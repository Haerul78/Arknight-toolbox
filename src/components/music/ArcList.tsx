import { memo, useEffect, useState } from "react"
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion"
import { Disc3 } from "lucide-react"
import GameIcon from "@/components/GameIcon"
import { MicroLabel } from "@/components/ProfilePanel"
import { coverUrl, formatSize, trackByCid, tracks } from "@/lib/music"
import { rowAt, rows, type ArcRow } from "./arcRows"
import { STEP_PX, useArcScroll } from "./useArcScroll"

// The list sits on a circle whose center is off to the left, toward the record, so rows away
// from the middle swing left as well as up/down.
const RADIUS = 720
// rows rendered on each side of the center; everything else isn't in the DOM
const WINDOW = 9

function arcPlacement(d: number) {
    const theta = (d * STEP_PX) / RADIUS
    const ad = Math.abs(d)
    return {
        x: RADIUS * (Math.cos(theta) - 1),
        y: RADIUS * Math.sin(theta),
        rotate: (theta * 180) / Math.PI * 0.55,
        scale: Math.max(0.5, 1 - 0.075 * ad),
        opacity: Math.max(0, 1 - 0.15 * ad),
    }
}

type RowProps = {
    row: ArcRow
    scroll: MotionValue<number>
    focused: boolean
    playing: boolean
    onSelect: (index: number) => void
}

const Row = memo(function Row({ row, scroll, focused, playing, onSelect }: RowProps) {
    const x = useTransform(scroll, (s) => arcPlacement(row.pos - s).x)
    const y = useTransform(scroll, (s) => arcPlacement(row.pos - s).y)
    const rotate = useTransform(scroll, (s) => arcPlacement(row.pos - s).rotate)
    const scale = useTransform(scroll, (s) => arcPlacement(row.pos - s).scale)
    const opacity = useTransform(scroll, (s) => arcPlacement(row.pos - s).opacity)

    if (row.kind === "album") {
        return (
            <motion.div style={{ x, y, rotate, scale, opacity, originX: 0 }} className="absolute left-14 top-1/2 w-[min(28rem,80%)]" aria-hidden>
                <div className="flex -translate-y-1/2 items-center gap-3">
                    <span className="h-px w-6 bg-foreground/30" />
                    <MicroLabel className="truncate">{row.album.name}</MicroLabel>
                    <span className="h-px flex-1 bg-foreground/15" />
                </div>
            </motion.div>
        )
    }

    const { track } = row
    return (
        <motion.div style={{ x, y, rotate, scale, opacity, originX: 0 }} className="absolute left-14 top-1/2 w-[min(28rem,80%)]">
            <div
                id={`arc-${track.cid}`}
                role="option"
                aria-selected={focused}
                onClick={() => onSelect(track.index)}
                className={`flex -translate-y-1/2 cursor-pointer items-center gap-3 py-1.5 transition-colors ${focused ? "text-foreground" : "text-foreground/70 hover:text-foreground"}`}
            >
                <div className={`h-11 w-11 shrink-0 overflow-hidden bg-card ${focused ? "ring-2 ring-primary" : ""}`}>
                    <GameIcon src={coverUrl(track.albumCid)} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`truncate font-barlow text-xl font-bold leading-tight ${focused ? "" : "font-semibold"}`}>{track.name}</p>
                    <p className="flex items-center gap-2">
                        {playing && <Disc3 size={12} className="text-accent motion-safe:animate-spin" aria-label="Now playing" />}
                        <span className="truncate text-xs text-muted-foreground">{track.artists.join(", ")}</span>
                    </p>
                </div>
                {track.size && (
                    <span className="shrink-0 font-mono text-[0.65rem] uppercase text-muted-foreground tabular-nums">
                        {track.ext} {formatSize(track.size)}
                    </span>
                )}
            </div>
        </motion.div>
    )
})

type ArcListProps = {
    currentCid: string | null
    onPlay: (cid: string) => void
}

export default function ArcList({ currentCid, onPlay }: ArcListProps) {
    const current = currentCid ? trackByCid.get(currentCid) : undefined
    const { scroll, focus, scrollToTrack, attachWheel, isClickSuppressed, bind, onKeyDown } = useArcScroll(current?.index ?? 0)

    // which slice of rows is mounted; only changes when the center moves a whole row
    const [center, setCenter] = useState(() => Math.round(scroll.get()))
    useMotionValueEvent(scroll, "change", (v) => {
        const c = Math.round(v)
        setCenter((prev) => (prev === c ? prev : c))
    })
    const visible = rows.slice(rowAt(center - WINDOW), rowAt(center + WINDOW + 1))

    // follow the player when it moves on by itself (track ended, next/prev)
    useEffect(() => {
        if (current) scrollToTrack(current.index)
    }, [current, scrollToTrack])

    const focusedTrack = tracks[focus]
    const select = (i: number) => {
        if (isClickSuppressed()) return
        scrollToTrack(i)
        onPlay(tracks[i].cid)
    }

    return (
        <div className="relative h-full min-h-[32rem] select-none">
            {/* album of the centered track, pinned at the top of the arc */}
            <div className="pointer-events-none absolute left-14 top-4 z-10 flex items-center gap-3">
                {focusedTrack && (
                    <>
                        <span className="h-3 w-0.5 bg-primary" />
                        <MicroLabel className="text-foreground/80">{focusedTrack.albumName}</MicroLabel>
                    </>
                )}
            </div>

            {/* selector notch at the center line, pointing at the record */}
            <div aria-hidden className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 items-center">
                <span className="h-px w-8 bg-primary" />
                <span className="h-2 w-2 rotate-45 border-r border-t border-primary" />
            </div>

            <div
                ref={attachWheel}
                role="listbox"
                tabIndex={0}
                aria-label="Tracks"
                aria-activedescendant={focusedTrack ? `arc-${focusedTrack.cid}` : undefined}
                onKeyDown={(e) => onKeyDown(e, (i) => onPlay(tracks[i].cid))}
                {...bind}
                className="absolute inset-0 touch-none overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)]"
            >
                {visible.map((row) => (
                    <Row
                        key={row.key}
                        row={row}
                        scroll={scroll}
                        focused={row.kind === "song" && row.track.index === focus}
                        playing={row.kind === "song" && row.track.cid === currentCid}
                        onSelect={select}
                    />
                ))}
            </div>

            <p className="pointer-events-none absolute bottom-3 left-14">
                <MicroLabel className="text-[0.6rem]">Scroll or drag to browse, Enter to play</MicroLabel>
            </p>
        </div>
    )
}
