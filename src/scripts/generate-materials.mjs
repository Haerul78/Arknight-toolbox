import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { gamedataVersion, writeMeta } from "./meta.mjs"

// Writes two files from the same tables:
// - materials.json: every material with its category and a short summary (main bundle;
//   used by the materials list and by operator pages for icons)
// - material-details.json: recipe, what it crafts, which operators need it and where it
//   drops, per material (lazy-loaded by /materials/:id)
const __dirname = dirname(fileURLToPath(import.meta.url))
const raw = (name) => JSON.parse(readFileSync(resolve(__dirname, `../data/raw/${name}.json`), "utf-8"))
const listPath = resolve(__dirname, "../data/materials.json")
const detailPath = resolve(__dirname, "../data/material-details.json")

const itemTable = raw("item_table")
const building = raw("building_data")
const characters = raw("character_table")
const uniequip = raw("uniequip_table")
const stages = raw("stage_table").stages
const zones = raw("zone_table").zones
const operators = JSON.parse(readFileSync(resolve(__dirname, "../data/operators.json"), "utf-8"))
const operatorIds = new Set(operators.map((o) => o.id))

// the raw tables use {} for empty arrays
const list = (x) => (Array.isArray(x) ? x : [])
const tier = (rarity) => Number(String(rarity).replace("TIER_", "")) || 0

// only real materials (promotion/skill/module materials, potential tokens); event items,
// vouchers, furniture etc. are left out
const items = Object.entries(itemTable.items).filter(([, d]) => d.classifyType === "MATERIAL")
const itemIds = new Set(items.map(([id]) => id))

// ---- category ----

function categoryOf(id) {
    if (/^200\d$/.test(id)) return "record"
    if (/^330\d$/.test(id)) return "summary"
    if (/^32\d\d$/.test(id) || id === "32001") return "chip"
    if (/^3\d{4}$/.test(id)) return "crafting"
    if (id.startsWith("mod_")) return "module"
    if (/^tier\d_/.test(id)) return "classToken"
    if (/^(p_char_|class_p_char_|voucher_full_)/.test(id)) return "operatorToken"
    return null
}

// personal letters name the operator only through this table
const letterOwner = Object.fromEntries(
    Object.entries(itemTable.fullPotentialCharacters ?? {}).map(([charId, v]) => [v.itemId, charId])
)
function operatorOf(id) {
    if (id.startsWith("class_p_")) return id.slice("class_p_".length)
    if (id.startsWith("p_")) return id.slice("p_".length)
    return letterOwner[id] ?? null
}

// ---- recipes ----

// crafting: Workshop (materials, skill summaries) and Factory (battle records, dualchips)
const recipeOf = {}
const conversionsOf = {}
const CRAFTS = new Set(["F_EVOLVE", "F_SKILL", "F_ASC"])
for (const f of Object.values(building.workshopFormulas)) {
    // F_BUILDING (carbon, furniture parts) makes base items, not materials
    if (!CRAFTS.has(f.formulaType)) continue
    if (!itemIds.has(f.itemId)) {
        console.warn(`skip workshop formula ${f.formulaId}: ${f.itemId} is not in item_table`)
        continue
    }
    const costs = list(f.costs).map((c) => ({ id: c.id, count: c.count }))
    if (f.formulaType === "F_ASC") {
        // chip conversion: 3 of one class's chips -> chips of the paired class
        ;(conversionsOf[f.itemId] ??= []).push({ costs, count: f.count })
        continue
    }
    const byproducts = list(f.extraOutcomeGroup)
    const weight = byproducts.reduce((s, b) => s + b.weight, 0)
    recipeOf[f.itemId] = {
        room: "WORKSHOP",
        costs,
        count: f.count,
        gold: f.goldCost,
        level: list(f.requireRooms)[0]?.roomLevel ?? 1,
        byproductRate: byproducts.length ? f.extraOutcomeRate : 0,
        byproducts: byproducts.map((b) => ({ id: b.itemId, share: +(b.weight / weight).toFixed(3) })),
    }
}
for (const f of Object.values(building.manufactFormulas)) {
    if (!itemIds.has(f.itemId) || recipeOf[f.itemId]) continue
    recipeOf[f.itemId] = {
        room: "FACTORY",
        costs: list(f.costs).map((c) => ({ id: c.id, count: c.count })),
        count: f.count,
        gold: 0,
        level: list(f.requireRooms)[0]?.roomLevel ?? 1,
        // seconds per item; dualchips are instant (1)
        seconds: f.costPoint > 1 ? f.costPoint : 0,
    }
}

const usedIn = {}
for (const [id, r] of Object.entries(recipeOf)) {
    for (const c of r.costs) (usedIn[c.id] ??= []).push({ id, count: c.count })
}

// ---- operators that need each material ----

const neededBy = {}
function need(item, charId, kind, count) {
    if (!itemIds.has(item)) return
    const byOp = (neededBy[item] ??= {})
    const row = (byOp[charId] ??= { id: charId, elite: 0, skill: 0, mastery: 0, module: 0 })
    row[kind] += count
}
for (const [charId, c] of Object.entries(characters)) {
    if (!operatorIds.has(charId)) continue
    for (const p of list(c.phases)) for (const x of list(p.evolveCost)) need(x.id, charId, "elite", x.count)
    for (const l of list(c.allSkillLvlup)) for (const x of list(l.lvlUpCost)) need(x.id, charId, "skill", x.count)
    for (const s of list(c.skills)) for (const l of list(s.levelUpCostCond)) for (const x of list(l.levelUpCost)) need(x.id, charId, "mastery", x.count)
}
for (const e of Object.values(uniequip.equipDict)) {
    if (!operatorIds.has(e.charId) || !e.itemCost) continue
    for (const stage of Object.values(e.itemCost)) for (const x of list(stage)) need(x.id, e.charId, "module", x.count)
}
const total = (r) => r.elite + r.skill + r.mastery + r.module

// ---- stages ----

// the game only gives a drop category, never a rate
const CHANCE_RANK = { ALWAYS: 5, ALMOST: 4, USUAL: 3, OFTEN: 2, SOMETIMES: 1 }
const DROP = { NORMAL: "main", SPECIAL: "special", ADDITIONAL: "extra" }
const DROP_RANK = { main: 0, special: 1, extra: 2 }

function stageGroup(st) {
    if (st.stageType === "MAIN" || st.stageType === "SUB") return "main"
    if (st.stageType === "DAILY") return "supply"
    if (st.stageType === "CAMPAIGN") return "annihilation"
    if (st.stageType === "ACTIVITY") return "event"
    if (st.stageType === "CLIMB_TOWER") return "other"
    return null
}
function zoneName(st) {
    if (st.stageType === "CLIMB_TOWER") return "Stationary Security Service"
    const z = zones[st.zoneId]
    if (!z) return null
    if (z.type === "MAINLINE") return [z.zoneNameFirst, z.zoneNameSecond].filter(Boolean).join(": ")
    return z.zoneNameSecond ?? z.zoneNameFirst ?? null
}

const dropsOf = {}
for (const st of Object.values(stages)) {
    // "#f#" challenge and "#s" story-environment copies repeat the normal stage
    if (st.stageId.includes("#") || st.isStoryOnly) continue
    const group = stageGroup(st)
    if (!group) continue
    for (const r of list(st.stageDropInfo?.displayDetailRewards)) {
        const drop = DROP[r.dropType]
        if (!drop || !itemIds.has(r.id)) continue
        ;(dropsOf[r.id] ??= []).push({
            id: st.stageId,
            code: st.code,
            name: st.name,
            zone: zoneName(st),
            group,
            drop,
            chance: r.occPercent,
            ap: st.apCost,
            adverse: st.diffGroup === "TOUGH" || undefined,
        })
    }
}
for (const list of Object.values(dropsOf)) {
    list.sort((a, b) => DROP_RANK[a.drop] - DROP_RANK[b.drop] || CHANCE_RANK[b.chance] - CHANCE_RANK[a.chance] || a.ap - b.ap)
}

// ---- families (rows of the chain chart) ----

const nameOf = (id) => itemTable.items[id]?.name ?? id
function familyOf(id, category) {
    if (category === "crafting") {
        // last digit is the tier; T5 compounds sit in the row of their first ingredient
        const r = recipeOf[id]
        if (tier(itemTable.items[id].rarity) === 5 && r) return r.costs[0].id.slice(0, -1)
        return id.slice(0, -1)
    }
    if (category === "chip") return id === "32001" ? "catalyst" : id.slice(0, 3)
    if (category === "record" || category === "summary") return category
    if (category === "module") return id === "mod_unlock_token" ? "mod_unlock" : "mod_update"
    if (category === "classToken") return id.replace(/^tier\d_/, "")
    return null
}
function familyName(family, category, members) {
    if (category === "crafting") return nameOf(members.sort((a, b) => tier(a.rarity) - tier(b.rarity))[0].id)
    if (category === "chip") return family === "catalyst" ? "Catalyst" : members[0].name.split(" ")[0]
    if (category === "record") return "Battle records"
    if (category === "summary") return "Skill summaries"
    if (category === "module") return family === "mod_unlock" ? "Module unlock" : "Data supplements"
    // "Replicated Vanguard Token" -> "Vanguard"
    return members[0].name.split(" ").at(-2)
}

// ---- output ----

const materials = []
const details = {}
for (const [id, data] of items) {
    const category = categoryOf(id)
    if (!category) console.warn(`no category for ${id} (${data.name})`)
    const ops = Object.values(neededBy[id] ?? {}).sort((a, b) => total(b) - total(a))
    const drops = dropsOf[id] ?? []
    const recipe = recipeOf[id]
    // list summary, where this is the main drop: the two highest supply stages (LS-6, CA-5)
    // when it has them, otherwise up to three main-story stages
    const main = drops.filter((d) => d.drop === "main" && !d.adverse)
    const supply = main.filter((d) => d.group === "supply").sort((a, b) => b.ap - a.ap).slice(0, 2)
    const story = main.filter((d) => d.group === "main").slice(0, 3)
    const mainDrops = [...new Set((supply.length ? supply : story).map((d) => d.code))]

    materials.push({
        id,
        name: data.name,
        rarity: data.rarity,
        // icon file name in public/items (downloaded by download-icons.mjs)
        iconId: data.iconId,
        category: category ?? "other",
        sortId: data.sortId,
        family: familyOf(id, category) ?? undefined,
        operatorId: category === "operatorToken" ? operatorOf(id) ?? undefined : undefined,
        recipe: recipe ? { costs: recipe.costs, count: recipe.count, gold: recipe.gold, room: recipe.room } : undefined,
        neededBy: ops.length || undefined,
        neededTotal: ops.length ? ops.reduce((s, r) => s + total(r), 0) : undefined,
        drops: mainDrops.length ? mainDrops : undefined,
    })
    details[id] = {
        description: data.description ?? "",
        usage: data.usage ?? "",
        obtain: data.obtainApproach ?? null,
        recipe: recipe ?? null,
        conversions: conversionsOf[id] ?? [],
        usedIn: usedIn[id] ?? [],
        neededBy: ops,
        stages: drops,
    }
}

// family display names, once all members are known
const families = {}
for (const m of materials) if (m.family) (families[m.family] ??= { category: m.category, members: [] }).members.push(m)
for (const m of materials) if (m.family) m.familyName = familyName(m.family, families[m.family].category, [...families[m.family].members])

writeFileSync(listPath, JSON.stringify(materials, null, 2))
writeFileSync(detailPath, JSON.stringify(details))
const counts = Object.groupBy(materials, (m) => m.category)
console.log(`Generated ${materials.length} materials -> ${listPath}`)
console.log(Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v.length])))
console.log(`Details -> ${detailPath}`)

writeMeta("materials", {
    source: "ArknightsGameData (EN): item_table, building_data, character_table, uniequip_table, stage_table, zone_table",
    version: gamedataVersion(),
    count: materials.length,
})
