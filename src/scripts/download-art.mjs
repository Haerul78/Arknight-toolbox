import { existsSync, mkdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import sharp from "sharp"
import { listArts } from "./art-list.mjs"

// Full-body art (default per elite + every skin) as WebP in two widths:
//   public/art/<file>.webp       1280px
//   public/art/<file>-640.webp    640px (phones)
// public/art/ is gitignored; run this when the art is needed, or upload the folder to the
// storage that VITE_ART_BASE_URL points at.
// Source: the same repo as before (characters/<portraitId>.png). PNGs already in
// public/operators (from the old download-operator-art.mjs) are reused instead of fetched.
// Pakai: node src/scripts/download-art.mjs [char_id ...]
const REPO = "PuppiizSunniiz/Arknight-Images"
const BRANCH = "main"
const CONCURRENCY = 6
const WIDTHS = [1280, 640]

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, "../../public/art")
const legacyDir = resolve(__dirname, "../../public/operators")

const only = new Set(process.argv.slice(2))
const arts = Object.entries(listArts())
    .filter(([id]) => only.size === 0 || only.has(id))
    .flatMap(([, list]) => list)

mkdirSync(outDir, { recursive: true })

const target = (file, w) => resolve(outDir, w === 1280 ? `${file}.webp` : `${file}-${w}.webp`)

async function source(art) {
    const legacy = resolve(legacyDir, `${art.file}.png`)
    if (existsSync(legacy)) return readFileSync(legacy)
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/characters/${encodeURIComponent(art.portraitId)}.png`
    let last
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return Buffer.from(await res.arrayBuffer())
        } catch (err) {
            last = err
        }
    }
    throw last
}

let done = 0
let skipped = 0
let reused = 0
const failed = []

async function convert(art) {
    // safe to re-run: finished arts are skipped
    if (WIDTHS.every((w) => existsSync(target(art.file, w)))) {
        skipped++
        return
    }
    try {
        if (existsSync(resolve(legacyDir, `${art.file}.png`))) reused++
        const png = await source(art)
        for (const w of WIDTHS) {
            await sharp(png)
                .resize({ width: w, height: w, fit: "inside", withoutEnlargement: true })
                .webp({ quality: 80, alphaQuality: 85, effort: 4 })
                .toFile(target(art.file, w))
        }
        done++
        if ((done + skipped) % 50 === 0) console.log(`  ${done + skipped}/${arts.length}`)
    } catch (err) {
        failed.push(`${art.portraitId}: ${err.message}`)
    }
}

console.log(`Converting ${arts.length} arts -> ${outDir}`)
const queue = [...arts]
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await convert(queue.shift())
}))

console.log(`Converted ${done} (reused ${reused} local PNGs), skipped ${skipped}, failed ${failed.length}`)
if (failed.length) console.log(failed.slice(0, 30).join("\n"))
