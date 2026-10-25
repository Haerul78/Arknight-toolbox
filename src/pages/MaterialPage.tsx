import { useState } from "react"
import { motion } from "framer-motion"
import { SearchX } from "lucide-react"
import materials from "@/data/materials.json"
import MaterialCard from "@/components/MaterialCard"
import PageHeader from "@/components/PageHeader"
import SearchInput from "@/components/SearchInput"
import FilterChip from "@/components/FilterChip"
import { rarityColor, rarityNumber } from "@/lib/rarity"

const RARITIES = ["TIER_1", "TIER_2", "TIER_3", "TIER_4", "TIER_5", "TIER_6"]
const STAGGERED = 24

const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.03, delayChildren: 0.4 } },
}

const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
}

export default function MaterialPage() {
    const [search, setSearch] = useState("")
    const [rarity, setRarity] = useState<string | null>(null)

    const filteredMaterials = materials.filter((mat) =>
        mat.name.toLowerCase().includes(search.toLowerCase()) &&
        (!rarity || mat.rarity === rarity)
    )

    return (
        <section className="px-6 py-12 md:px-12">
            <PageHeader kicker="Depot" title="Materials" count={filteredMaterials.length} />

            <div className="mb-8 flex flex-col gap-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Search materials..." />
                <div className="flex flex-wrap gap-2">
                    {RARITIES.map((r) => (
                        <FilterChip key={r} label={`Tier ${rarityNumber(r)}`} active={rarity === r} onClick={() => setRarity(rarity === r ? null : r)}>
                            <span className="h-2.5 w-2.5 rotate-45" style={{ background: rarityColor[r] }} />
                            <span className="font-barlow text-sm font-semibold tracking-wider">T{rarityNumber(r)}</span>
                        </FilterChip>
                    ))}
                </div>
            </div>

            {filteredMaterials.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
                    <SearchX size={40} />
                    <p>No materials match these filters.</p>
                </motion.div>
            ) : (
                <motion.div
                    key={rarity ?? "all"}
                    className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {filteredMaterials.map((material, i) => (
                        <motion.div variants={i < STAGGERED ? item : undefined} key={material.id}>
                            <MaterialCard material={material} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    )
}
