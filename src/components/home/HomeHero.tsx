import { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import OperatorArt from "@/components/OperatorArt"
import CountUp from "@/components/CountUp"
import RarityStars from "@/components/RarityStars"
import meta from "@/data/meta.json"
import { featuredOperator } from "@/lib/featuredOperator"
import { professionLabel } from "@/lib/profession"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { CropMarks } from "@/components/swiss"

const ease = [0.22, 1, 0.36, 1] as const
const generated = meta.operators.generatedAt.slice(0, 10)
const version = (meta.operators as { version: string | null }).version

// the operator's own tile; range cells are placed relative to it (col 0 = this tile)
const TILE = { desktop: { row: 5, col: 8 }, mobile: { row: 5, col: 1 } }

function Line({ children, index, className }: { children: string; index: number; className: string }) {
    return (
        <div className={`overflow-hidden ${className}`}>
            <motion.span
                className="block"
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.9, delay: 0.45 + index * 0.12, ease }}
            >
                {children}
            </motion.span>
        </div>
    )
}

export default function HomeHero() {
    const { operator, range } = featuredOperator()
    const mobile = useMediaQuery("(max-width: 767px)")
    const cols = mobile ? 4 : 12
    const tile = mobile ? TILE.mobile : TILE.desktop
    // phones have no hover, so a tap toggles the colour
    const [colour, setColour] = useState(false)

    const cells = range
        .map((c) => ({ row: tile.row + c.row, col: tile.col + c.col, self: c.row === 0 && c.col === 0 }))
        .filter((c) => c.col >= 1 && c.col <= cols && c.row >= 2)

    return (
        <section className="swiss-band" style={{ gridTemplateRows: "repeat(6, var(--cell))" }} aria-labelledby="home-title">
            {/* metadata strip */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="swiss-label col-span-full row-start-1 grid grid-cols-subgrid content-center"
            >
                <p className="col-span-2 md:col-span-3">(Arknights Toolbox)<br />Fan-made field reference</p>
                <p className="hidden md:col-span-3 md:col-start-6 md:block">
                    Operators on file<br />
                    <CountUp value={meta.operators.count} className="text-sm" />*
                </p>
                <p className="col-span-2 text-right md:col-span-3 md:col-start-10">
                    <span className="hidden md:inline">Data generated </span>{generated}<br />
                    {version ? `Client data v${version}` : "EN gamedata"}
                </p>
            </motion.div>

            {/* attack range of the featured operator, drawn on the tiles */}
            {cells.map((c) => (
                <motion.div
                    key={`${c.row}-${c.col}`}
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1 + (c.col - tile.col) * 0.06 }}
                    className={c.self ? "border border-(--ink)" : "bg-primary"}
                    style={{ gridRow: c.row, gridColumn: c.col }}
                />
            ))}

            <h1
                id="home-title"
                className="pointer-events-none relative z-10 col-span-full row-span-4 row-start-2 grid grid-rows-subgrid font-medium uppercase leading-[0.8] tracking-[-0.055em]"
                style={{ fontSize: mobile ? "17.5vw" : "15.8vw", fontStretch: mobile ? "80%" : "100%" }}
            >
                <Line index={0} className="row-span-2 flex items-end pb-[0.02em]">Arknights</Line>
                <Line index={1} className="row-span-2 flex items-end justify-end pb-[0.02em] md:justify-start md:pl-[calc(var(--cell)*3)]">Toolbox</Line>
            </h1>

            {/* cut-out art standing on its tile, over the title */}
            <motion.button
                type="button"
                onClick={() => setColour((c) => !c)}
                aria-pressed={colour}
                aria-label={`${operator.name}: show in colour`}
                initial={{ opacity: 0, clipPath: "inset(100% 0 0 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0% 0 0 0)" }}
                transition={{ duration: 1, delay: 0.8, ease }}
                className="group relative z-20 cursor-default focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--ink)"
                style={{
                    gridColumn: mobile ? `${tile.col} / span 3` : `${tile.col - 2} / span 5`,
                    gridRow: `${tile.row - 3} / span 4`,
                }}
            >
                <OperatorArt
                    id={operator.id}
                    name={operator.name}
                    className={`h-full w-full object-contain object-bottom transition-[filter] duration-500 group-hover:grayscale-0 ${colour ? "grayscale-0" : "grayscale"}`}
                />
            </motion.button>

            {/* caption under the tile */}
            <div className="relative col-span-full row-start-6 grid grid-cols-subgrid">
                <p className="swiss-label col-span-2 self-center md:col-span-4">
                    01 (Index)<br />
                    <span className="hidden normal-case tracking-normal md:inline">Operator files, depot materials and the Monster Siren archive in one place.</span>
                </p>
                <div className="relative col-span-2 self-center md:col-span-4 md:col-start-8">
                    <Link to={`/operators/${operator.id}`} className="swiss-label group inline-block hover:underline focus-visible:outline-2 focus-visible:outline-(--ink)">
                        ({operator.name}, {professionLabel[operator.profession]}. Attack range {operator.rangeId} at Elite 2) <span aria-hidden className="inline-block transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                    </Link>
                    <div className="mt-1 text-(--ink) [&_svg]:text-(--ink)"><RarityStars rarity={operator.rarity} size="xs" /></div>
                </div>
            </div>

            {/* crop marks around the featured operator's cells */}
            <div
                aria-hidden
                className="pointer-events-none relative z-30"
                style={{ gridColumn: mobile ? `${tile.col} / span 3` : `${tile.col - 2} / span 5`, gridRow: `${tile.row - 3} / span 4` }}
            >
                <CropMarks />
            </div>
        </section>
    )
}
