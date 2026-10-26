import { motion } from "framer-motion"
import { Search, X } from "lucide-react"
import meta from "@/data/meta.json"
import { Band, CellToggle, Label, SectionHeader, SwissPage } from "@/components/swiss"
import CountUp from "@/components/CountUp"
import ChainChart from "@/components/materials/ChainChart"
import TokenGroup from "@/components/materials/TokenGroup"
import MaterialIcon from "@/components/materials/MaterialIcon"
import { general, useMaterialFilter } from "@/components/materials/useMaterialFilter"
import { materialById } from "@/lib/materials"
import type { MaterialCategory } from "@/types/Material"

const generated = meta.materials.generatedAt.slice(0, 10)

// one toggle per section, shown with an item that stands for it
const TOGGLES: { key: MaterialCategory; label: string; icon: string }[] = [
    { key: "crafting", label: "Crafting", icon: "30135" },
    { key: "chip", label: "Chips", icon: "3243" },
    { key: "record", label: "Records", icon: "2004" },
    { key: "summary", label: "Summaries", icon: "3303" },
    { key: "module", label: "Modules", icon: "mod_unlock_token" },
    { key: "classToken", label: "Class tokens", icon: "tier6_sniper" },
    { key: "operatorToken", label: "Op. tokens", icon: "p_char_103_angel" },
]

export default function MaterialPage() {
    const filter = useMaterialFilter()
    const { search, setSearch, category, setCategory } = filter

    return (
        <SwissPage>
            {/* ---- title ---- */}
            <Band rows={3} aria-labelledby="materials-title">
                <Label className="col-span-2 self-center md:col-span-4">(Depot)<br />Every upgrade material on file</Label>
                <Label className="col-span-2 self-center text-right md:col-span-4 md:col-start-9">
                    <span className="hidden md:inline">Data generated </span>{generated}<br />EN gamedata
                </Label>
                <h1 id="materials-title" className="swiss-title col-span-full row-span-2 row-start-2 flex items-end overflow-hidden pb-[0.04em]">
                    <motion.span initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }} className="block">
                        Materials
                    </motion.span>
                </h1>
            </Band>

            {/* ---- filters ---- */}
            <section aria-label="Filter materials">
                <SectionHeader
                    index={1}
                    caption="Filter"
                    aside={
                        <Label as="span">
                            Showing <CountUp value={filter.generalCount} /> of {general.length}
                            {search.trim() && filter.tokenMatches.length > 0 && <>, {filter.tokenMatches.length} {filter.tokenMatches.length === 1 ? "token" : "tokens"}</>}
                            {filter.filtering && (
                                <button type="button" onClick={filter.clear} className="ml-3 underline underline-offset-2 hover:no-underline">Clear</button>
                            )}
                        </Label>
                    }
                />
                <Band className="swiss-rule-y">
                    <label className="col-span-full flex items-center gap-3 px-1 md:col-span-4">
                        <Search size={18} aria-hidden className="shrink-0" />
                        <span className="sr-only">Search materials</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Material or operator"
                            className="min-w-0 flex-1 border-b border-(--ink) bg-transparent py-1 text-lg outline-none [&::-webkit-search-cancel-button]:appearance-none placeholder:font-mono placeholder:text-xs placeholder:uppercase placeholder:tracking-[0.14em] placeholder:text-(--ink)/50 focus-visible:border-primary"
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="shrink-0 p-1"><X size={16} /></button>
                        )}
                    </label>
                </Band>
                <Band className="swiss-rule-y">
                    <div className="col-span-full flex overflow-x-auto scrollbar-hide md:col-span-7">
                        {TOGGLES.map((t) => (
                            <CellToggle key={t.key} label={t.label} active={category === t.key} onClick={() => setCategory(category === t.key ? null : t.key)}>
                                <span className="h-[40%] w-[40%]"><MaterialIcon material={materialById[t.icon]} /></span>
                                <Label as="span" className="text-[10px]">{t.label}</Label>
                            </CellToggle>
                        ))}
                    </div>
                </Band>
            </section>

            {/* ---- depot ---- */}
            <section aria-label="Materials">
                <SectionHeader index={2} caption="Crafting chart" />
                {filter.generalCount === 0 && filter.tokenMatches.length === 0 ? (
                    <Band rows={2} className="swiss-rule-y">
                        <div className="col-span-full flex flex-col justify-center gap-3 md:col-span-6">
                            <p className="text-[calc(var(--cell)*0.27)] font-medium uppercase leading-none tracking-[-0.03em]">No material matches</p>
                            <Label>
                                Try another name or remove the filter.{" "}
                                <button type="button" onClick={filter.clear} className="underline underline-offset-2">Clear filters</button>
                            </Label>
                        </div>
                    </Band>
                ) : (
                    <>
                        {filter.generalCount > 0 && <ChainChart filter={filter} />}
                        <TokenGroup filter={filter} />
                    </>
                )}
            </section>

        </SwissPage>
    )
}
