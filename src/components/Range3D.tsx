import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Edges } from "@react-three/drei"
import { PerspectiveCamera, Vector3 } from "three"

type Cell = { row: number; col: number }

// idle sprites are cropped to their pixels at ~0.6 spine scale; this maps that to tile units
const PX_PER_TILE = 180
const FOOT = new Vector3(0, 0.2, 0)
const projected = new Vector3()

// An animated WebP only plays as a DOM <img>, not as a WebGL texture, so the sprite is an
// overlay that follows the origin cell (row 0, col 0 = where the operator stands) each frame.
function SpriteAnchor({ onMove }: { onMove: (x: number, y: number, scale: number, flip: boolean) => void }) {
    useFrame(({ camera, size }) => {
        const cam = camera as PerspectiveCamera
        const dist = cam.position.distanceTo(FOOT)
        const pxPerUnit = size.height / 2 / (Math.tan((cam.fov * Math.PI) / 360) * dist)
        const scale = pxPerUnit / PX_PER_TILE
        projected.copy(FOOT).project(cam)
        const x = ((projected.x + 1) / 2) * size.width
        const y = ((1 - projected.y) / 2) * size.height
        // the sprite faces +x (toward the range); once +x points left on screen, mirror it
        const facingLeft = cam.matrixWorld.elements[0] < 0
        onMove(x, y, scale, facingLeft)
    })
    return null
}

export default function Range3D({ cells, operatorId }: { cells: Cell[]; operatorId?: string }) {
    const sprite = useRef<HTMLImageElement>(null)

    const moveSprite = (x: number, y: number, scale: number, flip: boolean) => {
        const img = sprite.current
        if (!img || !img.naturalWidth) return
        // pivot = bottom center of the sprite
        img.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${flip ? -scale : scale}, ${scale})`
        img.style.visibility = "visible"
    }

    return (
        <div className="relative overflow-hidden rounded-b-md h-64 w-full touch-none bg-[#eeeeee] inset-shadow-sm inset-shadow-black/30">
            <Canvas camera={{ position: [4, 5, 6], fov: 40 }} frameloop="demand">
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} />

                {operatorId && <SpriteAnchor onMove={moveSprite} />}

                {cells.map((cell, index) => (
                    <mesh key={index} position={[cell.col, 0.1, cell.row]}>
                        <boxGeometry args={[0.9, 0.2, 0.9]} />
                        <meshStandardMaterial color="#38bdf8" transparent opacity={0.15} />
                        <Edges color="#fffbf5" />
                    </mesh>
                ))}

                {/* <gridHelper args={[5, 5, '#dbdbdb', '#dbdbdb']} /> */}
                <OrbitControls
                    autoRotate
                    autoRotateSpeed={2}
                    enablePan
                    enableZoom
                    enableDamping={false}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 3}
                    target={[0, 0.25, 0]}
                />
            </Canvas>
            {operatorId && (
                <img
                    ref={sprite}
                    key={operatorId}
                    src={`/operators-idle-webp/${operatorId}.webp`}
                    alt=""
                    draggable={false}
                    style={{ visibility: "hidden", transformOrigin: "50% 100%" }}
                    className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
                />
            )}
        </div>
    )
}
