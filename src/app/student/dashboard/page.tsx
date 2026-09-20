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

interface Announcement {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  mentor: Mentor;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  mentor: Mentor;
}

interface Submission {
  _id: string;
  answer: string;
  status: "submitted" | "reviewed";
  feedback: string;
  submittedAt: string;
  reviewedAt?: string;
  assignment: {
    _id: string;
    title: string;
    description: string;
    dueDate: string;
  };
}

export default function StudentDashboard() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [assignedAt, setAssignedAt] = useState("");

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [announcementLoading, setAnnouncementLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(true);

  const [openAssignment, setOpenAssignment] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMentor();
    loadMeetings();
    loadAnnouncements();
    loadAssignments();
    loadSubmissions();
  }, []);

  async function loadMentor() {
    try {
      const res = await fetch("/api/student/mentor", {
        cache: "no-store",
      });

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
      const res = await fetch("/api/meetings", {
        cache: "no-store",
      });

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

  async function loadAnnouncements() {
    try {
      const res = await fetch("/api/announcements", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setAnnouncementLoading(false);
    }
  }

  async function loadAssignments() {
    try {
      const res = await fetch("/api/assignments", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setAssignmentLoading(false);
    }
  }

  async function loadSubmissions() {
    try {
      const res = await fetch("/api/submissions", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSubmissionLoading(false);
    }
  }

  function getSubmission(assignmentId: string) {
    return submissions.find(
      (submission) =>
        submission.assignment?._id === assignmentId
    );
  }

  async function submitAssignment(assignmentId: string) {
    if (!answer.trim()) {
      alert("Please write your answer");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
          answer,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Assignment Submitted Successfully");

        setAnswer("");
        setOpenAssignment("");

        await loadSubmissions();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const pendingAssignments = assignments.filter(
    (assignment) => !getSubmission(assignment._id)
  ).length;

  const reviewedSubmissions = submissions.filter(
    (submission) => submission.status === "reviewed"
  ).length;

  const recentActivities = [
    ...meetings.map((item) => ({
      type: "Meeting",
      title: item.title,
      date: item.date,
    })),

    ...assignments.map((item) => ({
      type: "Assignment",
      title: item.title,
      date: item.dueDate,
    })),

    ...announcements.map((item) => ({
      type: "Announcement",
      title: item.title,
      date: item.createdAt,
    })),

    ...submissions.map((item) => ({
      type: "Submission",
      title: item.assignment?.title || "Assignment",
      date: item.submittedAt,
    })),
  ]
    .filter((item) => item.date)
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    )
    .slice(0, 8);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              🎓 Student Dashboard
            </h1>

            <p className="text-gray-500 mt-1">
              Track your mentor, meetings, assignments and progress.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
              <p className="text-gray-500 text-sm">
                My Mentor
              </p>

              <h2 className="text-2xl font-bold text-blue-600 mt-2">
                {mentor ? "Assigned" : "Not Assigned"}
              </h2>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
              <p className="text-gray-500 text-sm">
                Meetings
              </p>

              <h2 className="text-3xl font-bold text-green-600 mt-2">
                {meetings.length}
              </h2>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
              <p className="text-gray-500 text-sm">
                Assignments
              </p>

              <h2 className="text-3xl font-bold text-purple-600 mt-2">
                {assignments.length}
              </h2>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
              <p className="text-gray-500 text-sm">
                Pending
              </p>

              <h2 className="text-3xl font-bold text-orange-600 mt-2">
                {pendingAssignments}
              </h2>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-pink-500">
              <p className="text-gray-500 text-sm">
                Reviewed
              </p>

              <h2 className="text-3xl font-bold text-pink-600 mt-2">
                {reviewedSubmissions}
              </h2>
            </div>

          </div>

          {/* Quick Actions */}
          <div className="mb-8">

            <h2 className="text-2xl font-bold mb-5">
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              <a
                href="/assignments"
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-5 shadow transition"
              >
                <h3 className="text-lg font-semibold">
                  📚 My Assignments
                </h3>

                <p className="text-sm mt-1 opacity-90">
                  View and submit assignments
                </p>
              </a>

              <a
                href="/meeting"
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-5 shadow transition"
              >
                <h3 className="text-lg font-semibold">
                  📅 My Meetings
                </h3>

                <p className="text-sm mt-1 opacity-90">
                  View scheduled meetings
                </p>
              </a>

              <a
                href="/announcement"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl p-5 shadow transition"
              >
                <h3 className="text-lg font-semibold">
                  📢 Announcements
                </h3>

                <p className="text-sm mt-1 opacity-90">
                  View mentor announcements
                </p>
              </a>

            </div>
          </div>

          {/* My Mentor */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">

            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                👨‍🏫 My Mentor
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                Loading mentor...
              </div>
            ) : mentor ? (
              <div className="p-6">

                <div className="border rounded-xl p-6">

                  <h3 className="text-2xl font-bold">
                    {mentor.name}
                  </h3>

                  <p className="text-gray-600 mt-2">
                    📧 {mentor.email}
                  </p>

                  {assignedAt && (
                    <p className="text-gray-500 mt-2">
                      Assigned Date:{" "}
                      {new Date(
                        assignedAt
                      ).toLocaleDateString("en-IN")}
                    </p>
                  )}

                </div>

              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No mentor assigned yet.
              </div>
            )}

          </div>

          {/* Meetings */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">

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
                No meetings scheduled yet.
              </div>
            ) : (
              <div className="divide-y">

                {meetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="p-6"
                  >

                    <h3 className="text-xl font-bold">
                      {meeting.title}
                    </h3>

                    <p className="text-gray-600 mt-2">
                      {meeting.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">

                      <p>
                        👨‍🏫 <strong>Mentor:</strong>{" "}
                        {meeting.mentor?.name}
                      </p>

                      <p>
                        📅 <strong>Date:</strong>{" "}
                        {new Date(
                          meeting.date
                        ).toLocaleDateString("en-IN")}
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

          {/* Announcements */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">

            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                📢 My Announcements
              </h2>
            </div>

            {announcementLoading ? (
              <div className="p-6 text-center">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No announcements available.
              </div>
            ) : (
              <div className="divide-y">

                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="p-6"
                  >

                    <h3 className="text-xl font-bold">
                      {announcement.title}
                    </h3>

                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                      {announcement.message}
                    </p>

                    <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-500">

                      <p>
                        👨‍🏫 Mentor:{" "}
                        {announcement.mentor?.name}
                      </p>

                      <p>
                        📅{" "}
                        {new Date(
                          announcement.createdAt
                        ).toLocaleString("en-IN")}
                      </p>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

          {/* Assignments */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">

            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                📚 My Assignments
              </h2>
            </div>

            {assignmentLoading || submissionLoading ? (
              <div className="p-6 text-center">
                Loading assignments...
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No assignments available.
              </div>
            ) : (
              <div className="divide-y">

                {assignments.map((assignment) => {

                  const submission =
                    getSubmission(assignment._id);

                  return (
                    <div
                      key={assignment._id}
                      className="p-6"
                    >

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                        <div>

                          <h3 className="text-xl font-bold">
                            {assignment.title}
                          </h3>

                          <p className="text-gray-600 mt-2">
                            {assignment.description}
                          </p>

                          <div className="flex flex-wrap gap-6 mt-4 text-sm text-gray-500">

                            <p>
                              👨‍🏫 Mentor:{" "}
                              {assignment.mentor?.name}
                            </p>

                            <p>
                              📅 Due:{" "}
                              {new Date(
                                assignment.dueDate
                              ).toLocaleDateString("en-IN")}
                            </p>

                            <p>
                              ⏰{" "}
                              {new Date(
                                assignment.dueDate
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>

                          </div>

                        </div>

                        <div>

                          {submission ? (
                            <span
                              className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                                submission.status ===
                                "reviewed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {submission.status ===
                              "reviewed"
                                ? "✅ Reviewed"
                                : "⏳ Pending Review"}
                            </span>
                          ) : (
                            <span className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-700">
                              Not Submitted
                            </span>
                          )}

                        </div>

                      </div>

                      {/* Submission */}
                      {submission ? (
                        <div className="mt-5">

                          <div className="bg-gray-50 border rounded-xl p-5">

                            <p className="font-semibold mb-2">
                              Your Answer
                            </p>

                            <p className="text-gray-700 whitespace-pre-wrap">
                              {submission.answer}
                            </p>

                            <p className="text-sm text-gray-500 mt-3">
                              Submitted:{" "}
                              {new Date(
                                submission.submittedAt
                              ).toLocaleString("en-IN")}
                            </p>

                          </div>

                          {/* Feedback */}
                          {submission.status ===
                          "reviewed" ? (
                            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-5">

                              <p className="font-semibold text-green-800">
                                👨‍🏫 Mentor Feedback
                              </p>

                              <p className="text-gray-700 mt-2 whitespace-pre-wrap">
                                {submission.feedback ||
                                  "No feedback provided."}
                              </p>

                              {submission.reviewedAt && (
                                <p className="text-sm text-gray-500 mt-3">
                                  Reviewed:{" "}
                                  {new Date(
                                    submission.reviewedAt
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                              )}

                            </div>
                          ) : (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                              <p className="text-yellow-800">
                                ⏳ Your submission is waiting
                                for mentor review.
                              </p>
                            </div>
                          )}

                        </div>
                      ) : openAssignment === assignment._id ? (

                        <div className="mt-5">

                          <textarea
                            value={answer}
                            onChange={(e) =>
                              setAnswer(e.target.value)
                            }
                            placeholder="Write your answer here..."
                            rows={6}
                            className="w-full border rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
                          />

                          <div className="flex flex-wrap gap-3 mt-3">

                            <button
                              onClick={() =>
                                submitAssignment(
                                  assignment._id
                                )
                              }
                              disabled={submitting}
                              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
                            >
                              {submitting
                                ? "Submitting..."
                                : "Submit Assignment"}
                            </button>

                            <button
                              onClick={() => {
                                setOpenAssignment("");
                                setAnswer("");
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
                            >
                              Cancel
                            </button>

                          </div>

                        </div>

                      ) : (

                        <button
                          onClick={() =>
                            setOpenAssignment(
                              assignment._id
                            )
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg mt-5"
                        >
                          📤 Submit Assignment
                        </button>

                      )}

                    </div>
                  );
                })}

              </div>
            )}

          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow overflow-hidden">

            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                🕒 Recent Activity
              </h2>
            </div>

            {recentActivities.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No recent activity.
              </div>
            ) : (
              <div className="divide-y">

                {recentActivities.map(
                  (activity, index) => (
                    <div
                      key={`${activity.type}-${activity.title}-${index}`}
                      className="p-5 flex items-center justify-between gap-4"
                    >

                      <div>

                        <span className="text-xs font-semibold uppercase text-gray-400">
                          {activity.type}
                        </span>

                        <p className="font-medium mt-1">
                          {activity.title}
                        </p>

                      </div>

                      <p className="text-sm text-gray-500 whitespace-nowrap">
                        {new Date(
                          activity.date
                        ).toLocaleString("en-IN")}
                      </p>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}