"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-600">
          MentorLink
        </h1>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="bg-red-500 text-white px-5 py-2 rounded-lg"
        >
          Logout
        </button>
      </header>

      <main className="p-8">
        <h2 className="text-3xl font-bold mb-2">
          Welcome, {teacher?.name}
        </h2>

        <p className="text-gray-600 mb-8">
          Teacher Dashboard
        </p>

        <div className="bg-white rounded-2xl shadow p-6 mb-8">
          <h3 className="text-xl font-bold mb-5">
            Academic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-blue-50 p-5 rounded-xl">
              <p className="text-gray-500">Subject</p>
              <p className="text-lg font-bold">
                {teacher?.subject || "Not assigned"}
              </p>
            </div>

            <div className="bg-green-50 p-5 rounded-xl">
              <p className="text-gray-500">Branch</p>
              <p className="text-lg font-bold">
                {teacher?.branch || "Not assigned"}
              </p>
            </div>

            <div className="bg-yellow-50 p-5 rounded-xl">
              <p className="text-gray-500">Semester</p>
              <p className="text-lg font-bold">
                {teacher?.semester || "Not assigned"}
              </p>
            </div>

            <div className="bg-purple-50 p-5 rounded-xl">
              <p className="text-gray-500">Section</p>
              <p className="text-lg font-bold">
                {teacher?.section || "Not assigned"}
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-5">
          Academic Activities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg">
            <div className="text-4xl mb-4">📢</div>
            <h4 className="text-xl font-bold">Announcements</h4>
            <p className="text-gray-500 mt-2">
              Send important information to your class.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg">
            <div className="text-4xl mb-4">📝</div>
            <h4 className="text-xl font-bold">Assignments</h4>
            <p className="text-gray-500 mt-2">
              Create and share assignments with students.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h4 className="text-xl font-bold">Homework</h4>
            <p className="text-gray-500 mt-2">
              Give homework to the entire class.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg">
            <div className="text-4xl mb-4">📖</div>
            <h4 className="text-xl font-bold">Class Information</h4>
            <p className="text-gray-500 mt-2">
              Share academic and class-related information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}