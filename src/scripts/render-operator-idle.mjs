import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import puppeteer from "puppeteer-core"
import sharp from "sharp"

const run = promisify(execFile)

// Render animasi idle battle (spine "front") semua operator jadi GIF dan/atau WebP animasi.
// Butuh: Chrome/Edge terpasang + ffmpeg di PATH (untuk GIF).
// Pakai: node src/scripts/render-operator-idle.mjs [char_id ...] [--format=gif,webp] [--force]
const SPINE_BASE = "https://raw.githubusercontent.com/PuppiizSunniiz/Arknights-Spines/main/spineassets/character"
const SPINE_RUNTIME = "https://cdn.jsdelivr.net/gh/EsotericSoftware/spine-runtimes@3.8/spine-ts/build/spine-webgl.js"
const FPS = 30
const SCALE = 0.6
const PADDING = 4
const CONCURRENCY = 4
const BROWSERS = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean)

const __dirname = dirname(fileURLToPath(import.meta.url))
const operatorsPath = resolve(__dirname, "../data/operators.json")
const framesRoot = resolve(tmpdir(), "arknight-toolbox-idle")

// encoder per format, input = daftar file frame PNG berurutan
const FORMATS = {
    // palette per animasi + 1 slot transparan (alpha GIF cuma on/off)
    gif: {
        dir: resolve(__dirname, "../../public/operators-idle"),
        encode: (framesDir, files, out) =>
            // async supaya encode lama tidak memblokir halaman lain (CDP timeout)
            run("ffmpeg", [
                "-v", "error", "-y",
                "-framerate", String(FPS),
                "-i", resolve(framesDir, "%04d.png"),
                "-lavfi", "split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=full[p];[b][p]paletteuse=dither=none:alpha_threshold=128",
                "-gifflags", "-offsetting",
                "-loop", "0",
                out,
            ]),
    },
    // lossy + alpha 8-bit (tepi halus); alpha ikut lossy karena alpha lossless yang bikin file besar
    webp: {
        dir: resolve(__dirname, "../../public/operators-idle-webp"),
        encode: (framesDir, files, out) =>
            sharp(files, { join: { animated: true } })
                .webp({
                    quality: 80,
                    alphaQuality: 60,
                    effort: 4,
                    loop: 0,
                    // delay dibulatkan kumulatif supaya total durasi tetap tepat
                    delay: files.map((_, i) => Math.round(((i + 1) * 1000) / FPS) - Math.round((i * 1000) / FPS)),
                })
                .toFile(out),
    },
}

const args = process.argv.slice(2)
const force = args.includes("--force")
const formatArg = args.find((a) => a.startsWith("--format="))
const formats = formatArg ? formatArg.slice("--format=".length).split(",") : Object.keys(FORMATS)
const unknown = formats.filter((f) => !FORMATS[f])
if (unknown.length) throw new Error(`Format tidak dikenal: ${unknown.join(", ")}`)
const onlyIds = args.filter((a) => !a.startsWith("--"))

const operators = JSON.parse(readFileSync(operatorsPath, "utf-8"))
    .filter((op) => !onlyIds.length || onlyIds.includes(op.id))

// dijalankan di dalam halaman browser: render idle loop, crop ke area yang terisi, kembalikan PNG per frame
async function renderInPage({ base, id, fps, scale, padding }) {
    const W = 1024
    const H = 1024
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = new spine.webgl.ManagedWebGLRenderingContext(canvas, {
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
    })
    const gl = ctx.gl
    const renderer = new spine.webgl.SceneRenderer(canvas, ctx)
    const assets = new spine.webgl.AssetManager(ctx, `${base}/${id}/front/`)
    assets.loadBinary(`${id}.skel`)
    assets.loadTextureAtlas(`${id}.atlas`)
    while (!assets.isLoadingComplete()) await new Promise((r) => setTimeout(r, 50))
    if (assets.hasErrors()) throw new Error(JSON.stringify(assets.getErrors()))

    const binary = new spine.SkeletonBinary(new spine.AtlasAttachmentLoader(assets.get(`${id}.atlas`)))
    binary.scale = scale
    const data = binary.readSkeletonData(assets.get(`${id}.skel`))
    const names = data.animations.map((a) => a.name)
    const anim = names.find((n) => n === "Idle") ?? names.find((n) => /idle/i.test(n)) ?? names[0]
    const frameCount = Math.max(1, Math.round(data.findAnimation(anim).duration * fps))

    const skeleton = new spine.Skeleton(data)
    const state = new spine.AnimationState(new spine.AnimationStateData(data))

    // posisi kaki di (0,0); kamera di tengah bounds setup pose
    skeleton.setToSetupPose()
    state.setAnimation(0, anim, true)
    state.apply(skeleton)
    skeleton.updateWorldTransform()
    const offset = new spine.Vector2()
    const size = new spine.Vector2()
    skeleton.getBounds(offset, size, [])
    renderer.camera.position.x = offset.x + size.x / 2
    renderer.camera.position.y = offset.y + size.y / 2
    renderer.camera.viewportWidth = W
    renderer.camera.viewportHeight = H

    const drawFrame = (i) => {
        skeleton.setToSetupPose()
        state.clearTracks()
        state.setAnimation(0, anim, true).trackTime = i / fps
        state.apply(skeleton)
        skeleton.updateWorldTransform()
        gl.viewport(0, 0, W, H)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        renderer.begin()
        renderer.drawSkeleton(skeleton, false)
        renderer.end()
    }

    // pass 1: cari bounding box piksel yang terlihat di semua frame
    const pixels = new Uint8Array(W * H * 4)
    let minX = W, minY = H, maxX = -1, maxY = -1
    for (let i = 0; i < frameCount; i++) {
        drawFrame(i)
        gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
        for (let y = 0; y < H; y++) {
            const row = y * W * 4
            for (let x = 0; x < W; x++) {
                if (pixels[row + x * 4 + 3] > 8) {
                    if (x < minX) minX = x
                    if (x > maxX) maxX = x
                    if (y < minY) minY = y
                    if (y > maxY) maxY = y
                }
            }
        }
    }
    if (maxX < 0) throw new Error("empty render")
    const touchesEdge = minX === 0 || minY === 0 || maxX === W - 1 || maxY === H - 1

    // readPixels mulai dari bawah, canvas 2D dari atas
    const cx = Math.max(0, minX - padding)
    const cy = Math.max(0, H - 1 - maxY - padding)
    const cw = Math.min(W, maxX + padding + 1) - cx
    const ch = Math.min(H, H - minY + padding) - cy

    // pass 2: render ulang dan potong
    const crop = document.createElement("canvas")
    crop.width = cw
    crop.height = ch
    const c2d = crop.getContext("2d")
    const frames = []
    for (let i = 0; i < frameCount; i++) {
        drawFrame(i)
        c2d.clearRect(0, 0, cw, ch)
        c2d.drawImage(canvas, cx, cy, cw, ch, 0, 0, cw, ch)
        frames.push(crop.toDataURL("image/png").split(",")[1])
    }
    return { anim, width: cw, height: ch, frames, touchesEdge }
}

const executablePath = BROWSERS.find((p) => existsSync(p))
if (!executablePath) throw new Error("Chrome/Edge tidak ditemukan, set CHROME_PATH")

for (const f of formats) mkdirSync(FORMATS[f].dir, { recursive: true })
const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
})

let done = 0
let skipped = 0
const failed = []
const warnings = []

const renderOne = async (page, op) => {
    // render hanya format yang file-nya belum ada
    const todo = formats.filter((f) => force || !existsSync(resolve(FORMATS[f].dir, `${op.id}.${f}`)))
    if (!todo.length) {
        skipped++
        return
    }
    const result = await page.evaluate(renderInPage, {
        base: SPINE_BASE,
        id: op.id,
        fps: FPS,
        scale: SCALE,
        padding: PADDING,
    })
    if (result.touchesEdge) warnings.push(`${op.id}: render menyentuh tepi canvas, mungkin terpotong`)

    const framesDir = resolve(framesRoot, op.id)
    rmSync(framesDir, { recursive: true, force: true })
    mkdirSync(framesDir, { recursive: true })
    const files = result.frames.map((b64, i) => {
        const file = resolve(framesDir, `${String(i).padStart(4, "0")}.png`)
        writeFileSync(file, Buffer.from(b64, "base64"))
        return file
    })
    for (const f of todo) await FORMATS[f].encode(framesDir, files, resolve(FORMATS[f].dir, `${op.id}.${f}`))
    rmSync(framesDir, { recursive: true, force: true })
    done++
    console.log(`  [${done + skipped + failed.length}/${operators.length}] ${op.id} ${todo.join("+")} (${result.anim}, ${result.width}x${result.height}, ${result.frames.length}f)`)
}

const queue = [...operators]
await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
        const page = await browser.newPage()
        await page.addScriptTag({ url: SPINE_RUNTIME })
        while (queue.length) {
            const op = queue.shift()
            try {
                await renderOne(page, op)
            } catch (err) {
                failed.push(`${op.id} (${op.name}): ${err.message.split("\n")[0]}`)
            }
        }
        await page.close()
    })
)
await browser.close()
rmSync(framesRoot, { recursive: true, force: true })

console.log(`Rendered ${done}, skipped ${skipped}, failed ${failed.length} -> ${formats.map((f) => FORMATS[f].dir).join(", ")}`)
if (failed.length) console.log(failed.join("\n"))
if (warnings.length) console.log(warnings.join("\n"))
