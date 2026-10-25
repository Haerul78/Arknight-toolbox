import { create } from "zustand"
import { persist } from "zustand/middleware"
import { audio, onMeteredConnection, resolveSource } from "@/lib/audio"
import { trackByCid, tracks } from "@/lib/music"

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error"

type PlayerState = {
    currentCid: string | null
    status: PlayerStatus
    error: string | null
    volume: number
    // song waiting for the mobile-data confirmation
    pendingCid: string | null
    skipDataWarning: boolean

    play: (cid: string) => void
    toggle: () => void
    next: () => void
    prev: () => void
    seek: (seconds: number) => void
    setVolume: (volume: number) => void
    confirmPending: (dontAskAgain: boolean) => void
    cancelPending: () => void
}

// bumps on every new load, so a slow link lookup can't start a track the user already skipped
let loadId = 0

export const usePlayer = create<PlayerState>()(
    persist(
        (set, get) => {
            async function load(cid: string) {
                const id = ++loadId
                set({ currentCid: cid, status: "loading", error: null })
                if (!audio) return
                audio.pause()
                try {
                    const url = await resolveSource(cid)
                    if (id !== loadId) return
                    audio.src = url
                    await audio.play()
                    // fetch the next track's link (not its audio) so skipping is instant
                    const next = tracks[(trackByCid.get(cid)!.index + 1) % tracks.length]
                    resolveSource(next.cid).catch(() => {})
                } catch (err) {
                    if (id !== loadId) return
                    // a pause or a new src rejects play(); that isn't a failure
                    if (err instanceof DOMException && err.name === "AbortError") return
                    // the browser refused to start audio without a click: wait for one
                    if (err instanceof DOMException && err.name === "NotAllowedError") {
                        set({ status: "paused" })
                        return
                    }
                    set({ status: "error", error: err instanceof Error ? err.message : "Could not play this track" })
                }
            }

            return {
                currentCid: null,
                status: "idle",
                error: null,
                volume: 0.8,
                pendingCid: null,
                skipDataWarning: false,

                play: (cid) => {
                    const track = trackByCid.get(cid)
                    if (!track) return
                    if (track.ext === "wav" && !get().skipDataWarning && onMeteredConnection()) {
                        set({ pendingCid: cid })
                        return
                    }
                    load(cid)
                },
                toggle: () => {
                    const { currentCid, status } = get()
                    if (!audio || !currentCid) return
                    if (status === "loading") {
                        // cancel the pending load too, or it would start playing after the pause
                        loadId++
                        audio.pause()
                        set({ status: "paused" })
                    } else if (status === "playing") audio.pause()
                    // nothing loaded yet (e.g. restored after a reload): go through play() for the size check
                    else if (!audio.src) get().play(currentCid)
                    else audio.play().catch(() => {})
                },
                next: () => {
                    const t = trackByCid.get(get().currentCid ?? "")
                    get().play(tracks[t ? (t.index + 1) % tracks.length : 0].cid)
                },
                prev: () => {
                    // like most players: restart the song unless it has barely started
                    if (audio && audio.currentTime > 3) {
                        audio.currentTime = 0
                        return
                    }
                    const t = trackByCid.get(get().currentCid ?? "")
                    get().play(tracks[t ? (t.index - 1 + tracks.length) % tracks.length : 0].cid)
                },
                seek: (seconds) => {
                    if (audio && Number.isFinite(audio.duration)) audio.currentTime = seconds
                },
                setVolume: (volume) => {
                    if (audio) audio.volume = volume
                    set({ volume })
                },
                confirmPending: (dontAskAgain) => {
                    const cid = get().pendingCid
                    set({ pendingCid: null, skipDataWarning: get().skipDataWarning || dontAskAgain })
                    if (cid) load(cid)
                },
                cancelPending: () => set({ pendingCid: null }),
            }
        },
        {
            name: "ak-player",
            // the last track is remembered but never auto-played after a reload
            partialize: (s) => ({ currentCid: s.currentCid, volume: s.volume, skipDataWarning: s.skipDataWarning }),
        },
    ),
)

// keep the store in sync with what the element is actually doing
if (audio) {
    audio.volume = usePlayer.getState().volume
    // the element outlives this module during hot reload; drop the old listeners with it,
    // or every reload would add another "ended -> next" and skip several tracks at once
    const listeners = new AbortController()
    import.meta.hot?.dispose(() => listeners.abort())
    const on = (event: string, fn: () => void) => audio!.addEventListener(event, fn, { signal: listeners.signal })

    const status = (s: PlayerStatus) => () => usePlayer.setState({ status: s })
    on("playing", status("playing"))
    on("pause", () => {
        if (usePlayer.getState().status !== "loading") usePlayer.setState({ status: "paused" })
    })
    on("waiting", status("loading"))
    on("ended", () => usePlayer.getState().next())

    let retried: string | null = null
    on("error", async () => {
        const { currentCid } = usePlayer.getState()
        if (!currentCid || !audio?.src) return
        // most likely an expired link: fetch a fresh one once, then resume where it stopped
        if (retried !== currentCid) {
            retried = currentCid
            const at = audio.currentTime
            try {
                audio.src = await resolveSource(currentCid, { fresh: true })
                audio.currentTime = at
                await audio.play()
                return
            } catch { /* fall through to the error state */ }
        }
        usePlayer.setState({ status: "error", error: "This track could not be streamed. Try again later." })
    })
}
