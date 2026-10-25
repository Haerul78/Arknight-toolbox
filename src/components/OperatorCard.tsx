import type { Operator } from '../types/Operator'
import RarityStars from './RarityStars'
import GameIcon from './GameIcon'
import { rarityColor } from '@/lib/rarity'
import { professionLabel } from '@/lib/profession'
import { chamfer } from '@/lib/chamfer'
import { artUrl } from '@/lib/art'

type OperatorCardProps = {
    operator: Operator
}

// top-right corner cut, like the panels in the in-game operator menu.
// The outline is a second, 1px-inset copy of the same shape so the hairline follows the cut.
const outer = chamfer(['tr'])
const inner = chamfer(['tr'], 18, 1)

// selection brackets that appear on hover; the cut corner gets none
const brackets = [
    'left-1.5 top-1.5 border-l border-t',
    'right-1.5 bottom-1.5 border-r border-b',
    'left-1.5 bottom-1.5 border-l border-b',
]

export default function OperatorCard({ operator }: OperatorCardProps) {
    const color = rarityColor[operator.rarity]
    const mask = `url(/classes/${operator.profession}.png)`

    return (
        <div className="group relative bg-border p-px transition-colors duration-200 hover:bg-primary" style={{ clipPath: outer }}>
            <div className="relative bg-card" style={{ clipPath: inner }}>
                {/* rarity edge */}
                <span className="absolute inset-y-0 left-0 z-10 w-0.75" style={{ background: color }} />

                {/* portrait */}
                <div className="relative aspect-square overflow-hidden bg-secondary">
                    <GameIcon
                        src={`/avatars/${operator.id}.png`}
                        alt={operator.name}
                        className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-105"
                        // a few operators have no avatar file: crop the face out of the full-body art instead
                        fallback={
                            <GameIcon
                                src={artUrl(`${operator.id}_1`, 640)}
                                alt={operator.name}
                                className="h-full w-full origin-[50%_6%] scale-[2.8] object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[2.9]"
                            />
                        }
                    />
                    {/* fade the portrait into the plate so the stars stay legible */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-card to-transparent" />

                    {/* class badge */}
                    <div className="absolute left-2.5 top-2 flex h-7 w-7 items-center justify-center bg-card/85 ring-1 ring-card-foreground/15">
                        <span
                            aria-hidden
                            className="block h-5 w-5 bg-card-foreground"
                            style={{ maskImage: mask, WebkitMaskImage: mask, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }}
                        />
                    </div>

                    {/* position, set vertically along the right edge */}
                    <span className="absolute bottom-3 right-1.5 font-barlow text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-card-foreground/60 [writing-mode:vertical-rl]">
                        {operator.position}
                    </span>

                    <div className="absolute bottom-1 left-2.5">
                        <RarityStars rarity={operator.rarity} size="xs" />
                    </div>
                </div>

                {/* name plate */}
                <div className="relative px-2.5 pb-2.5 pt-2">
                    <span className="absolute left-2.5 right-0 top-0 h-px bg-primary/70" />
                    <span className="absolute left-2.5 top-0 h-0.5 w-6 bg-primary" />
                    <p className="truncate font-barlow text-lg font-bold leading-tight text-card-foreground">{operator.name}</p>
                    <p className="font-barlow text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                        {professionLabel[operator.profession] ?? operator.profession}
                    </p>
                </div>

                {brackets.map((pos) => (
                    <span
                        key={pos}
                        aria-hidden
                        className={`pointer-events-none absolute z-20 h-3 w-3 border-primary opacity-0 motion-safe:transition-all motion-safe:duration-200 group-hover:opacity-100 ${pos}`}
                    />
                ))}
            </div>
        </div>
    )
}
