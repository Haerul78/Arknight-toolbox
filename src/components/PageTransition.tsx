import { AnimatePresence, motion } from "framer-motion"
import { useLocation, useOutlet } from "react-router-dom"
import CurtainWipe from "@/components/CurtainWipe"

export default function PageTransition() {
    const { pathname } = useLocation()
    const outlet = useOutlet()

    return (
        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
            <motion.div key={pathname} initial="initial" animate="animate" exit="exit">
                {outlet}
                <CurtainWipe />
            </motion.div>
        </AnimatePresence>
    )
}