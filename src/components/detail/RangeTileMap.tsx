import ranges from "@/data/ranges.json"

type Cell = { row: number; col: number }
const rangeTable = ranges as Record<string, Cell[]>

// The attack range as map tiles, each half a cell (--u) or smaller when the range is wider
// than the box (container query width). The operator's own tile is outlined and its idle
// sprite stands on it.
export default function RangeTileMap({ operatorId, rangeId }: { operatorId: string; rangeId: string | null }) {
    const cells = (rangeId && rangeTable[rangeId]) || []
    if (cells.length === 0) return null
    const rows = [0, ...cells.map((c) => c.row)]
    const cols = [0, ...cells.map((c) => c.col)]
    const minRow = Math.min(...rows)
    const minCol = Math.min(...cols)
    const w = Math.max(...cols) - minCol + 1
    const h = Math.max(...rows) - minRow + 1

    return (
        // the sprite is taller than its tile; the top padding keeps its head off the block title
        <div className="@container w-full pt-[calc(var(--u)*0.6)]">
            <div
                role="img"
                aria-label={`Attack range ${rangeId}`}
                className="grid"
                style={{
                    ["--t" as string]: `min(var(--u), calc(100cqw / ${w}))`,
                    gridTemplateColumns: `repeat(${w}, var(--t))`,
                    gridTemplateRows: `repeat(${h}, var(--t))`,
                }}
            >
                {cells.filter((c) => c.row !== 0 || c.col !== 0).map((c) => (
                    // inset a little so neighbouring tiles read as separate tiles, as on a stage map
                    <span key={`${c.row},${c.col}`} className="m-[2px] bg-primary" style={{ gridRow: c.row - minRow + 1, gridColumn: c.col - minCol + 1 }} />
                ))}
                <span className="relative z-10 m-[2px] border border-(--ink)" style={{ gridRow: 1 - minRow, gridColumn: 1 - minCol }}>
                    <img
                        src={`/operators-idle-webp/${operatorId}.webp`}
                        alt=""
                        loading="lazy"
                        className="pointer-events-none absolute bottom-[6%] left-1/2 h-[150%] max-w-none -translate-x-1/2 object-contain object-bottom"
                    />
                </span>
            </div>
        </div>
    )
}
