"use server"

import {revalidatePath} from "next/cache"
import {redirect} from "next/navigation"
import {createWorkout, deleteWorkout, updateWorkout, WorkoutPayload} from "@/lib/api"

export async function createWorkoutAction() {
    const workout = await createWorkout({name: "新跑位", description: "", poses: []})
    revalidatePath("/settings")
    redirect(`/settings/edit/${workout.id}`)
}

export async function deleteWorkoutAction(id: string) {
    await deleteWorkout(id)
    revalidatePath("/settings")
}

export async function updateWorkoutAction(id: string, payload: WorkoutPayload) {
    await updateWorkout(id, payload)
    revalidatePath("/settings")
    revalidatePath(`/settings/edit/${id}`)
}
