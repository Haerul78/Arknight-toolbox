import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import meta from "@/data/meta.json"
import RarityStars from "@/components/RarityStars"
import ClassOperator from "@/components/ClassOperator"
import OperatorArt from "@/components/OperatorArt"
import ArtGallery from "@/components/detail/ArtGallery"
import { CropMarks, Label } from "@/components/swiss"
import FitTitle from "@/components/swiss/FitTitle"
import type { Operator, OperatorDetail } from "@/types/Operator"
import { classAndBranch } from "@/lib/operatorDetail"

// Header pieces shared by the detail-page layouts (?v=a|b|c).

const generated = meta.operators.generatedAt.slice(0, 10)
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function BackLink() {
    return (
        <Link to="/operators" className="swiss-label group inline-flex items-center gap-2 hover:underline focus-visible:outline-2 focus-visible:outline-(--ink)">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" /> Operators
        </Link>
    )
}

export function DataStamp({ detail }: { detail: OperatorDetail | null }) {
    return <Label as="span">{detail?.number && `(File ${detail.number})  `}Data {generated}</Label>
}

// art gallery; while the detail data loads, the Elite 2 art fills the same box
export function DetailGallery({ operator, detail, sizes, dense = true }: { operator: Operator; detail: OperatorDetail | null; sizes: string; dense?: boolean }) {
    if (detail && detail.arts.length > 0) {
        return <ArtGallery key={operator.id} arts={detail.arts} name={operator.name} sizes={sizes} className="h-full" dense={dense} />
    }
    return (
        <div className="flex h-full flex-col">
            <div className="relative min-h-0 flex-1">
                <CropMarks size={20} />
                <OperatorArt id={operator.id} name={operator.name} sizes={sizes} className="absolute inset-0 h-full w-full object-bottom" />
            </div>
            <div className={`shrink-0 ${dense ? "h-[calc(var(--cell)/2)]" : "h-(--cell)"}`} />
        </div>
    )
}

// name, rarity, class/branch, faction, tags, trait
export function Identity({ operator, detail }: { operator: Operator; detail: OperatorDetail | null }) {
    const faction = detail ? [detail.nation, detail.group, detail.team].filter(Boolean).map((s) => capitalize(s as string)).join(" / ") : ""
    const facts: [string, string | null | undefined][] = [
        ["Class", classAndBranch(operator)],
        ["Position", capitalize(operator.position.toLowerCase())],
        ["Faction", faction || null],
        ["Tags", detail?.tags.join(", ")],
        ["Obtain", detail?.obtain],
    ]
    return (
        <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="pb-4"
        >
            <div className="flex h-7 items-center justify-between gap-3">
                <BackLink />
                <DataStamp detail={detail} />
            </div>
            <div className="mt-2 flex items-end gap-4">
                <div className="min-w-0 flex-1">
                    <div className="[&_svg]:text-(--ink)"><RarityStars rarity={operator.rarity} /></div>
                    <FitTitle id="operator-title" text={operator.name} maxCells={0.8} className="mt-1 font-medium uppercase leading-[0.86] tracking-tighter" />
                </div>
                <ClassOperator
                    profession={operator.profession}
                    subProfessionId={operator.subProfessionId}
                    className="flex shrink-0 gap-1.5 pb-1"
                    iconClassName="mb-0 h-9 w-9 bg-(--ink)"
                />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-5">
                {facts.filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="min-w-0">
                        <dt><Label as="span" className="text-(--ink)/60">{k}</Label></dt>
                        <dd className="mt-0.5 text-[14px] leading-snug">{v}</dd>
                    </div>
                ))}
            </dl>
            {detail?.trait && (
                <p className="mt-3 text-[15px] leading-snug">
                    <Label as="span" className="mr-2 text-(--ink)/60">Trait</Label>
                    {detail.trait.split("**").map((part, i) => i % 2 ? <mark key={i} className="bg-primary/60 px-0.5 text-(--ink)">{part}</mark> : part)}
                </p>
            )}
        </motion.header>
    )
}
