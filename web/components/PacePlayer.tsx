"use client"

import {useEffect, useRef, useState} from "react"
import Link from "next/link"
import {Infinity as InfinityIcon, ArrowLeft, Loader, Pause, Play, Radio, Repeat, Square, CheckCheck} from "lucide-react"
import {Badge} from "@/components/ui/badge"
import {Button, buttonVariants} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Checkbox} from "@/components/ui/checkbox"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {Input} from "@/components/ui/input"
import PaceGrid from "@/components/PaceGrid"
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip"
import {useRemote} from "@/components/RemoteProvider"
import {Workout} from "@/lib/api"
import {RemoteAction} from "@/lib/remote"
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
    const {clients, selfId, session, connected, sendControl} = useRemote()
    const [localMode, setLocalMode] = useState<Mode>("once")
    const [localTimes, setLocalTimes] = useState(3)
    const [localStatus, setLocalStatus] = useState<Status>("idle")
    const [controlledDone, setControlledDone] = useState(false)
    const [elapsed, setElapsed] = useState(0)

    const [remoteOpen, setRemoteOpen] = useState(false)
    const [linked, setLinked] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    // Devices may drop off while selected — only ever act on the ones still online
    const targets = selectedIds.filter(id => clients.some(c => c.id === id) && id !== selfId)

    const controlled = session !== null
    const mode = session ? session.mode : localMode
    const times = session ? session.times : localTimes
    const status: Status = session ? (controlledDone ? "finished" : session.status) : localStatus

    // A fresh remote "start" replaces the session; reset the clock for it
    const [lastStartedAt, setLastStartedAt] = useState(session?.startedAt ?? 0)
    if ((session?.startedAt ?? 0) !== lastStartedAt) {
        setLastStartedAt(session?.startedAt ?? 0)
        setElapsed(0)
        setControlledDone(false)
    }

    const poses = workout.poses
    const cycleMs = poses.reduce((sum, p) => sum + p.delayMillis, 0)
    const targetMs = mode === "loop" ? Infinity : cycleMs * (mode === "once" ? 1 : Math.max(1, times))

    useEffect(() => {
        if (status !== "playing" || cycleMs <= 0) return
        let last = performance.now()
        const interval = setInterval(() => {
            const now = performance.now()
            const dt = now - last
            last = now
            setElapsed(prev => Math.min(prev + dt, targetMs))
        }, 50)
        return () => clearInterval(interval)
    }, [status, targetMs, cycleMs])

    // Reaching the target ends the run (adjust-state-during-render pattern)
    if (elapsed >= targetMs) {
        if (!controlled && localStatus === "playing") setLocalStatus("finished")
        if (controlled && !controlledDone && session.status === "playing") setControlledDone(true)
    }

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

    function broadcast(action: RemoteAction) {
        if (!controlled && linked && targets.length > 0) sendControl(targets, action)
    }

    function connectTargets() {
        setRemoteOpen(false)
        setLinked(true)
        sendControl(targets, {kind: "connect", workoutId: workout.id, workoutName: workout.name})
    }

    function disconnectTargets() {
        sendControl(targets, {kind: "disconnect"})
        setLinked(false)
    }

    // Leaving the player releases any clients this controller was driving
    const exitRef = useRef<() => void>(() => {
    })
    useEffect(() => {
        exitRef.current = () => {
            if (!controlled && linked && targets.length > 0) sendControl(targets, {kind: "disconnect"})
        }
    })
    useEffect(() => () => exitRef.current(), [])

    function start() {
        setElapsed(0)
        setLocalStatus("playing")
        broadcast({
            kind: "start",
            workoutId: workout.id,
            workoutName: workout.name,
            mode: localMode,
            times: Math.max(1, localTimes),
        })
    }

    function pause() {
        setLocalStatus("paused")
        broadcast({kind: "pause"})
    }

    function resume() {
        setLocalStatus("playing")
        broadcast({kind: "resume"})
    }

    function stop() {
        setLocalStatus("idle")
        setElapsed(0)
        broadcast({kind: "stop"})
    }

    const otherClients = clients.filter(c => c.id !== selfId)

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-5 p-5">
            <div className="relative flex w-full items-center justify-center">
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Link
                                href={`/settings/edit/${workout.id}`}
                                aria-label="返回編輯"
                                className={cn(
                                    buttonVariants({variant: "ghost", size: "icon"}),
                                    "absolute left-0",
                                    controlled && "pointer-events-none opacity-40",
                                )}
                            />
                        }
                    >
                        <ArrowLeft className="size-5"/>
                    </TooltipTrigger>
                    <TooltipContent>返回編輯</TooltipContent>
                </Tooltip>
                <div className="flex flex-col items-center gap-1">
                    {controlled && (
                        <Badge variant="outline" className="mb-3 gap-1.5 border-red-500 text-red-500">
                            <Radio className="size-3.5 animate-pulse"/>
                            遠端控制中 · {session.controllerName}
                        </Badge>
                    )}
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
                            disabled={running || controlled}
                            onClick={() => setLocalMode("once")}
                        >
                            <Play data-icon="inline-start"/>
                            單次
                        </Button>
                        <Button
                            variant={mode === "times" ? "default" : "outline"}
                            size="sm"
                            disabled={running || controlled}
                            onClick={() => setLocalMode("times")}
                        >
                            <Repeat data-icon="inline-start"/>
                            重複次數
                        </Button>
                        <Button
                            variant={mode === "loop" ? "default" : "outline"}
                            size="sm"
                            disabled={running || controlled}
                            onClick={() => setLocalMode("loop")}
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
                                    disabled={running || controlled}
                                    aria-label="重複次數"
                                    onChange={e => {
                                        const value = parseInt(e.target.value, 10)
                                        if (Number.isFinite(value)) setLocalTimes(Math.max(1, value))
                                    }}
                                    className="h-8 w-20 pr-8 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <span
                                    className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                                    次
                                </span>
                            </div>
                        )}
                    </div>

                    {!controlled && (
                        <div className="flex items-center gap-2">
                            {linked ? (
                                <>
                                    <Badge variant="secondary" className="gap-1.5">
                                        <CheckCheck className="size-3.5 text-green-500"/>
                                        已連線 {targets.length} 個裝置
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={disconnectTargets}
                                        className="border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                    >
                                        中斷連線
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={running}
                                    onClick={() => setRemoteOpen(true)}
                                >
                                    <Radio data-icon="inline-start"/>
                                    遠端控制
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="flex w-full flex-1 items-center justify-center">
                        <Card className="w-full max-w-[332px] rounded-2xl p-4 shadow-none sm:p-6">
                            <PaceGrid
                                locations={running || status === "finished" ? [poses[poseIndex].location] : []}
                                responsive
                            />
                        </Card>
                    </div>

                    {status === "finished" && <p className="text-sm text-muted-foreground">完成！</p>}

                    <div className="flex items-center gap-6 pb-4">
                        {status === "playing" ? (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            aria-label="暫停"
                                            disabled={controlled}
                                            onClick={pause}
                                            className="size-16 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600"
                                        />
                                    }
                                >
                                    <Pause className="size-7 fill-white"/>
                                </TooltipTrigger>
                                <TooltipContent>暫停</TooltipContent>
                            </Tooltip>
                        ) : (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            aria-label={status === "paused" ? "繼續" : "開始"}
                                            disabled={controlled}
                                            onClick={() => (status === "paused" ? resume() : start())}
                                            className="size-16 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600"
                                        />
                                    }
                                >
                                    <Play className="size-7 fill-white"/>
                                </TooltipTrigger>
                                <TooltipContent>{status === "paused" ? "繼續" : "開始"}</TooltipContent>
                            </Tooltip>
                        )}
                        {running && (
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <Button
                                            aria-label="停止"
                                            disabled={controlled}
                                            onClick={stop}
                                            className="size-16 rounded-2xl bg-red-500 text-white shadow-lg hover:bg-red-600"
                                        />
                                    }
                                >
                                    <Square className="size-6 fill-white"/>
                                </TooltipTrigger>
                                <TooltipContent>停止</TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    <Dialog open={remoteOpen} onOpenChange={setRemoteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    遠端控制其他個體
                                    <Loader className="size-4 animate-spin text-muted-foreground"/>
                                </DialogTitle>
                                <DialogDescription>
                                    在其他裝置上連線至網頁 {window.location.protocol}&#47;&#47;{window.location.host}/<br/>並在這裡勾選它
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                                {!connected && (
                                    <p className="py-4 text-center text-sm text-muted-foreground">連線中…</p>
                                )}
                                {connected && otherClients.length === 0 && (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        目前沒有可控制的裝置
                                    </p>
                                )}
                                {otherClients.length > 0 && (
                                    <div className={"flex justify-end"}>
                                        <Button variant={"outline"}
                                                onClick={() => setSelectedIds(otherClients.map(client => client.id))}
                                                className={""}>
                                            <CheckCheck/> 全選
                                        </Button>
                                    </div>
                                )}
                                {otherClients.map(client => (
                                    <label
                                        key={client.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                                    >
                                        <Checkbox
                                            checked={selectedIds.includes(client.id)}
                                            onCheckedChange={checked =>
                                                setSelectedIds(prev =>
                                                    checked
                                                        ? [...prev, client.id]
                                                        : prev.filter(id => id !== client.id),
                                                )
                                            }
                                        />
                                        <span className="text-sm">{client.name}</span>
                                    </label>
                                ))}
                            </div>
                            <DialogFooter>
                                <DialogClose className={buttonVariants({variant: "outline"})}>取消</DialogClose>
                                <Button
                                    disabled={targets.length === 0}
                                    onClick={connectTargets}
                                >
                                    連線
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </main>
    )
}
