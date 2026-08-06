"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow">
      <h1 className="text-2xl font-bold text-blue-600">
        MentorLink
      </h1>

      <div className="flex gap-6">
        <Link href="/">Home</Link>
        <Link href="/login">Login</Link>
      </div>
    </nav>
  );
}