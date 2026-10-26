import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import meta from "@/data/meta.json"
import operators from "@/data/operators.json"
import { Band, CellToggle, CropMarks, Label, SectionHeader, SwissPage } from "@/components/swiss"
import CellBlock from "@/components/swiss/CellBlock"
import FitTitle from "@/components/swiss/FitTitle"
import GameIcon from "@/components/GameIcon"
import OperatorAvatar from "@/components/OperatorAvatar"
import MaterialIcon, { TierMark } from "@/components/materials/MaterialIcon"
import { MaterialTile } from "@/components/materials/MaterialTile"
import { CHANCE_LABEL, breakdown, categoryLabel, materialById, tierOf } from "@/lib/materials"
import { rarityColor, rarityNumber } from "@/lib/rarity"
import type { Material, MaterialDetail, OperatorNeed, StageDrop } from "@/types/Material"

const ease = [0.22, 1, 0.36, 1] as const
const generated = meta.materials.generatedAt.slice(0, 10)
const operatorById = Object.fromEntries(operators.map((o) => [o.id, o]))
const fmt = (n: number) => n.toLocaleString("en")

// ---- small parts ----

function LmdCell({ amount }: { amount: number }) {
    return (
        <div title={`${fmt(amount)} LMD`} className="relative flex h-(--cell) w-(--cell) flex-col items-center justify-center">
            <GameIcon src="/items/GOLD.png" alt="" className="h-[52%] w-[52%]" />
            <span className="mt-1 font-mono text-[11px] tabular-nums">{fmt(amount)} LMD</span>
        </div>
    )
}

// a labelled row of tiles; long rows wrap under the tiles, not under the label
function TileRow({ title, note, children }: { title: ReactNode; note?: ReactNode; children: ReactNode }) {
    return (
        <CellBlock className="swiss-rule-t">
            <RowHead title={title} note={note} />
            <div className="col-span-full grid auto-rows-(--cell) grid-cols-[repeat(var(--cols),var(--cell))] md:col-span-10 md:grid-cols-[repeat(10,var(--cell))]">
                {children}
            </div>
        </CellBlock>
    )
}

// the label cell that opens a row of tiles (two cells wide on desktop)
function RowHead({ title, note }: { title: ReactNode; note?: ReactNode }) {
    return (
        <div className="col-span-full flex flex-col justify-end py-3 md:col-span-2 md:pr-3">
            <span className="text-[17px] leading-tight">{title}</span>
            {note && <Label as="span" className="mt-1 text-(--ink)/60">{note}</Label>}
        </div>
    )
}

function TextButton({ onClick, children, pressed }: { onClick: () => void; children: ReactNode; pressed?: boolean }) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onClick}
            className={`swiss-label px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-(--ink) ${pressed ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
        >
            {children}
        </button>
    )
}

// ---- 01 recipe ----

function Recipe({ material, detail }: { material: Material; detail: MaterialDetail }) {
    const [full, setFull] = useState(false)
    const r = detail.recipe
    const tiles = (costs: { id: string; count: number }[]) =>
        costs.map((c) => materialById[c.id] && <MaterialTile key={c.id} material={materialById[c.id]} count={c.count} named />)
    // only worth a toggle when some ingredient is itself crafted in the Workshop
    const deep = r?.room === "WORKSHOP" && r.costs.some((c) => materialById[c.id]?.recipe?.room === "WORKSHOP")
    const total = deep ? breakdown(material.id) : null

    return (
        <>
            {r && (
                <TileRow
                    title={r.room === "WORKSHOP" ? `Workshop Lv ${r.level}` : `Factory Lv ${r.level}`}
                    note={r.count > 1 ? `Makes ${r.count}` : r.seconds ? `${Math.round(r.seconds / 60)} min each` : "Makes 1"}
                >
                    {r.costs.length > 0 ? tiles(r.costs) : (
                        <p className="col-span-full self-center text-[15px] md:col-span-6">No materials needed, only Factory time.</p>
                    )}
                    {r.gold > 0 && <LmdCell amount={r.gold} />}
                    {/* the breakdown opens from the end of the recipe it expands */}
                    {total && (
                        <CellToggle label="Full breakdown" active={full} onClick={() => setFull(!full)}>
                            <Label as="span" className="text-center text-[10px] leading-snug">{full ? "Hide" : "Full"}<br />breakdown</Label>
                        </CellToggle>
                    )}
                </TileRow>
            )}
            {total && full && (
                <TileRow title="Everything it takes" note="Crafted all the way down">
                    {tiles(total.costs)}
                    <LmdCell amount={total.gold} />
                </TileRow>
            )}
            {r?.byproducts && r.byproducts.length > 0 && (
                <TileRow title="Byproduct" note={`${Math.round((r.byproductRate ?? 0) * 100)}% chance, one of`}>
                    {r.byproducts.map((b) => {
                        const m = materialById[b.id]
                        if (!m) return null
                        return (
                            <div key={b.id} className="relative">
                                <MaterialTile material={m} named />
                                <span className="swiss-label pointer-events-none absolute right-1.5 top-1 text-(--ink)/60">{Math.round(b.share * 100)}%</span>
                            </div>
                        )
                    })}
                </TileRow>
            )}
            {detail.conversions.map((c, i) => (
                <TileRow key={i} title="Or convert" note={`Makes ${c.count}, Workshop`}>
                    {tiles(c.costs)}
                </TileRow>
            ))}
        </>
    )
}

// ---- 03 needed by ----

type Kind = "all" | "elite" | "skill" | "mastery" | "module"
const KINDS: { key: Kind; label: string }[] = [
    { key: "all", label: "All" },
    { key: "elite", label: "Elite" },
    { key: "skill", label: "Skills" },
    { key: "mastery", label: "Mastery" },
    { key: "module", label: "Modules" },
]
const amount = (r: OperatorNeed, k: Kind) => (k === "all" ? r.elite + r.skill + r.mastery + r.module : r[k])
const FIRST = 24

function NeededBy({ rows }: { rows: OperatorNeed[] }) {
    const [kind, setKind] = useState<Kind>("all")
    const [sort, setSort] = useState<"amount" | "rarity">("amount")
    const [all, setAll] = useState(false)
    const totals = useMemo(() => Object.fromEntries(KINDS.map((k) => [k.key, rows.reduce((s, r) => s + amount(r, k.key), 0)])) as Record<Kind, number>, [rows])
    const list = useMemo(() => {
        const rarity = (r: OperatorNeed) => rarityNumber(operatorById[r.id]?.rarity ?? "")
        return rows
            .filter((r) => amount(r, kind) > 0)
            .sort((a, b) => sort === "amount"
                ? amount(b, kind) - amount(a, kind) || rarity(b) - rarity(a)
                : rarity(b) - rarity(a) || amount(b, kind) - amount(a, kind))
    }, [rows, kind, sort])
    const shown = all ? list : list.slice(0, FIRST)

    return (
        <>
            {/* the summary doubles as the filter: each count selects its kind */}
            <Band className="swiss-rule-t">
                <div className="col-span-full flex flex-col justify-end py-3 md:col-span-3">
                    <span className="swiss-number text-[calc(var(--cell)*0.5)]">{fmt(rows.length)}</span>
                    <Label as="span" className="mt-2">Operators · {fmt(totals.all)} total</Label>
                </div>
                <div role="radiogroup" aria-label="Upgrade kind" className="col-span-full flex overflow-x-auto scrollbar-hide md:col-span-5">
                    {KINDS.map((k) => totals[k.key] > 0 && (
                        <CellToggle key={k.key} label={`${k.label}: ${fmt(totals[k.key])}`} active={kind === k.key} onClick={() => { setKind(k.key); setAll(false) }}>
                            <span className="font-mono text-[15px] tabular-nums">{fmt(totals[k.key])}</span>
                            <Label as="span" className="text-[10px]">{k.label}</Label>
                        </CellToggle>
                    ))}
                </div>
                <div role="radiogroup" aria-label="Sort operators" className="col-span-full flex items-center gap-1 md:col-span-4 md:justify-end">
                    <Label as="span" className="mr-2">Sort</Label>
                    {(["amount", "rarity"] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={sort === s}
                            onClick={() => setSort(s)}
                            className={`swiss-label px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-(--ink) ${sort === s ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
                        >
                            {s === "amount" ? "Amount" : "Rarity"}
                        </button>
                    ))}
                </div>
            </Band>
            <ul className="swiss-band swiss-rule-t">
                {shown.map((r) => {
                    const op = operatorById[r.id]
                    const n = amount(r, kind)
                    const parts = KINDS.slice(1).filter((k) => r[k.key as Exclude<Kind, "all">] > 0).map((k) => `${k.label} ${r[k.key as Exclude<Kind, "all">]}`).join(", ")
                    return (
                        <li key={r.id}>
                            <Link
                                to={`/operators/${r.id}`}
                                title={`${op?.name}: ${parts}`}
                                className="group relative flex h-(--cell) w-(--cell) flex-col focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ink)"
                            >
                                <span className="min-h-0 flex-1 overflow-hidden bg-(--ink)">
                                    <OperatorAvatar id={r.id} name="" className="transition-transform duration-300 can-hover:group-hover:scale-105" />
                                </span>
                                <span className="flex h-[24%] items-center justify-between gap-1 px-1.5">
                                    <span className="truncate text-[11px] leading-none">{op?.name}</span>
                                    <span className="shrink-0 font-mono text-[11px] font-medium tabular-nums">×{n}</span>
                                </span>
                                <span className="sr-only">, needs {n}</span>
                            </Link>
                        </li>
                    )
                })}
                {/* the rest opens from the cell right after the last face */}
                {list.length > FIRST && (
                    <li>
                        <CellToggle label={all ? `Show the first ${FIRST}` : `Show all ${list.length}`} active={all} onClick={() => setAll(!all)}>
                            <span className="font-mono text-[15px] tabular-nums">{all ? "–" : `+${list.length - FIRST}`}</span>
                            <Label as="span" className="text-[10px]">{all ? "Fewer" : "Show all"}</Label>
                        </CellToggle>
                    </li>
                )}
            </ul>
        </>
    )
}

// ---- 04 how to get ----

const GROUPS: { key: StageDrop["group"]; label: string; closed?: boolean }[] = [
    { key: "main", label: "Main story" },
    { key: "supply", label: "Supply stages" },
    { key: "annihilation", label: "Annihilation" },
    { key: "event", label: "Events and side stories", closed: true },
    { key: "other", label: "Other modes", closed: true },
]
const DROP_LABEL = { main: "Main drop", special: "Special drop", extra: "Extra drop" }
const FIRST_STAGES = 8

function StageGroup({ label, stages, closed }: { label: string; stages: StageDrop[]; closed?: boolean }) {
    const [open, setOpen] = useState(!closed)
    const [all, setAll] = useState(false)
    const shown = all ? stages : stages.slice(0, FIRST_STAGES)
    return (
        <CellBlock className="swiss-rule-t">
            <div className="col-span-full flex items-end justify-between gap-3 py-3">
                <div className="flex items-end gap-3">
                    <h3 className="text-[17px] leading-tight">{label}</h3>
                    <Label as="span" className="text-(--ink)/50">{stages.length}</Label>
                </div>
                {closed && <TextButton onClick={() => setOpen(!open)} pressed={open}>{open ? "Hide" : "Show"}</TextButton>}
            </div>
            {closed && !open && (
                <p className="col-span-full pb-3 text-[14px] text-(--ink)/60">Event stages may only be open during the event or its rerun.</p>
            )}
            {open && (
                <ul className="col-span-full">
                    {shown.map((s) => (
                        <li key={s.id} className="grid grid-cols-[repeat(var(--cols),var(--cell))] items-baseline border-t border-(--line) py-2.5">
                            <span className="col-span-1 font-mono text-[15px] font-medium md:col-span-1">{s.code}</span>
                            <span className="col-span-3 min-w-0 md:col-span-5">
                                <span className="text-[15px]">{s.name}</span>
                                {s.adverse && <Label as="span" className="ml-2">Adverse</Label>}
                                {s.zone && <span className="block truncate text-[13px] text-(--ink)/60">{s.zone}</span>}
                            </span>
                            <span className="col-span-2 col-start-2 text-[14px] md:col-span-2 md:col-start-auto">{DROP_LABEL[s.drop]}</span>
                            <span className="text-[14px] md:col-span-2">{CHANCE_LABEL[s.chance]} chance</span>
                            <span className="text-right font-mono text-[14px] tabular-nums md:col-span-2 md:text-left">{s.ap} <span className="font-display text-(--ink)/60">sanity</span></span>
                        </li>
                    ))}
                </ul>
            )}
            {open && stages.length > FIRST_STAGES && (
                <div className="col-span-full py-3">
                    <TextButton onClick={() => setAll(!all)} pressed={all}>{all ? `Show the first ${FIRST_STAGES}` : `Show all ${stages.length}`}</TextButton>
                </div>
            )}
        </CellBlock>
    )
}

// ---- page ----

export default function MaterialDetailPage() {
    const { id = "" } = useParams()
    const material = materialById[id]
    const [detail, setDetail] = useState<MaterialDetail | null>(null)

    // ~1.9MB with every stage list, so it stays out of the main bundle
    useEffect(() => {
        let cancelled = false
        import("@/data/material-details.json").then((m) => {
            if (!cancelled) setDetail((m.default as Record<string, MaterialDetail>)[id] ?? null)
        })
        return () => { cancelled = true }
    }, [id])

    const back = (
        <Link to="/materials" className="swiss-label group inline-flex items-center gap-2 hover:underline focus-visible:outline-2 focus-visible:outline-(--ink)">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> Materials
        </Link>
    )

    if (!material) {
        return (
            <SwissPage>
                <Band rows={3}>
                    <div className="col-span-full row-start-2 flex flex-col justify-center gap-3">
                        <p className="swiss-title text-[calc(var(--cell)*0.5)]">Material not found</p>
                        <Label>This id isn't in the depot. <Link to="/materials" className="underline underline-offset-2">Open the depot</Link></Label>
                    </div>
                </Band>
            </SwissPage>
        )
    }

    const owner = material.operatorId ? operatorById[material.operatorId] : undefined
    const stagesBy = (g: StageDrop["group"]) => detail?.stages.filter((s) => s.group === g) ?? []
    const hasRecipe = Boolean(detail && (detail.recipe || detail.conversions.length))
    const sections = [
        hasRecipe && "recipe",
        detail?.usedIn.length && "usedIn",
        detail?.neededBy.length && "neededBy",
        detail && "obtain",
    ].filter(Boolean) as string[]
    const num = (k: string) => sections.indexOf(k) + 1
    const facts: [string, ReactNode][] = [
        ["Needed by", material.neededBy ? `${material.neededBy} operators · ${fmt(material.neededTotal!)} total` : null],
        ["Made in", material.recipe ? (material.recipe.room === "WORKSHOP" ? "Workshop" : "Factory") : null],
        ["Main drop", material.drops?.join(", ")],
        ["Obtain", detail?.obtain],
    ].filter(([, v]) => v) as [string, ReactNode][]

    return (
        <SwissPage>
            <Band rows={1}>
                <div className="col-span-full flex items-center justify-between gap-4">
                    {back}
                    <Label as="span" className="text-right">Data {generated}</Label>
                </div>
            </Band>

            {/* ---- head: the item in a 3×3 slot, the facts beside it ---- */}
            <CellBlock className="swiss-rule-t" as="section">
                <div className="relative col-span-2 aspect-square md:col-span-3">
                    <CropMarks size={20} />
                    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2, ease }} className="flex h-full w-full items-center justify-center p-[16%]">
                        <MaterialIcon material={material} />
                    </motion.div>
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: rarityColor[material.rarity] }} />
                </div>
                <div className="col-span-2 flex flex-col justify-end gap-2 pb-2 pl-3 md:hidden">
                    <TierMark tier={tierOf(material)} color={rarityColor[material.rarity]} />
                    <Label as="span" className="text-(--ink)/60">{categoryLabel[material.category]}</Label>
                </div>
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.35, ease }}
                    className="col-span-full flex flex-col justify-end py-5 md:col-span-9 md:col-start-4 md:pl-[calc(var(--cell)*0.25)]"
                >
                    <div className="hidden items-center gap-4 md:flex">
                        <TierMark tier={tierOf(material)} color={rarityColor[material.rarity]} />
                        <Label as="span" className="text-(--ink)/60">{categoryLabel[material.category]}</Label>
                    </div>
                    <FitTitle id="material-title" text={material.name} maxCells={0.9} className="font-medium uppercase leading-[0.86] tracking-[-0.05em] md:mt-3" />
                    {owner && (
                        <Link to={`/operators/${owner.id}`} className="mt-4 inline-flex items-center gap-3 self-start hover:underline focus-visible:outline-2 focus-visible:outline-(--ink)">
                            <span className="h-10 w-10 overflow-hidden bg-(--ink)"><OperatorAvatar id={owner.id} name="" /></span>
                            <span className="text-[15px]">Belongs to {owner.name}</span>
                        </Link>
                    )}
                    {detail?.usage && <p className="mt-4 max-w-prose text-[17px] leading-snug">{detail.usage}</p>}
                    {detail?.description && <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-(--ink)/65">{detail.description}</p>}
                    {facts.length > 0 && (
                        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
                            {facts.map(([k, v]) => (
                                <div key={k}>
                                    <dt><Label as="span" className="text-(--ink)/60">{k}</Label></dt>
                                    <dd className={`mt-0.5 text-sm ${k === "Main drop" ? "font-mono" : ""}`}>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                </motion.div>
            </CellBlock>

            {!detail ? (
                <Band rows={2}><Label className="col-span-full self-center">(Loading the file)</Label></Band>
            ) : (
                <>
                    {hasRecipe && (
                        <section aria-label="Recipe" id="recipe">
                            <SectionHeader index={num("recipe")} caption="Recipe" />
                            <Recipe material={material} detail={detail} />
                        </section>
                    )}

                    {detail.usedIn.length > 0 && (
                        <section aria-label="Used to craft" id="used-in">
                            <SectionHeader index={num("usedIn")} caption="Used to craft" aside={<Label as="span" className="hidden text-(--ink)/60 md:inline">Number: how many go into one</Label>} />
                            <CellBlock className="swiss-rule-t">
                                {detail.usedIn.map((u) => materialById[u.id] && <MaterialTile key={u.id} material={materialById[u.id]} count={u.count} named />)}
                            </CellBlock>
                        </section>
                    )}

                    {detail.neededBy.length > 0 && (
                        <section aria-label="Needed by" id="needed-by">
                            <SectionHeader index={num("neededBy")} caption="Needed by" />
                            <NeededBy key={id} rows={detail.neededBy} />
                        </section>
                    )}

                    <section aria-label="How to get" id="how-to-get">
                        <SectionHeader index={num("obtain")} caption="How to get" aside={<Label as="span" className="hidden text-(--ink)/60 md:inline">The game gives a chance, not a rate</Label>} />
                        {GROUPS.map((g) => {
                            const list = stagesBy(g.key)
                            return list.length > 0 && <StageGroup key={`${id}-${g.key}`} label={g.label} stages={list} closed={g.closed} />
                        })}
                        {detail.stages.length === 0 && (
                            <CellBlock className="swiss-rule-t">
                                <p className="col-span-full max-w-prose py-4 text-[15px] leading-snug md:col-span-8">
                                    {detail.obtain
                                        ? `Not dropped in any stage. In the game: ${detail.obtain}.`
                                        : material.recipe
                                            ? `Not dropped in any stage. Make it in the ${material.recipe.room === "WORKSHOP" ? "Workshop" : "Factory"} with the recipe above.`
                                            : "Not dropped in any stage, and the game data doesn't say where else it comes from."}
                                </p>
                            </CellBlock>
                        )}
                    </section>
                </>
            )}
        </SwissPage>
    )
}
