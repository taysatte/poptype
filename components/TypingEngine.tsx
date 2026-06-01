"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SAMPLE_WORDS = [
  "nextjs",
  "tailwind",
  "framer",
  "motion",
  "shadcn",
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

  // Calculate our 3-word window dynamically safely around array bounds
  const prevWord = currentIndex > 0 ? wordQueue[currentIndex - 1] : ""
  const currentWord = wordQueue[currentIndex] || ""
  const nextWord = wordQueue[(currentIndex + 1) % wordQueue.length] || ""

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentIndex])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()

    // Zero-Space Completion Match
    if (value === currentWord) {
      setTypedValue("")
      setCorrectCharCount(0)
      setCurrentIndex((prev) => (prev + 1) % wordQueue.length)
      return
    }

    if (currentWord.startsWith(value)) {
      setTypedValue(value)
      setCorrectCharCount(value.length)
    } else {
      const shakeElement = document.getElementById("carousel-viewport")
      if (shakeElement) {
        shakeElement.classList.add("animate-shake")
        setTimeout(() => shakeElement.classList.remove("animate-shake"), 150)
      }
    }
  }

  return (
    <div
      className="flex min-h-[500px] w-full flex-col items-center justify-center font-mono select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* The Carousel Viewport Arena */}
      <div
        id="carousel-viewport"
        className="relative grid h-32 w-full max-w-5xl grid-cols-3 items-center justify-center overflow-hidden px-4"
      >
        {/* LEFT SLOT: Previous Word */}
        <div className="pointer-events-none flex w-full justify-end overflow-hidden pr-16 text-2xl font-bold text-zinc-800 opacity-30 select-none">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`prev-${currentIndex}`}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 0.3 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="block whitespace-nowrap lowercase"
            >
              {prevWord}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* CENTER SLOT: Active Typing Target */}
        <div className="relative flex h-full w-full items-center justify-center text-6xl font-black tracking-tight">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`current-${currentIndex}`}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute flex items-center justify-center"
            >
              {currentWord.split("").map((char, index) => {
                let colorClass = "text-zinc-700"
                let shouldPop = false

                if (index < correctCharCount) {
                  colorClass = "text-zinc-50"
                  shouldPop = true
                }

                return (
                  <div
                    key={`${currentIndex}-char-${index}`}
                    className="char-container w-[42px]"
                  >
                    {shouldPop ? (
                      <motion.span
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{
                          duration: 0.12,
                          ease: [0.175, 0.885, 0.32, 1.275],
                        }}
                        className={`inline-block ${colorClass}`}
                      >
                        {char}
                      </motion.span>
                    ) : (
                      <span className={colorClass}>{char}</span>
                    )}

                    {index === correctCharCount && (
                      <motion.div
                        layoutId="typing-cursor"
                        className="absolute right-0 bottom-[-10px] left-0 h-[3px] bg-zinc-200"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT SLOT: Next Word */}
        <div className="pointer-events-none flex w-full justify-start overflow-hidden pl-16 text-2xl font-bold text-zinc-600 opacity-40 select-none">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={`next-${currentIndex}`}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 0.4 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="block whitespace-nowrap lowercase"
            >
              {nextWord}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Core Hidden Event Capturer */}
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
