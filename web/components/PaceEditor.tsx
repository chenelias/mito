"use client"

import {useEffect, useRef, useState, useTransition} from "react"
import Link from "next/link"
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    MouseSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {CSS} from "@dnd-kit/utilities"
import {ArrowLeft, CircleCheck, GripVertical, Loader, Minus, Pencil, Play, Plus, Timer, Trash2} from "lucide-react"
import {Button, buttonVariants} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
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
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import PaceGrid from "@/components/PaceGrid"
import {Workout} from "@/lib/api"
import {updateWorkoutAction} from "@/app/actions"
import {cn} from "@/lib/utils"
import {Badge} from "@/components/ui/badge";

type EditorPose = {
    key: string
    location: number
    delayMillis: number
}

const MIN_DELAY = 100
const DELAY_STEP = 250

function TimeInput({delayMillis, onCommit}: { delayMillis: number; onCommit: (ms: number) => void }) {
    const [draft, setDraft] = useState(String(delayMillis / 1000))
    const [lastDelay, setLastDelay] = useState(delayMillis)
    if (delayMillis !== lastDelay) {
        setLastDelay(delayMillis)
        setDraft(String(delayMillis / 1000))
    }

    function commit() {
        const seconds = parseFloat(draft)
        if (Number.isFinite(seconds) && seconds > 0) {
            onCommit(Math.max(MIN_DELAY, Math.round(seconds * 1000)))
        } else {
            setDraft(String(delayMillis / 1000))
        }
    }

    return (
        <div className="relative">
            <Timer
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"/>
            <Input
                type="number"
                inputMode="decimal"
                min={MIN_DELAY / 1000}
                step={0.25}
                value={draft}
                aria-label="秒數"
                onChange={e => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
                className="h-8 w-28 pr-8 pl-9 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span
                className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                秒
            </span>
        </div>
    )
}

function SortablePoseRow({
                             pose,
                             index,
                             onChange,
                             onDelete,
                         }: {
    pose: EditorPose
    index: number
    onChange: (update: Partial<EditorPose>) => void
    onDelete: () => void
}) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: pose.key})

    return (
        <Card
            ref={setNodeRef}
            style={{transform: CSS.Transform.toString(transform), transition}}
            className={cn(
                "relative flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:gap-x-6 sm:px-6 sm:py-3",
                isDragging && "z-10 shadow-lg",
            )}
        >
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="拖曳調整順序"
                    className="-ml-1 cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-5"/>
                </button>
                <span className="w-6 text-center text-sm text-muted-foreground tabular-nums">{index + 1}</span>
            </div>
            <Card className="w-fit shrink-0 rounded-lg p-3 shadow-none max-sm:self-center">
                <PaceGrid
                    locations={[pose.location]}
                    cellSize={32}
                    onSelect={location => onChange({location})}
                />
            </Card>
            <div
                className="flex items-center gap-1 max-sm:self-center sm:flex-1 sm:justify-center sm:gap-2">
                <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="減少秒數"
                    disabled={pose.delayMillis <= MIN_DELAY}
                    onClick={() => onChange({delayMillis: Math.max(MIN_DELAY, pose.delayMillis - DELAY_STEP)})}
                >
                    <Minus/>
                </Button>
                <TimeInput
                    delayMillis={pose.delayMillis}
                    onCommit={delayMillis => onChange({delayMillis})}
                />
                <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="增加秒數"
                    onClick={() => onChange({delayMillis: pose.delayMillis + DELAY_STEP})}
                >
                    <Plus/>
                </Button>
            </div>
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label="刪除動作"
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive max-sm:absolute max-sm:top-3 max-sm:right-3"
            >
                <Trash2/>
            </Button>
        </Card>
    )
}

export default function PaceEditor({workout}: { workout: Workout }) {
    const [name, setName] = useState(workout.name)
    const [description, setDescription] = useState(workout.description)
    const [infoOpen, setInfoOpen] = useState(false)
    const [draftName, setDraftName] = useState(workout.name)
    const [draftDescription, setDraftDescription] = useState(workout.description)
    const [poses, setPoses] = useState<EditorPose[]>(
        workout.poses.map(p => ({key: p.id, location: p.location, delayMillis: p.delayMillis})),
    )
    const [isSaving, startSaving] = useTransition()
    const [saveError, setSaveError] = useState<string | null>(null)
    const loadedRef = useRef(false)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(MouseSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    )

    useEffect(() => {
        if (!loadedRef.current) {
            loadedRef.current = true
            return
        }
        const timeout = setTimeout(() => {
            startSaving(async () => {
                try {
                    await updateWorkoutAction(workout.id, {
                        name,
                        description,
                        poses: poses.map(p => ({location: p.location, delayMillis: p.delayMillis})),
                    })
                    setSaveError(null)
                } catch (e) {
                    setSaveError((e as Error).message)
                }
            })
        }, 600)
        return () => clearTimeout(timeout)
    }, [name, description, poses, workout.id])

    function handleDragEnd(event: DragEndEvent) {
        const {active, over} = event
        if (over && active.id !== over.id) {
            setPoses(prev => {
                const from = prev.findIndex(p => p.key === active.id)
                const to = prev.findIndex(p => p.key === over.id)
                return arrayMove(prev, from, to)
            })
        }
    }

    function openInfoDialog() {
        setDraftName(name)
        setDraftDescription(description)
        setInfoOpen(true)
    }

    function saveInfoDialog() {
        setName(draftName)
        setDescription(draftDescription)
        setInfoOpen(false)
    }

    function addPose() {
        setPoses(prev => [
            ...prev,
            {key: Math.random().toString(36).slice(2, 10), location: 4, delayMillis: 500},
        ])
    }

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
            <div className="flex items-center gap-2">
                <Link href="/settings" aria-label="返回列表" className={buttonVariants({variant: "ghost", size: "icon"})}>
                    <ArrowLeft className="size-5"/>
                </Link>
                <div>
                    <div className={"flex"}>
                        <p
                            className="truncate rounded px-1 text-left text-2xl font-semibold"
                        >
                            {name || "未命名"}
                        </p>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="編輯名稱與描述"
                            onClick={openInfoDialog}
                            className="text-muted-foreground"
                        >
                            <Pencil/>
                        </Button>
                    </div>
                    {description && (
                        <p className="max-w-md truncate px-1 text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <span className="text-xs text-muted-foreground" aria-live="polite">
                        {saveError ? <Badge variant={"destructive"}>
                            {`儲存失敗`}
                        </Badge> : isSaving ? <Loader className={"text-gray-500 animate-spin"} size={20} /> :
                            <CircleCheck className={"text-green-500"} size={20}/>}
                    </span>
                    {poses.length > 0 && (
                        <Link
                            href={`/player/${workout.id}`}
                            aria-label="播放跑位"
                            className={cn(
                                buttonVariants({size: "icon-sm"}),
                                "rounded-full bg-green-500 text-white hover:bg-green-600",
                            )}
                        >
                            <Play className="fill-white"/>
                        </Link>
                    )}
                </div>
            </div>



            <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>編輯跑位</DialogTitle>
                        <DialogDescription>修改跑位的名稱與描述。</DialogDescription>
                    </DialogHeader>
                    <form
                        id="workout-info-form"
                        className="flex flex-col gap-4"
                        onSubmit={e => {
                            e.preventDefault()
                            saveInfoDialog()
                        }}
                    >
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workout-name">名稱</Label>
                            <Input
                                id="workout-name"
                                autoFocus
                                value={draftName}
                                onChange={e => setDraftName(e.target.value)}
                                placeholder="跑位名稱"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="workout-description">描述</Label>
                            <Textarea
                                id="workout-description"
                                value={draftDescription}
                                onChange={e => setDraftDescription(e.target.value)}
                                placeholder="敘述這個跑位…"
                                rows={3}
                            />
                        </div>
                    </form>
                    <DialogFooter>
                        <DialogClose className={buttonVariants({variant: "outline"})}>取消</DialogClose>
                        <Button type="submit" form="workout-info-form">儲存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="mt-2 flex flex-col gap-3">
                {poses.length === 0 && (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                        還沒有動作，點下方「新增動作」。
                    </p>
                )}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={poses.map(p => p.key)} strategy={verticalListSortingStrategy}>
                        {poses.map((pose, index) => (
                            <SortablePoseRow
                                key={pose.key}
                                pose={pose}
                                index={index}
                                onChange={update =>
                                    setPoses(prev => prev.map(p => (p.key === pose.key ? {...p, ...update} : p)))
                                }
                                onDelete={() => setPoses(prev => prev.filter(p => p.key !== pose.key))}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
                <Button variant="outline" onClick={addPose} className="border-dashed">
                    <Plus data-icon="inline-start"/>
                    新增動作
                </Button>
            </div>
        </main>
    )
}
