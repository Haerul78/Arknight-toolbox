import { Link, useLocation } from "react-router-dom"
import { Loader2, Pause, Play } from "lucide-react"
import GameIcon from "@/components/GameIcon"
import { usePlayer } from "@/stores/playerStore"
import { coverUrl, trackByCid } from "@/lib/music"
import { chamfer } from "@/lib/chamfer"

const bar = chamfer(["tr"], 14)

// Compact now-playing control shown everywhere except /music itself.
// "navbar": inline in the desktop navbar. "bar": fixed strip at the bottom on phones.
export default function MiniPlayer({ variant }: { variant: "navbar" | "bar" }) {
    const { pathname } = useLocation()
    const { currentCid, status, toggle } = usePlayer()
    const track = currentCid ? trackByCid.get(currentCid) : undefined
    if (!track || pathname === "/music") return null

    const busy = status === "playing" || status === "loading"
    const button = (
        <button
            type="button"
            onClick={toggle}
            aria-label={busy ? "Pause" : "Play"}
            className="flex h-8 w-8 shrink-0 items-center justify-center bg-card text-card-foreground shadow-[inset_0_-2px_0_var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
            {status === "loading" ? <Loader2 size={14} className="motion-safe:animate-spin" />
                : status === "playing" ? <Pause size={14} /> : <Play size={14} className="translate-x-px" />}
        </button>
    )
    const info = (
        <Link to="/music" className="flex min-w-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-primary" aria-label={`Now playing: ${track.name}. Open music player`}>
            <GameIcon src={coverUrl(track.albumCid)} alt="" className="h-8 w-8 shrink-0 bg-card object-cover" />
            <span className="min-w-0">
                <span className="block truncate font-barlow text-sm font-semibold leading-tight">{track.name}</span>
                <span className="block truncate text-[0.7rem] text-muted-foreground">{track.albumName}</span>
            </span>
        </Link>
    )

    if (variant === "navbar") {
        return (
            <div className="hidden max-w-60 items-center gap-2.5 border-r border-foreground/10 pr-4 md:flex">
                {info}
                {button}
            </div>
        )
    }

    return (
        <>
            {/* reserve room so the fixed bar never covers the end of the page */}
            <div className="h-16 md:hidden" />
            <div
                style={{ clipPath: bar }}
                className="fixed inset-x-2 bottom-2 z-50 flex items-center gap-3 bg-card py-2 pl-2 pr-3 text-card-foreground shadow-lg md:hidden [&_a]:flex-1"
            >
                {info}
                <span className="[&>button]:bg-secondary">{button}</span>
            </div>
        </>
    )
}
