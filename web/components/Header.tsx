"use client"

import mitoTextLogo from "../public/mito_text.png"
import Image from "next/image"
import Link from "next/link";
import {buttonVariants} from "@/components/ui/button";
import {CircleHelp, Settings} from "lucide-react";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import { usePathname } from 'next/navigation'

export default function Header() {
    const pathname = usePathname()

    if (pathname.startsWith("/player") || pathname.startsWith("/settings/edit")) return null

    return (
        <>
            <header className="items-center justify-between gap-2 p-2 fixed top-0 left-0 w-full z-40 bg-background/80 backdrop-blur-sm">
                <div className={"flex items-center justify-between max-w-3xl mx-auto"}>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Link
                                    href="/how-to-use"
                                    aria-label="使用說明"
                                    className={buttonVariants({variant: "ghost", size: "icon"})}
                                />
                            }
                        >
                            <CircleHelp/>
                        </TooltipTrigger>
                        <TooltipContent>使用說明</TooltipContent>
                    </Tooltip>
                    <Link href="/">
                        <Image
                            src={mitoTextLogo}
                            alt="Mito Text Logo"
                            height={50}
                        />
                    </Link>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Link
                                    href="/settings"
                                    aria-label="跑位管理"
                                    className={cn(buttonVariants({variant: "ghost", size: "icon"}), "")}
                                />
                            }
                        >
                            <Settings/>
                        </TooltipTrigger>
                        <TooltipContent>跑位管理</TooltipContent>
                    </Tooltip>
                </div>
            </header>
            <div className="h-[66px]" aria-hidden/>
        </>
    )
}
