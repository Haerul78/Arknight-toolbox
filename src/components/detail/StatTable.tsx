import type { OperatorDetail } from "@/types/Operator"
import { STAT_COLUMNS, formatStat as fmt, statsAt } from "@/lib/operatorDetail"
import { Label } from "@/components/swiss"

type StatTableProps = {
    detail: OperatorDetail
    phase: number
    level: number
    onPhase: (i: number) => void
    onLevel: (level: number) => void
    // phones: stats as rows and elites as columns, because 8 stat columns don't fit 4 cells
    transposed: boolean
}

// Max-level stats of every elite the operator actually has (1–2★ stop at E0, 3★ at E1),
// plus a "Pick" row for any elite/level. No rows for elites that don't exist.
export default function StatTable({ detail, phase, level, onPhase, onLevel, transposed }: StatTableProps) {
    const phases = detail.phases
    const current = phases[phase]
    const picked = statsAt(current, level)
    const last = phases.length - 1
    const trust = (["hp", "atk", "def", "res"] as const).filter((k) => detail.trust[k])

    const controls = (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Label as="span">Pick</Label>
            {phases.length > 1 && (
                <span role="radiogroup" aria-label="Elite" className="flex">
                    {phases.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            role="radio"
                            aria-checked={phase === i}
                            onClick={() => { onPhase(i); onLevel(phases[i].maxLevel) }}
                            className={`swiss-label px-2 py-1 focus-visible:outline-2 focus-visible:outline-(--ink) ${phase === i ? "bg-primary" : "can-hover:hover:bg-(--ink)/5"}`}
                        >
                            E{i}
                        </button>
                    ))}
                </span>
            )}
            <label className="flex min-w-[10rem] flex-1 items-center gap-2">
                <span className="sr-only">Level</span>
                <input
                    type="range"
                    min={1}
                    max={current.maxLevel}
                    value={level}
                    onChange={(e) => onLevel(Number(e.target.value))}
                    className="h-1 min-w-0 flex-1 cursor-pointer accent-(--ink)"
                />
                <span className="w-14 text-right font-mono text-[13px] tabular-nums">Lv {level}</span>
            </label>
            {trust.length > 0 && (
                <Label as="span" className="text-(--ink)/60">(Max trust {trust.map((k) => `${k.toUpperCase()} +${detail.trust[k]}`).join(", ")})</Label>
            )}
        </div>
    )

    const headBase = "h-7 px-1.5 align-bottom font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-(--ink)/60"
    const cellBase = "h-7 border-t border-(--ink)/15 px-1.5"
    // alignment lives in separate classes: putting text-left and text-right on one element
    // lets whichever Tailwind emits last win
    const head = `${headBase} text-right`
    const cell = `${cellBase} text-right`
    const pickCell = "bg-primary/35"

    if (transposed) {
        return (
            <div>
                <table className="w-full font-mono text-[13px] tabular-nums">
                    <thead>
                        <tr>
                            <th className={`${headBase} text-left`}>Stat</th>
                            {phases.map((p, i) => <th key={i} className={head}>E{i} {p.maxLevel}</th>)}
                            <th className={`${head} ${pickCell}`}>Pick E{phase} {level}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {STAT_COLUMNS.map((c) => (
                            <tr key={c.key}>
                                <th scope="row" className={`${cellBase} text-left font-normal`}>{c.label}</th>
                                {phases.map((p, i) => (
                                    <td key={i} className={`${cell} ${i === last ? "font-semibold" : ""}`}>{fmt(p.max[c.key], c.decimals)}</td>
                                ))}
                                <td className={`${cell} ${pickCell}`}>{fmt(picked[c.key], c.decimals)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {controls}
            </div>
        )
    }

    return (
        <div>
            <table className="w-full font-mono text-[13px] tabular-nums">
                <thead>
                    <tr>
                        <th className={`${headBase} text-left`}>Elite</th>
                        <th className={head}>Lv</th>
                        {STAT_COLUMNS.map((c) => <th key={c.key} className={head}>{c.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {phases.map((p, i) => (
                        <tr key={i} className={i === last ? "font-semibold" : ""}>
                            <th scope="row" className={`${cellBase} text-left font-[inherit]`}>E{i}</th>
                            <td className={cell}>{p.maxLevel}</td>
                            {STAT_COLUMNS.map((c) => <td key={c.key} className={cell}>{fmt(p.max[c.key], c.decimals)}</td>)}
                        </tr>
                    ))}
                    <tr className={pickCell}>
                        <th scope="row" className={`${cellBase} text-left font-normal`}>Pick E{phase}</th>
                        <td className={cell}>{level}</td>
                        {STAT_COLUMNS.map((c) => <td key={c.key} className={cell}>{fmt(picked[c.key], c.decimals)}</td>)}
                    </tr>
                </tbody>
            </table>
            {controls}
        </div>
    )
}
