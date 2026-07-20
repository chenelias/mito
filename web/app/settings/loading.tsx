export default function SettingsLoading() {
    return (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">我的跑位</h1>
                <div className="h-9 w-27 animate-pulse rounded-lg bg-muted"/>
            </div>
            <div className="flex flex-col gap-3">
                {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="h-19 animate-pulse rounded-xl bg-muted"/>
                ))}
            </div>
        </main>
    )
}
