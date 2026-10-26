import { memo, type HTMLAttributes } from "react"
import { Link } from "react-router-dom"
import MaterialIcon from "./MaterialIcon"
import { rarityColor } from "@/lib/rarity"
import { tierOf } from "@/lib/materials"
import type { Material } from "@/types/Material"

type TileProps = {
    material: Material
    // "×5" in the corner (recipes, costs)
    count?: number
    // item name under the icon (lists where there is no caption to name it)
    named?: boolean
    // tier number in the top corner (phone chart, where columns don't say the tier)
    tiered?: boolean
    active?: boolean
    // searched away: kept in place so the chart keeps its shape, but faded
    dim?: boolean
    className?: string
    rowProps?: HTMLAttributes<HTMLElement> & { "data-row-key"?: string }
}

// One material in one cell, like a depot slot: icon, rarity line, links to its page.
export const MaterialTile = memo(function MaterialTile({ material, count, named, tiered, active, dim, className = "", rowProps }: TileProps) {
    const label = count ? `${material.name}, ${count}` : material.name
    return (
        <Link
            to={`/materials/${material.id}`}
            aria-label={label}
            title={label}
            tabIndex={dim ? -1 : undefined}
            {...rowProps}
            className={`relative flex h-(--cell) w-(--cell) flex-col items-center justify-center transition-[background-color,opacity] duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ink) ${active ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"} ${dim ? "opacity-15" : ""} ${className}`}
        >
            <span className={`flex items-center justify-center ${named ? "h-[52%] w-[52%]" : "h-[66%] w-[66%]"}`}>
                <MaterialIcon material={material} />
            </span>
            {named && (
                <span className="mt-1 line-clamp-2 w-full px-1.5 text-center text-[10px] leading-[1.15] md:text-[11px]">{material.name}</span>
            )}
            {tiered && <span className="absolute left-1.5 top-1 font-mono text-[10px] tabular-nums text-(--ink)/60">T{tierOf(material)}</span>}
            {count !== undefined && <span className={`swiss-label absolute right-1.5 font-medium ${named ? "top-1" : "bottom-1.5"}`}>×{count}</span>}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: rarityColor[material.rarity] ?? rarityColor.TIER_1 }} />
        </Link>
    )
})
