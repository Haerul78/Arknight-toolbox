import { useState, type ReactNode } from "react"

type GameIconProps = {
    src: string
    alt?: string
    className?: string
    // shown when the file is missing (icons are downloaded separately and may not exist yet)
    fallback?: ReactNode
}

export default function GameIcon({ src, alt = "", className = "", fallback = null }: GameIconProps) {
    const [failed, setFailed] = useState(false)
    if (failed) return <>{fallback}</>
    return (
        <img
            key={src}
            src={src}
            alt={alt}
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
            className={`select-none object-contain ${className}`}
        />
    )
}
