"use client"

import {cn} from "@/lib/utils"

type PaceGridProps = {
    /** Lit cell indexes (0-8, row-major) */
    locations: number[]
    /** Width/height of a single cell in px */
    cellSize?: number
    /** Makes the grid editable: tap a cell to make it the new location */
    onSelect?: (index: number) => void
    className?: string
}

export default function PaceGrid({locations, cellSize = 21, onSelect, className}: PaceGridProps) {
    const borderWidth = Math.min(3.2, Math.max(0.8, cellSize / 30))
    const gap = Math.min(10, Math.max(3, cellSize * 0.2))
    const radius = Math.min(10, Math.max(4, cellSize * 0.25))

    return (
        <div className={cn("grid grid-cols-3 w-fit", className)} style={{gap}}>
            {Array.from({length: 9}, (_, i) => {
                const on = locations.includes(i)
                const style = {width: cellSize, height: cellSize, borderWidth, borderRadius: radius}
                return onSelect ? (
                    <button
                        key={i}
                        type="button"
                        aria-label={`格子 ${i + 1}`}
                        aria-pressed={on}
                        onClick={() => onSelect(i)}
                        className={cn(
                            "border-foreground border-solid transition-colors",
                            on ? "bg-foreground" : "bg-background hover:bg-muted",
                        )}
                        style={style}
                    />
                ) : (
                    <div
                        key={i}
                        className={cn(
                            "border-foreground border-solid",
                            on ? "bg-foreground" : "bg-background",
                        )}
                        style={style}
                    />
                )
            })}
        </div>
    )
}
