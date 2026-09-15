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
  assignment: {
    _id: string;
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

  async function loadAnnouncements() {
    try {
      const res = await fetch("/api/announcements");
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
      const res = await fetch("/api/assignments");
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
      const res = await fetch("/api/submissions");
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

  function isSubmitted(assignmentId: string) {
    return submissions.some(
      (submission) =>
        submission.assignment?._id === assignmentId
    );
  }

  async function submitAssignment(
    assignmentId: string
  ) {
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8">
            🎓 Student Dashboard
          </h1>

          {/* My Mentor */}
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

          {/* My Meetings */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
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

          {/* My Announcements */}
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">
              📢 My Announcements
            </h2>

            {announcementLoading ? (
              <div className="text-center py-6">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No announcements available.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="border rounded-xl p-5"
                  >
                    <h3 className="text-xl font-bold">
                      {announcement.title}
                    </h3>

                    <p className="text-gray-600 mt-2">
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
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Assignments */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">
              📚 My Assignments
            </h2>

            {assignmentLoading ? (
              <div className="text-center py-6">
                Loading assignments...
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No assignments available.
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="border rounded-xl p-5"
                  >
                    <h3 className="text-xl font-bold">
                      {assignment.title}
                    </h3>

                    <p className="text-gray-600 mt-2">
                      {assignment.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
                      <p>
                        👨‍🏫 <strong>Mentor:</strong>{" "}
                        {assignment.mentor?.name}
                      </p>

                      <p>
                        📅 <strong>Due Date:</strong>{" "}
                        {new Date(
                          assignment.dueDate
                        ).toLocaleDateString()}
                      </p>

                      <p>
                        ⏰ <strong>Time:</strong>{" "}
                        {new Date(
                          assignment.dueDate
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="mt-5">
                      {isSubmitted(assignment._id) ? (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg font-medium">
                          ✅ Assignment Submitted
                        </div>
                      ) : openAssignment === assignment._id ? (
                        <div className="mt-4">
                          <textarea
                            value={answer}
                            onChange={(e) =>
                              setAnswer(e.target.value)
                            }
                            placeholder="Write your answer here..."
                            rows={6}
                            className="w-full border rounded-lg p-3"
                          />

                          <div className="flex gap-3 mt-3">
                            <button
                              onClick={() =>
                                submitAssignment(
                                  assignment._id
                                )
                              }
                              disabled={submitting}
                              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
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
                            setOpenAssignment(assignment._id)
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                        >
                          📤 Submit Assignment
                        </button>
                      )}
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
