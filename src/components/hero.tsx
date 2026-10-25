import { SwissPage, Band, Label } from "@/components/swiss"
import HomeHero from "@/components/home/HomeHero"
import FeatureRows from "@/components/home/FeatureRows"
import ClassMarquee from "@/components/home/ClassMarquee"
import ArchiveNumbers from "@/components/home/ArchiveNumbers"

// Home: Swiss/editorial layout on a square tile grid (components/swiss). Kept as the `Hero`
// export so the route in App.tsx stays as it was.
export default function Hero() {
    return (
        <SwissPage>
            <HomeHero />
            <FeatureRows />
            <ClassMarquee />
            <ArchiveNumbers />
            <Band as="footer">
                <Label className="col-span-full self-center md:col-span-8">
                    Arknights Toolbox is a fan-made reference. Arknights and Monster Siren Records
                    belong to Hypergryph and Yostar.
                </Label>
            </Band>
        </SwissPage>
    )
}
