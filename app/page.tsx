import TypingEngine from "@/components/TypingEngine"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background p-8">
      {/* Header Space */}
      <div className="flex w-full max-w-6xl shrink-0 items-center justify-between font-mono text-sm text-muted-foreground">
        <span className="text-xl font-black tracking-tighter text-foreground">
          poptype.
        </span>
        <span>v1.0.0-alpha</span>
      </div>

      {/* Typing arena — viewport-centered; config/stats pin near top via TypingEngine */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <TypingEngine />
      </div>

      {/* Footer Branding Space */}
      <div className="shrink-0 font-mono text-xs tracking-wide text-muted-foreground">
        built with 💖 & ☕ by{" "}
        <a
          href="https://github.com/taysatte"
          className="text-primary underline"
          target="_blank"
        >
          taysatte
        </a>
      </div>
    </main>
  )
}
