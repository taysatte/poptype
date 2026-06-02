export type WordTier = "easy" | "medium" | "hard"

const MIN_LEN = 3
const EASY_MAX = 5
const MEDIUM_MAX = 7

export function tierByLength(word: string): WordTier | null {
  const len = word.length
  if (len < MIN_LEN) return null
  if (len <= EASY_MAX) return "easy"
  if (len <= MEDIUM_MAX) return "medium"
  return "hard"
}

export function partitionFrequencyWords(
  words: readonly string[]
): Record<WordTier, string[]> {
  const tiers: Record<WordTier, string[]> = {
    easy: [],
    medium: [],
    hard: [],
  }

  const seen = new Set<string>()

  for (const word of words) {
    const tier = tierByLength(word)
    if (!tier || seen.has(word)) continue
    seen.add(word)
    tiers[tier].push(word)
  }

  return tiers
}
