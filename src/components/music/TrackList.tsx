import { Disc3 } from "lucide-react"
import GameIcon from "@/components/GameIcon"
import { MicroLabel } from "@/components/ProfilePanel"
import { albums, coverUrl, formatSize } from "@/lib/music"

type TrackListProps = {
    currentCid: string | null
    onPlay: (cid: string) => void
}

// Plain list for narrow screens: native scrolling with the page, sticky album headers.
// content-visibility skips layout for albums far off screen, so ~900 rows stay light.
export default function TrackList({ currentCid, onPlay }: TrackListProps) {
    return (
        <div className="mt-8">
            {albums.map((album) => (
                <section key={album.cid} className="[content-visibility:auto] [contain-intrinsic-size:auto_20rem]">
                    <header className="sticky top-(--navbar-h) z-10 flex items-center gap-3 border-b border-foreground/10 bg-background/95 py-2 backdrop-blur">
                        <GameIcon src={coverUrl(album.cid)} alt="" className="h-8 w-8 shrink-0 bg-card object-cover" />
                        <MicroLabel className="truncate text-foreground/80">{album.name}</MicroLabel>
                        <span className="ml-auto font-mono text-xs text-muted-foreground">{album.songs.length}</span>
                    </header>
                    <ul>
                        {album.songs.map((song) => {
                            const playing = song.cid === currentCid
                            return (
                                <li key={song.cid}>
                                    <button
                                        type="button"
                                        onClick={() => onPlay(song.cid)}
                                        aria-current={playing ? "true" : undefined}
                                        className={`flex min-h-14 w-full items-center gap-3 border-b border-foreground/5 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${playing ? "text-foreground" : "text-foreground/80"}`}
                                    >
                                        <span className="w-4 shrink-0">
                                            {playing && <Disc3 size={16} className="text-accent motion-safe:animate-spin" aria-label="Now playing" />}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className={`block truncate font-barlow text-lg leading-tight ${playing ? "font-bold" : "font-semibold"}`}>{song.name}</span>
                                            <span className="block truncate text-xs text-muted-foreground">{song.artists.join(", ")}</span>
                                        </span>
                                        {song.size && (
                                            <span className="shrink-0 font-mono text-[0.65rem] uppercase text-muted-foreground tabular-nums">
                                                {song.ext} {formatSize(song.size)}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            ))}
        </div>
    )
}
