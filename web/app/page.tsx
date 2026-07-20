"use client"

import {Loader, Radio} from "lucide-react"
import {Card} from "@/components/ui/card"
import {useRemote} from "@/components/RemoteProvider"

export default function Home() {
    const {selfName, connected} = useRemote()

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 p-6">
            <Card className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl p-10">
                <Radio className={connected ? "size-10 animate-pulse" : "size-10 text-muted-foreground"}/>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-sm text-muted-foreground">此裝置</span>
                    {connected && selfName ? (
                        <span className="text-center text-3xl font-semibold">{selfName}</span>
                    ) : (
                        <span className="flex items-center gap-2 text-lg text-muted-foreground">
                            <Loader className="size-4 animate-spin"/>
                            連線中…
                        </span>
                    )}
                </div>
                {connected && (
                    <span className="text-sm text-muted-foreground">等待遠端控制…</span>
                )}
            </Card>
        </main>
    )
}
