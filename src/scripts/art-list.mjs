import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

// Every full-body art of every operator in operators.json: default art per elite plus all
// skins, from skin_table. Shared by download-art.mjs (what to fetch) and
// generate-operators.mjs (what the gallery shows), so the two never disagree.
const __dirname = dirname(fileURLToPath(import.meta.url))
const readJson = (p) => JSON.parse(readFileSync(resolve(__dirname, p), "utf-8"))

// same rule as src/lib/art.ts: "#" starts a URL fragment, "+" is awkward in paths
export const artFile = (portraitId) => portraitId.replace(/#/g, "-").replace(/\+/g, "plus")

const DEFAULT_ORDER = { "1": 0, "1+": 1, "2": 2 }

export function listArts() {
    const operators = readJson("../data/operators.json")
    const skins = Object.values(readJson("../data/raw/skin_table.json").charSkins)
    const ids = new Set(operators.map((op) => op.id))

    const byOperator = new Map(operators.map((op) => [op.id, []]))
    for (const s of skins) {
        if (!s.portraitId) continue
        // match by the portrait's own prefix: a few alternate forms (Amiya's) share the
        // base form's charId but have their own operator id
        const owner = ids.has(s.charId) && s.portraitId.startsWith(`${s.charId}_`)
            ? s.charId
            : [...ids].find((id) => s.portraitId.startsWith(`${id}_`))
        if (!owner) continue
        const suffix = s.portraitId.slice(owner.length + 1)
        const isDefault = suffix in DEFAULT_ORDER
        byOperator.get(owner).push({
            portraitId: s.portraitId,
            file: artFile(s.portraitId),
            suffix,
            isDefault,
            name: s.displaySkin?.skinName ?? null,
            collection: isDefault ? null : s.displaySkin?.skinGroupName ?? null,
            sort: isDefault ? DEFAULT_ORDER[suffix] : 10 + (s.displaySkin?.getTime ?? 0) / 1e10,
        })
    }

    const out = {}
    for (const [id, arts] of byOperator) {
        arts.sort((a, b) => a.sort - b.sort)
        const hasElite1Art = arts.some((a) => a.suffix === "1+")
        out[id] = arts.map((a) => ({
            portraitId: a.portraitId,
            file: a.file,
            // E0 and E1 share the "_1" art unless the operator has a separate E1 art (Amiya)
            label: a.isDefault
                ? { "1": hasElite1Art ? "Elite 0" : "Elite 0 & 1", "1+": "Elite 1", "2": "Elite 2" }[a.suffix]
                : a.name ?? "Outfit",
            collection: a.collection,
        }))
    }
    return out
}
