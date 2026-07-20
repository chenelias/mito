import type {Metadata} from "next"

export const metadata: Metadata = {
    title: "使用說明 | Mito",
}

export default function HowToUseLayout({children}: { children: React.ReactNode }) {
    return (
        <main className="mx-auto w-full max-w-3xl flex-1 p-6">
            <article className="prose prose-neutral dark:prose-invert max-w-none">
                {children}
            </article>
        </main>
    )
}
