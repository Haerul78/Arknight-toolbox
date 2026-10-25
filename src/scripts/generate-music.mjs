import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import sharp from "sharp"
import { writeMeta } from "./meta.mjs"

// Daftar album & lagu dari Monster Siren Records (situs musik resmi HyperGryph).
// Audio TIDAK diunduh: link-nya bertanda tangan dan kedaluwarsa (~3 jam), jadi app memintanya
// saat lagu diputar lewat /api/song/:cid. Script ini hanya mencatat ukuran & format tiap file
// (stabil walau link berganti) dan mengunduh cover sebagai WebP kecil.
// Pakai: node src/scripts/generate-music.mjs [--refresh]  (--refresh = abaikan cache ukuran file)
const API = "https://monster-siren.hypergryph.com/api"
const CONCURRENCY = 6
const COVER_SIZE = 320

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(__dirname, "../data")
const outPath = resolve(dataDir, "music.json")
const namesPath = resolve(dataDir, "albumNames.json")
const cachePath = resolve(dataDir, "raw/music-cache.json")
const coverDir = resolve(__dirname, "../../public/music-covers")

const refresh = process.argv.includes("--refresh")
const cache = !refresh && existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, "utf-8")) : {}

// server mereka kadang lambat merespons koneksi pertama, jadi selalu dengan retry
async function request(url, init = {}) {
    let last
    for (let attempt = 1; attempt <= 4; attempt++) {
        try {
            const res = await fetch(url, { ...init, signal: AbortSignal.timeout(30000) })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res
        } catch (err) {
            last = err
            await new Promise((r) => setTimeout(r, 1000 * attempt))
        }
    }
    throw new Error(`${url}: ${last?.message}`)
}
const api = async (path) => {
    const json = await (await request(`${API}/${path}`)).json()
    if (json.code !== 0) throw new Error(`${path}: ${json.msg}`)
    return json.data
}

async function pool(items, fn) {
    const queue = [...items]
    let done = 0
    await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
            while (queue.length) {
                await fn(queue.shift())
                if (++done % 100 === 0) console.log(`  ${done}/${items.length}`)
            }
        })
    )
}

console.log("Fetching album list...")
const albumList = await api("albums")

const albums = []
const failed = []
await pool(albumList, async (a) => {
    try {
        const d = await api(`album/${a.cid}/detail`)
        if (d.belong !== "arknights") return
        albums.push({
            cid: d.cid,
            name: d.name,
            intro: d.intro ?? "",
            coverUrl: d.coverUrl,
            songs: d.songs.map((s) => ({ cid: s.cid, name: s.name, artists: s.artistes ?? [] })),
        })
    } catch (err) {
        failed.push(`album ${a.cid}: ${err.message}`)
    }
})
// pool selesai tidak berurutan; kembalikan ke urutan API (terbaru dulu)
const order = new Map(albumList.map((a, i) => [a.cid, i]))
albums.sort((a, b) => order.get(a.cid) - order.get(b.cid))

const songs = albums.flatMap((a) => a.songs)
console.log(`${albums.length} albums, ${songs.length} songs. Reading file sizes...`)
await pool(songs, async (s) => {
    if (cache[s.cid]) return
    try {
        const { sourceUrl } = await api(`song/${s.cid}`)
        if (!sourceUrl) return
        const head = await request(sourceUrl, { method: "HEAD" })
        cache[s.cid] = {
            ext: sourceUrl.split("?")[0].split(".").pop().toLowerCase(),
            size: Number(head.headers.get("content-length")) || 0,
        }
    } catch (err) {
        failed.push(`song ${s.cid}: ${err.message}`)
    }
})
writeFileSync(cachePath, JSON.stringify(cache))

console.log("Downloading covers...")
mkdirSync(coverDir, { recursive: true })
await pool(albums, async (a) => {
    const dest = resolve(coverDir, `${a.cid}.webp`)
    if (existsSync(dest)) return
    try {
        const img = Buffer.from(await (await request(a.coverUrl)).arrayBuffer())
        await sharp(img).resize(COVER_SIZE, COVER_SIZE, { fit: "cover" }).webp({ quality: 75 }).toFile(dest)
    } catch (err) {
        failed.push(`cover ${a.cid}: ${err.message}`)
    }
})

const out = albums.map(({ coverUrl: _coverUrl, ...a }) => ({
    ...a,
    songs: a.songs.map((s) => ({ ...s, ext: cache[s.cid]?.ext ?? null, size: cache[s.cid]?.size ?? null })),
}))
writeFileSync(outPath, JSON.stringify(out))

// file mapping nama Inggris diisi manual; jangan pernah ditimpa
if (!existsSync(namesPath)) writeFileSync(namesPath, "{}\n")

const wav = out.flatMap((a) => a.songs).filter((s) => s.ext === "wav").length
console.log(`Generated ${out.length} albums / ${songs.length} songs (${wav} WAV) -> ${outPath}`)
writeMeta("music", { source: "Monster Siren Records", albums: out.length, count: songs.length })
if (failed.length) console.log(`Failed ${failed.length}:\n${failed.slice(0, 20).join("\n")}`)
