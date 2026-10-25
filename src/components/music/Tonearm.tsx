import { useAnimationFrame, useMotionValue, useReducedMotion, useSpring, motion, type MotionValue } from "framer-motion"

// Angles for an arm pivoting near the deck's top-right corner and pointing down at rest.
// With the pivot at (90%, 8%) and a 62% arm, the stylus rests just off the record at -2°,
// lands on the outer groove at 5° and reaches the run-out near the label at 26°, so the arm
// sweeps inward as the song plays, like a real record.
const REST = -2
const START = 5
const END = 26

export default function Tonearm({ playing, progress }: { playing: boolean; progress: MotionValue<number> }) {
    const reduce = useReducedMotion()
    const target = useMotionValue(REST)
    // soft spring for lifting on/off the record; reduced motion follows the target directly
    const sprung = useSpring(target, { stiffness: 45, damping: 14 })

    useAnimationFrame(() => {
        const next = playing ? START + (END - START) * progress.get() : REST
        if (next !== target.get()) target.set(next)
    })

    return (
        <motion.div
            aria-hidden
            style={{ rotate: reduce ? target : sprung, originX: 0.5, originY: 0 }}
            className="pointer-events-none absolute left-[90%] top-[8%] h-[62%] w-[6%] -translate-x-1/2"
        >
            {/* pivot base and counterweight */}
            <div className="absolute left-1/2 top-0 aspect-square w-[240%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-card ring-1 ring-card-foreground/20" />
            <div className="absolute left-1/2 top-0 aspect-square w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
            {/* arm tube */}
            <div className="absolute left-1/2 top-0 h-[88%] w-[22%] -translate-x-1/2 bg-linear-to-r from-card-foreground/70 via-card-foreground to-card-foreground/60" />
            {/* headshell, angled like a real cartridge */}
            <div className="absolute bottom-0 left-1/2 h-[14%] w-[90%] -translate-x-[30%] rotate-[18deg] bg-card ring-1 ring-card-foreground/30">
                <div className="absolute inset-x-0 bottom-0 h-[22%] bg-primary" />
            </div>
        </motion.div>
    )
}
