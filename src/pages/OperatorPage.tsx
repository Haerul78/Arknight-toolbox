import { memo, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, X } from "lucide-react"
import operators from "@/data/operators.json"
import meta from "@/data/meta.json"
import { ArrowCircle, Band, CellToggle, ClassGlyph, Label, SectionHeader, SwissPage } from "@/components/swiss"
import { useActiveRow } from "@/components/swiss/useActiveRow"
import CountUp from "@/components/CountUp"
import OperatorAvatar from "@/components/OperatorAvatar"
import RarityStars from "@/components/RarityStars"
import RangeTiles from "@/components/RangeTiles"
import { professionLabel } from "@/lib/profession"
import { rarityNumber } from "@/lib/rarity"
import type { Operator } from "@/types/Operator"

const PROFESSIONS = ["PIONEER", "WARRIOR", "TANK", "SNIPER", "CASTER", "MEDIC", "SUPPORT", "SPECIAL"]
const RARITIES = ["TIER_6", "TIER_5", "TIER_4", "TIER_3", "TIER_2", "TIER_1"]
const generated = meta.operators.generatedAt.slice(0, 10)

type SortKey = "rarity" | "name" | "class"
const SORTS: { key: SortKey; label: string }[] = [
    { key: "rarity", label: "Rarity" },
    { key: "name", label: "Name" },
    { key: "class", label: "Class" },
]

// A–Z sorting and dividers ignore leading quotes and digits ("'Justice Knight'", "12F"),
// so the order and the letter groups always agree and each letter appears once
const sortName = (name: string) => name.replace(/^[^A-Za-z]+/, "")
const initial = (name: string) => sortName(name).charAt(0).toUpperCase() || "#"

function sortOperators(list: Operator[], sort: SortKey) {
    const byName = (a: Operator, b: Operator) => sortName(a.name).localeCompare(sortName(b.name))
    const byRarity = (a: Operator, b: Operator) => rarityNumber(b.rarity) - rarityNumber(a.rarity)
    const copy = [...list]
    if (sort === "name") return copy.sort(byName)
    if (sort === "class") return copy.sort((a, b) => PROFESSIONS.indexOf(a.profession) - PROFESSIONS.indexOf(b.profession) || byRarity(a, b) || byName(a, b))
    // rarity keeps the game's table order inside each tier
    return copy.sort(byRarity)
}

// dividers follow whatever the list is sorted by
function groupLabel(op: Operator, sort: SortKey) {
    if (sort === "name") return initial(op.name)
    if (sort === "class") return professionLabel[op.profession] ?? op.profession
    return `${rarityNumber(op.rarity)}★`
}

// ---- roster row ----

type RowProps = {
    op: Operator
    number: number
    active: boolean
    rowProps: ReturnType<typeof useActiveRow>["rowProps"]
}

// Memoized: hovering re-renders only the two rows whose `active` changes, not all 434.
// content-visibility lets the browser skip layout/paint for rows far off screen.
const RosterRow = memo(function RosterRow({ op, number, active, rowProps }: RowProps) {
    return (
        <li className="swiss-rule-t [contain-intrinsic-size:auto_var(--cell)] [content-visibility:auto]">
            <Link
                to={`/operators/${op.id}`}
                data-row-key={op.id}
                {...rowProps}
                className={`relative grid h-(--cell) grid-cols-[repeat(var(--cols),var(--cell))] transition-colors duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ink) ${active ? "bg-primary" : ""}`}
            >
                <Label as="span" className="hidden pt-3 md:col-start-1 md:block">{String(number).padStart(3, "0")}</Label>

                {/* phones have no hover, so the avatar is in colour there from the start */}
                <span className="col-start-1 overflow-hidden bg-(--ink) md:col-start-2">
                    <OperatorAvatar
                        id={op.id}
                        name=""
                        className={`transition-[filter] duration-300 ${active ? "" : "can-hover:grayscale"}`}
                    />
                </span>

                <span className="col-span-2 col-start-2 flex min-w-0 flex-col justify-center px-3 md:col-span-5 md:col-start-3 md:px-4">
                    <span className="truncate text-[calc(var(--cell)*0.27)] font-medium uppercase leading-none tracking-[-0.04em] md:text-[calc(var(--cell)*0.36)]">
                        {op.name}
                    </span>
                    {/* phones: class and stars under the name */}
                    <span className="mt-1.5 flex items-center gap-2 md:hidden">
                        <Label as="span">{professionLabel[op.profession]}</Label>
                        <span className="[&_svg]:text-(--ink)"><RarityStars rarity={op.rarity} size="xs" /></span>
                    </span>
                </span>

                <span className="hidden items-center gap-2 md:col-span-1 md:col-start-8 md:flex">
                    <ClassGlyph profession={op.profession} className="h-7 w-7" />
                    <Label as="span">{professionLabel[op.profession]}</Label>
                </span>

                {/* attack range, drawn as map tiles when the row is active */}
                <span className={`hidden items-center justify-center p-[14%] transition-opacity duration-300 md:col-start-9 md:flex ${active ? "opacity-100" : "opacity-0"}`}>
                    <RangeTiles rangeId={op.rangeId} className="max-h-full max-w-full text-(--ink)" />
                </span>

                <span className="hidden items-center md:col-start-10 md:flex [&_svg]:text-(--ink)">
                    <RarityStars rarity={op.rarity} size="xs" />
                </span>
                <Label as="span" className="hidden self-center md:col-start-11 md:block">{op.position}</Label>

                <span className="col-start-4 flex items-center justify-end pr-3 md:col-start-12">
                    <ArrowCircle active={active} />
                </span>
            </Link>
        </li>
    )
})

export default function OperatorPage() {
    const [search, setSearch] = useState("")
    const [profession, setProfession] = useState<string | null>(null)
    const [rarity, setRarity] = useState<string | null>(null)
    const [sort, setSort] = useState<SortKey>("rarity")
    const { active, listProps, rowProps } = useActiveRow()

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        return sortOperators(
            operators.filter((op) =>
                op.name.toLowerCase().includes(q) &&
                (!profession || op.profession === profession) &&
                (!rarity || op.rarity === rarity)
            ),
            sort,
        )
    }, [search, profession, rarity, sort])

    const groups = useMemo(() => {
        const out: { label: string; items: Operator[] }[] = []
        for (const op of filtered) {
            const label = groupLabel(op, sort)
            if (out.at(-1)?.label !== label) out.push({ label, items: [] })
            out.at(-1)!.items.push(op)
        }
        return out
    }, [filtered, sort])

    const filtering = Boolean(search || profession || rarity)
    const clear = () => { setSearch(""); setProfession(null); setRarity(null) }
    let number = 0

    return (
        <SwissPage>
            {/* ---- title ---- */}
            <Band rows={3} aria-labelledby="operators-title">
                <Label className="col-span-2 self-center md:col-span-4">(Operator archive)<br />Every playable operator on file</Label>
                <Label className="col-span-2 self-center text-right md:col-span-4 md:col-start-9">
                    <span className="hidden md:inline">Data generated </span>{generated}<br />EN gamedata
                </Label>
                <h1 id="operators-title" className="swiss-title col-span-full row-span-2 row-start-2 flex items-end overflow-hidden pb-[0.04em]">
                    <motion.span initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }} className="block">
                        Operators
                    </motion.span>
                </h1>
            </Band>

            {/* ---- filters ---- */}
            <section aria-label="Filter operators">
                <SectionHeader
                    index={1}
                    caption="Filter"
                    aside={
                        <Label as="span">
                            Showing <CountUp value={filtered.length} /> of {operators.length}
                            {filtering && (
                                <button type="button" onClick={clear} className="ml-3 underline underline-offset-2 hover:no-underline">Clear</button>
                            )}
                        </Label>
                    }
                />
                <Band className="swiss-rule-y">
                    <label className="col-span-full flex items-center gap-3 px-1 md:col-span-4">
                        <Search size={18} aria-hidden className="shrink-0" />
                        <span className="sr-only">Search operators</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name"
                            className="min-w-0 flex-1 border-b border-(--ink) bg-transparent py-1 text-lg outline-none placeholder:font-mono placeholder:text-xs placeholder:uppercase placeholder:tracking-[0.14em] placeholder:text-(--ink)/50 focus-visible:border-primary"
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="shrink-0 p-1"><X size={16} /></button>
                        )}
                    </label>
                    <div role="radiogroup" aria-label="Sort by" className="col-span-full row-start-2 flex items-center gap-1 px-1 md:col-span-4 md:col-start-9 md:row-start-1 md:justify-end">
                        <Label as="span" className="mr-2">Sort</Label>
                        {SORTS.map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                role="radio"
                                aria-checked={sort === s.key}
                                onClick={() => setSort(s.key)}
                                className={`swiss-label px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-(--ink) ${sort === s.key ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </Band>

                {/* class + rarity: one cell per option; on phones each strip scrolls sideways */}
                <Band className="swiss-rule-t">
                    <div className="col-span-full flex overflow-x-auto scrollbar-hide md:col-span-8">
                        {PROFESSIONS.map((p) => (
                            <CellToggle key={p} label={professionLabel[p]} active={profession === p} onClick={() => setProfession(profession === p ? null : p)}>
                                <ClassGlyph profession={p} className="h-[34%] w-[34%]" />
                                <Label as="span" className="text-[10px]">{professionLabel[p]}</Label>
                            </CellToggle>
                        ))}
                    </div>
                </Band>
                <Band className="swiss-rule-y">
                    <div className="col-span-full flex overflow-x-auto scrollbar-hide md:col-span-6">
                        {RARITIES.map((r) => (
                            <CellToggle key={r} label={`${rarityNumber(r)} star`} active={rarity === r} onClick={() => setRarity(rarity === r ? null : r)}>
                                <span className="swiss-number">{rarityNumber(r)}</span>
                                <Label as="span" className="text-[10px]">Star</Label>
                            </CellToggle>
                        ))}
                    </div>
                </Band>
            </section>

            {/* ---- roster ---- */}
            <section aria-label="Operator roster">
                <SectionHeader index={2} caption={`Roster, by ${sort}`} />
                {filtered.length === 0 ? (
                    <Band rows={2} className="swiss-rule-y">
                        <div className="col-span-full flex flex-col justify-center gap-3 md:col-span-6">
                            <p className="text-[calc(var(--cell)*0.27)] font-medium uppercase leading-none tracking-[-0.03em]">No operator matches</p>
                            <Label>
                                Try another name or remove a filter.{" "}
                                <button type="button" onClick={clear} className="underline underline-offset-2">Clear filters</button>
                            </Label>
                        </div>
                    </Band>
                ) : (
                    <ul className="relative mx-(--m) swiss-rule-y" {...listProps}>
                        {groups.map((g) => (
                            <li key={`${sort}-${g.label}`}>
                                <div className="swiss-rule-t flex h-(--cell) items-end gap-3 pb-2">
                                    <Label as="h2">({g.label})</Label>
                                    <Label as="span" className="text-(--ink)/50">{g.items.length} {g.items.length === 1 ? "operator" : "operators"}</Label>
                                </div>
                                <ul>
                                    {g.items.map((op) => (
                                        <RosterRow key={op.id} op={op} number={++number} active={active === op.id} rowProps={rowProps} />
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </SwissPage>
    )
}
