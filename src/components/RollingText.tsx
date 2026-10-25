import { motion } from "framer-motion";

type Props = {
    children: string
    className?: string
    stagger?: number
    duration?: number
}

export default function RollingText({
    children,
    className = "",
    stagger = 0.025,
    duration = 0.2,
}: Props) {
    const letters = children.split("")

    return (
        <motion.span
            initial="initial"
            whileHover="hovered"
            aria-label={children}
            className={`relative inline-block overflow-hidden whitespace-nowrap cursor-default ${className}`}
        >
            <span className="block" aria-hidden>
                {letters.map((letter, index) => (
                    <motion.span
                        key={index}
                        className="inline-block"
                        variants = {{ initial: { y: 0 },  hovered: { y: "-100%"} }}
                        transition={{ duration, ease: "easeInOut", delay: index * stagger }}
                    >
                        {letter === " " ? "\u00A0" : letter}
                    </motion.span>
                ))}
            </span>

            <span className="absolute inset-0 block" aria-hidden>
                {letters.map((letter, index) => (
                    <motion.span
                        key={index}
                        className="inline-block"
                        variants = {{ initial: { y: "100%" },  hovered: { y: 0} }}
                        transition={{ duration, ease: "easeInOut", delay: index * stagger }}
                    >
                        {letter === " " ? "\u00A0" : letter}
                    </motion.span>
                ))}
            </span>
        </motion.span>
    )
}

