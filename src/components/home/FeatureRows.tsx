import { Link } from "react-router-dom"
import GameIcon from "@/components/GameIcon"
import operators from "@/data/operators.json"
import materials from "@/data/materials.json"
import { albums, coverUrl, tracks } from "@/lib/music"
import { ArrowCircle, SectionHeader } from "@/components/swiss"
import { useActiveRow } from "@/components/swiss/useActiveRow"

type Feature = {
    to: string
    name: string
    count: string
    description: string
    images: { src: string; alt: string }[]
}

const features: Feature[] = [
    {
        to: "/operators",
        name: "Operators",
        count: `${operators.length} files`,
        description: "Stats per elite and level, skills, modules, range and promotion costs.",
        images: ["char_103_angel", "char_2014_nian", "char_350_surtr"].map((id) => ({
            src: `/avatars/${id}.png`,
            alt: operators.find((o) => o.id === id)?.name ?? "",
        })),
    },
    {
        to: "/materials",
        name: "Materials",
        count: `${materials.length} items`,
        description: "Every promotion and skill material with its tier, from chips to tokens.",
        images: ["3213", "30115", "30145"].map((id) => {
            const m = materials.find((x) => x.id === id)
            return { src: `/items/${m?.iconId}.png`, alt: m?.name ?? "" }
        }),
    },
    {
        to: "/music",
        name: "Music",
        count: `${tracks.length} tracks`,
        description: "The Monster Siren archive on a turntable, streamed from the official site.",
        images: albums.slice(0, 3).map((a) => ({ src: coverUrl(a.cid), alt: a.name })),
    },
]

// one duration for every open/close, so a closing row and an opening row move in step
const SWITCH = "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"

// Layout rule that keeps rows from moving under the cursor: everything inside a row is
// always mounted at a fixed grid position and only fades. Nothing is added or removed,
// so grid auto-placement can never push an item onto a second line. On desktop a row is
// always exactly one cell tall; on phones the open row grows by one cell (animated).
export default function FeatureRows() {
    // first tap opens a row on touch, second tap follows the link (see useActiveRow)
    const { active, listProps, rowProps } = useActiveRow({ tapToOpen: true })

    return (
        <section aria-labelledby="home-sections">
            <SectionHeader index={2} caption="Sections" id="home-sections" />

            {/* rules are inset shadows, not borders, so rows stay exactly one cell tall */}
            <ul className="relative mx-(--m)" {...listProps}>
                {features.map((f, i) => {
                    const open = active === String(i)
                    return (
                        <li key={f.to} className="swiss-rule-t last:swiss-rule-y">
                            <Link
                                to={f.to}
                                data-row-key={i}
                                {...rowProps}
                                aria-describedby={`feature-desc-${i}`}
                                className={`relative grid grid-cols-[repeat(var(--cols),var(--cell))] overflow-hidden transition-[background-color,grid-template-rows] ${SWITCH} focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ink) ${
                                    open ? "bg-primary max-md:grid-rows-[var(--cell)_var(--cell)]" : "max-md:grid-rows-[var(--cell)_0px]"
                                } md:grid-rows-(--cell)`}
                            >
                                {/* phones: the number sits in the row's corner so name + arrow fit one cell */}
                                <span className="swiss-label absolute pt-2 md:static md:col-start-1 md:row-start-1 md:pt-3">/{String(i + 1).padStart(2, "0")}</span>
                                <span className="col-span-3 col-start-1 row-start-1 flex items-center overflow-hidden swiss-row md:col-span-5 md:col-start-2">
                                    {f.name}
                                </span>

                                {/* detail: always mounted (images are loaded before the first hover),
                                    second line on phones, same line on desktop */}
                                <span
                                    aria-hidden={!open}
                                    className={`col-span-full row-start-2 grid min-h-0 grid-cols-subgrid overflow-hidden transition-opacity ${SWITCH} md:col-span-5 md:col-start-7 md:row-start-1 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
                                >
                                    <span className="col-span-2 flex gap-px overflow-hidden md:col-span-3">
                                        {f.images.map((img) => (
                                            <GameIcon key={img.src} src={img.src} alt={img.alt} className="aspect-square h-full bg-(--ink) object-cover" />
                                        ))}
                                    </span>
                                    <span id={`feature-desc-${i}`} className="swiss-label col-span-2 self-center px-2 normal-case tracking-normal md:pl-3">
                                        {f.description}
                                    </span>
                                </span>

                                {/* count shares the detail's cells and fades out as the detail fades in */}
                                <span
                                    aria-hidden={open}
                                    className={`swiss-label hidden self-center text-right transition-opacity ${SWITCH} md:col-span-2 md:col-start-10 md:row-start-1 md:block ${open ? "opacity-0" : "opacity-100"}`}
                                >
                                    {f.count}
                                </span>

                                <span className="col-start-4 row-start-1 flex items-center justify-end pr-3 md:col-start-12">
                                    <ArrowCircle active={open} />
                                </span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
