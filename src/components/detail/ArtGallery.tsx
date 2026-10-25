import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { preload } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { CropMarks, Label } from "@/components/swiss"
import { artSrcSet, artUrl } from "@/lib/art"
import type { OperatorDetail } from "@/types/Operator"

type Art = OperatorDetail["arts"][number]

// horizontal travel that counts as a swipe
const SWIPE_PX = 50

function NavButton({ dir, onClick, label }: { dir: "prev" | "next"; onClick: () => void; label: string }) {
    const Icon = dir === "prev" ? ArrowLeft : ArrowRight
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-(--ink) transition-colors can-hover:hover:bg-(--ink) can-hover:hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ink)"
        >
            <Icon size={18} />
        </button>
    )
}

// Full-body art viewer. The box keeps its size whatever the art's proportions (the art is
// contained and stands on the bottom edge), so switching never moves the layout.
// Only the visible art is rendered; the one before and after are preloaded, the rest load
// when reached. `sizes` tells the browser which of the 640/1280 files to fetch.
type ArtGalleryProps = {
    arts: Art[]
    name: string
    sizes: string
    className?: string
    // half-cell caption row for dense pages (the dossier); a full cell otherwise
    dense?: boolean
}

export default function ArtGallery({ arts, name, sizes, className = "", dense = false }: ArtGalleryProps) {
    const [index, setIndex] = useState(() => {
        // open on the Elite 2 art when there is one, like the rest of the page
        const e2 = arts.findIndex((a) => a.label === "Elite 2")
        return e2 >= 0 ? e2 : 0
    })
    const [failed, setFailed] = useState<Set<string>>(() => new Set())
    const swipe = useRef<{ x: number; y: number } | null>(null)

    const count = arts.length
    const go = (step: number) => setIndex((i) => (i + step + count) % count)
    const art = arts[index]

    useEffect(() => {
        if (count < 2) return
        for (const n of [arts[(index + 1) % count], arts[(index - 1 + count) % count]]) {
            preload(artUrl(n.file), { as: "image", imageSrcSet: artSrcSet(n.file), imageSizes: sizes })
        }
    }, [arts, index, count, sizes])

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") go(-1)
        else if (e.key === "ArrowRight") go(1)
        else return
        e.preventDefault()
    }
    const onPointerDown = (e: PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY } }
    const onPointerUp = (e: PointerEvent) => {
        const s = swipe.current
        swipe.current = null
        if (!s) return
        const dx = e.clientX - s.x
        // mostly horizontal and long enough; vertical drags stay page scrolls (touch-action)
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1)
    }

    if (!art) return null
    const caption = art.collection ? `${art.label}, ${art.collection}` : art.label

    return (
        <div className={`flex flex-col ${className}`}>
            <div
                role="group"
                aria-roledescription="carousel"
                aria-label={`${name} art`}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => { swipe.current = null }}
                className="relative min-h-0 flex-1 touch-pan-y select-none outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ink)"
            >
                <CropMarks size={20} />
                <AnimatePresence initial={false}>
                    {failed.has(art.file) ? (
                        <motion.div key={`missing-${art.file}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                            <Label>(Art not available)</Label>
                        </motion.div>
                    ) : (
                        <motion.img
                            key={art.file}
                            src={artUrl(art.file)}
                            srcSet={artSrcSet(art.file)}
                            sizes={sizes}
                            alt={`${name}, ${caption}`}
                            draggable={false}
                            onError={() => setFailed((f) => new Set(f).add(art.file))}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
                        />
                    )}
                </AnimatePresence>
            </div>

            <div className={`flex shrink-0 items-center gap-3 ${dense ? "h-[calc(var(--cell)/2)]" : "h-(--cell)"}`}>
                <Label className="min-w-0 flex-1" as="p">
                    <span className="font-medium">{String(index + 1).padStart(2, "0")}/{String(count).padStart(2, "0")}</span>
                    <span aria-live="polite" className="ml-3">({caption})</span>
                </Label>
                {count > 1 && (
                    <>
                        <NavButton dir="prev" onClick={() => go(-1)} label="Previous art" />
                        <NavButton dir="next" onClick={() => go(1)} label="Next art" />
                    </>
                )}
            </div>
        </div>
    )
}
