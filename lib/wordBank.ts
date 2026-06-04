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

/** Deterministic PRNG for SSR-safe initial queues (must match server + client). */
function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), state | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), state | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Utility function to generate a randomized subset of words for a typing run.
 * Pass `seed` when the queue must be identical on server and client (e.g. initial hydrate).
 */
export function generateQueue(
  difficulty: keyof WordBank,
  count: number = 50,
  seed?: number
): string[] {
  const pool = wordBank[difficulty]
  const shuffled = [...pool]
  const random = seed !== undefined ? mulberry32(seed) : Math.random

  // Fisher-Yates Shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled.slice(0, count)
}
