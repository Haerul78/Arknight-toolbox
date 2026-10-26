# Arknights Toolbox

A fan-made reference site for Arknights (EN server): look up operators, see what every upgrade material is made of and who needs it, and listen to the game's soundtrack.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Home, with a link to each section |
| `/operators` | Every operator: search by name, filter by class or rarity, sort by rarity, name or class |
| `/operators/:id` | One operator: attributes, attack range, skills, talents, potential, promotion materials, modules, base skills, profile and art |
| `/materials` | Upgrade materials as a crafting chart: one row per crafting line, one column per tier |
| `/materials/:id` | One material: recipe and full breakdown, what it crafts, which operators need it, which stages drop it |
| `/music` | Albums and songs from Monster Siren Records, played straight from the official site |

## Running it locally

Requires Node.js 20.19+ or 22.12+ (what Vite 8 needs).

```bash
npm install
npm run dev       # http://localhost:5173
```

The dev server also answers `/api/song/:cid`, so the music player works locally.

| Command | Does |
| --- | --- |
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run preview` | Serves the built `dist/` |
| `npm run lint` | Runs ESLint |

## Data

The site reads JSON files in `src/data/`. They are generated from the game tables and committed, so you only need the steps below to refresh them after a game update.

1. Download these tables from [ArknightsGameData_YoStar](https://github.com/Kengxxiao/ArknightsGameData_YoStar) (`en_US/gamedata/excel/`) into `src/data/raw/`:
   `character_table`, `skill_table`, `uniequip_table`, `battle_equip_table`, `building_data`, `range_table`, `skin_table`, `item_table`, `stage_table`, `zone_table`.
2. Run `npm run generate:data`. This writes `operators.json`, `operator-details.json`, `ranges.json`, `materials.json` and `material-details.json`, and records the date in `meta.json`.

`src/data/raw/` is gitignored.

## Images and music

Images are not in the repository. Download them with:

| Command | Downloads | To |
| --- | --- | --- |
| `npm run download:icons` | Item, skill, module and base skill icons | `public/items`, `public/skills`, `public/equip`, `public/building` |
| `npm run download:art` | Full-body art for every elite and skin, as WebP at 1280px and 640px | `public/art` |
| `npm run generate:music` | The album and song list (`src/data/music.json`) and album covers | `public/music-covers` |

Icons and art come from [Arknight-Images](https://github.com/PuppiizSunniiz/Arknight-Images).

Audio is never downloaded. Song links from Monster Siren expire after about three hours, so the player asks `/api/song/:cid` for a fresh link when a song starts. That function exists because Monster Siren's API does not allow requests from other sites (no CORS headers).

### Hosting the art elsewhere

The art folder is large. To serve it from object storage (R2, S3, Supabase and so on), upload `public/art/` there and set:

```bash
VITE_ART_BASE_URL=https://your-bucket.example.com/art
```

When it is unset, the site loads art from `/art`.

## Deploying

The site is built for [Vercel](https://vercel.com). `api/song/[cid].ts` runs as a serverless function, and the rest is a static build from `npm run build`.

## Built with

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, Zustand, Framer Motion, and React Three Fiber for the 3D attack range.

## Disclaimer

This is a fan project and is not affiliated with Hypergryph, Yostar or Studio Montagne. Arknights, its characters, art and music belong to their owners.
