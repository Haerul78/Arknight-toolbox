import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react"
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion, type AnimationPlaybackControls } from "framer-motion"
import { maxPos, minPos, nearestTrack, songPos } from "./arcRows"

// vertical pixels that move the arc by one song
export const STEP_PX = 68

const clamp = (v: number) => Math.min(maxPos, Math.max(minPos, v))

// Scroll state for the arc list. `scroll` is a position on the row axis (a motion value, so
// moving it never re-renders); `focus` is the track index nearest the center and only changes
// when a different track arrives there.
export function useArcScroll(initialTrack: number) {
    const reduce = useReducedMotion()
    const scroll = useMotionValue(songPos[initialTrack] ?? minPos)
    const [focus, setFocus] = useState(initialTrack)
    const anim = useRef<AnimationPlaybackControls | null>(null)
    const snapTimer = useRef<number | undefined>(undefined)
    const drag = useRef<{ y: number; start: number; moved: boolean } | null>(null)
    // set after a drag so the pointerup doesn't also count as a click on a row
    const suppressClick = useRef(false)

    useMotionValueEvent(scroll, "change", (v) => {
        const i = nearestTrack(v)
        setFocus((f) => (f === i ? f : i))
    })

    const stop = () => anim.current?.stop()

    const scrollToTrack = useCallback((i: number) => {
        anim.current?.stop()
        const target = songPos[Math.max(0, Math.min(songPos.length - 1, i))]
        anim.current = animate(scroll, target, reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 })
    }, [scroll, reduce])

    const snap = useCallback(() => scrollToTrack(nearestTrack(scroll.get())), [scroll, scrollToTrack])

    // wheel needs a non-passive listener to stop the page from scrolling underneath
    const attachWheel = useCallback((el: HTMLElement | null) => {
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            anim.current?.stop()
            const delta = e.deltaMode === 1 ? e.deltaY / 3 : e.deltaY / 100
            scroll.set(clamp(scroll.get() + delta))
            window.clearTimeout(snapTimer.current)
            snapTimer.current = window.setTimeout(snap, 140)
        }
        el.addEventListener("wheel", onWheel, { passive: false })
        return () => el.removeEventListener("wheel", onWheel)
    }, [scroll, snap])

    useEffect(() => () => window.clearTimeout(snapTimer.current), [])

    const onPointerDown = (e: PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return
        stop()
        drag.current = { y: e.clientY, start: scroll.get(), moved: false }
    }
    const onPointerMove = (e: PointerEvent<HTMLElement>) => {
        const d = drag.current
        if (!d) return
        const dy = e.clientY - d.y
        if (!d.moved && Math.abs(dy) > 5) {
            d.moved = true
            e.currentTarget.setPointerCapture(e.pointerId)
        }
        if (d.moved) scroll.set(clamp(d.start - dy / STEP_PX))
    }
    const onPointerUp = () => {
        const d = drag.current
        drag.current = null
        if (!d?.moved) return
        suppressClick.current = true
        window.setTimeout(() => { suppressClick.current = false }, 0)
        if (reduce) return snap()
        // fling with momentum, landing exactly on a song
        anim.current = animate(scroll, scroll.get(), {
            type: "inertia",
            velocity: scroll.getVelocity(),
            power: 0.35,
            timeConstant: 220,
            min: minPos,
            max: maxPos,
            modifyTarget: (v) => songPos[nearestTrack(v)],
        })
    }

    const onKeyDown = (e: KeyboardEvent<HTMLElement>, onActivate: (i: number) => void) => {
        const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: 6, PageUp: -6 }
        if (e.key in moves) scrollToTrack(focus + moves[e.key])
        else if (e.key === "Home") scrollToTrack(0)
        else if (e.key === "End") scrollToTrack(songPos.length - 1)
        else if (e.key === "Enter" || e.key === " ") onActivate(focus)
        else return
        e.preventDefault()
    }

    return {
        scroll,
        focus,
        scrollToTrack,
        attachWheel,
        isClickSuppressed: () => suppressClick.current,
        bind: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
        onKeyDown,
    }
}
