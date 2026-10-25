import { cn } from "@/lib/utils"

type ClassOperatorProps = {
    profession: string
    subProfessionId: string
    className?: string
    // overrides the icon size/color, e.g. light icons on a dark panel
    iconClassName?: string
}

// Tailwind only generates classes it finds as complete literal strings, so a mask
// URL built from a variable has to be set via inline style.
function MaskIcon({ src, label, className }: { src: string; label: string; className?: string }) {
    const mask = `url(${src})`
    return (
        <div
            role="img"
            aria-label={label}
            className={cn(" w-16 mb-3 bg-foreground", className)}
            style={{
                maskImage: mask,
                WebkitMaskImage: mask,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
            }}
        />
    )
}

export default function ClassOperator({ profession, subProfessionId, className, iconClassName }: ClassOperatorProps) {
    return (
        <div className={className}>
            <MaskIcon src={`/classes/${profession}.png`} label={profession} className={iconClassName} />
            <MaskIcon src={`/subclass/${subProfessionId}.png`} label={subProfessionId} className={iconClassName} />
        </div>
    )
}
