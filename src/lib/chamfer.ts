type Corner = "tl" | "tr" | "br" | "bl"

// clip-path polygon with the given corners cut at 45°. `inset` shrinks the shape so a
// 1px-inset copy on top of a filled copy draws a hairline that follows the cuts.
export function chamfer(corners: Corner[], cut = 18, inset = 0) {
    // the diagonal edge moves inward by inset * (√2 − 1) to stay parallel
    const c = cut + inset * 0.41
    const has = (k: Corner) => corners.includes(k)
    const i = `${inset}px`
    const far = `calc(100% - ${inset}px)`
    const pts = [
        ...(has("tl") ? [`${i} ${c}px`, `${c}px ${i}`] : [`${i} ${i}`]),
        ...(has("tr") ? [`calc(100% - ${c}px) ${i}`, `${far} ${c}px`] : [`${far} ${i}`]),
        ...(has("br") ? [`${far} calc(100% - ${c}px)`, `calc(100% - ${c}px) ${far}`] : [`${far} ${far}`]),
        ...(has("bl") ? [`${c}px ${far}`, `${i} calc(100% - ${c}px)`] : [`${i} ${far}`]),
    ]
    return `polygon(${pts.join(", ")})`
}
