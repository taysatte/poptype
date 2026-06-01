"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { generateQueue, WordBank } from "@/lib/wordBank"

const SESSION_DURATION = 15

export default function TypingEngine() {
  // Config States
  const [difficulty, setDifficulty] = useState<keyof WordBank>("bronze")
  const [wordQueue, setWordQueue] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedValue, setTypedValue] = useState("")
  const [isError, setIsError] = useState(false)

  // Session & Timer States
  const [timeLeft, setTimeLeft] = useState(SESSION_DURATION)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isSessionFinished, setIsSessionFinished] = useState(false)

  // Stat Metrics Tracking
  const [totalKeysPressed, setTotalKeysPressed] = useState(0)
  const [correctKeysPressed, setCorrectKeysPressed] = useState(0)
  const [wordsCleared, setWordsCleared] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize and rebuild word queue based on difficulty adjustments
  useEffect(() => {
    setWordQueue(generateQueue(difficulty, 40))
    setCurrentIndex(0)
    setTypedValue("")
    setIsError(false)
  }, [difficulty])

  const prevWord = currentIndex > 0 ? wordQueue[currentIndex - 1] : ""
  const currentWord = wordQueue[currentIndex] || ""
  const nextWord = wordQueue[(currentIndex + 1) % wordQueue.length] || ""

  useEffect(() => {
    if (!isSessionFinished) {
      inputRef.current?.focus()
    }
  }, [currentIndex, isSessionFinished, wordQueue])

  useEffect(() => {
    if (isSessionActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsSessionActive(false)
      setIsSessionFinished(true)
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isSessionActive, timeLeft])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSessionFinished) return

    const value = e.target.value.toLowerCase()
    if (value.length > currentWord.length) return

    if (
      !isSessionActive &&
      !isSessionFinished &&
      value.length === 1 &&
      typedValue.length === 0
    ) {
      setIsSessionActive(true)
    }

    if (value.length > typedValue.length) {
      setTotalKeysPressed((prev) => prev + 1)
    }

    if (value === currentWord) {
      setCorrectKeysPressed((prev) => prev + 1)
      setWordsCleared((prev) => prev + 1)
      setTypedValue("")
      setIsError(false)
      setCurrentIndex((prev) => (prev + 1) % wordQueue.length)
      return
    }

    setTypedValue(value)

    const latestIndex = value.length - 1
    if (latestIndex >= 0 && value[latestIndex] !== currentWord[latestIndex]) {
      setIsError(true)
      const shakeElement = document.getElementById("carousel-viewport")
      if (shakeElement) {
        shakeElement.classList.remove("animate-shake")
        void shakeElement.offsetWidth
        shakeElement.classList.add("animate-shake")
      }
    } else {
      setIsError(false)
      if (value.length > typedValue.length) {
        setCorrectKeysPressed((prev) => prev + 1)
      }
    }
  }

  const resetSession = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setWordQueue(generateQueue(difficulty, 40))
    setCurrentIndex(0)
    setTypedValue("")
    setIsError(false)
    setTimeLeft(SESSION_DURATION)
    setIsSessionActive(false)
    setIsSessionFinished(false)
    setTotalKeysPressed(0)
    setCorrectKeysPressed(0)
    setWordsCleared(0)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        resetSession()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [difficulty])

  const timeElapsed = SESSION_DURATION - timeLeft
  const currentWpm =
    timeElapsed > 0 ? Math.round((wordsCleared / timeElapsed) * 60) : 0
  const currentAccuracy =
    totalKeysPressed > 0
      ? Math.round((correctKeysPressed / totalKeysPressed) * 100)
      : 100

  return (
    <div
      className="relative flex min-h-[500px] w-full flex-col items-center justify-center font-mono select-none"
      onClick={() => !isSessionFinished && inputRef.current?.focus()}
    >
      {/* Config Sub-Bar (Hidden during active typing runs for extreme focus) */}
      {!isSessionActive && !isSessionFinished && (
        <div className="absolute top-[-40px] flex gap-4 rounded-lg border border-zinc-800/60 bg-zinc-900/40 px-3 py-1.5 text-xs">
          {(["bronze", "silver", "gold"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setDifficulty(tier)}
              className={`rounded px-2 py-0.5 font-bold tracking-wider lowercase transition-all ${
                difficulty === tier
                  ? "scale-105 bg-zinc-100 font-black text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      )}

      {/* Live Sleek Timer / Status Header Banner */}
      <div className="mb-12 flex h-6 items-center gap-12 text-sm tracking-wider text-zinc-500">
        <div>
          time:{" "}
          <span
            className={`font-bold transition-colors ${isSessionActive ? "text-zinc-200" : "text-zinc-500"}`}
          >
            {timeLeft}s
          </span>
        </div>
        {isSessionActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-6"
          >
            <div>
              wpm: <span className="font-bold text-zinc-300">{currentWpm}</span>
            </div>
            <div>
              acc:{" "}
              <span className="font-bold text-zinc-300">
                {currentAccuracy}%
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isSessionFinished ? (
          /* The Carousel Viewport Arena */
          <motion.div
            key="game-active"
            exit={{ opacity: 0, y: -20 }}
            id="carousel-viewport"
            className="relative flex h-32 w-full max-w-5xl items-center justify-center overflow-hidden px-4"
          >
            {/* The Sliding Horizon Container */}
            <div className="relative grid h-full w-full grid-cols-3 items-center justify-center">
              {/* LEFT SLOT: Previous Word */}
              <div className="pointer-events-none flex justify-end overflow-hidden pr-16 text-2xl font-bold whitespace-nowrap text-zinc-800 opacity-30 select-none">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`prev-${currentIndex}`}
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 0.3 }}
                    exit={{ x: -30, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="block lowercase"
                  >
                    {prevWord}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* CENTER SLOT: Active Typing Target */}
              <div className="relative z-10 flex h-full items-center justify-center text-6xl font-black tracking-tight">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={`current-${currentIndex}`}
                    initial={{ x: 50, opacity: 0, scale: 0.95 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    exit={{
                      x: -80,
                      opacity: 0,
                      scale: 0.7,
                      filter: "blur(4px)",
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                    className="absolute flex items-center justify-center"
                  >
                    {currentWord.split("").map((char, index) => {
                      let colorClass = "text-zinc-700"
                      let shouldPop = false

                      if (index < typedValue.length) {
                        if (typedValue[index] === currentWord[index]) {
                          colorClass = "text-zinc-50"
                          if (index === typedValue.length - 1 && !isError) {
                            shouldPop = true
                          }
                        } else {
                          colorClass = "text-red-500 bg-red-500/10 rounded-sm"
                        }
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
                            <span
                              className={`${colorClass} inline-block transition-colors duration-100`}
                            >
                              {char}
                            </span>
                          )}

                          {index === typedValue.length && (
                            <motion.div
                              layoutId="typing-cursor"
                              className={`absolute right-0 bottom-[-10px] left-0 h-[3px] ${isError ? "bg-red-500" : "bg-zinc-200"}`}
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
              <div className="pointer-events-none flex justify-start overflow-hidden pl-16 text-2xl font-bold whitespace-nowrap text-zinc-600 opacity-40 select-none">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`next-${currentIndex}`}
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 0.4 }}
                    exit={{ x: -30, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="block lowercase"
                  >
                    {nextWord}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          /* SESSION SUMMARY VIEW */
          <motion.div
            key="game-score"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="flex h-32 flex-col items-center justify-center p-6 text-center"
          >
            <div className="flex gap-16">
              <div className="flex flex-col items-start">
                <span className="text-xs tracking-wider text-zinc-500 uppercase">
                  wpm
                </span>
                <span className="text-6xl font-black text-zinc-50">
                  {currentWpm}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs tracking-wider text-zinc-500 uppercase">
                  accuracy
                </span>
                <span className="text-6xl font-black text-zinc-50">
                  {currentAccuracy}%
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs tracking-wider text-zinc-500 uppercase">
                  cleared
                </span>
                <span className="text-6xl font-black text-zinc-50">
                  {wordsCleared}
                </span>
              </div>
            </div>

            <button
              onClick={resetSession}
              className="mt-8 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs tracking-widest text-zinc-500 uppercase transition-all hover:border-zinc-700 hover:text-zinc-300"
            >
              [ press escape or click to retry ]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isSessionFinished && (
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
      )}

      {!isSessionFinished && (
        <div className="mt-16 text-xs tracking-widest text-zinc-600 uppercase">
          {isSessionActive
            ? "[ clock ticking — push pace ]"
            : "[ select difficulty then start typing ]"}
        </div>
      )}
    </div>
  )
}
