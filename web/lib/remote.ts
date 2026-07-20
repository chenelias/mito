export type RemoteClient = {
    id: string
    name: string
}

export type RemoteMode = "once" | "times" | "loop"

export type RemoteAction =
    | {kind: "connect"; workoutId: string; workoutName: string}
    | {kind: "start"; workoutId: string; workoutName: string; mode: RemoteMode; times: number}
    | {kind: "pause"}
    | {kind: "resume"}
    | {kind: "stop"}
    | {kind: "disconnect"}

/** Playback state of this client while it is being remote controlled */
export type RemoteSession = {
    controllerName: string
    workoutId: string
    workoutName: string
    mode: RemoteMode
    times: number
    status: "idle" | "playing" | "paused"
    startedAt: number
}
