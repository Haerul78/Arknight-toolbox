import { useParams, Link, useSearchParams } from "react-router-dom"
import { useEffect, useState } from "react"
import operators from "@/data/operators.json"
import { Band, Label, SwissPage } from "@/components/swiss"
import DossierView from "@/components/detail/variants/DossierView"
import BalancedView from "@/components/detail/variants/BalancedView"
import ImpressionView from "@/components/detail/variants/ImpressionView"
import VariantSwitch, { type DetailVariant } from "@/components/detail/variants/VariantSwitch"
import type { OperatorDetail } from "@/types/Operator"

// Balanced (B) is the chosen layout and the default. ?v=a (dossier) and ?v=c (impression
// first) stay reachable until they are removed. Same data, components and logic in all three.
const VIEWS = { a: DossierView, b: BalancedView, c: ImpressionView } satisfies Record<DetailVariant, unknown>

export default function OperatorDetailPage() {
    const { id } = useParams()
    const [params] = useSearchParams()
    const v = (["a", "b", "c"].includes(params.get("v") ?? "") ? params.get("v") : "b") as DetailVariant
    const operator = operators.find((op) => op.id === id)
    const [detail, setDetail] = useState<OperatorDetail | null>(null)

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

    const View = VIEWS[v]
    return (
        <SwissPage>
            <View operator={operator} detail={detail} />
            <VariantSwitch current={v} />
        </SwissPage>
    )
}
