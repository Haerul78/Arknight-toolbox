import materials from "@/data/materials.json"
import branches from "@/data/branches.json"
import { professionLabel } from "@/lib/profession"
import ranges from "@/data/ranges.json"
import type { Operator, OperatorDetail, OperatorStats } from "@/types/Operator"

// Shared logic for every layout of the operator detail page (?v=a|b|c): the layouts differ,
// the numbers they show come from here.

type Phase = OperatorDetail["phases"][number]
export type Skill = OperatorDetail["skills"][number]

const rangeTable = ranges as Record<string, { row: number; col: number }[]>
export const materialById = Object.fromEntries(materials.map((m) => [m.id, m]))

export const eliteLabel = (i: number) => `Elite ${i}`
export const phaseIndex = (p: string) => Number(p.replace("PHASE_", "")) || 0

export const STAT_COLUMNS: { key: keyof OperatorStats; label: string; decimals?: number }[] = [
    { key: "hp", label: "HP" },
    { key: "atk", label: "ATK" },
    { key: "def", label: "DEF" },
    { key: "res", label: "RES" },
    { key: "cost", label: "Cost" },
    { key: "block", label: "Block" },
    { key: "interval", label: "Interval", decimals: 2 },
    { key: "redeploy", label: "Redeploy" },
]

export const formatStat = (v: number, decimals = 0) => v.toFixed(decimals)

// stats grow linearly between the Lv 1 and max-level keyframes, as in the game
export function statsAt(phase: Phase, level: number): OperatorStats {
    const t = phase.maxLevel > 1 ? (level - 1) / (phase.maxLevel - 1) : 1
    const out = {} as OperatorStats
    for (const key of Object.keys(phase.min) as (keyof OperatorStats)[]) {
        const v = phase.min[key] + (phase.max[key] - phase.min[key]) * t
        out[key] = key === "interval" ? v : Math.round(v)
    }
    return out
}

// some lower-elite ranges are not in ranges.json; fall back to the next elite that has one
export function resolveRange(detail: OperatorDetail, phase: number, fallback: string | null) {
    for (let i = phase; i < detail.phases.length; i++) {
        const id = detail.phases[i].range
        if (id && rangeTable[id]) return { id, from: i }
    }
    return { id: fallback, from: detail.phases.length - 1 }
}

export const spLabel: Record<string, string> = {
    INCREASE_WITH_TIME: "Auto recovery",
    INCREASE_WHEN_ATTACK: "Offensive recovery",
    INCREASE_WHEN_TAKEN_DAMAGE: "Defensive recovery",
}
export const triggerLabel: Record<string, string> = { MANUAL: "Manual", AUTO: "Auto", PASSIVE: "Passive" }

// The highest level this operator can actually reach for the skill: Mastery 3 when the
// skill has mastery data (E2 operators), Level 7 otherwise (3★ stop at E1, and a few 4★
// skills have no masteries).
export const topLevel = (sk: Skill) => (sk.m3 ? { level: sk.m3, label: "Mastery 3" } : { level: sk.lv7, label: "Level 7" })

export const statLabel: Record<string, string> = {
    max_hp: "HP", atk: "ATK", def: "DEF", magic_resistance: "RES", attack_speed: "ASPD",
    cost: "Cost", respawn_time: "Redeploy", block_cnt: "Block",
}
export const roomLabel = (r: string) => r.toLowerCase().replace(/_/g, " ")

export const promotionsOf = (detail: OperatorDetail) =>
    detail.phases.map((p, i) => ({ elite: i, cost: p.cost })).filter((p) => p.cost.length > 0)

const branchName = branches as Record<string, string>

// "Sniper / Marksman": class plus its in-game branch name (branches.json)
export const classAndBranch = (operator: Operator) =>
    `${professionLabel[operator.profession] ?? operator.profession} / ${branchName[operator.subProfessionId] ?? operator.subProfessionId}`
