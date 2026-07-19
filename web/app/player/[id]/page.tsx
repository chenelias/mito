import Link from "next/link"
import {redirect} from "next/navigation"
import {ArrowLeft} from "lucide-react"
import {buttonVariants} from "@/components/ui/button"
import PacePlayer from "@/components/PacePlayer"
import {getWorkout, Workout} from "@/lib/api"

export const dynamic = "force-dynamic"

export default async function PlayerPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const {id} = await params
    if (!id) redirect("/settings")

    let workout: Workout
    try {
        workout = await getWorkout(id)
    } catch (e) {
        return (
            <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 p-6">
                <p className="text-muted-foreground">找不到這個跑位：{(e as Error).message}</p>
                <Link href="/settings" className={buttonVariants({variant: "outline"})}>
                    <ArrowLeft data-icon="inline-start"/>
                    返回列表
                </Link>
            </main>
        )
    }
    return <PacePlayer workout={workout}/>
}
