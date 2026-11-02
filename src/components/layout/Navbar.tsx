
"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl text-white shadow-lg shadow-blue-500/20 transition group-hover:scale-105">
            🎓
          </div>

          <div>
            <span className="block text-xl font-extrabold tracking-tight text-slate-900">
              Mentor<span className="text-blue-600">Link</span>
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Learn. Connect. Grow.
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-blue-600 sm:block"
          >
            Home
          </Link>

          <a
            href="#features"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-blue-600 sm:block"
          >
            Features
          </a>

          <Link
            href="/login"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:px-5"
          >
            Login
          </Link>

          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:px-5"
          >
            Get Started <span className="hidden sm:inline">→</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
