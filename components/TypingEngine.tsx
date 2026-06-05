"use client"

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import SessionConfig from "@/components/SessionConfig"
import { generateQueue, type Difficulty } from "@/lib/wordBank"

const SESSION_OPTIONS = [15, 30, 45, 60] as const
type SessionDuration = (typeof SESSION_OPTIONS)[number]

function queueSizeFor(duration: SessionDuration): number {
  const sizes: Record<SessionDuration, number> = {
    15: 40,
    30: 60,
    45: 80,
    60: 100,
  }
  return sizes[duration]
}

function isPoptypeConfigTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("[data-poptype-config]") !== null
  )
}

const CHAR_SLOT_PX = 42
/** Half of carousel viewport height (h-32) — arena is pinned to 50vh. */
const ARENA_HALF_REM = 4
/** Fixed seed so the first SSR + hydrate render the same word queue. */
const INITIAL_QUEUE_SEED = 1

/** Side gap scales with the active word so neighbors do not overlap long targets. */
function carouselSpacing(word: string) {
  const len = Math.max(word.length, 1)
  return {
    centerWidth: len * CHAR_SLOT_PX,
    gap: Math.max(48, Math.min(176, len * 10 + 32)),
  }
}

export default function TypingEngine() {
  // Config States
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [sessionDuration, setSessionDuration] = useState<SessionDuration>(15)
  const [wordQueue, setWordQueue] = useState(() =>
    generateQueue("easy", queueSizeFor(15), INITIAL_QUEUE_SEED)
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedValue, setTypedValue] = useState("")
  const [isError, setIsError] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [showNextWord, setShowNextWord] = useState(true)

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
  const [navbarBottom, setNavbarBottom] = useState(0)

  useLayoutEffect(() => {
    const measureNavbar = () => {
      const navbar = document.getElementById("poptype-navbar")
      if (navbar) {
        setNavbarBottom(navbar.getBoundingClientRect().bottom)
      }
    }

    measureNavbar()
    window.addEventListener("resize", measureNavbar)

    const navbar = document.getElementById("poptype-navbar")
    const observer =
      navbar && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measureNavbar)
        : null
    if (navbar && observer) observer.observe(navbar)

    return () => {
      window.removeEventListener("resize", measureNavbar)
      observer?.disconnect()
    }
  }, [])

  const focusInput = useCallback(() => {
    if (!isSessionFinished) {
      inputRef.current?.focus()
    }
  }, [isSessionFinished])

  const applyIdleDifficulty = useCallback(
    (next: Difficulty) => {
      setDifficulty(next)
      if (!isSessionActive && !isSessionFinished) {
        setWordQueue(generateQueue(next, queueSizeFor(sessionDuration)))
        setCurrentIndex(0)
        setTypedValue("")
        setIsError(false)
      }
    },
    [isSessionActive, isSessionFinished, sessionDuration]
  )

  const applyIdleDuration = useCallback(
    (sec: SessionDuration) => {
      setSessionDuration(sec)
      if (!isSessionActive && !isSessionFinished) {
        setTimeLeft(sec)
      }
    },
    [isSessionActive, isSessionFinished]
  )

  const finishSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setIsSessionActive(false)
    setIsSessionFinished(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const prevWord = currentIndex > 0 ? wordQueue[currentIndex - 1] : ""
  const currentWord = wordQueue[currentIndex] || ""
  const nextWord = wordQueue[(currentIndex + 1) % wordQueue.length] || ""
  const { centerWidth, gap: carouselGap } = carouselSpacing(currentWord)

  const showArenaFocusHint =
    !isInputFocused && !isSessionFinished && !isSessionActive

  useEffect(() => {
    focusInput()
  }, [currentIndex, wordQueue, focusInput])

  useEffect(() => {
    if (!isSessionActive) return

    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          queueMicrotask(finishSession)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    timerRef.current = id

    return () => {
      clearInterval(id)
      if (timerRef.current === id) timerRef.current = null
    }
  }, [isSessionActive, finishSession])

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
      if (e.key === "Escape" && !isSessionActive) {
        e.preventDefault()
        resetSession()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [resetSession, isSessionActive])

  const timeElapsed = isSessionFinished
    ? sessionDuration
    : sessionDuration - timeLeft
  const currentWpm =
    timeElapsed > 0 ? Math.round((wordsCleared / timeElapsed) * 60) : 0
  const currentAccuracy =
    totalKeysPressed > 0
      ? Math.round((correctKeysPressed / totalKeysPressed) * 100)
      : 100

  const handleRootPointerDown = (e: React.PointerEvent) => {
    if (!isPoptypeConfigTarget(e.target)) focusInput()
  }

  const handleRootClick = (e: React.MouseEvent) => {
    if (!isPoptypeConfigTarget(e.target)) focusInput()
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const next = e.relatedTarget
    if (
      next instanceof Node &&
      document.querySelector("[data-poptype-config]")?.contains(next)
    ) {
      return
    }
    setIsInputFocused(false)
  }

  const showHud = isSessionActive || (!isSessionActive && !isSessionFinished)
  const hudBandStyle = {
    top: navbarBottom > 0 ? navbarBottom : "4.5rem",
    bottom: `calc(50vh + ${ARENA_HALF_REM}rem)`,
  }

  return (
    <div
      className="relative h-full w-full font-mono select-none"
      onClick={handleRootClick}
      onPointerDown={handleRootPointerDown}
    >
      {showHud && (
        <div
          className="pointer-events-none fixed inset-x-0 z-20 flex items-center justify-center px-4"
          style={hudBandStyle}
        >
          <div className="pointer-events-auto w-full max-w-2xl text-sm tracking-wider text-muted-foreground">
            {isSessionActive && (
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div>
                  time:{" "}
                  <span className="font-bold text-foreground">{timeLeft}s</span>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-6"
                >
                  <div>
                    wpm:{" "}
                    <span className="font-bold text-foreground">
                      {currentWpm}
                    </span>
                  </div>
                  <div>
                    acc:{" "}
                    <span className="font-bold text-foreground">
                      {currentAccuracy}%
                    </span>
                  </div>
                </motion.div>
              </div>
            )}
            {!isSessionActive && !isSessionFinished && (
              <SessionConfig
                difficulty={difficulty}
                sessionDuration={sessionDuration}
                sessionOptions={SESSION_OPTIONS}
                showNextWord={showNextWord}
                onDifficultyChange={applyIdleDifficulty}
                onDurationChange={(sec) =>
                  applyIdleDuration(sec as SessionDuration)
                }
                onShowNextWordChange={setShowNextWord}
              />
            )}
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-4">
        <div className="pointer-events-auto w-full max-w-6xl">
          <AnimatePresence mode="wait">
            {!isSessionFinished ? (
              <motion.div
                key="game-active"
                exit={{ opacity: 0, y: -20 }}
                id="carousel-viewport"
                className="relative flex h-32 w-full max-w-6xl items-center justify-center overflow-hidden px-4"
              >
                {showArenaFocusHint && (
                  <div
                    className="poptype-arena-overlay pointer-events-none absolute inset-0 z-20 transition-opacity duration-200"
                    aria-hidden
                  />
                )}

                <div
                  className="flex h-full w-full max-w-full items-center"
                  style={{ gap: carouselGap }}
                >
                  <div className="pointer-events-none flex min-w-0 flex-1 basis-0 justify-end overflow-hidden text-2xl font-bold whitespace-nowrap text-muted-foreground/30 line-through select-none">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={`prev-${currentIndex}`}
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 0.2 }}
                        exit={{ x: -30, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                        }}
                        className="block lowercase"
                      >
                        {prevWord}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div
                    className="relative z-10 flex h-full shrink-0 items-center justify-center text-6xl font-black tracking-tight"
                    style={{ width: centerWidth }}
                  >
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
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 28,
                        }}
                        className="absolute flex items-center justify-center"
                      >
                        {currentWord.split("").map((char, index) => {
                          // High-contrast clean visibility split
                          let colorClass = "text-zinc-600 dark:text-zinc-500" // Crisp distinct untyped gray
                          let shouldPop = false

                          // Find the exact starting position of divergence
                          const firstErrorIndex = currentWord
                            .split("")
                            .findIndex(
                              (c, i) =>
                                i < typedValue.length && typedValue[i] !== c
                            )

                          if (index < typedValue.length) {
                            if (
                              firstErrorIndex !== -1 &&
                              index >= firstErrorIndex
                            ) {
                              // Freeze: only light up the exact mistake index
                              if (index === firstErrorIndex) {
                                colorClass =
                                  "text-destructive bg-destructive/10 rounded-sm"
                              } else {
                                colorClass = "text-zinc-600 dark:text-zinc-500"
                              }
                            } else {
                              colorClass = "text-foreground" // Bold white for correct strikes
                              if (index === typedValue.length - 1 && !isError) {
                                shouldPop = true
                              }
                            }
                          }

                          // Dynamic cursor tracker targeting active input indices safely bounds checking
                          const activeIndex = Math.min(
                            typedValue.length,
                            currentWord.length - 1
                          )

                          return (
                            <div
                              key={`${currentIndex}-char-${index}`}
                              className="char-container relative flex h-full flex-col items-center justify-center"
                              style={{ width: CHAR_SLOT_PX }}
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

                              {index === activeIndex && (
                                <motion.div
                                  layoutId="typing-cursor"
                                  className={`absolute right-0 bottom-[-14px] left-0 h-[3px] rounded-full ${
                                    isError ? "bg-destructive" : "bg-foreground"
                                  }`}
                                  transition={{
                                    type: "spring",
                                    stiffness: 600,
                                    damping: 38,
                                  }}
                                />
                              )}
                            </div>
                          )
                        })}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {showNextWord ? (
                    <div className="pointer-events-none flex min-w-0 flex-1 basis-0 justify-start overflow-hidden text-2xl font-bold whitespace-nowrap text-muted-foreground opacity-40 select-none">
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={`next-${currentIndex}`}
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 0.3 }}
                          exit={{ x: -30, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 32,
                          }}
                          className="block lowercase"
                        >
                          {nextWord}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1 basis-0" aria-hidden />
                  )}
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
        </div>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={typedValue}
        onChange={handleInputChange}
        onFocus={() => setIsInputFocused(true)}
        onBlur={handleInputBlur}
        readOnly={isSessionFinished}
        aria-hidden={isSessionFinished}
        tabIndex={isSessionFinished ? -1 : 0}
        className="pointer-events-none absolute h-0 w-0 cursor-default opacity-0"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />
    </div>
  )
}
