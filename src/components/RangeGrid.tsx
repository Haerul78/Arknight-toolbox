import ranges from "@/data/ranges.json"

type Cell = { row: number; col: number }

type RangeGridProps = {
    rangeId: string | null
    cellSize?: number
    className?: string
}

const rangeTable = ranges as Record<string, Cell[]>

export default function RangeGrid({ rangeId, cellSize = 24, className = "" }: RangeGridProps) {
    const cells = rangeId ? rangeTable[rangeId] : undefined

    if (!cells || cells.length === 0) {
        return <p className="text-sm text-muted-foreground">No range data</p>
    }

    // operator selalu di (0,0), jadi ikut dihitung agar selalu masuk grid
    const rows = [0, ...cells.map((c) => c.row)]
    const cols = [0, ...cells.map((c) => c.col)]
    const minRow = Math.min(...rows)
    const minCol = Math.min(...cols)
    const rowCount = Math.max(...rows) - minRow + 1
    const colCount = Math.max(...cols) - minCol + 1

    const place = (row: number, col: number) => ({
        gridRow: row - minRow + 1,
        gridColumn: col - minCol + 1,
    })

    return (
        <div
            role="img"
            aria-label={`Attack range ${rangeId}`}
            className={`inline-grid gap-0.5 ${className} bg-white/20 backdrop-blur-md p-5 rounded-xl`}  
            style={{
                gridTemplateRows: `repeat(${rowCount}, ${cellSize}px)`,
                gridTemplateColumns: `repeat(${colCount}, ${cellSize}px)`,
            }}
        >
            {cells
                .filter((c) => !(c.row === 0 && c.col === 0))
                .map((c) => (
                    <div
                        key={`${c.row},${c.col}`}
                        className="rounded-sm bg-accent/70"
                        style={place(c.row, c.col)}
                    />
                ))}
            <div
                className="rounded-sm bg-primary"
                title="Operator"
                style={place(0, 0)}
            />
        </div>
    )
}
