"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import type { Difficulty } from "@/lib/wordBank"
import { cn } from "@/lib/utils"

const DIFFICULTY_TIERS = [
  "easy",
  "medium",
  "hard",
] as const satisfies readonly Difficulty[]

type SessionConfigProps = {
  difficulty: Difficulty
  sessionDuration: number
  sessionOptions: readonly number[]
  showNextWord: boolean
  onDifficultyChange: (difficulty: Difficulty) => void
  onDurationChange: (seconds: number) => void
  onShowNextWordChange: (show: boolean) => void
}

type BracketOption<T extends string> = {
  value: T
  label: string
}

type BracketDropdownProps<T extends string> = {
  value: T
  options: readonly BracketOption<T>[]
  onValueChange: (value: T) => void
  ariaLabel: string
}

function BracketDropdown<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
}: BracketDropdownProps<T>) {
  const activeLabel =
    options.find((option) => option.value === value)?.label ?? value

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "inline rounded-sm align-baseline",
            "font-medium text-foreground uppercase",
            "transition-colors outline-none",
            "hover:bg-foreground/5 focus-visible:ring-1 focus-visible:ring-ring"
          )}
        >
          [{activeLabel}]
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="center"
        sideOffset={6}
        className="z-50 min-w-32 border-border"
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => next && onValueChange(next as T)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="text-foreground uppercase"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function SessionConfig({
  difficulty,
  sessionDuration,
  sessionOptions,
  showNextWord,
  onDifficultyChange,
  onDurationChange,
  onShowNextWordChange,
}: SessionConfigProps) {
  const difficultyOptions = DIFFICULTY_TIERS.map((tier) => ({
    value: tier,
    label: tier,
  }))

  const durationOptions = sessionOptions.map((sec) => ({
    value: String(sec),
    label: `${sec}s`,
  }))

  const previewOptions = [
    { value: "true", label: "on" },
    { value: "false", label: "off" },
  ] as const

  return (
    <div
      data-poptype-config
      className="max-w-2xl px-2 text-center text-sm leading-relaxed text-muted-foreground"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="m-0">
        train explosive speed on{" "}
        <BracketDropdown
          value={difficulty}
          options={difficultyOptions}
          onValueChange={onDifficultyChange}
          ariaLabel="Select difficulty tier"
        />{" "}
        tier for a duration of{" "}
        <BracketDropdown
          value={String(sessionDuration)}
          options={durationOptions}
          onValueChange={(v) => onDurationChange(Number(v))}
          ariaLabel="Select session duration"
        />
      </p>
      <p className="m-0 mt-1">
        with target horizon queue preview set to{" "}
        <BracketDropdown
          value={showNextWord ? "true" : "false"}
          options={previewOptions}
          onValueChange={(v) => onShowNextWordChange(v === "true")}
          ariaLabel="Select next word preview"
        />
      </p>
    </div>
  )
}
