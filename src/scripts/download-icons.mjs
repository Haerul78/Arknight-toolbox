import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

// Ikon item, skill, tipe modul dan base skill dari repo yang sama dengan art operator.
// Pakai: node src/scripts/download-icons.mjs [items|skills|equip|building ...]
const REPO = "PuppiizSunniiz/Arknight-Images"
const BRANCH = "main"
const CONCURRENCY = 8

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(__dirname, "../data")
const publicDir = resolve(__dirname, "../../public")

const readJson = (p) => JSON.parse(readFileSync(resolve(dataDir, p), "utf-8"))
const materials = readJson("materials.json")
const details = Object.values(readJson("operator-details.json"))

// folder di repo -> folder di public/ + nama file yang benar-benar dipakai app
const SETS = {
    items: { src: "items", out: "items", files: materials.map((m) => `${m.iconId}.png`) },
    skills: { src: "skills", out: "skills", files: details.flatMap((d) => d.skills.map((s) => `skill_icon_${s.icon}.png`)) },
    equip: { src: "equip/type", out: "equip", files: details.flatMap((d) => d.modules.map((m) => `${m.icon}.png`)) },
    building: { src: "ui/infrastructure/skill", out: "building", files: details.flatMap((d) => d.baseSkills.map((b) => `${b.icon}.png`)) },
}

const gh = async (path) => {
    const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
        headers: { "User-Agent": "arknight-toolbox" },
    })
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`)
    return res.json()
}

// telusuri tree per segmen path (tree rekursif repo ini terlalu besar dan terpotong)
async function listDir(path) {
    let sha = BRANCH
    for (const segment of path.split("/")) {
        const { tree } = await gh(`git/trees/${sha}`)
        const next = tree.find((t) => t.path === segment && t.type === "tree")
        if (!next) throw new Error(`folder ${path} tidak ada di ${REPO}`)
        sha = next.sha
    }
    const { tree } = await gh(`git/trees/${sha}`)
    return new Map(tree.filter((t) => t.type === "blob").map((t) => [t.path, t.size]))
}

async function downloadSet(name, { src, out, files }) {
    const available = await listDir(src)
    const wanted = [...new Set(files)]
    const targets = wanted.filter((f) => available.has(f))
    const missing = wanted.filter((f) => !available.has(f))
    const outDir = resolve(publicDir, out)
    mkdirSync(outDir, { recursive: true })

    let done = 0
    let skipped = 0
    const failed = []
    const download = async (file) => {
        const dest = resolve(outDir, file)
        // lewati file yang sudah ada dengan ukuran sama, jadi script aman dijalankan ulang
        if (existsSync(dest) && statSync(dest).size === available.get(file)) {
            skipped++
            return
        }
        const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${src}/${encodeURIComponent(file)}`
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const res = await fetch(url)
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
                done++
                return
            } catch (err) {
                if (attempt === 3) failed.push(`${file}: ${err.message}`)
            }
        }
    }

    const queue = [...targets]
    await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
            while (queue.length) await download(queue.shift())
        })
    )

    console.log(`[${name}] downloaded ${done}, skipped ${skipped}, failed ${failed.length}, not in repo ${missing.length} -> ${outDir}`)
    if (failed.length) console.log(failed.join("\n"))
}

const picked = process.argv.slice(2)
for (const [name, set] of Object.entries(SETS)) {
    if (picked.length && !picked.includes(name)) continue
    try {
        await downloadSet(name, set)
    } catch (err) {
        console.log(`[${name}] ${err.message}`)
    }
}
