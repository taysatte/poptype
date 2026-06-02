import { wordBank } from "../lib/wordBank"

for (const tier of ["easy", "medium", "hard"] as const) {
  const pool = wordBank[tier]
  const lengths = pool.map((w) => w.length)
  const min = Math.min(...lengths)
  const max = Math.max(...lengths)
  console.log(
    `${tier}: ${pool.length} words (len ${min}–${max}), longest: ${pool.find((w) => w.length === max)}`
  )
}
