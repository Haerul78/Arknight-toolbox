import type { Operator, OperatorDetail } from "@/types/Operator"
import OperatorInfo from "@/components/OperatorInfo"
import { Label } from "@/components/swiss"
import { DetailGallery, Identity } from "@/components/detail/OperatorHeader"

// Variant A (?v=a): the dense dossier, kept for comparison. Art on the left 5 columns
// (sticky while the right side scrolls), everything else on the right 7.

const ART_SIZES = "(max-width: 767px) 100vw, 40vw"

export default function DossierView({ operator, detail }: { operator: Operator; detail: OperatorDetail | null }) {
    return (
        <div className="dossier mx-(--m) grid grid-cols-[repeat(var(--cols),var(--cell))]">
            <aside
                aria-label={`${operator.name} art`}
                className="col-span-full h-[calc(var(--cell)*4.5)] md:sticky md:top-(--navbar-h) md:col-span-5 md:h-[calc(100dvh-var(--navbar-h))] md:pr-6 [@media(max-height:699px)]:md:static [@media(max-height:699px)]:md:h-[calc(var(--cell)*5)]"
            >
                <DetailGallery operator={operator} detail={detail} sizes={ART_SIZES} />
            </aside>
            <div className="col-span-full min-w-0 md:col-span-7 md:col-start-6">
                <Identity operator={operator} detail={detail} />
                {detail ? <OperatorInfo key={operator.id} operator={operator} detail={detail} /> : <Label className="py-6">(Loading the file)</Label>}
            </div>
        </div>
    )
}
