import { useEffect } from "react"
import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion"
import { Disc3 } from "lucide-react"
import GameIcon from "@/components/GameIcon"
import { coverUrl } from "@/lib/music"

// 33⅓ rpm
const SPEED = (100 / 3) * 6

// Grooves are a repeating radial gradient on the record; the light sheen sits on a separate,
// non-rotating layer, the way reflections on a real record stay put while it turns.
export default function Vinyl({ albumCid, spinning }: { albumCid: string | null; spinning: boolean }) {
    const reduce = useReducedMotion()
    const angle = useMotionValue(0)
    const velocity = useMotionValue(0)

    // spin up quickly, coast down slowly: the pause never stops the record dead
    useEffect(() => {
        const on = spinning && !reduce
        const controls = animate(velocity, on ? SPEED : 0, {
            duration: on ? 0.9 : 2.2,
            ease: on ? [0.4, 0, 0.2, 1] : [0.15, 0.55, 0.35, 1],
        })
        return () => controls.stop()
    }, [spinning, reduce, velocity])

    useAnimationFrame((_, delta) => {
        const v = velocity.get()
        if (v > 0.01) angle.set((angle.get() + (v * delta) / 1000) % 360)
    })

    return (
        <div className="relative aspect-square w-full rounded-full shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)]">
            <motion.div
                style={{ rotate: angle }}
                className="absolute inset-0 rounded-full bg-card"
            >
                <div className="absolute inset-[2%] rounded-full bg-[repeating-radial-gradient(circle_at_center,transparent_0_2px,color-mix(in_oklab,var(--card-foreground)_7%,transparent)_2px_3px)]" />
                {/* lead-in and run-out bands */}
                <div className="absolute inset-[3%] rounded-full ring-1 ring-card-foreground/10" />
                <div className="absolute inset-[30%] rounded-full ring-1 ring-card-foreground/15" />

                {/* label: the album cover */}
                <div className="absolute inset-[33%] overflow-hidden rounded-full bg-secondary ring-2 ring-primary/70">
                    {albumCid ? (
                        <GameIcon
                            src={coverUrl(albumCid)}
                            alt=""
                            className="h-full w-full object-cover"
                            fallback={<Disc3 className="m-auto h-full w-1/2 text-card-foreground/40" />}
                        />
                    ) : (
                        <Disc3 className="m-auto h-full w-1/2 text-card-foreground/30" />
                    )}
                </div>
            </motion.div>

            {/* fixed sheen */}
            <div className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_200deg,transparent_0deg,color-mix(in_oklab,var(--card-foreground)_14%,transparent)_25deg,transparent_60deg,transparent_180deg,color-mix(in_oklab,var(--card-foreground)_9%,transparent)_210deg,transparent_245deg)]" />
            {/* spindle */}
            <div className="absolute left-1/2 top-1/2 h-[3%] w-[3%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-1 ring-foreground/30" />
        </div>
    )
}
