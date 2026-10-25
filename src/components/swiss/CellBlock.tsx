import { useLayoutEffect, useRef, useState, type ReactNode } from "react"

// Wrapper for content whose height isn't known up front (skill text, talents, wrapped titles).
// Its height is rounded up to whole cells, so whatever follows still starts on a grid line.
// Children are laid out on the same column grid as a Band, with free-height rows.
export default function CellBlock({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" }) {
    const ref = useRef<HTMLDivElement>(null)
    const probe = useRef<HTMLSpanElement>(null)
    const [minHeight, setMinHeight] = useState<number | undefined>(undefined)

    useLayoutEffect(() => {
        const el = ref.current
        const cell = probe.current
        if (!el || !cell) return
        const measure = () => {
            const c = cell.getBoundingClientRect().width
            if (!c) return
            // measure the content, not the padded box we set last time
            const inner = el.firstElementChild?.nextElementSibling as HTMLElement | null
            const h = inner?.getBoundingClientRect().height ?? 0
            const next = Math.max(1, Math.ceil((h - 0.5) / c)) * c
            setMinHeight((prev) => (prev !== undefined && Math.abs(prev - next) < 0.5 ? prev : next))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        if (el.firstElementChild?.nextElementSibling) ro.observe(el.firstElementChild.nextElementSibling)
        return () => ro.disconnect()
    }, [])

    return (
        <Tag ref={ref} className={`relative mx-(--m) ${className}`} style={{ minHeight }}>
            {/* one cell wide, invisible: gives the cell size in px */}
            <span ref={probe} aria-hidden className="pointer-events-none absolute w-(--cell)" />
            <div className="grid grid-cols-[repeat(var(--cols),var(--cell))]">{children}</div>
        </Tag>
    )
}
