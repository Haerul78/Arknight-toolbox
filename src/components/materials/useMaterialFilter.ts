import { useMemo, useState } from "react"
import operators from "@/data/operators.json"
import { categoryLabel, materials } from "@/lib/materials"
import type { Material, MaterialCategory } from "@/types/Material"

const operatorName = Object.fromEntries(operators.map((o) => [o.id, o.name]))

// what a search can match: the name, the crafting line, the section, and for tokens the
// operator they belong to ("exusiai" finds Exusiai's Token)
function haystack(m: Material) {
    return [m.name, m.familyName, categoryLabel[m.category], m.operatorId && operatorName[m.operatorId]].filter(Boolean).join(" ").toLowerCase()
}
const index = new Map(materials.map((m) => [m.id, haystack(m)]))

export const general = materials.filter((m) => m.category !== "operatorToken")
export const tokens = materials.filter((m) => m.category === "operatorToken")

// Shared by both list layouts: the search box, the section toggles and what matches.
export function useMaterialFilter() {
    const [search, setSearch] = useState("")
    const [category, setCategory] = useState<MaterialCategory | null>(null)

    const q = search.trim().toLowerCase()
    const matches = useMemo(() => {
        const ids = new Set<string>()
        for (const m of materials) {
            if (category && m.category !== category) continue
            if (q && !index.get(m.id)!.includes(q)) continue
            ids.add(m.id)
        }
        return ids
    }, [q, category])

    const generalCount = general.filter((m) => matches.has(m.id)).length
    const tokenMatches = tokens.filter((m) => matches.has(m.id))

    return {
        search, setSearch, category, setCategory,
        matches, generalCount, tokenMatches,
        filtering: Boolean(q || category),
        clear: () => { setSearch(""); setCategory(null) },
    }
}
export type MaterialFilter = ReturnType<typeof useMaterialFilter>
