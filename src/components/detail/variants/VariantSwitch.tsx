import { Link, useLocation } from "react-router-dom"

export type DetailVariant = "a" | "b" | "c"

const VARIANTS: { id: DetailVariant; label: string }[] = [
    { id: "a", label: "Dossier" },
    { id: "b", label: "Balanced" },
    { id: "c", label: "Impression" },
]

// Temporary: switches between the three detail layouts (?v=a|b|c) while one is chosen.
// Remove together with the unused variants.
export default function VariantSwitch({ current }: { current: DetailVariant }) {
    const { pathname } = useLocation()
    return (
        <nav
            aria-label="Compare layouts"
            className="fixed bottom-20 left-4 z-40 flex items-center gap-1 bg-(--ink) p-1 text-background shadow-lg md:bottom-4"
        >
            <span className="swiss-label px-2 text-background/60">Layout</span>
            {VARIANTS.map((v) => (
                <Link
                    key={v.id}
                    to={`${pathname}?v=${v.id}`}
                    replace
                    aria-current={v.id === current ? "page" : undefined}
                    className={`swiss-label px-2 py-1 focus-visible:outline-2 focus-visible:outline-primary ${v.id === current ? "bg-primary text-(--ink)" : "hover:bg-background/10"}`}
                >
                    {v.id.toUpperCase()} {v.label}
                </Link>
            ))}
        </nav>
    )
}
