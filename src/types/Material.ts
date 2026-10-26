export type MaterialCategory = "crafting" | "chip" | "record" | "summary" | "module" | "classToken" | "operatorToken" | "other"

export type Cost = { id: string; count: number }

export type Material = {
    id: string
    name: string
    rarity: string
    iconId: string
    category: MaterialCategory
    sortId: number
    // row of the chain chart (same family = same crafting line); none for operator tokens
    family?: string
    familyName?: string
    // tokens and personal letters belong to one operator
    operatorId?: string
    // how one batch is made (Workshop or Factory); `count` items come out
    recipe?: { costs: Cost[]; count: number; gold: number; room: "WORKSHOP" | "FACTORY" }
    // number of operators that need it, and the summed amount over all of them
    neededBy?: number
    neededTotal?: number
    // up to three stage codes where it is the main drop
    drops?: string[]
}

export type StageDrop = {
    id: string
    code: string
    name: string
    zone: string | null
    group: "main" | "supply" | "annihilation" | "event" | "other"
    drop: "main" | "special" | "extra"
    // the game's drop category; there is no rate in the data
    chance: "ALWAYS" | "ALMOST" | "USUAL" | "OFTEN" | "SOMETIMES"
    ap: number
    adverse?: boolean
}

export type OperatorNeed = { id: string; elite: number; skill: number; mastery: number; module: number }

export type MaterialDetail = {
    description: string
    usage: string
    obtain: string | null
    recipe: {
        room: "WORKSHOP" | "FACTORY"
        costs: Cost[]
        count: number
        gold: number
        level: number
        byproductRate?: number
        byproducts?: { id: string; share: number }[]
        seconds?: number
    } | null
    // chip conversions: 3 chips of the paired class -> `count` of this one
    conversions: { costs: Cost[]; count: number }[]
    usedIn: Cost[]
    neededBy: OperatorNeed[]
    stages: StageDrop[]
}
