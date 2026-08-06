"use client";

import { signOut } from "next-auth/react";

export default function Navbar() {
  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-4">

      <h2 className="text-2xl font-bold">
        Admin Dashboard
      </h2>

      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
      >
        Logout
      </button>

    </header>
  );
}