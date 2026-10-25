import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { motion } from "framer-motion"
import type { Operator, OperatorDetail } from "@/types/Operator"
import RarityStars from "@/components/RarityStars"
import ClassOperator from "@/components/ClassOperator"
import { Label } from "@/components/swiss"
import FitTitle from "@/components/swiss/FitTitle"
import StatTable from "@/components/detail/StatTable"
import RangeTileMap from "@/components/detail/RangeTileMap"
import { BackLink, DataStamp, DetailGallery } from "@/components/detail/OperatorHeader"
import {
    BaseSkillList, ModuleList, PotentialList, ProfileText, PromotionList, Rich, SkillRows, TalentList,
} from "@/components/detail/parts"
import { classAndBranch, eliteLabel, formatStat, promotionsOf, resolveRange } from "@/lib/operatorDetail"
import { useMediaQuery } from "@/hooks/useMediaQuery"

// Variant C (?v=c), "impression first": the first screen reads like Home (big art, big
// name, class/branch, rarity, four key numbers); the data sheet starts below the fold, and
// the secondary info sits in tabs so it doesn't all pile up at once.

const ART_SIZES = "(max-width: 767px) 100vw, 55vw"
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// the four numbers on the first screen: at the highest elite's max level
const KEY_STATS = [
    { key: "hp", label: "Max HP" },
    { key: "atk", label: "ATK" },
    { key: "def", label: "DEF" },
    { key: "cost", label: "DP cost" },
] as const

function Hero({ operator, detail }: { operator: Operator; detail: OperatorDetail | null }) {
    const top = detail?.phases.at(-1)
    return (
        <section className="relative grid grid-cols-[repeat(var(--cols),var(--cell))] md:h-[calc(100dvh-var(--navbar-h))] md:min-h-[calc(var(--cell)*5)]" aria-labelledby="operator-title">
            <div className="col-span-full h-[calc(var(--cell)*5)] md:col-span-6 md:col-start-7 md:row-start-1 md:h-auto">
                <DetailGallery operator={operator} detail={detail} sizes={ART_SIZES} />
            </div>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="col-span-full flex flex-col pb-8 pt-6 md:col-span-6 md:row-start-1 md:justify-between md:pr-[calc(var(--cell)*0.5)] md:pt-4"
            >
                <div className="flex items-center justify-between gap-3">
                    <BackLink />
                    <DataStamp detail={detail} />
                </div>
                <div className="mt-6 md:mt-0">
                    <div className="[&_svg]:text-(--ink)"><RarityStars rarity={operator.rarity} size="lg" /></div>
                    <FitTitle id="operator-title" text={operator.name} maxCells={1.6} className="mt-3 font-medium uppercase leading-[0.84] tracking-tighter" />
                    <div className="mt-5 flex items-center gap-4">
                        <ClassOperator
                            profession={operator.profession}
                            subProfessionId={operator.subProfessionId}
                            className="flex gap-2"
                            iconClassName="mb-0 h-11 w-11 bg-(--ink)"
                        />
                        <span className="h-10 w-px bg-(--ink)/30" />
                        <Label>{classAndBranch(operator)}<br />{capitalize(operator.position.toLowerCase())}</Label>
                    </div>
                    {top && (
                        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
                            {KEY_STATS.map((s) => (
                                <div key={s.key} className="border-t border-(--ink) pt-2">
                                    <dt><Label as="span">{s.label}</Label></dt>
                                    <dd className="mt-2 text-[calc(var(--cell)*0.42)] font-normal leading-[0.8] tracking-[-0.06em] tabular-nums md:text-[calc(var(--cell)*0.34)]">{formatStat(top.max[s.key])}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    {top && (
                        <Label className="mt-4 text-(--ink)/60">({eliteLabel((detail?.phases.length ?? 1) - 1)}, level {top.maxLevel}. Full sheet below)</Label>
                    )}
                </div>
            </motion.div>
        </section>
    )
}

type Tab = { id: string; label: string; content: ReactNode }

// segmented tabs for the secondary info; arrow keys move between tabs
function Tabs({ tabs }: { tabs: Tab[] }) {
    const [active, setActive] = useState(tabs[0]?.id)
    const base = useId()
    const refs = useRef<(HTMLButtonElement | null)[]>([])
    const onKey = (e: KeyboardEvent, i: number) => {
        const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
        if (!step) return
        e.preventDefault()
        const next = (i + step + tabs.length) % tabs.length
        setActive(tabs[next].id)
        refs.current[next]?.focus()
    }
    return (
        <div>
            <div role="tablist" aria-label="Operator details" className="flex flex-wrap border-b border-(--ink)">
                {tabs.map((t, i) => {
                    const on = t.id === active
                    return (
                        <button
                            key={t.id}
                            ref={(el) => { refs.current[i] = el }}
                            role="tab"
                            id={`${base}-tab-${t.id}`}
                            aria-selected={on}
                            aria-controls={`${base}-panel-${t.id}`}
                            tabIndex={on ? 0 : -1}
                            onClick={() => setActive(t.id)}
                            onKeyDown={(e) => onKey(e, i)}
                            className={`swiss-label px-4 py-2.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ink) ${on ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
                        >
                            {t.label}
                        </button>
                    )
                })}
            </div>
            {tabs.map((t) => (
                <div key={t.id} role="tabpanel" id={`${base}-panel-${t.id}`} aria-labelledby={`${base}-tab-${t.id}`} hidden={t.id !== active} className="pt-5">
                    {t.content}
                </div>
            ))}
        </div>
    )
}

function SheetSection({ index, title, children }: { index: number; title: string; children: ReactNode }) {
    return (
        <section className="mt-[calc(var(--cell)*0.6)]">
            <Label as="h2" className="mb-4">{String(index).padStart(2, "0")} ({title})</Label>
            {children}
        </section>
    )
}

// two lists next to each other inside a tab (talents + potential), each with its own label
function Pair({ left, right }: { left: [string, ReactNode]; right?: [string, ReactNode] }) {
    return (
        <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {[left, right].filter(Boolean).map((p) => (
                <div key={p![0]}>
                    <Label as="h3" className="mb-2 text-(--ink)/60">{p![0]}</Label>
                    {p![1]}
                </div>
            ))}
        </div>
    )
}

function DataSheet({ operator, detail }: { operator: Operator; detail: OperatorDetail }) {
    const wide = useMediaQuery("(min-width: 768px)")
    const last = detail.phases.length - 1
    const [phase, setPhase] = useState(last)
    const [level, setLevel] = useState(detail.phases[last]?.maxLevel ?? 1)
    const range = resolveRange(detail, phase, operator.rangeId)

    const tabs: Tab[] = []
    if (detail.skills.length > 0) tabs.push({ id: "skills", label: `Skills (${detail.skills.length})`, content: <SkillRows skills={detail.skills} /> })
    if (detail.talents.length > 0 || detail.potentials.length > 0) {
        tabs.push({
            id: "talents",
            label: "Talents",
            content: (
                <Pair
                    left={["Talents", detail.talents.length > 0 ? <TalentList detail={detail} /> : <Label>(None)</Label>]}
                    right={detail.potentials.length > 0 ? ["Potential", <PotentialList detail={detail} />] : undefined}
                />
            ),
        })
    }
    if (detail.modules.length > 0) tabs.push({ id: "modules", label: "Modules", content: <div className="md:columns-2 md:gap-x-10 [&>*]:break-inside-avoid"><ModuleList detail={detail} /></div> })
    if (detail.baseSkills.length > 0) tabs.push({ id: "base", label: "Base", content: <div className="md:columns-2 md:gap-x-10 [&>*]:break-inside-avoid"><BaseSkillList detail={detail} /></div> })
    if (promotionsOf(detail).length > 0) tabs.push({ id: "materials", label: "Materials", content: <PromotionList detail={detail} tile="calc(var(--cell)*0.55)" /> })
    if (detail.usage || detail.quote) tabs.push({ id: "profile", label: "Profile", content: <ProfileText detail={detail} /> })

    return (
        <>
            <SheetSection index={1} title="Attributes">
                <div className="grid gap-x-10 gap-y-6 md:grid-cols-[minmax(0,1fr)_calc(var(--cell)*3)]">
                    <div>
                        {detail.trait && (
                            <p className="mb-4 max-w-prose text-[15px] leading-snug"><Label as="span" className="mr-2 text-(--ink)/60">Trait</Label><Rich text={detail.trait} /></p>
                        )}
                        <StatTable detail={detail} phase={phase} level={level} onPhase={setPhase} onLevel={setLevel} transposed={!wide} />
                    </div>
                    <div>
                        <Label className="mb-2 text-(--ink)/60">Range {range.id ?? "none"} ({eliteLabel(range.from)})</Label>
                        <RangeTileMap operatorId={operator.id} rangeId={range.id} />
                    </div>
                </div>
            </SheetSection>
            {tabs.length > 0 && (
                <SheetSection index={2} title="Details">
                    <Tabs key={operator.id} tabs={tabs} />
                </SheetSection>
            )}
        </>
    )
}

export default function ImpressionView({ operator, detail }: { operator: Operator; detail: OperatorDetail | null }) {
    return (
        <div className="dossier mx-(--m)">
            <Hero operator={operator} detail={detail} />
            {detail ? <DataSheet key={operator.id} operator={operator} detail={detail} /> : <Label className="py-6">(Loading the file)</Label>}
        </div>
    )
}
