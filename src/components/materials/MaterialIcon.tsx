import { Package } from "lucide-react"
import GameIcon from "@/components/GameIcon"
import OperatorAvatar from "@/components/OperatorAvatar"
import { iconUrl } from "@/lib/materials"
import type { Material } from "@/types/Material"

// Item icon; Kernel tokens have no icon file in the repo, so they show their operator.
export default function MaterialIcon({ material, className = "h-full w-full" }: { material: Material | undefined; className?: string }) {
    if (!material) return <Package aria-hidden className="h-1/3 w-1/3 text-(--ink)/40" />
    const fallback = material.operatorId
        ? <span className={`block overflow-hidden bg-(--ink) ${className}`}><OperatorAvatar id={material.operatorId} name={material.name} /></span>
        : <Package aria-hidden className="h-1/3 w-1/3 text-(--ink)/40" />
    return <GameIcon src={iconUrl(material)} alt="" className={className} fallback={fallback} />
}

// the tier as a small square in the game's rarity colour plus its number
export function TierMark({ tier, color }: { tier: number; color: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
            <span aria-hidden className="h-2 w-2" style={{ background: color }} />T{tier}
        </span>
    )
}
