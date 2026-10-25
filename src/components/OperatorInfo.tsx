import { useState, type ReactNode } from "react"
import { Building2, Cpu, Package, Zap } from "lucide-react"
import type { Operator, OperatorDetail, OperatorStats, SkillLevel } from "@/types/Operator"
import materials from "@/data/materials.json"
import ranges from "@/data/ranges.json"
import GameIcon from "@/components/GameIcon"
import CountUp from "@/components/CountUp"
import RangeTiles from "@/components/RangeTiles"
import { Band, CellToggle, Label, SectionHeader } from "@/components/swiss"
import CellBlock from "@/components/swiss/CellBlock"
import { rarityColor } from "@/lib/rarity"
import { useMediaQuery } from "@/hooks/useMediaQuery"

// Range3D.tsx (Three.js view) is kept for later 3D experiments; this page draws the range
// on the page's own tile grid instead.
const rangeTable = ranges as Record<string, { row: number; col: number }[]>
const materialById = Object.fromEntries(materials.map((m) => [m.id, m]))

// "a **b** c" -> highlights the **b** parts (keywords in game text): black on an amber mark
function Rich({ text }: { text: string }) {
    return (
        <>
            {text.split("**").map((part, i) =>
                i % 2 ? <mark key={i} className="bg-primary/60 px-0.5 font-medium text-(--ink)">{part}</mark> : part
            )}
        </>
    )
}

const eliteLabel = (i: number) => `Elite ${i}`
const phaseIndex = (p: string) => Number(p.replace("PHASE_", "")) || 0

// ---- attributes ----

const stats: { key: keyof OperatorStats; label: string; decimals?: number; unit?: string; big?: boolean }[] = [
    { key: "hp", label: "Max HP", big: true },
    { key: "atk", label: "ATK", big: true },
    { key: "def", label: "DEF", big: true },
    { key: "res", label: "RES", big: true },
    { key: "cost", label: "DP cost" },
    { key: "block", label: "Block" },
    { key: "interval", label: "Atk interval", decimals: 2, unit: "s" },
    { key: "redeploy", label: "Redeploy", unit: "s" },
]

// stats grow linearly between the Lv 1 and max-level keyframes, as in the game
function statsAt(phase: OperatorDetail["phases"][number], level: number): OperatorStats {
    const t = phase.maxLevel > 1 ? (level - 1) / (phase.maxLevel - 1) : 1
    const out = {} as OperatorStats
    for (const key of Object.keys(phase.min) as (keyof OperatorStats)[]) {
        const v = phase.min[key] + (phase.max[key] - phase.min[key]) * t
        out[key] = key === "interval" ? v : Math.round(v)
    }
    return out
}

// some lower-elite ranges are not in ranges.json; fall back to the next elite that has one
function resolveRange(detail: OperatorDetail, phase: number, fallback: string | null) {
    for (let i = phase; i < detail.phases.length; i++) {
        const id = detail.phases[i].range
        if (id && rangeTable[id]) return { id, from: i }
    }
    return { id: fallback, from: detail.phases.length - 1 }
}

// ---- range drawn on the page grid ----

// Desktop: every range tile is a real cell of the page, with the operator's idle sprite
// standing on its own tile. Phones (4 columns) can't fit most ranges, so they get the
// same shape as a small diagram.
function RangeOnGrid({ operatorId, rangeId, caption }: { operatorId: string; rangeId: string | null; caption: ReactNode }) {
    const wide = useMediaQuery("(min-width: 768px)")
    const cells = (rangeId && rangeTable[rangeId]) || []
    const rows = [0, ...cells.map((c) => c.row)]
    const minRow = Math.min(...rows)
    const height = Math.max(3, Math.max(...rows) - minRow + 1)
    const tile = { col: 2, row: 1 - minRow + Math.floor((height - (Math.max(...rows) - minRow + 1)) / 2) }

    if (!wide) {
        return (
            <Band rows={3} className="swiss-rule-y">
                <div className="col-span-2 row-span-3 flex items-center justify-center p-3">
                    <RangeTiles rangeId={rangeId} className="max-h-full max-w-full text-(--ink)" />
                </div>
                <div className="col-span-2 row-span-3 flex flex-col justify-center">{caption}</div>
            </Band>
        )
    }

    return (
        <Band rows={height} className="swiss-rule-y">
            {cells.filter((c) => c.row !== 0 || c.col !== 0).map((c) => (
                // inset a little so neighbouring tiles read as separate tiles, as on a stage map
                <div key={`${c.row},${c.col}`} aria-hidden className="m-[3px] bg-primary" style={{ gridRow: tile.row + c.row, gridColumn: tile.col + c.col }} />
            ))}
            {/* the operator's own tile, with the idle sprite standing on it */}
            <div className="relative z-10 border border-(--ink)" style={{ gridRow: tile.row, gridColumn: tile.col }}>
                <img
                    src={`/operators-idle-webp/${operatorId}.webp`}
                    alt=""
                    loading="lazy"
                    className="pointer-events-none absolute bottom-[8%] left-1/2 h-[140%] max-w-none -translate-x-1/2 object-contain object-bottom"
                />
            </div>
            <div className="col-span-3 col-start-10 row-span-full flex flex-col justify-center">{caption}</div>
        </Band>
    )
}

// ---- skills ----

const spLabel: Record<string, string> = {
    INCREASE_WITH_TIME: "Auto recovery",
    INCREASE_WHEN_ATTACK: "Offensive recovery",
    INCREASE_WHEN_TAKEN_DAMAGE: "Defensive recovery",
}
const triggerLabel: Record<string, string> = { MANUAL: "Manual trigger", AUTO: "Auto trigger", PASSIVE: "Passive" }

function SkillNumbers({ level }: { level: SkillLevel }) {
    const cells: [string, string][] = []
    if (level.spCost > 0) cells.push(["Initial SP", String(level.initSp)], ["SP cost", String(level.spCost)])
    if (level.duration) cells.push(["Duration", `${level.duration}s`])
    return (
        <>
            {cells.map(([k, v]) => (
                <div key={k} className="flex flex-col justify-end pb-3">
                    <span className="swiss-number text-[calc(var(--cell)*0.36)]">{v}</span>
                    <Label as="span" className="mt-1">{k}</Label>
                </div>
            ))}
        </>
    )
}

const statLabel: Record<string, string> = {
    max_hp: "HP", atk: "ATK", def: "DEF", magic_resistance: "RES", attack_speed: "ASPD",
    cost: "Cost", respawn_time: "Redeploy", block_cnt: "Block",
}
const roomLabel = (r: string) => r.toLowerCase().replace(/_/g, " ")

// shared layout for skills, talents, modules and base skills: icon cell, heading, text
function EntryRow({ icon, title, meta, children }: { icon?: ReactNode; title: string; meta: ReactNode; children: ReactNode }) {
    return (
        <CellBlock as="section" className="swiss-rule-t">
            <div className="col-span-1 flex aspect-square items-center justify-center">{icon}</div>
            <div className="col-span-3 py-3 pl-2 md:col-span-4 md:pl-3">
                <h3 className="text-[calc(var(--cell)*0.22)] font-medium uppercase leading-[0.95] tracking-[-0.03em] md:text-[calc(var(--cell)*0.2)]">{title}</h3>
                <Label className="mt-2 text-(--ink)/60">{meta}</Label>
            </div>
            <div className="col-span-full pb-4 md:col-span-7 md:py-3">{children}</div>
        </CellBlock>
    )
}

export default function OperatorInfo({ operator, detail }: { operator: Operator; detail: OperatorDetail }) {
    const [phase, setPhase] = useState(detail.phases.length - 1)
    const current = detail.phases[phase]
    const [level, setLevel] = useState(current?.maxLevel ?? 1)
    const hasMastery = detail.skills.some((s) => s.m3)
    const [skillLevel, setSkillLevel] = useState<"lv7" | "m3">(hasMastery ? "m3" : "lv7")

    const choosePhase = (i: number) => {
        setPhase(i)
        setLevel(detail.phases[i].maxLevel)
    }

    const values = current ? statsAt(current, level) : null
    const range = resolveRange(detail, phase, operator.rangeId)
    const trustBonus = (["hp", "atk", "def", "res"] as const).filter((k) => detail.trust[k])
    const promotions = detail.phases.map((p, i) => ({ elite: i, cost: p.cost })).filter((p) => p.cost.length > 0)

    // sections are numbered in the order they render
    const sections = [
        current && "attributes",
        current && "range",
        detail.skills.length > 0 && "skills",
        detail.talents.length > 0 && "talents",
        detail.potentials.length > 0 && "potential",
        promotions.length > 0 && "promotion",
        detail.modules.length > 0 && "modules",
        detail.baseSkills.length > 0 && "base",
        (detail.usage || detail.quote) && "profile",
    ].filter(Boolean)
    const num = (k: string) => sections.indexOf(k) + 1

    return (
        <>
            {current && values && (
                <section aria-label="Attributes">
                    <SectionHeader index={num("attributes")} caption="Attributes" aside={<Label as="span">Level 1 to {current.maxLevel}</Label>} />
                    <Band className="swiss-rule-t">
                        <div role="group" aria-label="Elite" className="col-span-full flex md:col-span-3">
                            {detail.phases.map((_, i) => (
                                <CellToggle key={i} label={eliteLabel(i)} active={phase === i} onClick={() => choosePhase(i)}>
                                    <span className="swiss-number text-[calc(var(--cell)*0.36)]">E{i}</span>
                                </CellToggle>
                            ))}
                        </div>
                        <label className="col-span-full row-start-2 flex items-center gap-4 px-1 md:col-span-8 md:col-start-5 md:row-start-1">
                            <Label as="span">Level</Label>
                            <input
                                type="range"
                                min={1}
                                max={current.maxLevel}
                                value={level}
                                onChange={(e) => setLevel(Number(e.target.value))}
                                className="h-1 min-w-0 flex-1 cursor-pointer accent-(--ink)"
                            />
                            <span className="font-mono text-sm tabular-nums">
                                <span className="text-lg font-medium">{String(level).padStart(2, "0")}</span> / {current.maxLevel}
                            </span>
                        </label>
                    </Band>
                    {/* numbers sit on the bottom line of their cells, label underneath */}
                    <Band className="swiss-rule-t">
                        {stats.map((s) => (
                            <div key={s.key} className={`col-span-2 flex flex-col justify-end pb-3 ${s.big ? "md:col-span-3" : "md:col-span-3"}`}>
                                <span className={`swiss-number ${s.big ? "" : "text-[calc(var(--cell)*0.36)]"}`}>
                                    <CountUp value={values[s.key]} decimals={s.decimals} />
                                    {s.unit && <span className="text-[0.4em]">{s.unit}</span>}
                                </span>
                                <Label as="span" className="mt-1">{s.label}</Label>
                            </div>
                        ))}
                    </Band>
                    {trustBonus.length > 0 && (
                        <Band className="swiss-rule-t">
                            <Label className="col-span-full self-center">
                                (Max trust: {trustBonus.map((k) => `${k.toUpperCase()} +${detail.trust[k]}`).join(", ")})
                            </Label>
                        </Band>
                    )}
                </section>
            )}

            {current && (
                <section aria-label="Attack range">
                    <SectionHeader index={num("range")} caption="Range" />
                    <RangeOnGrid
                        operatorId={operator.id}
                        rangeId={range.id}
                        caption={
                            <>
                                <span className="swiss-number text-[calc(var(--cell)*0.36)]">{range.id ?? "None"}</span>
                                <Label className="mt-1">
                                    {range.from !== phase ? `(Shown from ${eliteLabel(range.from)}; no data for ${eliteLabel(phase)})` : `(${eliteLabel(phase)})`}
                                </Label>
                            </>
                        }
                    />
                </section>
            )}

            {detail.skills.length > 0 && (
                <section aria-label="Skills">
                    <SectionHeader
                        index={num("skills")}
                        caption="Skills"
                        aside={hasMastery && (
                            <span role="radiogroup" aria-label="Skill level" className="inline-flex gap-1">
                                {(["lv7", "m3"] as const).map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        role="radio"
                                        aria-checked={skillLevel === k}
                                        onClick={() => setSkillLevel(k)}
                                        className={`swiss-label px-2 py-1 focus-visible:outline-2 focus-visible:outline-(--ink) ${skillLevel === k ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
                                    >
                                        {k === "lv7" ? "Level 7" : "Mastery 3"}
                                    </button>
                                ))}
                            </span>
                        )}
                    />
                    {detail.skills.map((sk, i) => {
                        const lv = skillLevel === "m3" && sk.m3 ? sk.m3 : sk.lv7
                        return (
                            <EntryRow
                                key={i}
                                icon={<GameIcon src={`/skills/skill_icon_${sk.icon}.png`} alt="" className="h-[70%] w-[70%]" fallback={<Zap className="h-1/3 w-1/3" />} />}
                                title={sk.name}
                                meta={<>S{i + 1} ({triggerLabel[sk.type] ?? sk.type}{lv.spType && spLabel[lv.spType] ? `, ${spLabel[lv.spType]}` : ""}) from {eliteLabel(phaseIndex(sk.unlockPhase))}</>}
                            >
                                <div className="grid grid-cols-3 gap-x-4 md:max-w-[calc(var(--cell)*4)]"><SkillNumbers level={lv} /></div>
                                <p className="mt-2 max-w-prose whitespace-pre-line text-[15px] leading-relaxed"><Rich text={lv.description} /></p>
                            </EntryRow>
                        )
                    })}
                </section>
            )}

            {detail.talents.length > 0 && (
                <section aria-label="Talents">
                    <SectionHeader index={num("talents")} caption="Talents" />
                    {detail.talents.map((t, i) => (
                        <EntryRow
                            key={i}
                            icon={<span className="swiss-number text-[calc(var(--cell)*0.36)]">T{i + 1}</span>}
                            title={t.name}
                            meta={<>From {eliteLabel(phaseIndex(t.phase))} Lv {t.level}{t.potential > 0 && `, potential ${t.potential + 1}`}</>}
                        >
                            <p className="max-w-prose text-[15px] leading-relaxed"><Rich text={t.description} /></p>
                        </EntryRow>
                    ))}
                </section>
            )}

            {detail.potentials.length > 0 && (
                <section aria-label="Potential">
                    <SectionHeader index={num("potential")} caption="Potential, ranks 2 to 6" />
                    <CellBlock className="swiss-rule-t">
                        {detail.potentials.map((p, i) => (
                            <div key={i} className="col-span-2 flex flex-col py-3 pr-3">
                                <span className="swiss-number text-[calc(var(--cell)*0.36)]">{i + 2}</span>
                                <span className="mt-2 text-[15px] leading-snug">{p}</span>
                            </div>
                        ))}
                    </CellBlock>
                </section>
            )}

            {promotions.length > 0 && (
                <section aria-label="Promotion materials">
                    <SectionHeader index={num("promotion")} caption="Promotion materials" />
                    {promotions.map((p) => (
                        <Band key={p.elite} className="swiss-rule-t">
                            <div className="col-span-full flex flex-col justify-end pb-3 md:col-span-2">
                                <span className="swiss-number text-[calc(var(--cell)*0.36)]">E{p.elite}</span>
                                <Label as="span" className="mt-1">To {eliteLabel(p.elite)}</Label>
                            </div>
                            {p.cost.map((c) => {
                                const mat = materialById[c.id]
                                return (
                                    // one material per cell, like the depot; named on hover/focus via title
                                    <div key={c.id} title={c.name} className="relative flex items-center justify-center">
                                        <GameIcon src={`/items/${mat?.iconId}.png`} alt={c.name} className="h-[66%] w-[66%]" fallback={<Package className="h-1/3 w-1/3" />} />
                                        <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: rarityColor[mat?.rarity ?? "TIER_1"] }} />
                                        <Label as="span" className="absolute bottom-1.5 right-1.5 font-medium">×{c.count}</Label>
                                    </div>
                                )
                            })}
                        </Band>
                    ))}
                </section>
            )}

            {detail.modules.length > 0 && (
                <section aria-label="Modules">
                    <SectionHeader index={num("modules")} caption="Modules" />
                    {detail.modules.map((m, i) => (
                        <EntryRow
                            key={i}
                            icon={<GameIcon src={`/equip/${m.icon}.png`} alt="" className="h-[60%] w-[60%] invert" fallback={<Cpu className="h-1/3 w-1/3" />} />}
                            title={m.name}
                            meta={<>{m.code} from {eliteLabel(phaseIndex(m.phase))} Lv {m.level}{m.stats.length > 0 && `. Stage 3: ${m.stats.map((st) => `${statLabel[st.key] ?? st.key} +${st.value}`).join(", ")}`}</>}
                        >
                            {m.notes.map((n, j) => <p key={j} className="max-w-prose text-[15px] leading-relaxed [&+p]:mt-2"><Rich text={n} /></p>)}
                        </EntryRow>
                    ))}
                </section>
            )}

            {detail.baseSkills.length > 0 && (
                <section aria-label="Base skills">
                    <SectionHeader index={num("base")} caption="Base skills" />
                    {detail.baseSkills.map((b, i) => (
                        <EntryRow
                            key={i}
                            // the room colour comes from the game data
                            icon={<span className="flex h-[66%] w-[66%] items-center justify-center" style={{ background: b.color }}><GameIcon src={`/building/${b.icon}.png`} alt="" className="h-[80%] w-[80%]" fallback={<Building2 className="h-1/2 w-1/2 text-white" />} /></span>}
                            title={b.name}
                            meta={<>{roomLabel(b.room)}, from {eliteLabel(phaseIndex(b.phase))}</>}
                        >
                            <p className="max-w-prose text-[15px] leading-relaxed"><Rich text={b.description} /></p>
                        </EntryRow>
                    ))}
                </section>
            )}

            {(detail.usage || detail.quote) && (
                <section aria-label="Profile">
                    <SectionHeader index={num("profile")} caption="Profile" />
                    <CellBlock className="swiss-rule-y">
                        <div className="col-span-full py-4 md:col-span-7 md:col-start-2">
                            {detail.usage && <p className="max-w-prose text-[15px] leading-relaxed">{detail.usage}</p>}
                            {detail.quote && <Label className="mt-3 normal-case tracking-normal">“{detail.quote}”</Label>}
                        </div>
                    </CellBlock>
                </section>
            )}
        </>
    )
}
