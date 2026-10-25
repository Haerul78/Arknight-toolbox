import { motion } from "framer-motion"
import RollingText from "@/components/RollingText"

type PageHeaderProps = {
    kicker: string
    title: string
    count?: number
}

// Shared heading for list pages: small mono-style kicker, Michroma title, amber rule.
export default function PageHeader({ kicker, title, count }: PageHeaderProps) {
    return (
        <motion.header
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
        >
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
                <span className="h-2 w-2 rotate-45 bg-primary" />
                {kicker}
            </p>
            <div className="flex items-end gap-4">
                <h1 className="font-heading text-4xl text-foreground md:text-5xl">
                    <RollingText>{title}</RollingText>
                </h1>
                {count !== undefined && (
                    <span className="mb-1 font-barlow text-lg font-semibold tracking-wider text-muted-foreground">
                        {String(count).padStart(3, "0")}
                    </span>
                )}
            </div>
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.76, 0, 0.24, 1] }}
                className="mt-4 h-1 w-full origin-left bg-[repeating-linear-gradient(-45deg,var(--primary)_0_10px,transparent_10px_16px)]"
            />
        </motion.header>
    )
}
