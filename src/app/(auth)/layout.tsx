import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f]">
      {/* Minimal header */}
      <header className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <Image src="/logo-circa.png" alt="Circa" width={38} height={38} className="shrink-0" />
          <span className="text-2xl font-bold tracking-tight text-slate-100">Circa</span>
        </Link>
      </header>

      {/* Auth card */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-2xl border border-slate-700/50 bg-white/5 p-8 backdrop-blur-md shadow-[0_8px_32px_rgb(0,0,0,0.4)]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Circa · Built for global fans
      </footer>
    </div>
  );
}
