import operators from "@/data/operators.json"
import ranges from "@/data/ranges.json"
import type { Operator } from "@/types/Operator"

type Cell = { row: number; col: number }
const rangeTable = ranges as Record<string, Cell[]>

// Curated for the Home hero: E2 art is a clean cut-out (transparent edges, no backdrop),
// and the attack range fits the 12-column grid to the right of the operator's tile.
// Add ids here to grow the daily rotation.
export const CURATED = [
    "char_180_amgoat", // Eyjafjalla: layout was tuned on this one
    "char_456_ash",
    "char_300_phenxi",
    "char_1035_wisdel",
    "char_4009_irene",
    "char_350_surtr",
    "char_2014_nian",
] as const

// Off until the layout is locked; set to true to pick a different curated operator each day.
export const ROTATE_DAILY = false

export type Featured = { operator: Operator; range: Cell[] }

export function featuredOperator(date = new Date()): Featured {
    // days since the epoch in local time, so everyone gets the same pick on the same date
    const day = Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000)
    const id = ROTATE_DAILY ? CURATED[day % CURATED.length] : CURATED[0]
    const operator = operators.find((op) => op.id === id) ?? operators[0]
    return { operator, range: (operator.rangeId && rangeTable[operator.rangeId]) || [] }
}
