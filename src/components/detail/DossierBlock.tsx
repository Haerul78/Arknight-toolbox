import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Label } from "@/components/swiss"

// A block of the dossier. Its height is rounded up to whole half-cells (--u), so every
// block ends on a grid line or half-line however much text it holds, and the block after
// it starts on the rhythm. The title sits on the block's top rule as a single 28px line
// instead of taking a row of its own.
export default function DossierBlock({
    title,
    aside,
    children,
    className = "",
    id,
}: {
    title: string
    aside?: ReactNode
    children: ReactNode
    className?: string
    id?: string
}) {
    const ref = useRef<HTMLElement>(null)
    const inner = useRef<HTMLDivElement>(null)
    const probe = useRef<HTMLSpanElement>(null)
    const [minHeight, setMinHeight] = useState<number | undefined>(undefined)

    useLayoutEffect(() => {
        const el = inner.current
        const p = probe.current
        if (!el || !p) return
        const measure = () => {
            const u = p.getBoundingClientRect().width
            if (!u) return
            const next = Math.max(1, Math.ceil((el.getBoundingClientRect().height - 0.5) / u)) * u
            setMinHeight((prev) => (prev !== undefined && Math.abs(prev - next) < 0.5 ? prev : next))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return (
        <section ref={ref} aria-labelledby={id} className={`swiss-rule-t relative break-inside-avoid ${className}`} style={{ minHeight }}>
            {/* half a cell wide, invisible: gives --u in px */}
            <span ref={probe} aria-hidden className="pointer-events-none absolute w-(--u)" />
            <div ref={inner} className="pb-4">
                <div className="flex h-7 items-center justify-between gap-3">
                    <Label as="h2" id={id}>{title}</Label>
                    {aside}
                </div>
                {children}
            </div>
        </section>
    )
}
