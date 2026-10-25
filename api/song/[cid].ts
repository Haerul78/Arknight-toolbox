// Vercel serverless function: GET /api/song/:cid -> { cid, sourceUrl, ext, expiresAt }
//
// Monster Siren's API sends no CORS headers, so the browser can't call it directly. This only
// relays the small JSON with the (signed, ~3h) audio link; the audio itself is streamed by the
// browser straight from the official CDN, which does allow CORS and range requests.
// The Vite dev server runs this same handler (see vite.config.ts).

const UPSTREAM = "https://monster-siren.hypergryph.com/api/song/"
// links last ~3h; serve a cached answer for at most 30 min so it always has hours left
const CACHE = "public, s-maxage=1800, stale-while-revalidate=300"

const json = (body: unknown, status: number, cache?: string) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", "cache-control": cache ?? "no-store" },
    })

// the signed path is /<hash>/<hex unix expiry>/siren/...
function expiryOf(url: string): number | null {
    const hex = new URL(url).pathname.split("/")[2]
    const seconds = /^[0-9a-f]{8}$/i.test(hex ?? "") ? parseInt(hex, 16) : NaN
    return Number.isFinite(seconds) ? seconds * 1000 : null
}

export async function GET(request: Request): Promise<Response> {
    const cid = new URL(request.url).pathname.split("/").filter(Boolean).pop() ?? ""
    if (!/^\d{1,10}$/.test(cid)) return json({ error: "Invalid song id" }, 400)

    let upstream: Response
    try {
        upstream = await fetch(UPSTREAM + cid, { signal: AbortSignal.timeout(10000) })
    } catch {
        return json({ error: "Music service did not respond" }, 504)
    }
    if (!upstream.ok) return json({ error: `Music service returned ${upstream.status}` }, 502)

    const body = (await upstream.json()) as { code: number; data?: { sourceUrl?: string | null } }
    const sourceUrl = body.data?.sourceUrl
    if (body.code !== 0 || !sourceUrl) return json({ error: "Song not found" }, 404)

    return json(
        {
            cid,
            sourceUrl,
            ext: sourceUrl.split("?")[0].split(".").pop()?.toLowerCase() ?? null,
            expiresAt: expiryOf(sourceUrl),
        },
        200,
        CACHE,
    )
}
