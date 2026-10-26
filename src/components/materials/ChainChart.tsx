import { Fragment, type CSSProperties } from "react"
import { Label } from "@/components/swiss"
import { useActiveRow } from "@/components/swiss/useActiveRow"
import { MaterialTile } from "./MaterialTile"
import MaterialIcon, { TierMark } from "./MaterialIcon"
import { general, type MaterialFilter } from "./useMaterialFilter"
import { CATEGORIES, materialById, tierOf } from "@/lib/materials"
import { rarityColor } from "@/lib/rarity"
import type { Material } from "@/types/Material"

const TIERS = [1, 2, 3, 4, 5, 6]

type Row = { key: string; name: string; cells: Material[] }

// one row per crafting line, cells in tier order; base materials (with a T1) first, then
// the lines that start at T3, each in game-id order
function buildRows(list: Material[]): Row[] {
    const rows = new Map<string, Row>()
    for (const m of list) {
        const key = m.family ?? m.id
        if (!rows.has(key)) rows.set(key, { key, name: m.familyName ?? m.name, cells: [] })
        rows.get(key)!.cells.push(m)
    }
    const out = [...rows.values()]
    for (const r of out) r.cells.sort((a, b) => tierOf(a) - tierOf(b))
    const minSort = (r: Row) => Math.min(...r.cells.map((c) => c.sortId))
    const startsLow = (r: Row) => (tierOf(r.cells[0]) <= 2 ? 0 : 1)
    return out.sort((a, b) => startsLow(a) - startsLow(b) || (a.cells[0].category === "classToken" ? minSort(a) - minSort(b) : a.key.localeCompare(b.key)))
}

const SECTIONS = CATEGORIES.filter((c) => c.key !== "operatorToken").map((c) => ({
    ...c,
    rows: buildRows(general.filter((m) => m.category === c.key)),
}))

// how many of the left cell make one of this cell; "+" when other materials go in too
function ratioOf(cell: Material, prev: Material | undefined) {
    const r = cell.recipe
    if (!prev || !r || r.room !== "WORKSHOP") return null
    const c = r.costs.find((x) => x.id === prev.id)
    return c ? `${c.count}${r.costs.length > 1 ? "+" : ""}` : null
}

function ChainRow({ row, filter, active, rowProps }: { row: Row; filter: MaterialFilter; active: string | null; rowProps: ReturnType<typeof useActiveRow>["rowProps"] }) {
    const spare = 4 - (row.cells.length % 4)
    return (
        <div className="grid auto-rows-(--cell) grid-cols-4 md:grid-cols-[repeat(8,var(--cell))]">
            <span className="hidden min-w-0 items-center pr-3 text-[15px] leading-tight md:col-span-2 md:col-start-1 md:row-start-1 md:flex">{row.name}</span>
            {row.cells.map((m, i) => {
                const prev = row.cells.find((c) => tierOf(c) === tierOf(m) - 1)
                const ratio = ratioOf(m, prev)
                return (
                    <div key={m.id} className="relative md:row-start-1 md:col-start-(--col)" style={{ "--col": tierOf(m) + 2 } as CSSProperties}>
                        <MaterialTile
                            material={m}
                            named
                            tiered
                            active={active === m.id}
                            dim={!filter.matches.has(m.id)}
                            rowProps={{ ...rowProps, "data-row-key": m.id }}
                        />
                        {ratio && (
                            // sits on the line between the two cells; on phones only when both are on one line
                            <span
                                aria-hidden
                                className={`pointer-events-none absolute left-0 top-[30%] z-10 -translate-x-1/2 -translate-y-1/2 bg-background px-1 font-mono text-[11px] leading-[1.4] tabular-nums ${i % 4 === 0 ? "max-md:hidden" : ""}`}
                            >
                                {ratio}
                            </span>
                        )}
                    </div>
                )
            })}
            {/* phones: the line's name in the empty cells after its last item */}
            {spare >= 2 && spare < 4 && (
                <span className="flex items-end justify-end pb-2 text-right md:hidden" style={{ gridColumn: `span ${spare}` }}>
                    <Label as="span" className="text-(--ink)/60">{row.name}</Label>
                </span>
            )}
        </div>
    )
}

function Caption({ material }: { material: Material | undefined }) {
    if (!material) {
        return (
            <div className="flex flex-col gap-3 pl-4 pt-4">
                <Label as="p">(How to read the chart)</Label>
                <p className="max-w-[34ch] text-[15px] leading-snug">
                    Each row is one crafting line and each column is a tier. The number between two cells is how many of the left one make one of the right; a + means other materials go in too.
                </p>
                <p className="max-w-[34ch] text-[15px] leading-snug text-(--ink)/60">Point at a material for its recipe and who needs it. Click to open its page.</p>
            </div>
        )
    }
    const r = material.recipe
    return (
        <div className="flex flex-col gap-4 pl-4 pt-4">
            <div className="flex items-center gap-3">
                <TierMark tier={tierOf(material)} color={rarityColor[material.rarity]} />
                <Label as="span" className="text-(--ink)/60">{CATEGORIES.find((c) => c.key === material.category)?.label}</Label>
            </div>
            <p className="text-[calc(var(--cell)*0.27)] font-medium uppercase leading-[0.95] tracking-[-0.04em]">{material.name}</p>
            <dl className="flex flex-col gap-3 text-[15px] leading-snug">
                <div>
                    <dt><Label as="span" className="text-(--ink)/60">{r ? (r.room === "WORKSHOP" ? "Workshop recipe" : "Factory") : "Recipe"}</Label></dt>
                    <dd className="mt-1">
                        {r && r.costs.length > 0 ? (
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                {r.costs.map((c) => (
                                    <span key={c.id} className="inline-flex items-center gap-1">
                                        <span className="h-7 w-7"><MaterialIcon material={materialById[c.id]} /></span>
                                        <span className="font-mono text-[13px]">×{c.count}</span>
                                        <span className="sr-only">{materialById[c.id]?.name}</span>
                                    </span>
                                ))}
                                {r.gold > 0 && <span className="font-mono text-[13px]">+ {r.gold.toLocaleString("en")} LMD</span>}
                            </span>
                        ) : r ? "Factory, no materials needed" : "Can't be crafted"}
                    </dd>
                </div>
                <div>
                    <dt><Label as="span" className="text-(--ink)/60">Needed by</Label></dt>
                    <dd className="mt-1">
                        {material.neededBy ? `${material.neededBy} operators · ${material.neededTotal!.toLocaleString("en")} total` : "No operator upgrade uses it"}
                    </dd>
                </div>
                <div>
                    <dt><Label as="span" className="text-(--ink)/60">Main drop in</Label></dt>
                    <dd className="mt-1 font-mono text-[14px]">{material.drops?.join(", ") ?? <span className="font-display">No stage; see its page</span>}</dd>
                </div>
            </dl>
        </div>
    )
}

// The depot as a crafting chart (rows = crafting lines, columns = tiers).
export default function ChainChart({ filter }: { filter: MaterialFilter }) {
    const { active, listProps, rowProps } = useActiveRow()
    const visible = SECTIONS.map((s) => ({ ...s, rows: s.rows.filter((r) => r.cells.some((c) => filter.matches.has(c.id))) })).filter((s) => s.rows.length > 0)

    return (
        <div className="relative mx-(--m) grid grid-cols-[repeat(var(--cols),var(--cell))]">
            <div className="col-span-full md:col-span-8" {...listProps}>
                {visible.map((s) => (
                    <Fragment key={s.key}>
                        <div className="swiss-rule-t grid h-(--cell) grid-cols-4 items-end pb-2 md:grid-cols-[repeat(8,var(--cell))]">
                            <div className="col-span-4 flex items-end gap-3 md:col-span-2">
                                <Label as="h2">({s.label})</Label>
                                <Label as="span" className="text-(--ink)/50">{s.rows.reduce((n, r) => n + r.cells.filter((c) => filter.matches.has(c.id)).length, 0)}</Label>
                            </div>
                            {TIERS.map((t) => (
                                <Label key={t} as="span" className="hidden text-center text-(--ink)/50 md:block">T{t}</Label>
                            ))}
                        </div>
                        {s.rows.map((row) => (
                            <ChainRow key={row.key} row={row} filter={filter} active={active} rowProps={rowProps} />
                        ))}
                    </Fragment>
                ))}
            </div>
            <aside aria-live="polite" className="hidden md:col-span-4 md:col-start-9 md:block">
                <div className="sticky top-(--navbar-h) [@media(max-height:699px)]:static">
                    <Caption material={active ? materialById[active] : undefined} />
                </div>
            </aside>
        </div>
    )
}
