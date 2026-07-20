import {Loader} from "lucide-react"

export default function EditLoading() {
    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center p-6">
            <Loader className="size-6 animate-spin text-muted-foreground"/>
        </main>
    )
}
