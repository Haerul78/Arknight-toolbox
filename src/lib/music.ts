import music from "@/data/music.json"
import albumNames from "@/data/albumNames.json"
import type { Album, Track } from "@/types/Music"

// optional hand-written English names, keyed by album id; anything missing keeps its original name
const englishNames = albumNames as Record<string, string>

export const albums: Album[] = (music as Album[]).map((a) => ({ ...a, name: englishNames[a.cid] || a.name }))

// one flat play order across all albums (newest album first, as on Monster Siren)
export const tracks: Track[] = albums.flatMap((a) => a.songs.map((s) => ({ ...s, albumCid: a.cid, albumName: a.name, index: 0 })))
tracks.forEach((t, i) => { t.index = i })

export const trackByCid = new Map(tracks.map((t) => [t.cid, t]))

export const coverUrl = (albumCid: string) => `/music-covers/${albumCid}.webp`

export function formatSize(bytes: number | null) {
    if (!bytes) return null
    const mb = bytes / 1024 / 1024
    return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`
}

export function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, "0")}`
}
