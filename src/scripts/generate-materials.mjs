import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { gamedataVersion, writeMeta } from "./meta.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawPath = resolve(__dirname, "../data/raw/item_table.json")
const outPath = resolve(__dirname, "../data/materials.json")

const raw = JSON.parse(readFileSync(rawPath, "utf-8"))

// hanya material sungguhan (bahan promosi/skill, token potensial); item event, voucher, dll. dilewati
const materials = Object.entries(raw.items).filter(([, data]) => data.classifyType === "MATERIAL").map(([id, data]) => ({
    id,
    name: data.name,
    rarity: data.rarity,
    // nama file ikon di public/items (diunduh oleh download-icons.mjs)
    iconId: data.iconId,
}))

writeFileSync(outPath, JSON.stringify(materials, null, 2))
console.log(`Generated ${materials.length} materials -> ${outPath}`)

writeMeta("materials", { source: "ArknightsGameData (EN): item_table", version: gamedataVersion(), count: materials.length })
