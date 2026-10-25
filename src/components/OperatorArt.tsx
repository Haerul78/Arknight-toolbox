import { useState } from "react"
import { artSrcSet, artUrl } from "@/lib/art"

// highest elite art first; not every operator has every stage
const artSuffixes = ["_2", "_1plus", "_1"]

type OperatorArtProps = {
    id: string
    name: string
    className?: string
    // CSS width the image is shown at, so the browser picks the 640 or 1280 file
    sizes?: string
}

export default function OperatorArt({ id, name, className = "", sizes = "(max-width: 767px) 100vw, 50vw" }: OperatorArtProps) {
    const [i, setI] = useState(0)
    const file = `${id}${artSuffixes[i]}`
    return (
        <img
            src={artUrl(file)}
            srcSet={artSrcSet(file)}
            sizes={sizes}
            alt={name}
            draggable={false}
            onError={() => setI((n) => Math.min(n + 1, artSuffixes.length - 1))}
            className={`select-none object-contain ${className}`}
        />
    )
}
