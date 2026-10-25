import { useState } from "react"
import { Loader2, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react"
import { MicroLabel } from "@/components/ProfilePanel"
import { usePlayer } from "@/stores/playerStore"
import { useAudioTime } from "@/hooks/useAudio"
import { formatSize, formatTime } from "@/lib/music"
import type { Track } from "@/types/Music"

const iconButton =
    "flex h-10 w-10 items-center justify-center text-foreground/70 transition-colors hover:text-foreground disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-primary"

export default function PlayerControls({ track }: { track: Track | null }) {
    const { status, error, volume, toggle, next, prev, seek, setVolume } = usePlayer()
    const time = useAudioTime()
    // while dragging the seek bar, show the dragged position instead of the playing one
    const [scrub, setScrub] = useState<number | null>(null)
    const position = scrub ?? time.current

    const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

    return (
        <div className="mt-6">
            <div className="min-h-20">
                {track ? (
                    <>
                        <h1 className="font-heading text-2xl leading-tight md:text-3xl">{track.name}</h1>
                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <MicroLabel className="text-foreground/80">{track.albumName}</MicroLabel>
                            <span className="h-3 w-px bg-foreground/20" />
                            <MicroLabel>{track.artists.join(", ")}</MicroLabel>
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="font-heading text-2xl md:text-3xl">Music</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Pick a track from the list to start the record.</p>
                    </>
                )}
            </div>

            <div className="mt-5 flex items-center gap-3">
                <span className="w-12 font-mono text-xs tabular-nums text-muted-foreground">{formatTime(position)}</span>
                <input
                    type="range"
                    min={0}
                    max={time.duration || 1}
                    step={0.1}
                    value={Math.min(position, time.duration || 1)}
                    disabled={!time.duration}
                    onChange={(e) => setScrub(Number(e.target.value))}
                    onPointerUp={() => { if (scrub !== null) seek(scrub); setScrub(null) }}
                    onKeyUp={() => { if (scrub !== null) seek(scrub); setScrub(null) }}
                    aria-label="Seek"
                    aria-valuetext={`${formatTime(position)} of ${formatTime(time.duration)}`}
                    className="h-1 flex-1 cursor-pointer accent-primary disabled:cursor-default"
                />
                <span className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground">{formatTime(time.duration)}</span>
            </div>

            <div className="mt-3 flex items-center gap-1">
                <button type="button" className={iconButton} onClick={prev} disabled={!track} aria-label="Previous track">
                    <SkipBack size={20} />
                </button>
                <button
                    type="button"
                    onClick={toggle}
                    disabled={!track}
                    aria-label={status === "playing" || status === "loading" ? "Pause" : "Play"}
                    className="flex h-12 w-12 items-center justify-center bg-card text-card-foreground shadow-[inset_0_-2px_0_var(--primary)] transition-transform active:scale-95 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    {status === "loading" ? <Loader2 size={20} className="motion-safe:animate-spin" />
                        : status === "playing" ? <Pause size={20} /> : <Play size={20} className="translate-x-px" />}
                </button>
                <button type="button" className={iconButton} onClick={next} disabled={!track} aria-label="Next track">
                    <SkipForward size={20} />
                </button>

                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        className={iconButton}
                        onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                        aria-label={volume === 0 ? "Unmute" : "Mute"}
                    >
                        <VolumeIcon size={18} />
                    </button>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        aria-label="Volume"
                        className="h-1 w-24 cursor-pointer accent-primary"
                    />
                </div>
            </div>

            <p role="status" className="mt-3 min-h-5 text-sm">
                {error ? <span className="text-destructive">{error}</span>
                    : track?.size ? <span className="font-mono text-xs text-muted-foreground">{track.ext?.toUpperCase()} {formatSize(track.size)}, streamed as it plays</span>
                    : null}
            </p>
        </div>
    )
}
