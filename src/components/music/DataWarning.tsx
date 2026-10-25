import { useState } from "react"
import { Dialog } from "radix-ui"
import { MicroLabel } from "@/components/ProfilePanel"
import { usePlayer } from "@/stores/playerStore"
import { formatSize, trackByCid } from "@/lib/music"
import { chamfer } from "@/lib/chamfer"

const panel = chamfer(["tr"], 18)

// Asks before streaming a WAV on mobile data / Data Saver. Mounted once at the app root,
// so it also covers plays started from the mini player.
export default function DataWarning() {
    const { pendingCid, confirmPending, cancelPending } = usePlayer()
    const [dontAsk, setDontAsk] = useState(false)
    const track = pendingCid ? trackByCid.get(pendingCid) : undefined

    return (
        <Dialog.Root open={Boolean(track)} onOpenChange={(open) => { if (!open) cancelPending() }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[60] bg-card/60 backdrop-blur-sm" />
                <Dialog.Content
                    style={{ clipPath: panel }}
                    className="fixed left-1/2 top-1/2 z-[61] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 bg-background p-6 shadow-xl focus:outline-none"
                >
                    <MicroLabel>Mobile data</MicroLabel>
                    <Dialog.Title className="mt-1 font-heading text-xl">Stream a large file?</Dialog.Title>
                    <Dialog.Description className="mt-3 text-sm leading-relaxed">
                        “{track?.name}” is an uncompressed WAV of about{" "}
                        <span className="font-mono font-semibold">{formatSize(track?.size ?? null) ?? "40 MB"}</span>.
                        It downloads as it plays, so a full listen uses that much data.
                    </Dialog.Description>

                    <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" checked={dontAsk} onChange={(e) => setDontAsk(e.target.checked)} className="h-4 w-4 accent-primary" />
                        Don't ask again
                    </label>

                    <div className="mt-6 flex justify-end gap-2">
                        <Dialog.Close className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">
                            Cancel
                        </Dialog.Close>
                        <button
                            type="button"
                            onClick={() => { confirmPending(dontAsk); setDontAsk(false) }}
                            className="bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-[inset_0_-2px_0_var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            Play anyway
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
