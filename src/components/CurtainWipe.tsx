import { motion } from "framer-motion";

const ease = [0.76, 0, 0.24, 1] as const
const duration = 0.6

const variants = {
    // halaman baru muncul dalam keadaan tertutup
    initial: { scaleX: 1, originX: 1 },
    // buka: menyusut ke kanan
    animate: { scaleX: 0, originX: 1, transition: { duration, ease } },
    // tutup: tumbuh dari kiri (origin pindah instan saat scaleX masih 0)
    exit: {
        scaleX: 1,
        originX: 0,
        transition: { duration, ease, originX: { duration: 0 } },
    },
}

export default function CurtainWipe({ className = "bg-yellow-500" }) {
    return (
        <motion.div
            variants={variants}
            className={`pointer-events-none fixed inset-x-0 top-(--navbar-h) bottom-0 z-40 ${className}`}
        />
    )
}
