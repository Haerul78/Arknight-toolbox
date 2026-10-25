import { albums, tracks } from "@/lib/music"
import type { Album, Track } from "@/types/Music"

// Flat row list for the arc: an album divider before each album's songs. Each row has a
// position on one continuous axis; dividers take less room than songs.
export type ArcRow =
    | { kind: "album"; key: string; pos: number; album: Album }
    | { kind: "song"; key: string; pos: number; track: Track }

const ALBUM_GAP = 0.8

export const rows: ArcRow[] = []
// position of each track on the axis, by track index (snap targets)
export const songPos: number[] = []

let pos = 0
let t = 0
for (const album of albums) {
    rows.push({ kind: "album", key: `a${album.cid}`, pos, album })
    pos += ALBUM_GAP
    for (let i = 0; i < album.songs.length; i++) {
        const track = tracks[t++]
        rows.push({ kind: "song", key: `s${track.cid}`, pos, track })
        songPos[track.index] = pos
        pos += 1
    }
}

export const minPos = songPos[0] ?? 0
export const maxPos = songPos.at(-1) ?? 0

// index of the track whose position is closest to `p` (binary search, positions are sorted)
export function nearestTrack(p: number) {
    let lo = 0
    let hi = songPos.length - 1
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (songPos[mid] < p) lo = mid + 1
        else hi = mid
    }
    if (lo > 0 && Math.abs(songPos[lo - 1] - p) <= Math.abs(songPos[lo] - p)) return lo - 1
    return lo
}

// first row at or after position `p`
export function rowAt(p: number) {
    let lo = 0
    let hi = rows.length
    while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (rows[mid].pos < p) lo = mid + 1
        else hi = mid
    }
    return lo
}
