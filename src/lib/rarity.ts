// in-game rarity colors (1★ grey ... 6★ orange)
export const rarityColor: Record<string, string> = {
    TIER_1: "#9CA3AF",
    TIER_2: "#D8DD5A",
    TIER_3: "#3FB4E8",
    TIER_4: "#B99BE0",
    TIER_5: "#E8C24B",
    TIER_6: "#F2803E",
}

export const rarityNumber = (rarity: string) => Number(rarity.replace("TIER_", "")) || 0
