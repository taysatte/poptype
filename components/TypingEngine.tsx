"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { generateQueue, type Difficulty } from "@/lib/wordBank"

const SESSION_OPTIONS = [15, 30] as const
type SessionDuration = (typeof SESSION_OPTIONS)[number]

const DIFFICULTY_TIERS = [
  "easy",
  "medium",
  "hard",
] as const satisfies readonly Difficulty[]

function queueSizeFor(duration: SessionDuration): number {
  return duration === 30 ? 60 : 40
}

export default function TypingEngine() {
  // Config States
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(15)
  const [wordQueue, setWordQueue] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedValue, setTypedValue] = useState("")
  const [isError, setIsError] = useState(false)

  // Session & Timer States
  const [timeLeft, setTimeLeft] = useState<number>(15)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [isSessionFinished, setIsSessionFinished] = useState(false)

  // Stat Metrics Tracking
  const [totalKeysPressed, setTotalKeysPressed] = useState(0)
  const [correctKeysPressed, setCorrectKeysPressed] = useState(0)
  const [wordsCleared, setWordsCleared] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const focusInput = useCallback(() => {
    if (!isSessionFinished) {
      inputRef.current?.focus()
    }
  }, [isSessionFinished])

  // Rebuild queue and timer when idle config changes (not after a completed run)
  useEffect(() => {
    if (isSessionActive || isSessionFinished) return

    setWordQueue(generateQueue(difficulty, queueSizeFor(sessionDuration)))
    setCurrentIndex(0)
    setTypedValue("")
    setIsError(false)
    setTimeLeft(sessionDuration)
  }, [difficulty, sessionDuration, isSessionActive, isSessionFinished])

  const prevWord = currentIndex > 0 ? wordQueue[currentIndex - 1] : ""
  const currentWord = wordQueue[currentIndex] || ""
  const nextWord = wordQueue[(currentIndex + 1) % wordQueue.length] || ""

  useEffect(() => {
    focusInput()
  }, [currentIndex, wordQueue, focusInput])

  useEffect(() => {
    if (isSessionActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isSessionActive) {
      setIsSessionActive(false)
      setIsSessionFinished(true)
      if (timerRef.current) clearInterval(timerRef.current)
      requestAnimationFrame(() => inputRef.current?.focus())
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

  const resetSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setWordQueue(generateQueue(difficulty, queueSizeFor(sessionDuration)))
    setCurrentIndex(0)
    setTypedValue("")
    setIsError(false)
    setTimeLeft(sessionDuration)
    setIsSessionActive(false)
    setIsSessionFinished(false)
    setTotalKeysPressed(0)
    setCorrectKeysPressed(0)
    setWordsCleared(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [difficulty, sessionDuration])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        resetSession()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [resetSession])

  const timeElapsed = isSessionFinished
    ? sessionDuration
    : sessionDuration - timeLeft
  const currentWpm =
    timeElapsed > 0 ? Math.round((wordsCleared / timeElapsed) * 60) : 0
  const currentAccuracy =
    totalKeysPressed > 0
      ? Math.round((correctKeysPressed / totalKeysPressed) * 100)
      : 100

  return (
    <div
      className="relative flex min-h-[500px] w-full flex-col items-center justify-center font-mono select-none"
      onClick={focusInput}
      onPointerDown={focusInput}
    >
      {/* Config Sub-Bar (Hidden during active typing runs for extreme focus) */}
      {!isSessionActive && !isSessionFinished && (
        <div className="poptype-config absolute top-[-40px] flex items-center gap-0.5 rounded-lg bg-muted p-1">
          <ToggleGroup
            type="single"
            size="sm"
            value={difficulty}
            onValueChange={(v) => v && setDifficulty(v as Difficulty)}
            className="gap-0 border-0 p-0 shadow-none"
          >
            {DIFFICULTY_TIERS.map((tier) => (
              <ToggleGroupItem
                key={tier}
                value={tier}
                aria-label={tier}
                className="h-7 min-w-13 px-2.5 text-xs font-medium tracking-wide lowercase"
              >
                {tier}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="mx-0.5 h-4 w-px shrink-0 bg-border/70" aria-hidden />
          <ToggleGroup
            type="single"
            size="sm"
            value={String(sessionDuration)}
            onValueChange={(v) =>
              v && setSessionDuration(Number(v) as SessionDuration)
            }
            className="gap-0 border-0 p-0 shadow-none"
          >
            {SESSION_OPTIONS.map((sec) => (
              <ToggleGroupItem
                key={sec}
                value={String(sec)}
                aria-label={`${sec} seconds`}
                className="h-7 min-w-13 px-2.5 text-xs font-medium tracking-wide"
              >
                {sec}s
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Live Sleek Timer / Status Header Banner */}
      <div className="mb-12 flex h-6 items-center gap-12 text-sm tracking-wider text-muted-foreground">
        <div>
          time:{" "}
          <span
            className={`font-bold transition-colors ${isSessionActive ? "text-foreground" : "text-muted-foreground"}`}
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
              wpm:{" "}
              <span className="font-bold text-foreground">{currentWpm}</span>
            </div>
            <div>
              acc:{" "}
              <span className="font-bold text-foreground">
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
              <div className="pointer-events-none flex justify-end overflow-hidden pr-16 text-2xl font-bold whitespace-nowrap text-muted-foreground line-through select-none">
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
                      let colorClass = "text-muted-foreground"
                      let shouldPop = false

                      if (index < typedValue.length) {
                        if (typedValue[index] === currentWord[index]) {
                          colorClass = "text-foreground"
                          if (index === typedValue.length - 1 && !isError) {
                            shouldPop = true
                          }
                        } else {
                          colorClass =
                            "text-destructive bg-destructive/10 rounded-sm"
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
                              className={`absolute right-0 bottom-[-10px] left-0 h-[3px] ${isError ? "bg-destructive" : "bg-foreground"}`}
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
              <div className="pointer-events-none flex justify-start overflow-hidden pl-16 text-2xl font-bold whitespace-nowrap text-muted-foreground opacity-60 select-none">
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
                <span className="text-xs tracking-wider text-muted-foreground uppercase">
                  wpm
                </span>
                <span className="text-6xl font-black text-foreground">
                  {currentWpm}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs tracking-wider text-muted-foreground uppercase">
                  accuracy
                </span>
                <span className="text-6xl font-black text-foreground">
                  {currentAccuracy}%
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs tracking-wider text-muted-foreground uppercase">
                  cleared
                </span>
                <span className="text-6xl font-black text-foreground">
                  {wordsCleared}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={resetSession}
              className="mt-8 tracking-widest uppercase"
            >
              [ press escape or click to retry ]
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="text"
        value={typedValue}
        onChange={handleInputChange}
        readOnly={isSessionFinished}
        aria-hidden={isSessionFinished}
        tabIndex={isSessionFinished ? -1 : 0}
        className="pointer-events-none absolute h-0 w-0 cursor-default opacity-0"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {!isSessionFinished && (
        <div className="mt-16 text-xs tracking-widest text-muted-foreground uppercase">
          {isSessionActive
            ? "[ clock ticking — push pace ]"
            : "[ select difficulty & duration, then start typing ]"}
        </div>
      )}
    </div>
  )
}
