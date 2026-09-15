"use client";

import { useEffect, useState } from "react";
import { signOut, getSession } from "next-auth/react";

export default function Navbar() {
  const [title, setTitle] = useState("Dashboard");

  useEffect(() => {
    async function loadRole() {
      const session = await getSession();
      const role = (session?.user as any)?.role;

      if (role === "admin") {
        setTitle("Admin Dashboard");
      } else if (role === "mentor") {
        setTitle("Mentor Dashboard");
      } else if (role === "student") {
        setTitle("Student Dashboard");
      }
    }

    loadRole();
  }, []);

  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-4">
      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
      >
        Logout
      </button>
    </header>
  );
}
