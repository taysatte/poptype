"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SAMPLE_WORDS = [
  "nextjs",
  "tailwind",
  "framer",
  "motion",
  "shndcn",
  "typing",
  "engine",
  "canvas",
  "minimal",
  "vector",
]

export default function TypingEngine() {
  const [wordQueue, setWordQueue] = useState<string[]>(SAMPLE_WORDS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedValue, setTypedValue] = useState("")
  const [correctCharCount, setCorrectCharCount] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  const currentWord = wordQueue[currentIndex] || ""
  const nextWord = wordQueue[(currentIndex + 1) % wordQueue.length] || ""

  // Enforce global area focus targeting
  useEffect(() => {
    inputRef.current?.focus()
  }, [currentIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()

    // Exact Word Match Trigger Loop (Zero-Space Completion)
    if (value === currentWord) {
      setTypedValue("")
      setCorrectCharCount(0)
      setCurrentIndex((prev) => (prev + 1) % wordQueue.length)
      return
    }

    // Step-by-step sequential string character match validation
    if (currentWord.startsWith(value)) {
      setTypedValue(value)
      setCorrectCharCount(value.length)
    } else {
      // Prevent input value change if it deviates from path accuracy limits
      // This enforces clean muscle-memory corrections
      const shakeElement = document.getElementById("word-canvas-wrapper")
      if (shakeElement) {
        shakeElement.classList.add("animate-shake")
        setTimeout(() => shakeElement.classList.remove("animate-shake"), 150)
      }
    }
  }

  return (
    <div
      className="flex min-h-[500px] flex-col items-center justify-center font-mono select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Target Canvas Wrapper */}
      <div className="flex h-32 w-full max-w-4xl items-baseline justify-center gap-12 overflow-hidden px-4">
        {/* Active Target Component Container */}
        <div
          id="word-canvas-wrapper"
          className="flex items-center text-6xl font-black tracking-tight select-none"
        >
          {currentWord.split("").map((char, index) => {
            let colorClass = "text-zinc-700" // Upcoming character colors
            let shouldPop = false

            if (index < correctCharCount) {
              colorClass = "text-zinc-50" // Completed characters
              shouldPop = true
            }

            return (
              <div
                key={`${currentIndex}-${index}`}
                className="char-container w-[42px]"
              >
                {shouldPop ? (
                  <motion.span
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{
                      duration: 0.12, // Ultra-fast frame duration
                      ease: [0.175, 0.885, 0.32, 1.275], // Custom elastic cubic-bezier
                    }}
                    className={`inline-block ${colorClass}`}
                  >
                    {char}
                  </motion.span>
                ) : (
                  <span className={colorClass}>{char}</span>
                )}

                {/* Active Underline Blinking Block Cursor Indicator */}
                {index === correctCharCount && (
                  <motion.div
                    layoutId="typing-cursor"
                    className="absolute right-0 bottom-[-10px] left-0 h-[3px] bg-zinc-200"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Ghost Word Queue System Preview Panel */}
        <div className="pointer-events-none text-3xl font-bold text-zinc-800 lowercase opacity-40 select-none">
          {nextWord}
        </div>
      </div>

      {/* Completely Invisible Core Input Event Capturer */}
      <input
        ref={inputRef}
        type="text"
        value={typedValue}
        onChange={handleInputChange}
        className="pointer-events-none absolute h-0 w-0 cursor-default opacity-0"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      <div className="mt-16 animate-pulse text-xs tracking-widest text-zinc-600 uppercase">
        [ system active: start typing to fire ]
      </div>
    </div>
  )
}
