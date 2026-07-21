import type {Metadata} from "next"
import Link from "next/link"
import {Plus, Trash2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import PaceGrid from "@/components/PaceGrid"
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip"
import {listWorkouts, Workout} from "@/lib/api"
import {createWorkoutAction, deleteWorkoutAction} from "@/app/actions"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
    title: "我的跑位 | Mito",
}

export default async function SettingsPage() {
    let workouts: Workout[] = []
    let error: string | null = null
    try {
        workouts = (await listWorkouts()).data
    } catch (e) {
        error = (e as Error).message
    }

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">我的跑位</h1>
                <form action={createWorkoutAction}>
                    <Button type="submit">
                        <Plus data-icon="inline-start"/>
                        新增跑位
                    </Button>
                </form>
            </div>

            {error &&
                <p className="text-sm text-destructive flex justify-center items-center h-20">無法載入跑位：{error}</p>}
            {!error && workouts.length === 0 && (
                <p className="text-sm text-muted-foreground flex justify-center items-center h-20">還沒有跑位，點右上角「新增跑位」建立第一個。</p>
            )}

            <div className="flex flex-col gap-3">
                {workouts.map(workout => (
                    <Card
                        key={workout.id}
                        className="group relative flex-row items-center gap-4 rounded-xl px-5 py-4 transition-colors hover:bg-muted/50"
                    >
                        <form
                            id={`delete-workout-${workout.id}`}
                            action={deleteWorkoutAction.bind(null, workout.id)}
                            className={"hidden"}
                            aria-hidden
                        />
                        <Link href={`/settings/edit/${workout.id}`} className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="absolute inset-0" aria-hidden/>
                            <span className="truncate text-lg font-medium">{workout.name}</span>
                            <span className="truncate text-sm text-muted-foreground">
                                {workout.description || `${workout.poses.length} 個動作`}
                            </span>
                        </Link>
                        <div className="relative transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <AlertDialog>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <AlertDialogTrigger
                                                render={
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label={`刪除 ${workout.name}`}
                                                        className="text-muted-foreground"
                                                    />
                                                }
                                            />
                                        }
                                    >
                                        <Trash2/>
                                    </TooltipTrigger>
                                    <TooltipContent>刪除跑位</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>刪除跑位？</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            這會永久刪除「{workout.name}」，而且無法復原。
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>取消</AlertDialogCancel>
                                        <AlertDialogAction
                                            render={
                                                <Button
                                                    type="submit"
                                                    form={`delete-workout-${workout.id}`}
                                                    variant="destructive"
                                                />
                                            }
                                        >
                                            刪除
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <PaceGrid
                            locations={[...new Set(workout.poses.map(p => p.location))]}
                            cellSize={16}
                            className="shrink-0"
                        />
                    </Card>
                ))}
            </div>
        </main>
    )
}
