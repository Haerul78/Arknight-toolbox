import { useState, type ReactNode } from "react"
import type { Operator, OperatorDetail } from "@/types/Operator"
import { Label } from "@/components/swiss"
import DossierBlock from "@/components/detail/DossierBlock"
import StatTable from "@/components/detail/StatTable"
import RangeTileMap from "@/components/detail/RangeTileMap"
import BalancedColumns from "@/components/detail/BalancedColumns"
import {
    BaseSkillList, ModuleList, PotentialList, ProfileText, PromotionList, SkillIcon, SkillLevelText, TalentList,
} from "@/components/detail/parts"
import { eliteLabel, phaseIndex, promotionsOf, resolveRange, topLevel, triggerLabel } from "@/lib/operatorDetail"
import { useMediaQuery } from "@/hooks/useMediaQuery"

// Variant A (?v=a): the dense "dossier". Range3D.tsx (Three.js view) is kept for later 3D
// experiments; every variant draws the range as tiles instead.

export default function OperatorInfo({ operator, detail }: { operator: Operator; detail: OperatorDetail }) {
    const wide = useMediaQuery("(min-width: 768px)")
    const last = detail.phases.length - 1
    const [phase, setPhase] = useState(last)
    const [level, setLevel] = useState(detail.phases[last]?.maxLevel ?? 1)

    const range = resolveRange(detail, phase, operator.rangeId)
    const promotions = promotionsOf(detail)
    const skills = detail.skills
    // the long Lv 7 / M3 comparison only exists when there is a second level to compare
    const hasMastery = skills.some((s) => s.m3)

    // secondary blocks: only the ones with data are rendered, then split over two balanced
    // columns, so a missing block never leaves a hole in the two-column layout
    const secondary: ReactNode[] = []
    if (detail.talents.length > 0) secondary.push(<DossierBlock key="talents" title="Talents"><TalentList detail={detail} /></DossierBlock>)
    if (detail.potentials.length > 0) secondary.push(<DossierBlock key="potential" title="Potential"><PotentialList detail={detail} /></DossierBlock>)
    if (detail.modules.length > 0) secondary.push(<DossierBlock key="modules" title="Modules"><ModuleList detail={detail} /></DossierBlock>)
    if (detail.baseSkills.length > 0) secondary.push(<DossierBlock key="base" title="Base skills"><BaseSkillList detail={detail} /></DossierBlock>)
    if (promotions.length > 0) secondary.push(<DossierBlock key="promotion" title="Promotion materials"><PromotionList detail={detail} /></DossierBlock>)
    if (detail.usage || detail.quote) secondary.push(<DossierBlock key="profile" title="Profile"><ProfileText detail={detail} /></DossierBlock>)

    return (
        <>
            {/* stats + range side by side: the first thing under the identity block */}
            <div className="grid gap-x-6 md:grid-cols-[minmax(0,1fr)_calc(var(--cell)*2)]">
                <DossierBlock title={`Stats at max level${detail.phases.length < 3 ? `, up to ${eliteLabel(last)}` : ""}`}>
                    <StatTable detail={detail} phase={phase} level={level} onPhase={setPhase} onLevel={setLevel} transposed={!wide} />
                </DossierBlock>
                <DossierBlock title="Range" aside={<Label as="span">{range.id ?? "None"}</Label>}>
                    {/* phones: tiles and caption side by side, so a small range doesn't leave
                        the right half of a full-width block empty; desktop: stacked in its column */}
                    <div className="mt-1 flex items-end gap-4 md:flex-col md:items-stretch md:gap-2">
                        <div className="min-w-0 flex-1 md:flex-none"><RangeTileMap operatorId={operator.id} rangeId={range.id} /></div>
                        <Label className="w-(--cell) shrink-0 text-(--ink)/60 md:w-auto">
                            {range.from !== phase ? `(${eliteLabel(range.from)}; no data for ${eliteLabel(phase)})` : `(${eliteLabel(phase)})`}
                        </Label>
                    </div>
                </DossierBlock>
            </div>

            {/* every skill at the highest level it can reach; the block is gone if there are none */}
            {skills.length > 0 && (
                <DossierBlock title={`Skills (${skills.length})`}>
                    <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: wide ? `repeat(${skills.length}, minmax(0, 1fr))` : "1fr" }}>
                        {skills.map((sk, i) => {
                            const top = topLevel(sk)
                            return (
                                <article key={i} className="min-w-0">
                                    <div className="flex gap-3">
                                        <SkillIcon sk={sk} />
                                        <div className="min-w-0">
                                            <h3 className="text-[15px] font-medium uppercase leading-tight">S{i + 1} {sk.name}</h3>
                                            <Label className="mt-0.5 text-(--ink)/60">{top.label}, {triggerLabel[sk.type] ?? sk.type}, from {eliteLabel(phaseIndex(sk.unlockPhase))}</Label>
                                        </div>
                                    </div>
                                    {/* clamped only when the full text is repeated in the comparison below */}
                                    <div className="mt-2"><SkillLevelText level={top.level} clamp={hasMastery && wide} /></div>
                                </article>
                            )
                        })}
                    </div>
                </DossierBlock>
            )}

            {hasMastery && (
                <DossierBlock title="Skill detail, Level 7 and Mastery 3">
                    {skills.map((sk, i) => (
                        <div key={i} className="grid gap-x-6 border-t border-(--ink)/15 py-2.5 first:border-t-0 first:pt-1 md:grid-cols-[calc(var(--cell)*1.25)_minmax(0,1fr)_minmax(0,1fr)]">
                            <h3 className="text-[14px] font-medium uppercase leading-tight">S{i + 1} {sk.name}</h3>
                            {[{ label: "Level 7", level: sk.lv7 }, ...(sk.m3 ? [{ label: "Mastery 3", level: sk.m3 }] : [])].map((l) => (
                                <div key={l.label} className="mt-2 md:mt-0">
                                    <Label className="mb-0.5 text-(--ink)/60">{l.label}</Label>
                                    <SkillLevelText level={l.level} />
                                </div>
                            ))}
                        </div>
                    ))}
                </DossierBlock>
            )}

            {secondary.length > 0 && <BalancedColumns>{secondary}</BalancedColumns>}
        </>
    )
}
