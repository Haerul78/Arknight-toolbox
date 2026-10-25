import { Button } from "@/components/ui/button"
import { Link, NavLink } from "react-router-dom"
import { motion } from "framer-motion"
import RollingText from "@/components/RollingText"
import MiniPlayer from "@/components/music/MiniPlayer"

const links = [
    { to: "/", label: "Home" },
    { to: "/operators", label: "Operators" },
    { to: "/materials", label: "Materials" },
    { to: "/music", label: "Music" },
]

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 flex h-(--navbar-h) items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
            <Link to="/" className="group flex items-center gap-2.5">
                <span className="relative flex h-6 w-6 items-center justify-center">
                    <span className="absolute inset-0 rotate-45 border-2 border-foreground transition-transform duration-500 group-hover:rotate-225" />
                    <span className="h-2 w-2 rotate-45 bg-primary" />
                </span>
                <span className="hidden text-sm font-medium tracking-[0.2em] text-foreground sm:inline">RHODES ISLAND</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-6">
                <MiniPlayer variant="navbar" />
                {links.map(({ to, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === "/"}
                        className={({ isActive }) =>
                            // below 400px the logo is the way home, so the Home link makes room
                            `relative py-1 text-sm transition-colors ${to === "/" ? "max-[399px]:hidden" : ""} ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <RollingText className="cursor-pointer">{label}</RollingText>
                                {isActive && (
                                    <motion.span
                                        layoutId="nav-active"
                                        className="absolute inset-x-0 -bottom-[calc((var(--navbar-h)-1.75rem)/2)] h-0.5 bg-primary"
                                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
                <Button size="sm">Masuk</Button>
            </div>
        </nav>
    )
}
