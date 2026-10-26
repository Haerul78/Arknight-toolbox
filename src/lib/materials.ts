import data from "@/data/materials.json"
import type { Cost, Material, MaterialCategory } from "@/types/Material"
import { rarityNumber } from "@/lib/rarity"

export const materials = data as Material[]
export const materialById: Record<string, Material> = Object.fromEntries(materials.map((m) => [m.id, m]))

export const tierOf = (m: Material) => rarityNumber(m.rarity)

// list order and section names; operator tokens are always last and start closed
export const CATEGORIES: { key: MaterialCategory; label: string }[] = [
    { key: "crafting", label: "Crafting materials" },
    { key: "chip", label: "Chips" },
    { key: "record", label: "Battle records" },
    { key: "summary", label: "Skill summaries" },
    { key: "module", label: "Module materials" },
    { key: "classToken", label: "Class tokens" },
    { key: "operatorToken", label: "Operator tokens and letters" },
]
export const categoryLabel = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label])) as Record<MaterialCategory, string>

export const CHANCE_LABEL: Record<string, string> = {
    ALWAYS: "Always",
    ALMOST: "High",
    USUAL: "Medium",
    OFTEN: "Low",
    SOMETIMES: "Rare",
}

// Everything a batch of `count` items costs once every craftable ingredient is crafted
// too, down to materials that can only be farmed. Factory recipes (battle records,
// dualchips) stop at their own ingredients, since they cost Factory time, not LMD.
export function breakdown(id: string, count = 1): { costs: Cost[]; gold: number } {
    const out = new Map<string, number>()
    let gold = 0
    const walk = (itemId: string, amount: number) => {
        const r = materialById[itemId]?.recipe
        if (!r || r.room !== "WORKSHOP" || r.costs.length === 0) {
            out.set(itemId, (out.get(itemId) ?? 0) + amount)
            return
        }
        const batches = Math.ceil(amount / r.count)
        gold += batches * r.gold
        for (const c of r.costs) walk(c.id, c.count * batches)
    }
    const r = materialById[id]?.recipe
    if (!r || r.costs.length === 0) return { costs: [], gold: 0 }
    const batches = Math.ceil(count / r.count)
    if (r.room === "WORKSHOP") gold += batches * r.gold
    for (const c of r.costs) walk(c.id, c.count * batches)
    const costs = [...out].map(([cid, n]) => ({ id: cid, count: n }))
    // highest tier first, like the game's own recipe panels
    costs.sort((a, b) => (materialById[b.id] ? tierOf(materialById[b.id]) : 0) - (materialById[a.id] ? tierOf(materialById[a.id]) : 0))
    return { costs, gold }
}

export const iconUrl = (m: Pick<Material, "iconId">) => `/items/${m.iconId}.png`
