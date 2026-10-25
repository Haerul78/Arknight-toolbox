import { useEffect, useState } from "react"
import { useAnimationFrame, useMotionValue, type MotionValue } from "framer-motion"
import { audio } from "@/lib/audio"

// playback position 0..1 as a motion value, read straight from the element every frame;
// drives the seek bar and tonearm without re-rendering anything
export function useAudioProgress(): MotionValue<number> {
    const progress = useMotionValue(0)
    useAnimationFrame(() => {
        if (!audio) return
        const p = audio.duration > 0 ? audio.currentTime / audio.duration : 0
        if (p !== progress.get()) progress.set(p)
    })
    return progress
}

// current time and duration in seconds for text labels (updates ~4×/s via timeupdate)
export function useAudioTime() {
    const [time, setTime] = useState({ current: 0, duration: 0 })
    useEffect(() => {
        if (!audio) return
        const el = audio
        const update = () => setTime({ current: el.currentTime, duration: Number.isFinite(el.duration) ? el.duration : 0 })
        update()
        const events = ["timeupdate", "durationchange", "loadedmetadata", "emptied"]
        events.forEach((e) => el.addEventListener(e, update))
        return () => events.forEach((e) => el.removeEventListener(e, update))
    }, [])
    return time
}
