import Link from "next/link"
import {ArrowLeft, SearchX} from "lucide-react"
import {buttonVariants} from "@/components/ui/button"

export default function NotFound() {
    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 p-6">
            <SearchX className="size-10 text-muted-foreground"/>
            <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-semibold">404</span>
                <p className="text-muted-foreground">找不到這個頁面</p>
            </div>
            <Link href="/" className={buttonVariants({variant: "outline"})}>
                <ArrowLeft data-icon="inline-start"/>
                回到首頁
            </Link>
        </main>
    )
}
