import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

// Sumber: repo Aceship yang di-maintain ulang (wiki.gg tidak bisa diakses dari script)
const REPO = "PuppiizSunniiz/Arknight-Images"
const BRANCH = "main"
const DIR = "characters"
const CONCURRENCY = 8

const __dirname = dirname(fileURLToPath(import.meta.url))
const operatorsPath = resolve(__dirname, "../data/operators.json")
const outDir = resolve(__dirname, "../../public/operators")

const operators = JSON.parse(readFileSync(operatorsPath, "utf-8"))
const ids = new Set(operators.map((op) => op.id))

const gh = async (path) => {
    const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
        headers: { "User-Agent": "arknight-toolbox" },
    })
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`)
    return res.json()
}

// ambil daftar file folder characters/ lewat git tree (tidak kena batas 1000 file seperti contents API)
const root = await gh(`git/trees/${BRANCH}`)
const dirSha = root.tree.find((t) => t.path === DIR).sha
const { tree } = await gh(`git/trees/${dirSha}`)

// art full body default: _1 (E0/E1), _1+ (E1 khusus, mis. Amiya), _2 (E2). Skin diabaikan.
const targets = tree
    .map((t) => ({ ...t, match: t.path.match(/^(char_.+?)_(1|1\+|2)\.png$/) }))
    .filter((t) => t.match && ids.has(t.match[1]))
    .map((t) => ({
        src: t.path,
        size: t.size,
        dest: resolve(outDir, `${t.match[1]}_${t.match[2].replace("+", "plus")}.png`),
    }))

mkdirSync(outDir, { recursive: true })

let done = 0
let skipped = 0
const failed = []

const download = async ({ src, size, dest }) => {
    // lewati file yang sudah ada dengan ukuran sama, jadi script aman dijalankan ulang
    if (existsSync(dest) && statSync(dest).size === size) {
        skipped++
        return
    }
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${DIR}/${encodeURIComponent(src)}`
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
            done++
            if (done % 50 === 0) console.log(`  ${done + skipped}/${targets.length}`)
            return
        } catch (err) {
            if (attempt === 3) failed.push(`${src}: ${err.message}`)
        }
    }
}

console.log(`Downloading ${targets.length} art files -> ${outDir}`)
const queue = [...targets]
await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length) await download(queue.shift())
    })
)

const covered = new Set(targets.map((t) => t.src.match(/^(char_.+?)_/)[1]))
const missing = operators.filter((op) => !covered.has(op.id))

console.log(`Downloaded ${done}, skipped ${skipped}, failed ${failed.length}`)
if (failed.length) console.log(failed.join("\n"))
if (missing.length) console.log(`Operator tanpa art: ${missing.map((op) => op.name).join(", ")}`)
