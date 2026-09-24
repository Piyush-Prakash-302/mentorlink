"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  Megaphone,
  ClipboardList,
  BookOpen,
  Monitor,
  Info,
  GraduationCap,
  Network,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeacher = async () => {
      try {
        const res = await fetch("/api/teacher/dashboard", {
          cache: "no-store",
        });

        const data = await res.json();

        if (data.success) {
          setTeacher(data.teacher);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacher();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  const activities = [
    {
      title: "Announcements",
      description: "Send important information to your class.",
      href: "/teacher/announcements",
      icon: Megaphone,
      bg: "bg-pink-50",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      arrowBg: "bg-pink-500",
    },
    {
      title: "Assignments",
      description: "Create and share assignments with students.",
      href: "/teacher/assignments",
      icon: ClipboardList,
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      arrowBg: "bg-blue-500",
    },
    {
      title: "Homework",
      description: "Give homework to the entire class.",
      href: "/teacher/homework",
      icon: BookOpen,
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      arrowBg: "bg-purple-500",
    },
    {
      title: "Practicals",
      description: "Create and share practical work with students.",
      href: "/teacher/practical",
      icon: Monitor,
      bg: "bg-cyan-50",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
      arrowBg: "bg-cyan-500",
    },
    {
      title: "Class Information",
      description: "Share academic and class-related information.",
      href: "/teacher/class-info",
      icon: Info,
      bg: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      arrowBg: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">

      {/* Header */}
      <header className="bg-white border-b shadow-sm px-6 md:px-10 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-700">
            MentorLink
          </h1>
          <p className="text-sm text-gray-500">
            Teacher Portal
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold transition"
        >
          Logout
        </button>
      </header>

      <main className="p-6 md:p-10 max-w-7xl mx-auto">

        {/* Welcome Banner */}
        <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white shadow-xl mb-8">
          <p className="text-blue-100 text-lg mb-2">
            Welcome back,
          </p>

          <h2 className="text-4xl font-extrabold mb-3">
            {teacher?.name || "Teacher"}
          </h2>

          <p className="text-blue-100 text-lg">
            Teacher Dashboard
          </p>

          <p className="text-blue-100 mt-2">
            Manage your class activities and keep your students updated.
          </p>
        </section>

        {/* Academic Information */}
        <section className="bg-white rounded-3xl shadow-lg p-7 md:p-8 mb-10">
          <div className="flex items-center gap-4 mb-7">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <GraduationCap className="text-blue-600" size={27} />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Academic Information
              </h3>

              <p className="text-gray-500">
                Your assigned subject and class details.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Subject */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="text-blue-600" size={23} />
                <p className="text-gray-500 font-medium">
                  Subject
                </p>
              </div>

              <p className="text-2xl font-bold text-gray-900">
                {teacher?.subject || "Not assigned"}
              </p>
            </div>

            {/* Branch */}
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <Network className="text-green-600" size={23} />
                <p className="text-gray-500 font-medium">
                  Branch
                </p>
              </div>

              <p className="text-2xl font-bold text-gray-900">
                {teacher?.branch || "Not assigned"}
              </p>
            </div>

            {/* Semester */}
            <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
              <div className="flex items-center gap-3 mb-3">
                <CalendarDays className="text-yellow-600" size={23} />
                <p className="text-gray-500 font-medium">
                  Semester
                </p>
              </div>

              <p className="text-2xl font-bold text-gray-900">
                {teacher?.semester || "Not assigned"}
              </p>
            </div>

          </div>
        </section>

        {/* Academic Activities */}
        <section>
          <div className="flex items-center gap-4 mb-7">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <ClipboardList className="text-purple-600" size={27} />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Academic Activities
              </h3>

              <p className="text-gray-500">
                Manage your class activities and student updates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <Link
                  key={activity.title}
                  href={activity.href}
                  className={`${activity.bg} rounded-2xl p-5 border border-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200`}
                >
                  <div className="flex justify-between items-start">

                    <div
                      className={`w-12 h-12 rounded-xl ${activity.iconBg} flex items-center justify-center`}
                    >
                      <Icon
                        size={28}
                        className={activity.iconColor}
                      />
                    </div>

                    <div
                      className={`w-10 h-10 rounded-full ${activity.arrowBg} flex items-center justify-center`}
                    >
                      <ArrowRight
                        size={20}
                        className="text-white"
                      />
                    </div>

                  </div>

                  <h4 className="text-lg font-bold text-gray-900 mt-4">
                    {activity.title}
                  </h4>

                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {activity.description}
                  </p>
                </Link>
              );
            })}

          </div>
        </section>

      </main>
    </div>
  );
}


