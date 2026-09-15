"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Mentor {
  _id: string;
  name: string;
  email: string;
}

interface Meeting {
  _id: string;
  title: string;
  description: string;
  date: string;
  mentor: Mentor;
}

export default function StudentDashboard() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [assignedAt, setAssignedAt] = useState("");

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(true);

  useEffect(() => {
    loadMentor();
    loadMeetings();
  }, []);

  async function loadMentor() {
    try {
      const res = await fetch("/api/student/mentor");
      const data = await res.json();

      if (data.success) {
        setMentor(data.mentor);
        setAssignedAt(data.assignedAt || "");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMeetings() {
    try {
      const res = await fetch("/api/meetings");
      const data = await res.json();

      if (data.success) {
        setMeetings(data.meetings || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setMeetingLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8">
            🎓 Student Dashboard
          </h1>

          {/* Mentor Card */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">
              My Mentor
            </h2>

            {loading ? (
              <div className="text-center py-6">
                Loading mentor...
              </div>
            ) : mentor ? (
              <div className="border rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-3">
                  👨‍🏫 {mentor.name}
                </h3>

                <p className="text-gray-600 mb-2">
                  📧 {mentor.email}
                </p>

                <p className="text-gray-500">
                  Assigned Date:{" "}
                  {new Date(assignedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No mentor assigned yet.
              </div>
            )}
          </div>

          {/* Meetings */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">
              📅 My Meetings
            </h2>

            {meetingLoading ? (
              <div className="text-center py-6">
                Loading meetings...
              </div>
            ) : meetings.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No meetings scheduled yet.
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="border rounded-xl p-5"
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {meeting.title}
                    </h3>

                    <p className="text-gray-600 mb-4">
                      {meeting.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <p>
                        👨‍🏫 <strong>Mentor:</strong>{" "}
                        {meeting.mentor?.name}
                      </p>

                      <p>
                        📅 <strong>Date:</strong>{" "}
                        {new Date(
                          meeting.date
                        ).toLocaleDateString()}
                      </p>

                      <p>
                        ⏰ <strong>Time:</strong>{" "}
                        {new Date(
                          meeting.date
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}