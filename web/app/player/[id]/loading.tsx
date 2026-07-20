"use client"

import {Loader} from "lucide-react"
import PacePlayer from "@/components/PacePlayer"
import {useRemote} from "@/components/RemoteProvider"

export default function PlayerLoading() {
    const {session} = useRemote()
    // A remote-controlled device already received the workout from its
    // controller — render the real player immediately while the
    // server-rendered page streams in, instead of blocking on the API
    if (session) return <PacePlayer workout={session.workout}/>
    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center p-6">
            <Loader className="size-6 animate-spin text-muted-foreground"/>
        </main>
    )
}
