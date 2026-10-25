import type { ReactNode } from "react"
import { chamfer } from "@/lib/chamfer"

const outer = chamfer(["tr"], 14)
const inner = chamfer(["tr"], 14, 1)

type ProfilePanelProps = {
    label: string
    // right side of the header row: toggles, counters
    aside?: ReactNode
    className?: string
    children: ReactNode
}

// Light panel on the paper background: hairline outline that follows the cut corner,
// a wide-tracked label and a short amber tick, like the boxed groups on the in-game file screen.
export default function ProfilePanel({ label, aside, className = "", children }: ProfilePanelProps) {
    return (
        <section className={`bg-foreground/15 p-px ${className}`} style={{ clipPath: outer }}>
            <div className="h-full bg-background" style={{ clipPath: inner }}>
                <header className="flex min-h-11 items-center gap-3 border-b border-foreground/10 px-4">
                    <span className="h-3 w-0.5 bg-primary" />
                    <h2 className="font-barlow text-xs font-semibold uppercase tracking-[0.35em] text-foreground/80">{label}</h2>
                    {aside && <div className="ml-auto">{aside}</div>}
                </header>
                <div className="p-4">{children}</div>
            </div>
        </section>
    )
}

// wide-tracked micro label used inside panels
export function MicroLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <span className={`font-barlow text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground ${className}`}>
            {children}
        </span>
    )
}

// two-state segmented switch (elite tabs, skill level)
export function Segmented<T extends string | number>({
    options,
    value,
    onChange,
    label,
}: {
    options: { value: T; label: string }[]
    value: T
    onChange: (v: T) => void
    label: string
}) {
    return (
        <div role="radiogroup" aria-label={label} className="flex border border-foreground/20">
            {options.map((o) => {
                const active = o.value === value
                return (
                    <button
                        key={String(o.value)}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(o.value)}
                        className={`px-3 py-1 font-barlow text-xs font-semibold uppercase tracking-[0.2em] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
                            active ? "bg-card text-card-foreground shadow-[inset_0_-2px_0_var(--primary)]" : "text-foreground/60 hover:text-foreground"
                        }`}
                    >
                        {o.label}
                    </button>
                )
            })}
        </div>
    )
}
