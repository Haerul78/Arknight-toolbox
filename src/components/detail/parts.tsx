import type { ReactNode } from "react"
import { Building2, Cpu, Package, Zap } from "lucide-react"
import type { OperatorDetail, SkillLevel } from "@/types/Operator"
import GameIcon from "@/components/GameIcon"
import { Label } from "@/components/swiss"
import { rarityColor } from "@/lib/rarity"
import {
    eliteLabel, materialById, phaseIndex, promotionsOf, roomLabel, spLabel, statLabel, triggerLabel, type Skill,
} from "@/lib/operatorDetail"

// Content pieces shared by every layout of the operator detail page. They carry no outer
// spacing or section frame: each layout decides how they sit on its grid.

// "a **b** c" -> highlights the **b** parts (keywords in game text): black on an amber mark
export function Rich({ text }: { text: string }) {
    return (
        <>
            {text.split("**").map((part, i) =>
                i % 2 ? <mark key={i} className="bg-primary/60 px-0.5 font-medium text-(--ink)">{part}</mark> : part
            )}
        </>
    )
}

export function SpLine({ level }: { level: SkillLevel }) {
    const parts = [
        level.spType && spLabel[level.spType],
        level.spCost > 0 && `SP ${level.initSp}/${level.spCost}`,
        level.duration && `${level.duration}s`,
    ].filter(Boolean)
    if (parts.length === 0) return null
    return <p className="font-mono text-[12px] tabular-nums text-(--ink)/80">{parts.join("  |  ")}</p>
}

// `className` sets the size (h-10 w-10 by default)
export function SkillIcon({ sk, className = "h-10 w-10" }: { sk: Skill; className?: string }) {
    return (
        <GameIcon
            src={`/skills/skill_icon_${sk.icon}.png`}
            alt=""
            className={`shrink-0 ${className}`}
            fallback={<span className={`flex shrink-0 items-center justify-center bg-(--ink)/10 ${className}`}><Zap size={16} /></span>}
        />
    )
}

// one row of a list: optional icon, title, small meta line, text
export function Entry({ icon, title, meta, children }: { icon?: ReactNode; title: string; meta?: ReactNode; children: ReactNode }) {
    return (
        <div className="flex gap-3 border-t border-(--ink)/15 py-2.5 first:border-t-0 first:pt-1">
            {icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center">{icon}</span>}
            <div className="min-w-0">
                <h3 className="text-[15px] font-medium uppercase leading-tight tracking-[-0.01em]">{title}</h3>
                {meta && <Label className="mt-0.5 text-(--ink)/60">{meta}</Label>}
                <div className="mt-1 text-[14px] leading-relaxed">{children}</div>
            </div>
        </div>
    )
}

export function TalentList({ detail }: { detail: OperatorDetail }) {
    return (
        <>
            {detail.talents.map((t, i) => (
                <Entry key={i} title={t.name} meta={<>From {eliteLabel(phaseIndex(t.phase))} Lv {t.level}{t.potential > 0 && `, potential ${t.potential + 1}`}</>}>
                    <Rich text={t.description} />
                </Entry>
            ))}
        </>
    )
}

export function PotentialList({ detail }: { detail: OperatorDetail }) {
    return (
        <table className="w-full text-[14px]">
            <tbody>
                {detail.potentials.map((p, i) => (
                    <tr key={i} className="border-t border-(--ink)/15 first:border-t-0">
                        <th scope="row" className="w-10 py-1.5 text-left align-top font-mono text-[13px] font-medium tabular-nums">{i + 2}</th>
                        <td className="py-1.5">{p}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export function ModuleList({ detail }: { detail: OperatorDetail }) {
    return (
        <>
            {detail.modules.map((m, i) => (
                <Entry
                    key={i}
                    icon={<GameIcon src={`/equip/${m.icon}.png`} alt="" className="h-8 w-8 invert" fallback={<Cpu size={18} />} />}
                    title={m.name}
                    meta={<>{m.code}, from {eliteLabel(phaseIndex(m.phase))} Lv {m.level}{m.stats.length > 0 && `. Stage 3: ${m.stats.map((st) => `${statLabel[st.key] ?? st.key} +${st.value}`).join(", ")}`}</>}
                >
                    {m.notes.map((n, j) => <p key={j} className="[&+p]:mt-1.5"><Rich text={n} /></p>)}
                </Entry>
            ))}
        </>
    )
}

export function BaseSkillList({ detail }: { detail: OperatorDetail }) {
    return (
        <>
            {detail.baseSkills.map((b, i) => (
                <Entry
                    key={i}
                    // the room colour comes from the game data
                    icon={<span className="flex h-8 w-8 items-center justify-center" style={{ background: b.color }}><GameIcon src={`/building/${b.icon}.png`} alt="" className="h-7 w-7" fallback={<Building2 size={16} className="text-white" />} /></span>}
                    title={b.name}
                    meta={<>{roomLabel(b.room)}, from {eliteLabel(phaseIndex(b.phase))}</>}
                >
                    <Rich text={b.description} />
                </Entry>
            ))}
        </>
    )
}

// material tiles; `tile` is a CSS length (half a cell in the dossier)
export function PromotionList({ detail, tile = "var(--u)" }: { detail: OperatorDetail; tile?: string }) {
    return (
        <>
            {promotionsOf(detail).map((p) => (
                <div key={p.elite} className="flex items-center gap-3 border-t border-(--ink)/15 py-2 first:border-t-0 first:pt-1">
                    <span className="w-12 shrink-0 font-mono text-[13px] font-medium">E{p.elite}</span>
                    <ul className="flex flex-wrap gap-1">
                        {p.cost.map((c) => {
                            const mat = materialById[c.id]
                            return (
                                // one material per tile, like the depot
                                <li key={c.id} title={c.name} style={{ width: tile, height: tile }} className="relative flex items-center justify-center bg-(--ink)/5">
                                    <GameIcon src={`/items/${mat?.iconId}.png`} alt={c.name} className="h-[72%] w-[72%]" fallback={<Package size={16} />} />
                                    <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: rarityColor[mat?.rarity ?? "TIER_1"] }} />
                                    <span className="absolute bottom-0.5 right-1 font-mono text-[11px] font-medium tabular-nums">×{c.count}</span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            ))}
        </>
    )
}

export function ProfileText({ detail }: { detail: OperatorDetail }) {
    return (
        <>
            {detail.usage && <p className="max-w-prose text-[14px] leading-relaxed">{detail.usage}</p>}
            {detail.quote && <Label className="mt-2 normal-case tracking-normal">“{detail.quote}”</Label>}
        </>
    )
}

// one skill level: SP line + description
export function SkillLevelText({ level, clamp = false }: { level: SkillLevel; clamp?: boolean }) {
    return (
        <>
            <SpLine level={level} />
            <p className={`mt-1 whitespace-pre-line text-[14px] leading-snug ${clamp ? "line-clamp-3" : ""}`}><Rich text={level.description} /></p>
        </>
    )
}

// One skill per row (layouts B and C): name and trigger on the left, the reachable levels
// side by side on the right (Level 7 and Mastery 3, or Level 7 alone for 3★ and below).
export function SkillRows({ skills }: { skills: Skill[] }) {
    return (
        <>
            {skills.map((sk, i) => {
                const levels = [{ label: "Level 7", level: sk.lv7 }, ...(sk.m3 ? [{ label: "Mastery 3", level: sk.m3 }] : [])]
                return (
                    <article key={i} className="grid gap-x-8 gap-y-3 border-t border-(--ink)/15 py-5 first:border-t-0 first:pt-2 md:grid-cols-[calc(var(--cell)*1.6)_minmax(0,1fr)]">
                        <div className="flex gap-3">
                            <SkillIcon sk={sk} className="h-12 w-12" />
                            <div className="min-w-0">
                                <h3 className="text-[16px] font-medium uppercase leading-tight">S{i + 1} {sk.name}</h3>
                                <Label className="mt-1 text-(--ink)/60">{triggerLabel[sk.type] ?? sk.type}, from {eliteLabel(phaseIndex(sk.unlockPhase))}</Label>
                            </div>
                        </div>
                        <div className={`grid gap-x-8 gap-y-4 ${levels.length > 1 ? "md:grid-cols-2" : ""}`}>
                            {levels.map((l) => (
                                <div key={l.label} className="min-w-0">
                                    <Label className="mb-1 text-(--ink)/60">{l.label}</Label>
                                    <SkillLevelText level={l.level} />
                                </div>
                            ))}
                        </div>
                    </article>
                )
            })}
        </>
    )
}
