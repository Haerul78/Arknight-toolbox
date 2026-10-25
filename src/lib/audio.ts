// The one audio element for the whole app. It lives outside React so playback survives route
// changes and component unmounts; the player store drives it and listens to its events.
//
// - preload="none": nothing is downloaded until a track is actually played.
// - The element streams with HTTP range requests on its own (the CDN answers 206 Partial
//   Content), so seeking never fetches the whole file. Never fetch() the audio file itself.
// - No service worker caches audio. If this app becomes a PWA, exclude res*.hycdn.cn from
//   runtime caching: the files are 30–40 MB WAVs and the links expire anyway.
export const audio: HTMLAudioElement | null = typeof Audio === "undefined" ? null : new Audio()
if (audio) audio.preload = "none"

type Source = { url: string; expiresAt: number }
const sources = new Map<string, Source>()
// treat a link as stale this long before the CDN does, so it can't expire mid-request
const MARGIN = 5 * 60 * 1000
// used when the link carries no readable expiry
const FALLBACK_TTL = 60 * 60 * 1000

// Signed audio link for a song, via /api/song/:cid (Vercel function in production, the same
// handler in the Vite dev server). Cached until shortly before it expires.
export async function resolveSource(cid: string, { fresh = false } = {}): Promise<string> {
    const cached = sources.get(cid)
    if (!fresh && cached && cached.expiresAt - MARGIN > Date.now()) return cached.url

    const res = await fetch(`/api/song/${cid}`)
    const body = (await res.json().catch(() => ({}))) as { sourceUrl?: string; expiresAt?: number | null; error?: string }
    if (!res.ok || !body.sourceUrl) throw new Error(body.error ?? `Could not load this track (${res.status})`)

    sources.set(cid, { url: body.sourceUrl, expiresAt: body.expiresAt ?? Date.now() + FALLBACK_TTL })
    return body.sourceUrl
}

type NetworkInformation = { saveData?: boolean; type?: string }

// true on Chromium browsers that report mobile data or Data Saver; other browsers expose no
// connection info, so this is false there (the file size stays visible on every track instead)
export function onMeteredConnection() {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
    return Boolean(connection && (connection.saveData || connection.type === "cellular"))
}
