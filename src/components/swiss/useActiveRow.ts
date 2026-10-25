import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent, type PointerEvent } from "react"

// how long the mouse has to rest on a row before it opens, so sweeping across a list
// doesn't flash every row on the way
const HOVER_INTENT_MS = 100

// One "active row" for a whole list (Home sections, operator roster):
// - opens on mouse hover after a short intent delay; the previous row stays active until
//   the new one takes over, so there is never a frame with nothing open
// - taps never count as hover (touch also fires pointerenter)
// - keyboard focus opens at once
// - with `tapToOpen`, the first tap on a row opens it and a second tap follows the link
//
// Rows identify themselves with `data-row-key`, so the handlers are stable and memoized
// rows only re-render when their own active state changes.
export function useActiveRow({ tapToOpen = false } = {}) {
    const [active, setActive] = useState<string | null>(null)
    const activeRef = useRef<string | null>(null)
    const timer = useRef<number | undefined>(undefined)
    const pressedWith = useRef<string | null>(null)

    useEffect(() => { activeRef.current = active }, [active])
    useEffect(() => () => window.clearTimeout(timer.current), [])

    const keyOf = (el: Element) => (el as HTMLElement).dataset.rowKey ?? null

    const onPointerEnter = useCallback((e: PointerEvent<HTMLElement>) => {
        if (e.pointerType !== "mouse") return
        const key = keyOf(e.currentTarget)
        window.clearTimeout(timer.current)
        if (key === activeRef.current) return
        timer.current = window.setTimeout(() => setActive(key), HOVER_INTENT_MS)
    }, [])

    // put this one on the list container
    const onListPointerLeave = useCallback((e: PointerEvent<HTMLElement>) => {
        if (e.pointerType !== "mouse") return
        window.clearTimeout(timer.current)
        setActive(null)
    }, [])

    const onFocus = useCallback((e: FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.matches(":focus-visible")) return
        window.clearTimeout(timer.current)
        setActive(keyOf(e.currentTarget))
    }, [])

    const onPointerDown = useCallback((e: PointerEvent<HTMLElement>) => {
        pressedWith.current = e.pointerType
    }, [])

    const onClick = useCallback((e: MouseEvent<HTMLElement>) => {
        if (!tapToOpen) return
        const touchLike = pressedWith.current !== null && pressedWith.current !== "mouse"
        const key = keyOf(e.currentTarget)
        if (touchLike && key !== activeRef.current) {
            e.preventDefault()
            setActive(key)
        }
    }, [tapToOpen])

    return {
        active,
        listProps: { onPointerLeave: onListPointerLeave },
        rowProps: { onPointerEnter, onFocus, onPointerDown, onClick },
    }
}
