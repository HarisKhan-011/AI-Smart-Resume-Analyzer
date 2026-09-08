"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  POSTED_WITHIN_OPTIONS,
  type PostedWithin,
} from "@/services/jobs/normalize-job"

export function DatePostedFilter({
  value,
  onChange,
  disabled = false,
}: {
  value: PostedWithin
  onChange: (value: PostedWithin) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<PostedWithin>(value)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const selectedLabel = POSTED_WITHIN_OPTIONS.find((option) => option.value === value)?.label

  function reset() {
    setDraft("all")
    onChange("all")
    setOpen(false)
  }

  function showResults() {
    onChange(draft)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm font-medium",
          open || value !== "all"
            ? "border-foreground bg-muted"
            : "border-input bg-background hover:bg-accent"
        )}
      >
        {selectedLabel ?? "Date posted"}
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Date posted"
          className="absolute left-0 z-20 mt-2 w-72 rounded-xl border bg-background p-2 shadow-lg"
        >
          <div className="space-y-1 p-2">
            {POSTED_WITHIN_OPTIONS.map((option) => {
              const checked = draft === option.value
              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      checked ? "border-foreground" : "border-muted-foreground/50"
                    )}
                    aria-hidden="true"
                  >
                    {checked && <span className="h-2 w-2 rounded-full bg-foreground" />}
                  </span>
                  <input
                    type="radio"
                    name="posted-within"
                    value={option.value}
                    checked={checked}
                    className="sr-only"
                    onChange={() => setDraft(option.value)}
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
          <div className="flex justify-end gap-2 border-t px-2 py-2">
            <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={reset}>
              Reset
            </Button>
            <Button type="button" size="sm" className="rounded-full" onClick={showResults}>
              Show results
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
