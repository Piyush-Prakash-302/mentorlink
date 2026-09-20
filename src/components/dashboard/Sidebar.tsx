"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  UserPlus,
  Mail,
  Calendar,
  Megaphone,
  ClipboardList,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar() {
  const [role, setRole] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadRole() {
      const session = await getSession();
      setRole((session?.user as any)?.role || "");
    }

    loadRole();
  }, []);

  const dashboard =
    role === "admin"
      ? "/admin/dashboard"
      : role === "mentor"
      ? "/mentor/dashboard"
      : "/student/dashboard";

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-3 rounded-lg shadow-lg"
      >
        <Menu size={22} />
      </button>

      {/* Mobile Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 min-h-screen bg-slate-900 text-white flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-blue-400">
            MentorLink
          </h1>

          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {/* Dashboard */}
          <Link
            href={dashboard}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>

          {/* Student Menu */}
          {role === "student" && (
            <Link
              href="/student/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
            >
              <User size={20} />
              My Profile
            </Link>
          )}

          {/* Admin Menu */}
          {role === "admin" && (
            <>
              <Link
                href="/admin/students"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                <Users size={20} />
                Students
              </Link>

              <Link
                href="/admin/mentors"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                <UserCog size={20} />
                Mentors
              </Link>

              <Link
                href="/admin/assign-mentor"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                <UserPlus size={20} />
                Assign Mentor
              </Link>

              <Link
                href="/admin/authorized-emails"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                <Mail size={20} />
                Authorized Emails
              </Link>
            </>
          )}

          {/* Mentor Menu */}
          {role === "mentor" && (
            <>
              {/* Mentor Profile */}
              <Link
                href="/mentor/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                <User size={20} />
                My Profile
              </Link>

              <Link
                href="/meeting"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                <Calendar size={20} />
                Meetings
              </Link>

              <Link
                href="/announcement"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                <Megaphone size={20} />
                Announcements
              </Link>

              <Link
                href="/assignments"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition"
              >
                <ClipboardList size={20} />
                Assignments
              </Link>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 py-3 rounded-lg transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}