import { Globe } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-brand-50">
      {/* Minimal header */}
      <header className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Globe className="h-5 w-5 text-white" />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900">FanZone</span>
        </Link>
      </header>

      {/* Auth card */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} FanZone · Built for global fans
      </footer>
    </div>
  );
}
