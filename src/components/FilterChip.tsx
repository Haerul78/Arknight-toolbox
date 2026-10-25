import type { ReactNode } from "react"

type FilterChipProps = {
    active: boolean
    onClick: () => void
    label: string
    children: ReactNode
}

export default function FilterChip({ active, onClick, label, children }: FilterChipProps) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={active}
            onClick={onClick}
            className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border px-2 transition-all duration-200 active:scale-95 ${
                active
                    ? "border-card bg-card text-card-foreground shadow-[inset_0_-2px_0_var(--primary)]"
                    : "border-foreground/15 text-foreground/70 hover:border-foreground/40 hover:text-foreground"
            }`}
        >
            {children}
        </button>
    )
}
