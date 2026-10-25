import GameIcon from "./GameIcon"
import { artUrl } from "@/lib/art"

// Square avatar. A few operators have no avatar file: then the face is cropped out of the
// full-body art instead. `className` styles both images (size, filters, transitions).
export default function OperatorAvatar({ id, name, className = "" }: { id: string; name: string; className?: string }) {
    return (
        <GameIcon
            src={`/avatars/${id}.png`}
            alt={name}
            className={`h-full w-full object-cover ${className}`}
            fallback={
                <GameIcon
                    src={artUrl(`${id}_1`, 640)}
                    alt={name}
                    className={`h-full w-full origin-[50%_6%] scale-[2.8] object-cover ${className}`}
                />
            }
        />
    )
}
