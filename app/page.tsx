import TypingEngine from "@/components/TypingEngine"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-background p-8">
      {/* Header Space */}
      <div className="flex w-full max-w-6xl items-center justify-between font-mono text-sm text-muted-foreground">
        <span className="text-xl font-black tracking-tighter text-foreground">
          poptype.
        </span>
        <span>v1.0.0-alpha</span>
      </div>

      {/* Immersive Center Game Environment Canvas */}
      <div className="flex w-full grow items-center justify-center">
        <TypingEngine />
      </div>

      {/* Footer Branding Space */}
      <div className="font-mono text-xs tracking-wide text-muted-foreground">
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
