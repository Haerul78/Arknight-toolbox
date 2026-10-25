import { Fragment, useLayoutEffect, useRef, useState } from "react"

// Display title whose size follows the name: the longest unbreakable piece always fits the
// width, lines only break at spaces, or right after "/" and "-" (between two words, never
// inside one). Re-measures on resize and once the display font has loaded.
//
// Measuring happens on a hidden copy at a fixed reference size, so the result includes the
// real font, weight, width axis and tracking of the title class.
const REFERENCE = 100

// "Alliance/Supportive" -> ["Alliance/", "Supportive"]; "Fire-Sharpened" -> ["Fire-", "Sharpened"]
const pieces = (word: string) => word.split(/(?<=[/-])/)

type FitTitleProps = {
    text: string
    // largest size, in cells (so it scales with the grid); short names stop growing here
    maxCells: number
    className?: string
    id?: string
}

export default function FitTitle({ text, maxCells, className = "", id }: FitTitleProps) {
    const box = useRef<HTMLHeadingElement>(null)
    const ruler = useRef<HTMLSpanElement>(null)
    const probe = useRef<HTMLSpanElement>(null)
    const [size, setSize] = useState<number | null>(null)

    useLayoutEffect(() => {
        const el = box.current
        const r = ruler.current
        const p = probe.current
        if (!el || !r || !p) return
        const fit = () => {
            const width = el.clientWidth
            const max = p.getBoundingClientRect().width * maxCells
            const widest = Math.max(...[...r.children].map((c) => c.getBoundingClientRect().width), 1)
            // 2% slack for sub-pixel rounding
            setSize(Math.min(max, Math.floor((width / widest) * REFERENCE * 0.98)))
        }
        fit()
        const ro = new ResizeObserver(fit)
        ro.observe(el)
        document.fonts?.ready.then(fit)
        return () => ro.disconnect()
    }, [text, maxCells])

    const words = text.split(/\s+/)

    return (
        <h1
            ref={box}
            id={id}
            className={`relative [hyphens:manual] [overflow-wrap:normal] [word-break:normal] ${className}`}
            style={{ fontSize: size ?? undefined, visibility: size === null ? "hidden" : undefined }}
        >
            {words.map((w, i) => (
                <Fragment key={i}>
                    {i > 0 && " "}
                    {/* explicit break opportunity after "/" ("-" already allows one) */}
                    {pieces(w).map((p, j) => <Fragment key={j}>{p}{p.endsWith("/") && <wbr />}</Fragment>)}
                </Fragment>
            ))}
            {/* one cell wide, invisible: gives the cell size in px */}
            <span ref={probe} aria-hidden className="pointer-events-none absolute w-(--cell)" />
            {/* hidden ruler: one span per unbreakable piece, at the reference size. The
                zero-size clipping wrapper keeps it from widening the title's scroll box. */}
            <span aria-hidden className="pointer-events-none invisible absolute left-0 top-0 h-0 w-0 overflow-hidden">
                <span ref={ruler} className="whitespace-nowrap" style={{ fontSize: REFERENCE }}>
                    {words.flatMap(pieces).map((p, i) => <span key={i} className="inline-block">{p}</span>)}
                </span>
            </span>
        </h1>
    )
}
