"use client"

import mitoTextLogo from "../public/mito_text.png"
import Image from "next/image"
import Link from "next/link";
import {buttonVariants} from "@/components/ui/button";
import {Settings} from "lucide-react";
import {cn} from "@/lib/utils";
import { usePathname } from 'next/navigation'

export default function Header() {
    const pathname = usePathname()

    if (pathname.startsWith("/player") || pathname.startsWith("/settings/edit")) return null

    return (
        <>
            <header className="items-center justify-between gap-2 p-2 fixed top-0 left-0 w-full z-40 bg-background/80 backdrop-blur-sm">
                <div className={"flex items-center justify-between max-w-3xl mx-auto"}>
                    <div />
                    <Link href="/">
                        <Image
                            src={mitoTextLogo}
                            alt="Mito Text Logo"
                            height={50}
                        />
                    </Link>
                    <Link
                        href="/settings"
                        aria-label="跑位管理"
                        className={cn(buttonVariants({variant: "ghost", size: "icon"}), "")}
                    >
                        <Settings/>
                    </Link>
                </div>
            </header>
            <div className="h-[66px]" aria-hidden/>
        </>
    )
}
