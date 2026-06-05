import TypingEngine from "@/components/TypingEngine"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background p-8">
      {/* Header Space */}
      <div
        id="poptype-navbar"
        className="flex w-full max-w-6xl shrink-0 items-center justify-between font-mono text-sm text-muted-foreground"
      >
        <span className="text-2xl font-black tracking-tighter text-foreground">
          poptype.
        </span>
        <Badge variant="secondary">
          <span className="text-sm">v1.0.0-alpha</span>
        </Badge>
      </div>

      <div className="min-h-0 w-full flex-1">
        <TypingEngine />
      </div>

      {/* Footer Branding Space */}
      <span className="text-sm text-muted-foreground">
        built with 💖 & ☕ by{" "}
        <a
          href="https://github.com/taysatte"
          className="text-primary underline"
          target="_blank"
        >
          taysatte
        </a>
      </span>
    </main>
  )
}
