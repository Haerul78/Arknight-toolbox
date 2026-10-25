import { Package } from "lucide-react"
import type { Material } from "../types/Material"
import GameIcon from "./GameIcon"
import { rarityColor, rarityNumber } from "@/lib/rarity"

type MaterialCardProps = {
    material: Material
    // required amount, shown as a badge on the icon (e.g. promotion costs)
    count?: number
}

export default function MaterialCard({ material, count }: MaterialCardProps) {
    const color = rarityColor[material.rarity] ?? rarityColor.TIER_1
    const ownerId = material.iconId.match(/char_\w+/)?.[0]

    return (
        <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_12px_24px_-12px_rgba(0,0,0,0.5)]">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
            <span className="absolute right-3 top-3 font-barlow text-xs font-semibold tracking-widest text-muted-foreground">
                T{rarityNumber(material.rarity)}
            </span>
            {/* rarity-tinted tile like the in-game depot */}
            <div
                className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-lg"
                style={{ background: `radial-gradient(circle at 50% 60%, ${color}55, ${color}10 70%)`, boxShadow: `inset 0 -3px 0 ${color}` }}
            >
                <GameIcon
                    src={`/items/${material.iconId}.png`}
                    alt={material.name}
                    className="h-14 w-14 drop-shadow transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                    fallback={
                        // operator tokens have no item icon in the repo; show the operator instead
                        ownerId ? (
                            <GameIcon
                                src={`/avatars/${ownerId}.png`}
                                alt={material.name}
                                className="h-12 w-12 rounded-md transition-transform duration-300 group-hover:scale-110"
                                fallback={<Package className="h-7 w-7 text-card-foreground/40" />}
                            />
                        ) : <Package className="h-7 w-7 text-card-foreground/40" />
                    }
                />
                {count !== undefined && (
                    <span className="absolute -bottom-1.5 -right-2 bg-background px-1 font-mono text-xs font-semibold text-foreground tabular-nums">
                        ×{count}
                    </span>
                )}
            </div>
            <p className="line-clamp-2 text-sm font-medium text-card-foreground">{material.name}</p>
        </div>
    )
}
