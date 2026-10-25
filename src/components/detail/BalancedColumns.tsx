import { Children, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"

// Two columns of blocks with the smallest possible height difference, so a short column
// never leaves a large empty area at the end. CSS columns can't do this: blocks may not be
// split, and the browser's balancing then leaves whole blocks' worth of space.
//
// Every block is measured, then every split into two columns is tried (at most 6 blocks,
// so 64 options) keeping the original order inside each column. Phones get one column.
export default function BalancedColumns({ children, className = "", gap = "gap-x-6" }: { children: ReactNode; className?: string; gap?: string }) {
    const items = Children.toArray(children)
    const wide = useMediaQuery("(min-width: 768px)")
    const refs = useRef<(HTMLDivElement | null)[]>([])
    const [split, setSplit] = useState<number | null>(null)

    useLayoutEffect(() => {
        if (!wide) return
        const measure = () => {
            const h = refs.current.slice(0, items.length).map((el) => el?.getBoundingClientRect().height ?? 0)
            let best = { mask: 0, diff: Infinity }
            // even masks only: the first block always opens the left column, so reading
            // starts where the list starts
            for (let mask = 0; mask < 1 << h.length; mask += 2) {
                let left = 0
                let right = 0
                h.forEach((v, i) => { if (mask & (1 << i)) right += v; else left += v })
                // prefer the longer column on the left when the difference ties
                const diff = Math.abs(left - right) + (right > left ? 0.1 : 0)
                if (diff < best.diff) best = { mask, diff }
            }
            setSplit((prev) => (prev === best.mask ? prev : best.mask))
        }
        measure()
        const ro = new ResizeObserver(measure)
        refs.current.forEach((el) => el && ro.observe(el))
        return () => ro.disconnect()
    }, [wide, items.length])

    const wrap = (child: ReactNode, i: number) => (
        <div key={i} ref={(el) => { refs.current[i] = el }}>{child}</div>
    )

    if (!wide) return <div className={className}>{items.map(wrap)}</div>

    const mask = split ?? 0
    return (
        <div className={`grid grid-cols-2 items-start ${gap} ${className}`}>
            <div>{items.map((c, i) => (mask & (1 << i) ? null : wrap(c, i)))}</div>
            <div>{items.map((c, i) => (mask & (1 << i) ? wrap(c, i) : null))}</div>
        </div>
    )
}
