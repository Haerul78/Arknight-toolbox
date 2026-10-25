import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { gamedataVersion, writeMeta } from "./meta.mjs"
import { listArts } from "./art-list.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawPath = resolve(__dirname, "../data/raw/character_table.json")
const rangeRawPath = resolve(__dirname, "../data/raw/range_table.json")
const outPath = resolve(__dirname, "../data/operators.json")
const rangeOutPath = resolve(__dirname, "../data/ranges.json")

const raw = JSON.parse(readFileSync(rawPath, "utf-8"))
const rangeRaw = JSON.parse(readFileSync(rangeRawPath, "utf-8"))

const operators = Object.entries(raw)
    .filter(([id]) => id.startsWith("char_"))
    .map(([id, data]) => ({
        id,
        name: data.name,
        rarity: data.rarity,
        profession: data.profession,
        subProfessionId: data.subProfessionId,
        position: data.position,
        // range di elite tertinggi (phase terakhir)
        rangeId: data.phases?.at(-1)?.rangeId ?? null,
    }))

// hanya simpan range yang benar-benar dipakai operator
const usedIds = [...new Set(operators.map((op) => op.rangeId).filter(Boolean))].sort()
const ranges = Object.fromEntries(
    usedIds.map((id) => [id, rangeRaw[id].grids.map(({ row, col }) => ({ row, col }))])
)

writeFileSync(outPath, JSON.stringify(operators, null, 2))
writeFileSync(rangeOutPath, JSON.stringify(ranges, null, 2))
console.log(`Generated ${operators.length} operators -> ${outPath}`)
console.log(`Generated ${usedIds.length} ranges -> ${rangeOutPath}`)

// ---- detail info (dipakai halaman detail operator, di-load lazy) ----
const detailOutPath = resolve(__dirname, "../data/operator-details.json")
const materialNames = Object.fromEntries(
    JSON.parse(readFileSync(resolve(__dirname, "../data/materials.json"), "utf-8")).map((m) => [m.id, m.name])
)

// {key}, {key:0%}, {key:0.0} diisi dari blackboard; <@..>x</> -> **x**; <$..>x</> -> x
function fillText(text, blackboard = []) {
    if (!Array.isArray(blackboard)) blackboard = []
    if (!text) return ""
    const values = Object.fromEntries(blackboard.map((b) => [b.key.toLowerCase(), b.value]))
    return text
        .replace(/\{-?([\w@.]+)(?::([\d.]+)(%)?)?\}/g, (m, key, fmt, pct) => {
            const v = values[key.toLowerCase()]
            if (v === undefined) return m
            const n = pct ? v * 100 : v
            const digits = fmt?.split(".")[1]?.length ?? 0
            return Number(n.toFixed(digits)).toString() + (pct ? "%" : "")
        })
        .replace(/<@[^>]*>(.*?)<\/>/g, "**$1**")
        .replace(/<\$[^>]*>(.*?)<\/>/g, "$1")
        .replace(/<[^>]+>/g, "")
}

const pickStats = (d) => ({
    hp: d.maxHp, atk: d.atk, def: d.def, res: d.magicResistance,
    cost: d.cost, block: d.blockCnt, interval: d.baseAttackTime, redeploy: d.respawnTime,
})

const details = Object.fromEntries(
    Object.entries(raw)
        .filter(([id]) => id.startsWith("char_"))
        .map(([id, data]) => {
            const traitCand = data.trait?.candidates?.at(-1)
            const trait = traitCand
                ? fillText(traitCand.overrideDescripton ?? data.description, traitCand.blackboard)
                : fillText(data.description)
            return [id, {
                number: data.displayNumber,
                tags: Array.isArray(data.tagList) ? data.tagList : [],
                nation: data.mainPower?.nationId ?? data.nationId ?? null,
                group: data.mainPower?.groupId ?? null,
                team: data.mainPower?.teamId ?? null,
                obtain: data.itemObtainApproach ?? null,
                usage: data.itemUsage ?? "",
                quote: data.itemDesc ?? "",
                trait,
                phases: (data.phases ?? []).map((p, i) => {
                    const frames = p.attributesKeyFrames ?? []
                    return {
                        maxLevel: p.maxLevel,
                        range: p.rangeId,
                        min: pickStats(frames[0].data),
                        max: pickStats(frames.at(-1).data),
                        cost: i === 0 ? [] : (Array.isArray(p.evolveCost) ? p.evolveCost : []).map((c) => ({
                            id: c.id, name: materialNames[c.id] ?? c.id, count: c.count,
                        })),
                    }
                }),
                trust: pickStats(data.favorKeyFrames?.at(-1)?.data ?? {}),
                potentials: (Array.isArray(data.potentialRanks) ? data.potentialRanks : []).map((p) => p.description),
                talents: (data.talents ?? []).map((t) => {
                    const c = t.candidates.at(-1)
                    return {
                        name: c.name,
                        description: fillText(c.description, c.blackboard),
                        phase: c.unlockCondition.phase,
                        level: c.unlockCondition.level,
                        potential: c.requiredPotentialRank,
                    }
                }),
            }]
        })
)

// ---- skills, modules, base skills ----
const readRaw = (name) => JSON.parse(readFileSync(resolve(__dirname, `../data/raw/${name}.json`), "utf-8"))
const skillTable = readRaw("skill_table")
const equipTable = readRaw("uniequip_table")
const battleEquip = readRaw("battle_equip_table")
const building = readRaw("building_data")
const arr = (v) => (Array.isArray(v) ? v : [])

// sebagian skill menyimpan spType sebagai angka
const SP_TYPES = { 1: "INCREASE_WITH_TIME", 2: "INCREASE_WHEN_ATTACK", 4: "INCREASE_WHEN_TAKEN_DAMAGE", 8: "PASSIVE" }
const skillLevel = (l) => ({
    description: fillText(l.description, l.blackboard),
    spType: SP_TYPES[l.spData?.spType] ?? l.spData?.spType ?? null,
    spCost: l.spData?.spCost ?? 0,
    initSp: l.spData?.initSp ?? 0,
    duration: l.duration > 0 ? l.duration : null,
})

// full-body arts for the gallery (default per elite + skins); files come from download-art.mjs
const artsByOperator = listArts()

for (const [id, d] of Object.entries(details)) {
    const data = raw[id]
    d.arts = (artsByOperator[id] ?? []).map(({ file, label, collection }) => ({ file, label, collection }))
    d.skills = arr(data.skills).filter((s) => s.skillId && skillTable[s.skillId]).map((s) => {
        const levels = arr(skillTable[s.skillId].levels)
        const base = levels[Math.min(6, levels.length - 1)]
        const last = levels.at(-1)
        return {
            name: base.name,
            // file ikon: public/skills/skill_icon_<icon>.png
            icon: skillTable[s.skillId].iconId ?? s.skillId,
            type: base.skillType,
            unlockPhase: s.unlockCond?.phase ?? "PHASE_0",
            lv7: skillLevel(base),
            // mastery 3 (level 10), hanya kalau ada
            m3: levels.length > 7 ? skillLevel(last) : null,
        }
    })

    d.modules = arr(equipTable.charEquip?.[id]).map((eid) => equipTable.equipDict[eid]).filter((e) => e && e.type !== "INITIAL").map((e) => {
        const phase = arr(battleEquip[e.uniEquipId]?.phases).at(-1)
        const notes = []
        for (const part of arr(phase?.parts)) {
            const trait = arr(part.overrideTraitDataBundle?.candidates).at(-1)
            if (trait?.additionalDescription) notes.push(fillText(trait.additionalDescription, trait.blackboard))
            const talent = arr(part.addOrOverrideTalentDataBundle?.candidates).at(-1)
            if (talent?.upgradeDescription) notes.push(fillText(talent.upgradeDescription, talent.blackboard))
        }
        return {
            name: e.uniEquipName,
            code: [e.typeName1, e.typeName2].filter(Boolean).join("-"),
            // file ikon: public/equip/<typeIcon>.png
            icon: e.typeIcon,
            phase: e.unlockEvolvePhase,
            level: e.unlockLevel,
            stats: arr(phase?.attributeBlackboard).map((b) => ({ key: b.key, value: b.value })),
            notes,
        }
    })

    d.baseSkills = arr(building.chars?.[id]?.buffChar).flatMap((slot) => arr(slot.buffData)).map((b) => {
        const buff = building.buffs[b.buffId]
        return buff && {
            name: buff.buffName,
            // file ikon: public/building/<skillIcon>.png
            icon: buff.skillIcon,
            color: buff.buffColor,
            room: buff.roomType,
            description: fillText(buff.description),
            phase: b.cond.phase,
            level: b.cond.level,
        }
    }).filter(Boolean)
}

writeFileSync(detailOutPath, JSON.stringify(details))
console.log(`Generated ${Object.keys(details).length} operator details -> ${detailOutPath}`)

// branch (sub-class) display names: subProfessionId -> name, e.g. fastshot -> Marksman
const branchesPath = resolve(__dirname, "../data/branches.json")
const branchNames = Object.fromEntries(
    Object.values(equipTable.subProfDict ?? {}).map((b) => [b.subProfessionId, b.subProfessionName])
)
const branches = Object.fromEntries(
    [...new Set(operators.map((op) => op.subProfessionId))].sort().map((id) => [id, branchNames[id] ?? id])
)
writeFileSync(branchesPath, JSON.stringify(branches, null, 2) + "\n")
console.log(`Generated ${Object.keys(branches).length} branch names -> ${branchesPath}`)

writeMeta("operators", {
    source: "ArknightsGameData (EN): character_table, skill_table, uniequip_table, building_data",
    version: gamedataVersion(),
    count: operators.length,
})
