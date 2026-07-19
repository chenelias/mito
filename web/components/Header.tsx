import mitoTextLogo from "../public/mito_text.png"
import Image from "next/image"
import Link from "next/link";
import {buttonVariants} from "@/components/ui/button";
import {Settings} from "lucide-react";
import {cn} from "@/lib/utils";

export default function Header() {
    return (
        <header className="flex items-center justify-center gap-2 p-2 fixed top-0 left-0 w-full z-40 bg-background/80 backdrop-blur-sm">
            <Link href="/">
                <Image
                    src={mitoTextLogo}
                    alt="Mito Text Logo"
                    height={50}
                />
            </Link>
            <Link
                href="/settings"
                aria-label="教練管理"
                className={cn(buttonVariants({variant: "ghost", size: "icon"}), "absolute right-2")}
            >
                <Settings/>
            </Link>
        </header>
    )
}
