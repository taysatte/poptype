import { getNormalizedFrequencyWords } from "@/lib/frequencyWords"
import { partitionFrequencyWords } from "@/lib/wordTiers"

export interface WordBank {
  easy: string[]
  medium: string[]
  hard: string[]
}

export type Difficulty = keyof WordBank

const CUSTOM_WORDS: WordBank = {
  easy: [
    "cat",
    "dog",
    "rust",
    "code",
    "wind",
    "form",
    "text",
    "pure",
    "snap",
    "jolt",
    "bolt",
    "node",
    "sync",
    "flow",
    "fast",
    "dash",
    "flick",
    "rush",
    "tiny",
    "pop",
    "core",
    "axis",
    "kern",
    "mono",
    "volt",
    "byte",
    "data",
    "link",
    "file",
    "loop",
  ],
  medium: [
    "engine",
    "buffer",
    "canvas",
    "pixel",
    "framer",
    "motion",
    "shadcn",
    "vector",
    "minimal",
    "rapid",
    "stable",
    "spring",
    "bounce",
    "matrix",
    "layout",
    "cursor",
    "glitch",
    "arcade",
    "tactile",
    "device",
    "stream",
    "bubble",
    "unzip",
    "render",
  ],
  hard: [
    "abstract",
    "monopoly",
    "synergy",
    "exertion",
    "complex",
    "irregular",
    "keyboard",
    "structure",
    "framework",
    "conveyor",
    "velocity",
    "staccato",
    "stenography",
    "mechanical",
    "friction",
    "burstfire",
    "responsive",
    "deployment",
    "optimization",
  ],
}

function mergeTier(tier: Difficulty, frequency: string[]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const word of [...frequency, ...CUSTOM_WORDS[tier]]) {
    const key = word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(key)
  }

  return merged
}

const frequencyByTier = partitionFrequencyWords(getNormalizedFrequencyWords())

export const wordBank: WordBank = {
  easy: mergeTier("easy", frequencyByTier.easy),
  medium: mergeTier("medium", frequencyByTier.medium),
  hard: mergeTier("hard", frequencyByTier.hard),
}

/**
 * Utility function to generate a randomized subset of words for a typing run
 */
export function generateQueue(
  difficulty: keyof WordBank,
  count: number = 50
): string[] {
  const pool = wordBank[difficulty]
  const shuffled = [...pool]

  // Fisher-Yates Shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Slices a random cluster and loops it to ensure the pipeline never runs completely empty
  const selected = shuffled.slice(0, count)
  return selected
}
