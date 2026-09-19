"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import StatCard from "@/components/dashboard/StatCard";

export default function AdminDashboard() {
  const [students, setStudents] = useState(0);
  const [mentors, setMentors] = useState(0);
  const [meetings, setMeetings] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const [studentsRes, mentorsRes, meetingsRes] =
          await Promise.all([
            fetch("/api/students"),
            fetch("/api/mentors"),
            fetch("/api/meetings"),
          ]);

        const studentsData = await studentsRes.json();
        const mentorsData = await mentorsRes.json();
        const meetingsData = await meetingsRes.json();

        if (studentsData.success) {
          setStudents(studentsData.students.length);
        }

        if (mentorsData.success) {
          setMentors(mentorsData.mentors.length);
        }

        if (meetingsData.success) {
          setMeetings(meetingsData.meetings.length);
        }
      } catch (error) {
        console.log("Error loading dashboard stats:", error);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">

        <Navbar />

        <main className="p-8">

          <h1 className="text-3xl font-bold mb-8">
            Welcome Admin
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <StatCard
              title="Total Students"
              value={students.toString()}
            />

            <StatCard
              title="Total Mentors"
              value={mentors.toString()}
            />

            <StatCard
              title="Meetings"
              value={meetings.toString()}
            />

          </div>

        </main>

      </div>

    </div>
  );
}
