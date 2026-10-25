import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import Vinyl from "./Vinyl"
import Tonearm from "./Tonearm"
import { MicroLabel } from "@/components/ProfilePanel"
import { chamfer } from "@/lib/chamfer"
import { useAudioProgress } from "@/hooks/useAudio"
import type { Track } from "@/types/Music"
import type { PlayerStatus } from "@/stores/playerStore"

const plinth = chamfer(["br"], 40)

export default function Turntable({ track, status }: { track: Track | null; status: PlayerStatus }) {
    const reduce = useReducedMotion()
    const progress = useAudioProgress()
    const playing = status === "playing"

    // old record slides out to the lower left while the new one comes in from the right;
    // with reduced motion it is a plain crossfade
    const disc = reduce
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : {
              initial: { opacity: 0, x: "35%", rotate: -40 },
              animate: { opacity: 1, x: "0%", rotate: 0 },
              exit: { opacity: 0, x: "-45%", y: "12%", rotate: 40 },
          }

    return (
        <div className="relative aspect-square w-full bg-card p-[7%]" style={{ clipPath: plinth }}>
            {/* platter well */}
            <div className="relative h-full w-full rounded-full bg-secondary/60 p-[2%] ring-1 ring-card-foreground/10">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={track?.cid ?? "empty"}
                        {...disc}
                        transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
                        className="h-full w-full"
                    >
                        <Vinyl albumCid={track?.albumCid ?? null} spinning={playing} />
                    </motion.div>
                </AnimatePresence>
            </div>

            <Tonearm playing={playing} progress={progress} />

            {/* deck details */}
            <div className="absolute bottom-[3%] left-[5%] flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full transition-colors ${playing ? "bg-primary" : "bg-card-foreground/20"}`} />
                <MicroLabel className="text-[0.55rem] text-card-foreground/50">33⅓ rpm</MicroLabel>
            </div>
        </div>
    )
}
