"use client"

import {cn} from "@/lib/utils"

type PaceGridProps = {
    /** Lit cell indexes (0-8, row-major) */
    locations: number[]
    /** Width/height of a single cell in px (ignored when `responsive`) */
    cellSize?: number
    /** Fill the container width with square cells instead of a fixed cell size */
    responsive?: boolean
    /** Makes the grid editable: tap a cell to make it the new location */
    onSelect?: (index: number) => void
    className?: string
}

export default function PaceGrid({
    locations,
    cellSize = 21,
    responsive = false,
    onSelect,
    className,
}: PaceGridProps) {
    const borderWidth = responsive ? 3 : Math.min(3.2, Math.max(0.8, cellSize / 30))
    const gap = responsive ? 10 : Math.min(10, Math.max(3, cellSize * 0.2))
    const radius = responsive ? 10 : Math.min(10, Math.max(4, cellSize * 0.25))

    return (
        <div
            className={cn("grid grid-cols-3", responsive ? "w-full" : "w-fit", className)}
            style={{gap}}
        >
            {Array.from({length: 9}, (_, i) => {
                const on = locations.includes(i)
                const style = responsive
                    ? {borderWidth, borderRadius: radius}
                    : {width: cellSize, height: cellSize, borderWidth, borderRadius: radius}
                const sizing = responsive ? "aspect-square w-full" : ""
                return onSelect ? (
                    <button
                        key={i}
                        type="button"
                        aria-label={`格子 ${i + 1}`}
                        aria-pressed={on}
                        onClick={() => onSelect(i)}
                        className={cn(
                            "border-foreground border-solid transition-colors",
                            sizing,
                            on ? "bg-foreground" : "bg-background hover:bg-muted",
                        )}
                        style={style}
                    />
                ) : (
                    <div
                        key={i}
                        className={cn(
                            "border-foreground border-solid",
                            sizing,
                            on ? "bg-foreground" : "bg-background",
                        )}
                        style={style}
                    />
                )
            })}
        </div>
    )
}
