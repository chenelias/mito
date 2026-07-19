"use client"

import {useEffect, useRef, useState} from "react"
import Link from "next/link"
import {ArrowLeft, Infinity as InfinityIcon, Pause, Play, Repeat, Square} from "lucide-react"
import {Button, buttonVariants} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import PaceGrid from "@/components/PaceGrid"
import {Workout} from "@/lib/api"
import {cn} from "@/lib/utils"

type Mode = "once" | "times" | "loop"
type Status = "idle" | "playing" | "paused" | "finished"

function formatClock(ms: number) {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes} : ${String(seconds).padStart(2, "0")}`
}

export default function PacePlayer({workout}: { workout: Workout }) {
    const [mode, setMode] = useState<Mode>("once")
    const [times, setTimes] = useState(3)
    const [status, setStatus] = useState<Status>("idle")
    const [elapsed, setElapsed] = useState(0)
    const elapsedRef = useRef(0)

    const poses = workout.poses
    const cycleMs = poses.reduce((sum, p) => sum + p.delayMillis, 0)
    const targetMs = mode === "loop" ? Infinity : cycleMs * (mode === "once" ? 1 : Math.max(1, times))

    useEffect(() => {
        if (status !== "playing") return
        let last = performance.now()
        const interval = setInterval(() => {
            const now = performance.now()
            const next = Math.min(elapsedRef.current + (now - last), targetMs)
            last = now
            elapsedRef.current = next
            setElapsed(next)
            if (next >= targetMs) setStatus("finished")
        }, 50)
        return () => clearInterval(interval)
    }, [status, targetMs])

    let poseIndex = 0
    if (cycleMs > 0) {
        const within = status === "finished" ? cycleMs - 1 : elapsed % cycleMs
        let cumulative = 0
        for (let i = 0; i < poses.length; i++) {
            cumulative += poses[i].delayMillis
            if (within < cumulative) {
                poseIndex = i
                break
            }
        }
    }
    const currentCycle = cycleMs > 0 ? Math.floor(elapsed / cycleMs) + 1 : 1
    const running = status === "playing" || status === "paused"

    function start() {
        elapsedRef.current = 0
        setElapsed(0)
        setStatus("playing")
    }

    function stop() {
        setStatus("idle")
        elapsedRef.current = 0
        setElapsed(0)
    }

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 p-6">
            <div className="relative flex w-full items-center justify-center">
                <Link
                    href={`/settings/edit/${workout.id}`}
                    aria-label="返回編輯"
                    className={cn(buttonVariants({variant: "ghost", size: "icon"}), "absolute left-0")}
                >
                    <ArrowLeft className="size-5"/>
                </Link>
                <div className="flex flex-col items-center">
                    <span className="text-sm text-muted-foreground">{workout.name || "未命名"}</span>
                    <span className="text-4xl font-semibold tabular-nums">{formatClock(elapsed)}</span>
                    {mode !== "once" && (
                        <span className="text-xs text-muted-foreground" aria-live="polite">
                            第 {Math.min(currentCycle, mode === "times" ? times : currentCycle)} 輪
                            {mode === "times" ? ` / ${times}` : ""}
                        </span>
                    )}
                </div>
            </div>

            {poses.length === 0 ? (
                <p className="flex flex-1 items-center text-sm text-muted-foreground">
                    這個跑位還沒有動作，先回編輯頁新增。
                </p>
            ) : (
                <>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                            variant={mode === "once" ? "default" : "outline"}
                            size="sm"
                            disabled={running}
                            onClick={() => setMode("once")}
                        >
                            <Play data-icon="inline-start"/>
                            單次
                        </Button>
                        <Button
                            variant={mode === "times" ? "default" : "outline"}
                            size="sm"
                            disabled={running}
                            onClick={() => setMode("times")}
                        >
                            <Repeat data-icon="inline-start"/>
                            重複次數
                        </Button>
                        <Button
                            variant={mode === "loop" ? "default" : "outline"}
                            size="sm"
                            disabled={running}
                            onClick={() => setMode("loop")}
                        >
                            <InfinityIcon data-icon="inline-start"/>
                            無限循環
                        </Button>
                        {mode === "times" && (
                            <div className="relative">
                                <Input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={times}
                                    disabled={running}
                                    aria-label="重複次數"
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10)
                                        if (Number.isFinite(value)) setTimes(Math.max(1, value))
                                    }}
                                    className="h-8 w-20 pr-8 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                                    次
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-1 items-center">
                        <Card className="w-fit rounded-2xl p-6 shadow-none">
                            <PaceGrid
                                locations={running || status === "finished" ? [poses[poseIndex].location] : []}
                                cellSize={88}
                            />
                        </Card>
                    </div>

                    {status === "finished" && <p className="text-sm text-muted-foreground">完成！</p>}

                    <div className="flex items-center gap-6 pb-4">
                        {status === "playing" ? (
                            <Button
                                aria-label="暫停"
                                onClick={() => setStatus("paused")}
                                className="size-16 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600"
                            >
                                <Pause className="size-7 fill-white"/>
                            </Button>
                        ) : (
                            <Button
                                aria-label={status === "paused" ? "繼續" : "開始"}
                                onClick={() => (status === "paused" ? setStatus("playing") : start())}
                                className="size-16 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600"
                            >
                                <Play className="size-7 fill-white"/>
                            </Button>
                        )}
                        {running && (
                            <Button
                                aria-label="停止"
                                onClick={stop}
                                className="size-16 rounded-2xl bg-red-500 text-white shadow-lg hover:bg-red-600"
                            >
                                <Square className="size-6 fill-white"/>
                            </Button>
                        )}
                    </div>
                </>
            )}
        </main>
    )
}
