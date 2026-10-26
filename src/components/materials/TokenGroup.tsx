import { useState } from "react"
import { Link } from "react-router-dom"
import { Label } from "@/components/swiss"
import MaterialIcon from "./MaterialIcon"
import { tokens, type MaterialFilter } from "./useMaterialFilter"
import type { Material } from "@/types/Material"

const KINDS: { label: string; test: (m: Material) => boolean }[] = [
    { label: "Potential tokens", test: (m) => m.id.startsWith("p_char_") },
    { label: "Kernel tokens", test: (m) => m.id.startsWith("class_p_char_") },
    { label: "Personal letters", test: (m) => m.id.startsWith("voucher_full_") },
]

// Items that belong to a single operator: closed by default (they are 597 of the 736
// items), opened by the toggle, or by a search that finds some of them.
export default function TokenGroup({ filter }: { filter: MaterialFilter }) {
    const [open, setOpen] = useState(false)
    const searching = Boolean(filter.search.trim()) || filter.category === "operatorToken"
    const shown = searching ? filter.tokenMatches : tokens
    const expanded = open || (searching && shown.length > 0)
    if (filter.category && filter.category !== "operatorToken") return null
    if (searching && shown.length === 0) return null

    return (
        <section aria-labelledby="tokens-title" className="mx-(--m)">
            <div className="swiss-rule-t flex h-(--cell) items-end justify-between gap-3 pb-2">
                <div className="flex items-end gap-3">
                    <Label as="h2" id="tokens-title">(Operator tokens and letters)</Label>
                    <Label as="span" className="text-(--ink)/50">{shown.length}</Label>
                </div>
                {!searching && (
                    <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls="tokens-list"
                        onClick={() => setOpen(!open)}
                        className={`swiss-label px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-(--ink) ${open ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
                    >
                        {open ? "Hide" : `Show all ${tokens.length}`}
                    </button>
                )}
            </div>
            {!expanded ? (
                <p className="max-w-prose pb-4 text-[15px] leading-snug text-(--ink)/70">
                    Each of these raises the potential of one operator. Search an operator's name to find theirs.
                </p>
            ) : (
                <div id="tokens-list">
                    {KINDS.map((k) => {
                        const items = shown.filter(k.test)
                        if (items.length === 0) return null
                        return (
                            <div key={k.label}>
                                <Label as="h3" className="flex h-[calc(var(--cell)/2)] items-end pb-1 text-(--ink)/60">{k.label} {items.length}</Label>
                                <ul className="grid grid-cols-[repeat(calc(var(--cols)*2),calc(var(--cell)/2))]">
                                    {items.map((m) => (
                                        <li key={m.id}>
                                            <Link
                                                to={`/materials/${m.id}`}
                                                title={m.name}
                                                aria-label={m.name}
                                                className="flex h-[calc(var(--cell)/2)] w-[calc(var(--cell)/2)] items-center justify-center p-[12%] can-hover:hover:bg-(--ink)/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--ink)"
                                            >
                                                <MaterialIcon material={m} />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
