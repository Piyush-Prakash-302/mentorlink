"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Student {
  _id: string;
  name: string;
  email: string;
  branch?: string;
  semester?: string;
  academic?: {
    semester1?: number | null;
    semester2?: number | null;
    semester3?: number | null;
    semester4?: number | null;
    semester5?: number | null;
    semester6?: number | null;
  } | null;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  students: Student[];
}

interface Submission {
  _id: string;
  assignment: Assignment;
  student: Student;
  answer: string;
  submittedAt: string;
  status?: string;
  feedback?: string;
}

interface Meeting {
  _id: string;
  title: string;
  description: string;
  date: string;
  students: Student[];
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function MentorDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [loading, setLoading] = useState(true);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [announcementLoading, setAnnouncementLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(true);

  const [deleting, setDeleting] = useState("");
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState("");

  useEffect(() => {
    loadStudents();
    loadMeetings();
    loadAssignments();
    loadAnnouncements();
    loadSubmissions();
  }, []);

  async function loadStudents() {
    try {
      const res = await fetch("/api/mentor/students", {
        cache: "no-store",
      });

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

  async function deleteMeeting(meetingId: string) {
    if (!confirm("Are you sure you want to delete this meeting?")) {
      return;
    }

    try {
      setDeleting(meetingId);

      const res = await fetch("/api/meetings", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meetingId }),
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

  async function deleteAssignment(assignmentId: string) {
    if (!confirm("Are you sure you want to delete this assignment?")) {
      return;
    }

    try {
      setDeleting(assignmentId);

      const res = await fetch("/api/assignments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignmentId }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Assignment Deleted Successfully");

        setAssignments((prev) =>
          prev.filter((assignment) => assignment._id !== assignmentId)
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

  async function deleteAnnouncement(announcementId: string) {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    try {
      setDeleting(announcementId);

      const res = await fetch("/api/announcements", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ announcementId }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Announcement Deleted Successfully");

        setAnnouncements((prev) =>
          prev.filter(
            (announcement) => announcement._id !== announcementId
          )
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

  async function reviewSubmission(submissionId: string) {
    try {
      setReviewing(submissionId);

      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          status: "reviewed",
          feedback: feedback[submissionId] || "",
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Submission Reviewed Successfully");

        setSubmissions((prev) =>
          prev.map((submission) =>
            submission._id === submissionId
              ? {
                  ...submission,
                  status: "reviewed",
                  feedback: feedback[submissionId] || "",
                }
              : submission
          )
        );
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setReviewing("");
    }
  }

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
      title: item.assignment?.title || "Assignment Submission",
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
              👨‍🏫 Mentor Dashboard
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your students, meetings, assignments and announcements.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
              <p className="text-gray-500 text-sm">
                Assigned Students
              </p>
              <h2 className="text-3xl font-bold text-blue-600 mt-2">
                {students.length}
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
                Announcements
              </p>
              <h2 className="text-3xl font-bold text-orange-600 mt-2">
                {announcements.length}
              </h2>
            </div>

            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-pink-500">
              <p className="text-gray-500 text-sm">
                Submissions
              </p>
              <h2 className="text-3xl font-bold text-pink-600 mt-2">
                {submissions.length}
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
                  Create Assignment
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  Assign work to students
                </p>
              </a>

              <a
                href="/meeting"
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-5 shadow transition"
              >
                <h3 className="text-lg font-semibold">
                  Schedule Meeting
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  Schedule a student meeting
                </p>
              </a>

              <a
                href="/announcement"
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl p-5 shadow transition"
              >
                <h3 className="text-lg font-semibold">
                  Post Announcement
                </h3>
                <p className="text-sm mt-1 opacity-90">
                  Notify your students
                </p>
              </a>
            </div>
          </div>

          {/* Assigned Students */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                👨‍🎓 My Assigned Students
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
                      <th className="p-4 text-left">
                        Academic Performance
                      </th>
                      <th className="p-4 text-left">
                        Communication
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
                          {assignment.assignedAt
                            ? new Date(
                                assignment.assignedAt
                              ).toLocaleDateString("en-IN")
                            : "-"}
                        </td>

                        <td className="p-4 min-w-[300px]">
                          <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Sem 1:</span>{" "}
                              <span className="font-semibold">
                                {assignment.student?.academic?.semester1 ?? "-"}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-500">Sem 2:</span>{" "}
                              <span className="font-semibold">
                                {assignment.student?.academic?.semester2 ?? "-"}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-500">Sem 3:</span>{" "}
                              <span className="font-semibold">
                                {assignment.student?.academic?.semester3 ?? "-"}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-500">Sem 4:</span>{" "}
                              <span className="font-semibold">
                                {assignment.student?.academic?.semester4 ?? "-"}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-500">Sem 5:</span>{" "}
                              <span className="font-semibold">
                                {assignment.student?.academic?.semester5 ?? "-"}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-500">Sem 6:</span>{" "}
                              <span className="font-semibold">
                                {assignment.student?.academic?.semester6 ?? "-"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            <a
                              href={`/chat?studentId=${assignment.student?._id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm text-center"
                            >
                              Private Chat
                            </a>

                            <a
                              href={`/video-meeting?studentId=${assignment.student?._id}`}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm text-center"
                            >
                              Video Meeting
                            </a>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
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
                        Date & Time
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
                          {meeting.students?.map((student) => (
                            <div
                              key={student._id}
                              className="mb-1"
                            >
                              <span className="font-medium">
                                {student.name}
                              </span>

                              <span className="text-gray-500 text-sm ml-2">
                                ({student.email})
                              </span>
                            </div>
                          ))}
                        </td>

                        <td className="p-4">
                          {new Date(
                            meeting.date
                          ).toLocaleDateString("en-IN")}

                          <p className="text-sm text-gray-500">
                            {new Date(
                              meeting.date
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() =>
                              deleteMeeting(meeting._id)
                            }
                            disabled={
                              deleting === meeting._id
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
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

          {/* Assignments */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                📝 My Assignments
              </h2>
            </div>

            {assignmentLoading ? (
              <div className="p-6 text-center">
                Loading assignments...
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No assignments created yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4 text-left">
                        Assignment
                      </th>
                      <th className="p-4 text-left">
                        Students
                      </th>
                      <th className="p-4 text-left">
                        Due Date
                      </th>
                      <th className="p-4 text-left">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {assignments.map((assignment) => (
                      <tr
                        key={assignment._id}
                        className="border-t"
                      >
                        <td className="p-4">
                          <p className="font-semibold">
                            {assignment.title}
                          </p>

                          <p className="text-sm text-gray-500 mt-1 max-w-md">
                            {assignment.description}
                          </p>
                        </td>

                        <td className="p-4">
                          {assignment.students?.map(
                            (student) => (
                              <div
                                key={student._id}
                                className="mb-1"
                              >
                                {student.name}
                              </div>
                            )
                          )}
                        </td>

                        <td className="p-4">
                          {new Date(
                            assignment.dueDate
                          ).toLocaleDateString("en-IN")}
                        </td>

                        <td className="p-4">
                          <button
                            onClick={() =>
                              deleteAssignment(
                                assignment._id
                              )
                            }
                            disabled={
                              deleting === assignment._id
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            {deleting === assignment._id
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
                No announcements posted yet.
              </div>
            ) : (
              <div className="divide-y">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">
                        {announcement.title}
                      </h3>

                      <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                        {announcement.message}
                      </p>

                      <p className="text-sm text-gray-400 mt-2">
                        {new Date(
                          announcement.createdAt
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        deleteAnnouncement(
                          announcement._id
                        )
                      }
                      disabled={
                        deleting === announcement._id
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                      {deleting === announcement._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student Submissions */}
          <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                📥 Student Submissions
              </h2>
            </div>

            {submissionLoading ? (
              <div className="p-6 text-center">
                Loading submissions...
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No submissions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-4 text-left">
                        Assignment
                      </th>
                      <th className="p-4 text-left">
                        Student
                      </th>
                      <th className="p-4 text-left">
                        Answer
                      </th>
                      <th className="p-4 text-left">
                        Submitted
                      </th>
                      <th className="p-4 text-left">
                        Review
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {submissions.map((submission) => (
                      <tr
                        key={submission._id}
                        className="border-t align-top"
                      >
                        <td className="p-4">
                          <p className="font-semibold">
                            {submission.assignment?.title}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {submission.assignment?.description}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="font-medium">
                            {submission.student?.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {submission.student?.email}
                          </p>
                        </td>

                        <td className="p-4">
                          <div className="max-w-md whitespace-pre-wrap">
                            {submission.answer}
                          </div>
                        </td>

                        <td className="p-4">
                          {new Date(
                            submission.submittedAt
                          ).toLocaleDateString("en-IN")}

                          <p className="text-sm text-gray-500">
                            {new Date(
                              submission.submittedAt
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>

                        <td className="p-4 min-w-[260px]">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm mb-3 ${
                              submission.status === "reviewed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {submission.status === "reviewed"
                              ? "Reviewed"
                              : "Pending Review"}
                          </span>

                          <textarea
                            value={
                              feedback[submission._id] ??
                              submission.feedback ??
                              ""
                            }
                            onChange={(e) =>
                              setFeedback((prev) => ({
                                ...prev,
                                [submission._id]:
                                  e.target.value,
                              }))
                            }
                            placeholder="Write feedback..."
                            className="w-full border rounded-lg p-3 text-sm min-h-[90px] outline-none focus:ring-2 focus:ring-blue-500"
                          />

                          <button
                            onClick={() =>
                              reviewSubmission(
                                submission._id
                              )
                            }
                            disabled={
                              reviewing === submission._id
                            }
                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            {reviewing === submission._id
                              ? "Saving..."
                              : "Save Review"}
                          </button>
                        </td>



                      </tr>
                    ))}
                  </tbody>
                </table>
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
                {recentActivities.map((activity, index) => (
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
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}








