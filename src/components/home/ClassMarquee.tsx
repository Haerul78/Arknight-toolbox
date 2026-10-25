import { professionLabel } from "@/lib/profession"
import { ClassGlyph, SectionHeader } from "@/components/swiss"

const PROFESSIONS = ["PIONEER", "WARRIOR", "TANK", "SNIPER", "CASTER", "MEDIC", "SUPPORT", "SPECIAL"]

// One cell tall. The list is rendered twice and slides by half its width, so the loop is
// seamless; with reduced motion it simply stands still.
export default function ClassMarquee() {
    const items = PROFESSIONS.map((p) => (
        <span key={p} className="flex shrink-0 items-center gap-[0.3em] pr-[0.45em]">
            {professionLabel[p]}
            <ClassGlyph profession={p} />
            <span className="font-light text-(--ink)/40">/</span>
        </span>
    ))

    return (
        <section aria-label="Operator classes">
            <SectionHeader index={3} caption="Classes" />
            <div className="swiss-band">
            <div className="swiss-rule-y col-span-full flex items-center overflow-hidden">
                <div className="flex w-max text-[calc(var(--cell)*0.5)] font-medium uppercase leading-none tracking-[-0.03em] motion-safe:animate-[marquee_45s_linear_infinite] md:text-[calc(var(--cell)*0.6)]">
                    <div className="flex">{items}</div>
                    <div className="flex" aria-hidden>{items}</div>
                </div>
            </div>
            </div>
        </section>
    )
}
