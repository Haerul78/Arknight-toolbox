import ranges from "@/data/ranges.json"

type Cell = { row: number; col: number }
const rangeTable = ranges as Record<string, Cell[]>

// An attack range drawn as tiny map tiles that fit any box (SVG, so it scales with the
// cell). The operator's own tile is outlined; covered tiles are filled with currentColor.
export default function RangeTiles({ rangeId, className = "" }: { rangeId: string | null; className?: string }) {
    const cells = (rangeId && rangeTable[rangeId]) || []
    if (cells.length === 0) return null

    const rows = [0, ...cells.map((c) => c.row)]
    const cols = [0, ...cells.map((c) => c.col)]
    const minRow = Math.min(...rows)
    const minCol = Math.min(...cols)
    const w = Math.max(...cols) - minCol + 1
    const h = Math.max(...rows) - minRow + 1

    return (
        <svg viewBox={`-0.1 -0.1 ${w + 0.2} ${h + 0.2}`} className={className} role="img" aria-label={`Attack range ${rangeId}`}>
            {cells
                .filter((c) => c.row !== 0 || c.col !== 0)
                .map((c) => (
                    <rect key={`${c.row},${c.col}`} x={c.col - minCol + 0.08} y={c.row - minRow + 0.08} width={0.84} height={0.84} fill="currentColor" />
                ))}
            <rect x={-minCol + 0.12} y={-minRow + 0.12} width={0.76} height={0.76} fill="none" stroke="currentColor" strokeWidth={0.12} />
        </svg>
    )
}
