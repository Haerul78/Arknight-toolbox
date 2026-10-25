import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

// src/data/meta.json: where each generated dataset came from and when it was generated.
// Each generate script updates only its own key, so running one script keeps the others.
const __dirname = dirname(fileURLToPath(import.meta.url))
const metaPath = resolve(__dirname, "../data/meta.json")
const rawDir = resolve(__dirname, "../data/raw")

// game client data version, only if data_version.txt was downloaded together with the raw
// tables; otherwise null rather than a version the local tables might not match
export function gamedataVersion() {
    const file = resolve(rawDir, "data_version.txt")
    if (!existsSync(file)) return null
    return readFileSync(file, "utf-8").match(/VersionControl:\s*([\d.]+)/)?.[1] ?? null
}

export function writeMeta(key, value) {
    const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf-8")) : {}
    meta[key] = { ...value, generatedAt: new Date().toISOString() }
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n")
}
