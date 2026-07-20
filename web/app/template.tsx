export default function Template({children}: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
        </div>
    )
}
