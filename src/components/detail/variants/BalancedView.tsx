import { useState, type ReactNode } from "react"
import type { Operator, OperatorDetail } from "@/types/Operator"
import { Label } from "@/components/swiss"
import RangeTileMap from "@/components/detail/RangeTileMap"
import BalancedColumns from "@/components/detail/BalancedColumns"
import { DetailGallery, Identity } from "@/components/detail/OperatorHeader"
import {
    BaseSkillList, ModuleList, PotentialList, ProfileText, PromotionList, SkillRows, TalentList,
} from "@/components/detail/parts"
import { STAT_COLUMNS, eliteLabel, formatStat, promotionsOf, resolveRange, statsAt } from "@/lib/operatorDetail"

// Variant B (default, also ?v=b), "balanced": the dossier's two zones, but above the fold only identity,
// the 8 stats of one elite (including cost and block) and the range. Skills one per row,
// small section labels with clear space between sections, secondary info in two columns.

const ART_SIZES = "(max-width: 767px) 100vw, 40vw"

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
    return (
        <section className="mt-[calc(var(--cell)*0.5)] first:mt-0">
            <div className="flex items-baseline justify-between gap-3 border-t border-(--ink) pt-2">
                <Label as="h2">{title}</Label>
                {aside}
            </div>
            <div className="mt-4">{children}</div>
        </section>
    )
}

// 8 stats of the chosen elite and level: big numbers, four per row on desktop, two on phones
function EliteStats({ detail, phase, level, onPhase, onLevel }: { detail: OperatorDetail; phase: number; level: number; onPhase: (i: number) => void; onLevel: (l: number) => void }) {
    const current = detail.phases[phase]
    const values = statsAt(current, level)
    return (
        <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {detail.phases.length > 1 && (
                    <span role="radiogroup" aria-label="Elite" className="flex">
                        {detail.phases.map((p, i) => (
                            <button
                                key={i}
                                type="button"
                                role="radio"
                                aria-checked={phase === i}
                                onClick={() => { onPhase(i); onLevel(p.maxLevel) }}
                                className={`swiss-label px-2.5 py-1.5 focus-visible:outline-2 focus-visible:outline-(--ink) ${phase === i ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
                            >
                                {eliteLabel(i)}
                            </button>
                        ))}
                    </span>
                )}
                <label className="flex min-w-[10rem] flex-1 items-center gap-3">
                    <span className="sr-only">Level</span>
                    <input type="range" min={1} max={current.maxLevel} value={level} onChange={(e) => onLevel(Number(e.target.value))} className="h-1 min-w-0 flex-1 cursor-pointer accent-(--ink)" />
                    <span className="font-mono text-[13px] tabular-nums">Lv {level} / {current.maxLevel}</span>
                </label>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                {STAT_COLUMNS.map((c) => (
                    <div key={c.key} className="border-t border-(--ink)/15 pt-2">
                        <dt><Label as="span" className="text-(--ink)/60">{c.label}</Label></dt>
                        <dd className="mt-1 font-mono text-[26px] font-medium leading-none tabular-nums">{formatStat(values[c.key], c.decimals)}</dd>
                    </div>
                ))}
            </dl>
        </div>
    )
}

function Secondary({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="pb-[calc(var(--cell)*0.4)]">
            <Label as="h3" className="mb-2 border-b border-(--ink)/30 pb-1.5">{title}</Label>
            {children}
        </div>
    )
}

function BalancedInfo({ operator, detail }: { operator: Operator; detail: OperatorDetail }) {
    const last = detail.phases.length - 1
    const [phase, setPhase] = useState(last)
    const [level, setLevel] = useState(detail.phases[last]?.maxLevel ?? 1)
    const range = resolveRange(detail, phase, operator.rangeId)

    const secondary: ReactNode[] = []
    if (detail.talents.length > 0) secondary.push(<Secondary key="t" title="Talents"><TalentList detail={detail} /></Secondary>)
    if (detail.potentials.length > 0) secondary.push(<Secondary key="p" title="Potential"><PotentialList detail={detail} /></Secondary>)
    if (detail.modules.length > 0) secondary.push(<Secondary key="m" title="Modules"><ModuleList detail={detail} /></Secondary>)
    if (detail.baseSkills.length > 0) secondary.push(<Secondary key="b" title="Base skills"><BaseSkillList detail={detail} /></Secondary>)
    if (promotionsOf(detail).length > 0) secondary.push(<Secondary key="pr" title="Promotion materials"><PromotionList detail={detail} tile="calc(var(--cell)*0.55)" /></Secondary>)
    if (detail.usage || detail.quote) secondary.push(<Secondary key="pf" title="Profile"><ProfileText detail={detail} /></Secondary>)

    return (
        <>
            <Section title="Stats" aside={<Label as="span" className="text-(--ink)/60">{eliteLabel(phase)}, level {level}</Label>}>
                <div className="grid gap-x-10 gap-y-6 md:grid-cols-[minmax(0,1fr)_calc(var(--cell)*1.75)]">
                    <EliteStats detail={detail} phase={phase} level={level} onPhase={setPhase} onLevel={setLevel} />
                    <div>
                        <Label className="mb-2 text-(--ink)/60">Range {range.id ?? "none"}{range.from !== phase && ` (${eliteLabel(range.from)})`}</Label>
                        <RangeTileMap operatorId={operator.id} rangeId={range.id} />
                    </div>
                </div>
            </Section>

            {detail.skills.length > 0 && (
                <Section title={`Skills (${detail.skills.length})`}>
                    <SkillRows skills={detail.skills} />
                </Section>
            )}

            {secondary.length > 0 && (
                <Section title="Details">
                    <BalancedColumns gap="gap-x-10">{secondary}</BalancedColumns>
                </Section>
            )}
        </>
    )
}

export default function BalancedView({ operator, detail }: { operator: Operator; detail: OperatorDetail | null }) {
    return (
        <div className="dossier mx-(--m) grid grid-cols-[repeat(var(--cols),var(--cell))]">
            <aside
                aria-label={`${operator.name} art`}
                className="col-span-full h-[calc(var(--cell)*4.5)] md:sticky md:top-(--navbar-h) md:col-span-5 md:h-[calc(100dvh-var(--navbar-h))] md:pr-8 [@media(max-height:699px)]:md:static [@media(max-height:699px)]:md:h-[calc(var(--cell)*5)]"
            >
                <DetailGallery operator={operator} detail={detail} sizes={ART_SIZES} />
            </aside>
            <div className="col-span-full min-w-0 md:col-span-7 md:col-start-6">
                <Identity operator={operator} detail={detail} />
                {detail ? <BalancedInfo key={operator.id} operator={operator} detail={detail} /> : <Label className="py-6">(Loading the file)</Label>}
            </div>
        </div>
    )
}
