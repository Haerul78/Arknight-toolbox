import { SharpStar } from '@/components/ui/SharpStar' 

type RarityStarsProps = {
    rarity: string
    size?: "xs" | "sm" | "lg"
}

const sizeClass: Record<string, string> = {
    xs: "h-3.5 w-3.5",
    sm: "h-5 w-5",
    lg: "h-7 w-7",
}

const getStarCount = (rarity: string) => {
    return Number(rarity.replace("TIER_", "")) || 0
}

export default function RarityStars({ rarity, size = "sm" }: RarityStarsProps) {
    return (
        <div className={"mt-1 flex gap-0.5"}>
            {Array.from({ length: getStarCount(rarity) }).map((_, i) => (
                <SharpStar
                    key={i}
                    className={`fill-current ${sizeClass[size]} text-[#E8C24B]`}   
                />
            ))}
        </div>
    )
}