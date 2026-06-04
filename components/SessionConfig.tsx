"use client"

import type { LucideIcon } from "lucide-react"
import { Eye, Gauge, Timer } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Difficulty } from "@/lib/wordBank"

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

function ConfigSegment({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="poptype-config flex overflow-hidden rounded-lg border border-border">
      <span className="flex items-center gap-1.5 border-r border-border bg-transparent px-3 py-2 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        <Icon className="size-3 shrink-0" aria-hidden />
        {label}
      </span>
      <div className="flex items-center bg-transparent p-1.5">{children}</div>
    </div>
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
  return (
    <div
      data-poptype-config
      className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <ConfigSegment icon={Gauge} label="difficulty">
        <ToggleGroup
          type="single"
          size="sm"
          value={difficulty}
          onValueChange={(v) => v && onDifficultyChange(v as Difficulty)}
          className="gap-0 border-0 bg-transparent p-0 shadow-none"
        >
          {DIFFICULTY_TIERS.map((tier) => (
            <ToggleGroupItem
              key={tier}
              value={tier}
              aria-label={tier}
              className="h-8 min-w-14 bg-transparent px-3 text-xs font-medium tracking-wide lowercase"
            >
              {tier}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ConfigSegment>

      <ConfigSegment icon={Timer} label="duration">
        <ToggleGroup
          type="single"
          size="sm"
          value={String(sessionDuration)}
          onValueChange={(v) => v && onDurationChange(Number(v))}
          className="gap-0 border-0 bg-transparent p-0 shadow-none"
        >
          {sessionOptions.map((sec) => (
            <ToggleGroupItem
              key={sec}
              value={String(sec)}
              aria-label={`${sec} seconds`}
              className="h-8 min-w-12 bg-transparent px-3 text-xs font-medium tracking-wide"
            >
              {sec}s
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </ConfigSegment>

      <ConfigSegment icon={Eye} label="preview">
        <ToggleGroup
          type="single"
          size="sm"
          value={showNextWord ? "true" : "false"}
          onValueChange={(v) => v && onShowNextWordChange(v === "true")}
          className="gap-0 border-0 bg-transparent p-0 shadow-none"
        >
          <ToggleGroupItem
            value="true"
            aria-label="Show next word"
            className="h-8 min-w-12 bg-transparent px-3 text-xs font-medium tracking-wide"
          >
            on
          </ToggleGroupItem>
          <ToggleGroupItem
            value="false"
            aria-label="Hide next word"
            className="h-8 min-w-12 bg-transparent px-3 text-xs font-medium tracking-wide"
          >
            off
          </ToggleGroupItem>
        </ToggleGroup>
      </ConfigSegment>
    </div>
  )
}
