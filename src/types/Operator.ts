export type Operator = {
    id: string
    name: string
    rarity: string
    profession: string
    subProfessionId: string
    position: string
    rangeId: string | null
}

export type OperatorStats = {
    hp: number
    atk: number
    def: number
    res: number
    cost: number
    block: number
    interval: number
    redeploy: number
}

export type OperatorDetail = {
    number: string | null
    tags: string[]
    nation: string | null
    group: string | null
    team: string | null
    obtain: string | null
    usage: string
    quote: string
    trait: string
    phases: {
        maxLevel: number
        range: string | null
        min: OperatorStats
        max: OperatorStats
        cost: { id: string; name: string; count: number }[]
    }[]
    trust: OperatorStats
    potentials: string[]
    talents: {
        name: string
        description: string
        phase: string
        level: number
        potential: number
    }[]
    skills: {
        name: string
        icon: string
        type: string
        unlockPhase: string
        lv7: SkillLevel
        m3: SkillLevel | null
    }[]
    modules: {
        name: string
        code: string
        icon: string
        phase: string
        level: number
        stats: { key: string; value: number }[]
        notes: string[]
    }[]
    // full-body art in gallery order (Elite 0 → Elite 2 → skins); see src/lib/art.ts
    arts: {
        file: string
        label: string
        collection: string | null
    }[]
    baseSkills: {
        name: string
        icon: string
        color: string
        room: string
        description: string
        phase: string
        level: number
    }[]
}

export type SkillLevel = {
    description: string
    spType: string | null
    spCost: number
    initSp: number
    duration: number | null
}
