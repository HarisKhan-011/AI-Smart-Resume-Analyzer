"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { suggestJobKeywords } from "@/lib/job-keyword-suggestions"

export function KeywordSuggestInput({
  id,
  name,
  value,
  onChange,
  onPick,
  disabled = false,
  placeholder,
  className,
  ariaLabel,
}: {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  onPick?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  ariaLabel?: string
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const listId = `${inputId}-suggestions`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const suggestions = suggestJobKeywords(value)
  const listOpen = open && !disabled && suggestions.length > 0

  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  useEffect(() => {
    if (!listOpen) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [listOpen])

  function pick(keyword: string) {
    onChange(keyword)
    setOpen(false)
    onPick?.(keyword)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!listOpen) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        event.preventDefault()
        setOpen(true)
      }
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % suggestions.length)
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + suggestions.length) % suggestions.length)
      return
    }
    if (event.key === "Enter" && suggestions[activeIndex]) {
      event.preventDefault()
      pick(suggestions[activeIndex])
      return
    }
    if (event.key === "Escape") {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Input
        id={inputId}
        name={name}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        role="combobox"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={listOpen}
        aria-controls={listId}
        aria-activedescendant={listOpen ? `${listId}-option-${activeIndex}` : undefined}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onKeyDown={onKeyDown}
      />
      {listOpen && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Keyword suggestions"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-background py-1 shadow-lg"
        >
          {suggestions.map((keyword, index) => (
            <li
              id={`${listId}-option-${index}`}
              key={keyword}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                index === activeIndex ? "bg-muted" : "hover:bg-muted/70"
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                pick(keyword)
              }}
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              {keyword}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
