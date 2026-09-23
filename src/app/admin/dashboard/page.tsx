"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import StatCard from "@/components/dashboard/StatCard";

interface Activity {
  type: string;
  title: string;
  date: string;
}

export default function AdminDashboard() {
  const [students, setStudents] = useState(0);
  const [mentors, setMentors] = useState(0);
  const [teachers, setTeachers] = useState(0);
  const [meetings, setMeetings] = useState(0);
  const [assignments, setAssignments] = useState(0);
  const [announcements, setAnnouncements] = useState(0);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          studentsRes,
          mentorsRes,
          teachersRes,
          meetingsRes,
          assignmentsRes,
          announcementsRes,
        ] = await Promise.all([
          fetch("/api/students"),
          fetch("/api/mentors"),
          fetch("/api/teachers"),
          fetch("/api/meetings"),
          fetch("/api/assignments"),
          fetch("/api/announcements"),
        ]);

        const studentsData = await studentsRes.json();
        const mentorsData = await mentorsRes.json();
        const teachersData = await teachersRes.json();
        const meetingsData = await meetingsRes.json();
        const assignmentsData = await assignmentsRes.json();
        const announcementsData =
          await announcementsRes.json();

        if (studentsData.success) {
          setStudents(studentsData.students?.length || 0);
        }

        if (mentorsData.success) {
          setMentors(mentorsData.mentors?.length || 0);
        }

        if (teachersData.success) {
          setTeachers(teachersData.teachers?.length || 0);
        }

        if (meetingsData.success) {
          setMeetings(meetingsData.meetings?.length || 0);
        }

        if (assignmentsData.success) {
          setAssignments(
            assignmentsData.assignments?.length || 0
          );
        }

        if (announcementsData.success) {
          setAnnouncements(
            announcementsData.announcements?.length || 0
          );
        }

        const recentActivities: Activity[] = [];

        if (meetingsData.success) {
          meetingsData.meetings
            ?.slice(0, 5)
            .forEach((meeting: any) => {
              recentActivities.push({
                type: "Meeting",
                title: meeting.title,
                date: meeting.date,
              });
            });
        }

        if (assignmentsData.success) {
          assignmentsData.assignments
            ?.slice(0, 5)
            .forEach((assignment: any) => {
              recentActivities.push({
                type: "Assignment",
                title: assignment.title,
                date: assignment.createdAt,
              });
            });
        }

        if (announcementsData.success) {
          announcementsData.announcements
            ?.slice(0, 5)
            .forEach((announcement: any) => {
              recentActivities.push({
                type: "Announcement",
                title: announcement.title,
                date: announcement.createdAt,
              });
            });
        }

        recentActivities.sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        );

        setActivities(recentActivities.slice(0, 8));
      } catch (error) {
        console.log(
          "Error loading dashboard:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
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

          {loading ? (
            <div className="text-center py-10 text-gray-500">
              Loading dashboard...
            </div>
          ) : (
            <>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <StatCard
                  title="Total Students"
                  value={students.toString()}
                />

                <StatCard
                  title="Total Mentors"
                  value={mentors.toString()}
                />

                <StatCard
                  title="Total Teachers"
                  value={teachers.toString()}
                />

                <StatCard
                  title="Meetings"
                  value={meetings.toString()}
                />

                <StatCard
                  title="Assignments"
                  value={assignments.toString()}
                />

                <StatCard
                  title="Announcements"
                  value={announcements.toString()}
                />

              </div>

              {/* Quick Actions */}
              <div className="mt-10">

                <h2 className="text-2xl font-bold mb-5">
                  Quick Actions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

                  <a
                    href="/admin/students"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 transition shadow-sm"
                  >
                    <h3 className="text-lg font-semibold">
                      Manage Students
                    </h3>

                    <p className="text-sm mt-1 opacity-90">
                      Manage student accounts
                    </p>
                  </a>

                  <a
                    href="/admin/mentors"
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-5 transition shadow-sm"
                  >
                    <h3 className="text-lg font-semibold">
                      Manage Mentors
                    </h3>

                    <p className="text-sm mt-1 opacity-90">
                      Manage mentor accounts
                    </p>
                  </a>

                  <a
                    href="/admin/teachers"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-5 transition shadow-sm"
                  >
                    <h3 className="text-lg font-semibold">
                      Manage Teachers
                    </h3>

                    <p className="text-sm mt-1 opacity-90">
                      Manage teacher accounts
                    </p>
                  </a>

                  <a
                    href="/admin/assign-mentor"
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-5 transition shadow-sm"
                  >
                    <h3 className="text-lg font-semibold">
                      Assign Mentor
                    </h3>

                    <p className="text-sm mt-1 opacity-90">
                      Assign students to mentors
                    </p>
                  </a>

                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-10 bg-white rounded-xl shadow-sm p-6">

                <h2 className="text-2xl font-bold mb-5">
                  Recent Activity
                </h2>

                {activities.length === 0 ? (
                  <p className="text-gray-500">
                    No recent activity found.
                  </p>
                ) : (
                  <div className="space-y-4">

                    {activities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b pb-4 last:border-b-0"
                      >

                        <div>
                          <p className="font-semibold">
                            {activity.title}
                          </p>

                          <p className="text-sm text-gray-500">
                            {activity.type}
                          </p>
                        </div>

                        <p className="text-sm text-gray-500">
                          {new Date(
                            activity.date
                          ).toLocaleDateString("en-IN")}
                        </p>

                      </div>
                    ))}

                  </div>
                )}

              </div>

            </>
          )}

        </main>
      </div>
    </div>
  );
}
