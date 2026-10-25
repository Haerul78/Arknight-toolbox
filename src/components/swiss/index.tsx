import type { CSSProperties, ElementType, ReactNode } from "react"
import { MotionConfig } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import "./swiss.css"

// Page shell: the grid variables, the visible lines and reduced-motion handling.
export function SwissPage({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <MotionConfig reducedMotion="user">
            <div className={`swiss overflow-x-clip pb-(--cell) ${className}`}>
                <GridLines />
                {children}
            </div>
        </MotionConfig>
    )
}

export function GridLines() {
    return <div aria-hidden className="swiss-lines" />
}

type BandProps = {
    as?: ElementType
    // fixed number of rows; omit to let content add rows (always whole cells)
    rows?: number
    className?: string
    style?: CSSProperties
    children: ReactNode
    [aria: `aria-${string}`]: string | undefined
}

// A section laid on the cell grid.
export function Band({ as: Tag = "section", rows, className = "", style, children, ...aria }: BandProps) {
    return (
        <Tag
            className={`swiss-band ${className}`}
            style={rows ? { gridTemplateRows: `repeat(${rows}, var(--cell))`, ...style } : style}
            {...aria}
        >
            {children}
        </Tag>
    )
}

// Mono, uppercase, wide-tracked label for metadata and captions.
export function Label({ as: Tag = "p", className = "", children, id }: { as?: ElementType; className?: string; children: ReactNode; id?: string }) {
    return <Tag id={id} className={`swiss-label ${className}`}>{children}</Tag>
}

// "02 (Sections)": the section number and its caption, sitting on the bottom line of a
// one-cell row; `aside` goes to the right end of the same row.
export function SectionHeader({ index, caption, id, aside }: { index: number; caption: string; id?: string; aside?: ReactNode }) {
    return (
        <div className="swiss-band">
            <Label id={id} className="col-span-2 self-end pb-2 md:col-span-6">
                {String(index).padStart(2, "0")} ({caption})
            </Label>
            {aside && <div className="col-span-2 self-end pb-2 text-right md:col-span-6">{aside}</div>}
        </div>
    )
}

// ⌐ ⌙ corner marks; place inside a relatively positioned block.
export function CropMarks({ size = 16 }: { size?: number }) {
    const mark = "pointer-events-none absolute border-(--ink)"
    const s = { width: size, height: size }
    return (
        <>
            <span aria-hidden style={s} className={`${mark} -left-px -top-px border-l border-t`} />
            <span aria-hidden style={s} className={`${mark} -right-px -top-px border-r border-t`} />
            <span aria-hidden style={s} className={`${mark} -bottom-px -left-px border-b border-l`} />
            <span aria-hidden style={s} className={`${mark} -bottom-px -right-px border-b border-r`} />
        </>
    )
}

// ↗ in a thin circle; fills black with an amber arrow when `active`.
export function ArrowCircle({ active = false, size = 44 }: { active?: boolean; size?: number }) {
    return (
        <span
            aria-hidden
            style={{ width: size, height: size }}
            className={`flex shrink-0 items-center justify-center rounded-full border border-(--ink) transition-colors duration-300 ${active ? "bg-(--ink) text-primary" : ""}`}
        >
            <ArrowUpRight size={Math.round(size * 0.45)} />
        </span>
    )
}

// Class icon inside a thin circle, sized with the surrounding text (em).
export function ClassGlyph({ profession, className = "h-[0.62em] w-[0.62em]" }: { profession: string; className?: string }) {
    const mask = `url(/classes/${profession}.png)`
    return (
        <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full border border-current ${className}`}>
            <span
                className="block h-[64%] w-[64%] bg-current"
                style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center" }}
            />
        </span>
    )
}

// One cell-sized toggle; the active one is filled amber with black text.
export function CellToggle({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
    return (
        <button
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={onClick}
            className={`flex h-(--cell) w-(--cell) shrink-0 flex-col items-center justify-center gap-[8%] transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ink) ${active ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
        >
            {children}
        </button>
    )
}
