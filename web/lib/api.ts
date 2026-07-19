export type Pose = {
    id: string
    location: number // 0-8, row-major cell in the 3x3 grid
    delayMillis: number
    createdAt: string
}

export type Workout = {
    id: string
    name: string
    description: string
    poses: Pose[]
    createdAt: string
    updatedAt: string
}

export type PosePayload = {
    location: number
    delayMillis: number
}

export type WorkoutPayload = {
    name: string
    description: string
    poses: PosePayload[]
}

export type Pagination = {
    totalItem: number
    totalPage: number
    currentPage: number
}

export type WorkoutList = {
    page: Pagination
    data: Workout[]
}

// Server-side only: called from server components and server actions.
const BASE = process.env.API_HOST ?? "http://localhost:8080"

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...init,
        cache: "no-store",
        headers: {"Content-Type": "application/json", ...init?.headers},
    })
    if (!res.ok) {
        let message = `Request failed (${res.status})`
        try {
            message = (await res.json()).message ?? message
        } catch {
        }
        throw new Error(message)
    }
    if (res.status === 204) return undefined as T
    return res.json()
}

export function listWorkouts(search = "") {
    return request<WorkoutList>(`/workout?search=${encodeURIComponent(search)}&limit=100`)
}

export function getWorkout(id: string) {
    return request<Workout>(`/workout/${id}`)
}

export function createWorkout(payload: WorkoutPayload) {
    return request<Workout>("/workout", {method: "POST", body: JSON.stringify(payload)})
}

export function updateWorkout(id: string, payload: WorkoutPayload) {
    return request<Workout>(`/workout/${id}`, {method: "PUT", body: JSON.stringify(payload)})
}

export function deleteWorkout(id: string) {
    return request<void>(`/workout/${id}`, {method: "DELETE"})
}
