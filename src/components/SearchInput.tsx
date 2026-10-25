import { Search, X } from "lucide-react"

type SearchInputProps = {
    value: string
    onChange: (value: string) => void
    placeholder: string
}

export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
    return (
        <div className="group relative w-full max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-secondary py-2 pl-9 pr-9 text-sm text-secondary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {value && (
                <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => onChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-secondary-foreground"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    )
}
