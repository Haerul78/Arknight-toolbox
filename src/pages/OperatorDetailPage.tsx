import { useParams, Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import operators from "@/data/operators.json"
import meta from "@/data/meta.json"
import branches from "@/data/branches.json"
import RarityStars from "@/components/RarityStars"
import ClassOperator from "@/components/ClassOperator"
import OperatorInfo from "@/components/OperatorInfo"
import OperatorArt from "@/components/OperatorArt"
import ArtGallery from "@/components/detail/ArtGallery"
import { Band, CropMarks, Label, SwissPage } from "@/components/swiss"
import CellBlock from "@/components/swiss/CellBlock"
import FitTitle from "@/components/swiss/FitTitle"
import type { Operator, OperatorDetail } from "@/types/Operator"
import { professionLabel } from "@/lib/profession"
import { useMediaQuery } from "@/hooks/useMediaQuery"

const ease = [0.22, 1, 0.36, 1] as const
const generated = meta.operators.generatedAt.slice(0, 10)
const branchName = branches as Record<string, string>
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// art box: 5×5 cells + a caption row on desktop, 4×4 + caption on phones; the image is
// contained inside, so arts of any proportion never move the layout
const ART_SIZES = "(max-width: 767px) 100vw, 42vw"

function Gallery({ operator, detail }: { operator: Operator; detail: OperatorDetail | null }) {
    if (detail && detail.arts.length > 0) {
        return <ArtGallery key={operator.id} arts={detail.arts} name={operator.name} sizes={ART_SIZES} className="h-full" />
    }
    // while the detail data loads, show the Elite 2 art in the same box
    return (
        <div className="flex h-full flex-col">
            <div className="relative min-h-0 flex-1">
                <CropMarks size={20} />
                <OperatorArt id={operator.id} name={operator.name} sizes={ART_SIZES} className="absolute inset-0 h-full w-full object-bottom" />
            </div>
            <div className="h-(--cell) shrink-0" />
        </div>
    )
}

function Info({ operator, detail }: { operator: Operator; detail: OperatorDetail | null }) {
    const faction = detail ? [detail.nation, detail.group, detail.team].filter(Boolean).map((s) => capitalize(s as string)).join(" / ") : ""
    const facts: [string, string | null | undefined][] = [
        ["File no.", detail?.number],
        ["Faction", faction || null],
        ["Tags", detail?.tags.join(", ")],
        ["Obtain", detail?.obtain],
    ]
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            className="flex flex-col"
        >
            <div className="[&_svg]:text-(--ink)"><RarityStars rarity={operator.rarity} size="lg" /></div>
            <FitTitle id="operator-title" text={operator.name} maxCells={1.05} className="mt-3 font-medium uppercase leading-[0.86] tracking-[-0.05em]" />
            <div className="mt-5 flex items-center gap-4">
                <ClassOperator
                    profession={operator.profession}
                    subProfessionId={operator.subProfessionId}
                    className="flex gap-2"
                    iconClassName="mb-0 h-11 w-11 bg-(--ink)"
                />
                <span className="h-10 w-px bg-(--ink)/30" />
                <Label>
                    {professionLabel[operator.profession] ?? operator.profession} / {branchName[operator.subProfessionId] ?? operator.subProfessionId}
                    <br />{operator.position}
                </Label>
            </div>
            {detail?.trait && (
                <p className="mt-5 max-w-prose text-[17px] leading-snug">
                    ({detail.trait.split("**").map((part, i) => i % 2 ? <mark key={i} className="bg-primary/60 px-0.5 text-(--ink)">{part}</mark> : part)})
                </p>
            )}
            {detail && (
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
                    {facts.filter(([, v]) => v).map(([k, v]) => (
                        <div key={k}>
                            <dt><Label as="span" className="text-(--ink)/60">{k}</Label></dt>
                            <dd className={`mt-0.5 text-sm ${k === "File no." ? "font-mono" : ""}`}>{v}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </motion.div>
    )
}

function TopStrip({ children }: { children: ReactNode }) {
    return <div className="col-span-full row-start-1 flex items-center justify-between gap-4 md:col-span-7">{children}</div>
}

export default function OperatorDetailPage() {
    const { id } = useParams()
    const operator = operators.find((op) => op.id === id)
    const [detail, setDetail] = useState<OperatorDetail | null>(null)
    const wide = useMediaQuery("(min-width: 768px)")

    // detail data is ~1.7MB, so keep it out of the main bundle
    useEffect(() => {
        let cancelled = false
        import("@/data/operator-details.json").then((m) => {
            if (!cancelled) setDetail((m.default as Record<string, OperatorDetail>)[id ?? ""] ?? null)
        })
        return () => { cancelled = true }
    }, [id])

    if (!operator) {
        return (
            <SwissPage>
                <Band rows={3}>
                    <div className="col-span-full row-start-2 flex flex-col justify-center gap-3">
                        <p className="swiss-title text-[calc(var(--cell)*0.5)]">Operator not found</p>
                        <Label>This id isn't in the archive. <Link to="/operators" className="underline underline-offset-2">Open the roster</Link></Label>
                    </div>
                </Band>
            </SwissPage>
        )
    }

    const back = (
        <Link to="/operators" className="swiss-label group inline-flex items-center gap-2 hover:underline focus-visible:outline-2 focus-visible:outline-(--ink)">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> Operators
        </Link>
    )
    const stamp = <Label as="span" className="text-right">Data {generated}</Label>

    return (
        <SwissPage>
            {wide ? (
                // desktop: info on the left 7 columns, art box on the right 5
                <Band rows={6} aria-labelledby="operator-title">
                    <TopStrip>{back}{stamp}</TopStrip>
                    <div className="col-span-7 row-span-5 row-start-2 flex flex-col justify-end pb-6 pr-[calc(var(--cell)*0.5)]">
                        <Info operator={operator} detail={detail} />
                    </div>
                    <div className="col-span-5 col-start-8 row-span-6 row-start-1">
                        <Gallery operator={operator} detail={detail} />
                    </div>
                </Band>
            ) : (
                <>
                    <Band rows={6}>
                        <TopStrip>{back}{stamp}</TopStrip>
                        <div className="col-span-4 row-span-5 row-start-2">
                            <Gallery operator={operator} detail={detail} />
                        </div>
                    </Band>
                    <CellBlock className="swiss-rule-t">
                        <div className="col-span-full py-5"><Info operator={operator} detail={detail} /></div>
                    </CellBlock>
                </>
            )}

            {detail ? (
                <OperatorInfo key={id} operator={operator} detail={detail} />
            ) : (
                <Band rows={2}><Label className="col-span-full self-center">(Loading the file)</Label></Band>
            )}
        </SwissPage>
    )
}
