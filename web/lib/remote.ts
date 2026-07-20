import {Workout} from "@/lib/api"

export type RemoteClient = {
    id: string
    name: string
}

export type RemoteMode = "once" | "times" | "loop"

// connect/start carry the full workout so a controlled device can render the
// player immediately, without waiting on its own API round trip
export type RemoteAction =
    | {kind: "connect"; workout: Workout}
    | {kind: "start"; workout: Workout; mode: RemoteMode; times: number}
    | {kind: "pause"}
    | {kind: "resume"}
    | {kind: "stop"}
    | {kind: "disconnect"}

/** Playback state of this client while it is being remote controlled */
export type RemoteSession = {
    controllerName: string
    workout: Workout
    mode: RemoteMode
    times: number
    status: "idle" | "playing" | "paused"
    startedAt: number
}
