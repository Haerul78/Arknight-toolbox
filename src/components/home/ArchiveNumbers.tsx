import { Link } from "react-router-dom"
import { Play } from "lucide-react"
import CountUp from "@/components/CountUp"
import meta from "@/data/meta.json"
import { usePlayer } from "@/stores/playerStore"
import { trackByCid } from "@/lib/music"

// Counts come from the generated data (meta.json is written by the generate scripts),
// scattered over the cells like an index page rather than lined up in a row.
const numbers = [
    { value: meta.operators.count, label: "Operators", note: "character_table", place: "md:col-start-7 md:row-start-1" },
    { value: meta.materials.count, label: "Materials", note: "item_table", place: "md:col-start-3 md:row-start-2" },
    { value: meta.music.count, label: "Tracks", note: `${meta.music.albums} albums`, place: "md:col-start-6 md:row-start-3" },
]

const BADGE = `Listen to the archive * ${meta.music.count} tracks * `
// circumference of the r=78 text circle: textLength spreads the text over exactly one turn
const CIRCLE = 2 * Math.PI * 78

export default function ArchiveNumbers() {
    const { currentCid } = usePlayer()
    const current = currentCid ? trackByCid.get(currentCid) : undefined

    return (
        <section className="swiss-band" style={{ gridTemplateRows: "repeat(4, var(--cell))" }} aria-labelledby="home-archive">
            <div className="col-span-2 row-start-1 md:col-span-4">
                <p className="swiss-label pt-3">04 (Archive)</p>
                <h2 id="home-archive" className="mt-2 text-[calc(var(--cell)*0.36)] font-medium uppercase leading-[0.9] tracking-[-0.04em] md:text-[calc(var(--cell)*0.42)]">
                    In the<br />archive
                </h2>
            </div>

            {numbers.map((n) => (
                <div key={n.label} className={`col-span-2 flex flex-col justify-end md:col-span-3 ${n.place}`}>
                    <span className="swiss-number block">
                        <CountUp value={n.value} />
                    </span>
                    <span className="swiss-label mt-1 text-right">{n.label}*<br /><span className="text-(--ink)/50">({n.note})</span></span>
                </div>
            ))}

            {/* rotating text badge around a play button, linking to the player */}
            <Link
                to="/music"
                aria-label={current ? `Open the music player, now playing ${current.name}` : "Open the music player"}
                className="group relative col-span-2 row-span-2 row-start-3 m-[8%] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--ink) max-md:col-start-3 md:col-start-10"
            >
                <svg viewBox="0 0 200 200" aria-hidden className="absolute inset-0 h-full w-full motion-safe:animate-[spin-slow_30s_linear_infinite]">
                    <defs>
                        <path id="badge-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
                    </defs>
                    <text className="fill-(--ink) font-mono text-[13.2px] uppercase tracking-[0.32em]">
                        <textPath href="#badge-circle" textLength={CIRCLE - 4} lengthAdjust="spacing">{BADGE}</textPath>
                    </text>
                </svg>
                <span className="absolute left-1/2 top-1/2 flex h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-(--ink) text-background transition-colors group-hover:bg-primary group-hover:text-(--ink)">
                    <Play className="h-1/3 w-1/3 translate-x-[6%] fill-current" />
                </span>
            </Link>

            <p className="swiss-label col-span-2 row-start-4 self-end pb-3 md:col-span-6">
                * Counted from the generated data: ArknightsGameData (EN) for operators and materials,
                Monster Siren Records for music.
                {current && <><br />(Now playing: {current.name})</>}
            </p>
        </section>
    )
}
