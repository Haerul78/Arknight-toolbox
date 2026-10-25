import { MotionConfig, motion } from "framer-motion"
import Turntable from "@/components/music/Turntable"
import PlayerControls from "@/components/music/PlayerControls"
import ArcList from "@/components/music/ArcList"
import TrackList from "@/components/music/TrackList"
import { usePlayer } from "@/stores/playerStore"
import { trackByCid } from "@/lib/music"
import { useMediaQuery } from "@/hooks/useMediaQuery"

export default function MusicPage() {
    const { currentCid, status, play } = usePlayer()
    const track = currentCid ? trackByCid.get(currentCid) ?? null : null
    const wide = useMediaQuery("(min-width: 1024px)")

    return (
        <MotionConfig reducedMotion="user">
            <section className="px-4 py-6 md:px-12 lg:grid lg:h-[calc(100dvh-var(--navbar-h))] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 lg:py-8">
                <div className="flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="mx-auto w-[min(60vw,22rem)] lg:mx-0 lg:w-full lg:max-w-[min(34rem,calc(100dvh-var(--navbar-h)-20rem))]"
                    >
                        <Turntable track={track} status={status} />
                    </motion.div>
                    <div className="lg:max-w-[34rem]">
                        <PlayerControls track={track} />
                        <p className="mt-2 text-xs text-muted-foreground">
                            Streamed from{" "}
                            <a href="https://monster-siren.hypergryph.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                                Monster Siren Records
                            </a>
                            , HyperGryph's official music site.
                        </p>
                    </div>
                </div>

                {wide ? (
                    <ArcList currentCid={currentCid} onPlay={play} />
                ) : (
                    <TrackList currentCid={currentCid} onPlay={play} />
                )}
            </section>
        </MotionConfig>
    )
}
