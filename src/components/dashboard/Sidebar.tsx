"use client";

import Link from "next/link";
import { LayoutDashboard, Users, UserCog, Calendar, UserPlus, Megaphone, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">

      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-blue-400">
          MentorLink
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">

        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>

        <Link
          href="/admin/students"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
        >
          <Users size={20} />
          Students
        </Link>

        <Link
          href="/admin/mentors"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
        >
          <UserCog size={20} />
          Mentors
        </Link>

        <Link
          href="/admin/assign"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
        >
          <UserPlus size={20} />
          Assign Mentor
        </Link>

        <Link
          href="/admin/meetings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
        >
          <Calendar size={20} />
          Meetings
        </Link>

        <Link
          href="/admin/announcements"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
        >
          <Megaphone size={20} />
          Announcements
        </Link>

      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-3 rounded-lg transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

    </aside>
  );
}