"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Assignment {
  _id: string;
  student: Student;
  assignedAt: string;
}

interface Meeting {
  _id: string;
  title: string;
  description: string;
  date: string;
  students: Student[];
}

export default function MentorDashboard() {
  const [students, setStudents] = useState<Assignment[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [deleting, setDeleting] = useState("");

  useEffect(() => {
    loadStudents();
    loadMeetings();
  }, []);

  async function loadStudents() {
    try {
      const res = await fetch("/api/mentor/students");
      const data = await res.json();

      if (data.success) {
        setStudents(data.students || []);
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

  async function deleteMeeting(meetingId: string) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this meeting?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(meetingId);

      const res = await fetch("/api/meetings", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meetingId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Meeting Deleted Successfully");

        setMeetings((prev) =>
          prev.filter((meeting) => meeting._id !== meetingId)
        );
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setDeleting("");
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">

          <h1 className="text-3xl font-bold mb-8">
            👨‍🏫 Mentor Dashboard
          </h1>

          {/* Total Students */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <p className="text-gray-500">
              Total Assigned Students
            </p>

            <h2 className="text-4xl font-bold text-blue-600 mt-2">
              {students.length}
            </h2>
          </div>

          {/* Assigned Students */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                My Assigned Students
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No students assigned yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4 text-left">
                        Student Name
                      </th>

                      <th className="p-4 text-left">
                        Email
                      </th>

                      <th className="p-4 text-left">
                        Assigned Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map((assignment) => (
                      <tr
                        key={assignment._id}
                        className="border-t"
                      >
                        <td className="p-4 font-medium">
                          {assignment.student?.name}
                        </td>

                        <td className="p-4">
                          {assignment.student?.email}
                        </td>

                        <td className="p-4">
                          {new Date(
                            assignment.assignedAt
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* My Meetings */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                📅 My Meetings
              </h2>
            </div>

            {meetingLoading ? (
              <div className="p-6 text-center">
                Loading meetings...
              </div>
            ) : meetings.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No meetings created yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4 text-left">
                        Meeting
                      </th>

                      <th className="p-4 text-left">
                        Students
                      </th>

                      <th className="p-4 text-left">
                        Date
                      </th>

                      <th className="p-4 text-left">
                        Time
                      </th>

                      <th className="p-4 text-left">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {meetings.map((meeting) => (
                      <tr
                        key={meeting._id}
                        className="border-t"
                      >
                        <td className="p-4">
                          <p className="font-semibold">
                            {meeting.title}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {meeting.description}
                          </p>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            {meeting.students?.map(
                              (student) => (
                                <div
                                  key={student._id}
                                  className="font-medium"
                                >
                                  {student.name}
                                  <span className="text-gray-500 text-sm ml-2">
                                    ({student.email})
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          {new Date(
                            meeting.date
                          ).toLocaleDateString()}
                        </td>

                        <td className="p-4">
                          {new Date(
                            meeting.date
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() =>
                              deleteMeeting(meeting._id)
                            }
                            disabled={deleting === meeting._id}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                          >
                            {deleting === meeting._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}