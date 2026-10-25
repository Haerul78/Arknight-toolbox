// Every full-body art URL goes through here, so moving the art to external storage
// (R2, Supabase, ...) is one env var: VITE_ART_BASE_URL. Files are produced by
// src/scripts/download-art.mjs as <file>.webp (1280px) and <file>-640.webp.
const BASE = (import.meta.env.VITE_ART_BASE_URL || "/art").replace(/\/+$/, "")

export const ART_WIDTHS = [640, 1280] as const

// Game portrait ids contain "#" and "+" (char_002_amiya_epoque#4, char_002_amiya_1+);
// "#" would start a URL fragment, so both are replaced in the file names.
export function artFile(portraitId: string) {
    return portraitId.replace(/#/g, "-").replace(/\+/g, "plus")
}

export function artUrl(file: string, width: (typeof ART_WIDTHS)[number] = 1280) {
    return `${BASE}/${file}${width === 1280 ? "" : `-${width}`}.webp`
}

export function artSrcSet(file: string) {
    return ART_WIDTHS.map((w) => `${artUrl(file, w)} ${w}w`).join(", ")
}
