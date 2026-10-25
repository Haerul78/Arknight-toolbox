import { useEffect, useRef } from "react"
import { animate, useInView } from "framer-motion"

type CountUpProps = {
    value: number
    decimals?: number
    className?: string
}

// counts from 0 to `value` the first time it scrolls into view, then tweens from the
// previous value whenever `value` changes
export default function CountUp({ value, decimals = 0, className = "" }: CountUpProps) {
    const ref = useRef<HTMLSpanElement>(null)
    const shown = useRef<number | null>(null)
    const inView = useInView(ref, { once: true })

    useEffect(() => {
        if (!inView || !ref.current) return
        const node = ref.current
        const first = shown.current === null
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const controls = animate(shown.current ?? 0, value, {
            duration: reduce ? 0 : first ? 1.4 : 0.45,
            delay: first && !reduce ? 0.4 : 0,
            ease: [0.22, 1, 0.36, 1],
            onUpdate: (v) => {
                shown.current = v
                node.textContent = v.toFixed(decimals)
            },
        })
        return () => controls.stop()
    }, [inView, value, decimals])

    return <span ref={ref} className={className}>{(0).toFixed(decimals)}</span>
}
