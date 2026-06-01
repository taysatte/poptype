import TypingEngine from "@/components/TypingEngine"

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-[#09090b] p-8">
      {/* Header Space */}
      <div className="flex w-full max-w-6xl items-center justify-between font-mono text-sm text-zinc-500">
        <span className="text-lg font-bold tracking-tighter text-zinc-200">
          poptype.
        </span>
        <span>v1.0.0-alpha</span>
      </div>

      {/* Immersive Center Game Environment Canvas */}
      <div className="flex w-full grow items-center justify-center">
        <TypingEngine />
      </div>

      {/* Footer Branding Space */}
      <div className="font-mono text-xs tracking-wide text-zinc-600">
        built with next.js + tailwind + framer-motion
      </div>
    </main>
  )
}
