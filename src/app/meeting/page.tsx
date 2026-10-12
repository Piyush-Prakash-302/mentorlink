
"use client";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Meeting {
  _id: string;
  title: string;
  description: string;
  date: string;
  duration?: number;
  roomName?: string;
  status?: "upcoming" | "in-progress" | "completed" | "missed";
  mentor?: {
    _id?: string;
    name: string;
    email?: string;
  };
  students?: Student[];
}

function getMeetingStatus(meeting: Meeting) {
  if (
    meeting.status === "completed" ||
    meeting.status === "missed"
  ) {
    return meeting.status;
  }

  const start = new Date(meeting.date).getTime();
  const end = start + (meeting.duration || 30) * 60 * 1000;
  const now = Date.now();

  if (now < start) return "upcoming";
  if (now <= end) return "in-progress";

  // Passing the scheduled time alone does not prove
  // that a meeting was missed.
  return "awaiting-confirmation";
}

function MeetingStatus({ meeting }: { meeting: Meeting }) {
  const status = getMeetingStatus(meeting);

  const styles: Record<string, string> = {
    upcoming: "bg-blue-100 text-blue-700",
    "in-progress": "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700",
    missed: "bg-red-100 text-red-700",
    "awaiting-confirmation": "bg-amber-100 text-amber-800",
  };

  const labels: Record<string, string> = {
    upcoming: "Upcoming",
    "in-progress": "Scheduled time reached",
    completed: "Completed",
    missed: "Missed Meeting",
    "awaiting-confirmation": "Awaiting completion status",
  };

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function MeetingCard({
  meeting,
  role,
}: {
  meeting: Meeting;
  role: string;
}) {
  const start = new Date(meeting.date);
  const status = getMeetingStatus(meeting);
  const canJoin =
    status === "in-progress" &&
    meeting.status !== "completed" &&
    meeting.status !== "missed";

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900">
          {meeting.title}
        </h3>
        <MeetingStatus meeting={meeting} />
      </div>

      <p className="mt-2 whitespace-pre-wrap text-gray-600">
        {meeting.description}
      </p>

      <div className="mt-4 space-y-2 text-sm text-gray-700">
        <p>
          <b>Date:</b>{" "}
          {start.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}
        </p>

        <p>
          <b>Time:</b>{" "}
          {start.toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <p>
          <b>Duration:</b> {meeting.duration || 30} minutes
        </p>

        {role === "student" && (
          <p>
            <b>Mentor:</b> {meeting.mentor?.name || "Mentor"}
          </p>
        )}

        {role === "mentor" && (
          <p>
            <b>Students:</b>{" "}
            {meeting.students?.map((student) => student.name).join(", ") ||
              "Selected students"}
          </p>
        )}
      </div>

      {canJoin ? (
        <a
          href={`/video-meeting?meetingId=${encodeURIComponent(meeting._id)}`}
          className="mt-5 inline-block rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700"
        >
          Join Meeting
        </a>
      ) : status === "upcoming" ? (
        <p className="mt-4 text-sm text-blue-700">
        Meeting is scheduled. The Join button will be available at the scheduled time.
        </p>
      ) : status === "awaiting-confirmation" ? (
        <p className="mt-4 text-sm text-amber-800">
          Scheduled time beet chuka hai. Meeting ka final status abhi confirm nahi hua.
        </p>
      ) : null}
    </div>
  );
}

export default function MeetingPage() {
  const [role, setRole] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const session = await getSession();
        if (!active) return;

        const userRole = (session?.user as any)?.role || "";
        setRole(userRole);

        if (userRole === "mentor") {
          await loadStudents();
        }

        if (userRole === "mentor" || userRole === "student") {
          await loadMeetings();
        }
      } catch (error) {
        console.error(error);
        if (active) setPageError("Unable to load meetings.");
      } finally {
        if (active) setLoading(false);
      }
    }

    async function refreshMeetings() {
      if (active && (role === "mentor" || role === "student")) {
        await loadMeetings();
      }
    }

    void initialize();

    const interval = setInterval(() => {
      void refreshMeetings();
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [role]);

  async function loadStudents() {
    try {
      const res = await fetch("/api/mentor/students", {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setStudents(
          data.students.map((item: any) => item.student).filter(Boolean)
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadMeetings() {
    try {
      const res = await fetch("/api/meetings", {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setMeetings(data.meetings || []);
        setPageError("");
      } else {
        setPageError(data.message || "Unable to load meetings.");
      }
    } catch (error) {
      console.error(error);
      setPageError("Unable to load meetings.");
    }
  }

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id]
    );
  }

  async function createMeeting(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    const selectedDate = new Date(date);

    if (!date || Number.isNaN(selectedDate.getTime())) {
      alert("Please select a valid date and time.");
      return;
    }

    if (selectedDate.getTime() <= Date.now()) {
      alert("Please select a future date and time.");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          date: selectedDate.toISOString(),
          studentIds: selectedStudents,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Meeting scheduled successfully.");

        setTitle("");
        setDescription("");
        setDate("");
        setSelectedStudents([]);

        await loadMeetings();
      } else {
        alert(data.message || "Meeting could not be scheduled.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while scheduling the meeting.");
    } finally {
      setCreating(false);
    }
  }

  const upcomingMeetings = meetings.filter((meeting) => {
    const status = getMeetingStatus(meeting);
    return status === "upcoming" || status === "in-progress";
  });

  const pastMeetings = meetings.filter((meeting) => {
    const status = getMeetingStatus(meeting);
    return (
      status === "completed" ||
      status === "missed" ||
      status === "awaiting-confirmation"
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Navbar />

        <main className="p-4 md:p-8">
          <h1 className="mb-8 text-3xl font-bold">📅 Meetings</h1>

          {pageError && (
            <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">
              {pageError}
            </p>
          )}

          {role === "mentor" && (
            <div className="mb-8 max-w-3xl rounded-xl bg-white p-6 shadow">
              <h2 className="mb-6 text-xl font-semibold">
                Schedule a Meeting
              </h2>

              <form onSubmit={createMeeting}>
                <div className="mb-5">
                  <label className="mb-2 block font-medium">
                    Meeting Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter meeting title"
                    className="w-full rounded-lg border p-3"
                    required
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block font-medium">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter meeting description"
                    className="w-full rounded-lg border p-3"
                    rows={4}
                    required
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block font-medium">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                      .toISOString()
                      .slice(0, 16)}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border p-3"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Default meeting duration: 30 minutes.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block font-medium">
                    Select Students
                  </label>

                  {loading ? (
                    <p className="text-gray-500">Loading students...</p>
                  ) : students.length === 0 ? (
                    <p className="text-gray-500">
                      No students assigned to you.
                    </p>
                  ) : (
                    <div className="space-y-3 rounded-lg border p-4">
                      {students.map((student) => (
                        <label
                          key={student._id}
                          className="flex cursor-pointer items-center gap-3"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => toggleStudent(student._id)}
                            className="h-5 w-5"
                          />
                          <span>
                            {student.name} - {student.email}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={creating || students.length === 0}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </form>
            </div>
          )}

          {(role === "mentor" || role === "student") && (
            <>
              <section className="mb-8">
                <h2 className="mb-4 text-xl font-semibold">
                  Upcoming Meetings
                </h2>

                {loading ? (
                  <p className="text-gray-500">Loading meetings...</p>
                ) : upcomingMeetings.length === 0 ? (
                  <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
                    No upcoming meetings scheduled.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {upcomingMeetings.map((meeting) => (
                      <MeetingCard
                        key={meeting._id}
                        meeting={meeting}
                        role={role}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-4 text-xl font-semibold">
                  Past Meetings
                </h2>

                {pastMeetings.length === 0 ? (
                  <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
                    No past meetings to display.
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {pastMeetings.map((meeting) => (
                      <MeetingCard
                        key={meeting._id}
                        meeting={meeting}
                        role={role}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {!loading && role !== "mentor" && role !== "student" && (
            <p className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
              Meetings are available to mentors and students.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
