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

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  students: Student[];
  mentor?: {
    name: string;
    email: string;
  };
  createdAt: string;
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
  student: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function AssignmentPage() {
  const [role, setRole] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [feedback, setFeedback] = useState<
    Record<string, string>
  >({});

  const [openAssignment, setOpenAssignment] = useState("");
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] =
    useState(true);
  const [submissionLoading, setSubmissionLoading] =
    useState(true);

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [reviewing, setReviewing] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const session = await getSession();
      const userRole = (session?.user as any)?.role;

      setRole(userRole || "");

      await loadAssignments();

      if (userRole === "mentor") {
        await loadStudents();
        await loadSubmissions();
      }

      if (userRole === "student") {
        await loadSubmissions();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    try {
      const res = await fetch("/api/mentor/students");
      const data = await res.json();

      if (data.success) {
        const studentList = data.students.map(
          (item: any) => item.student
        );

        setStudents(studentList);
      }
    } catch (error) {
      console.log(error);
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

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id]
    );
  }

  async function createAssignment(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }

    try {
      setCreating(true);

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          dueDate,
          studentIds: selectedStudents,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Assignment Created Successfully");

        setTitle("");
        setDescription("");
        setDueDate("");
        setSelectedStudents([]);

        await loadAssignments();
        await loadSubmissions();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function deleteAssignment(
    assignmentId: string
  ) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmDelete) return;

    try {
      setDeleting(assignmentId);

      const res = await fetch("/api/assignments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Assignment Deleted Successfully");

        setAssignments((prev) =>
          prev.filter(
            (assignment) =>
              assignment._id !== assignmentId
          )
        );

        await loadSubmissions();
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

  function getSubmission(assignmentId: string) {
    return submissions.find(
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

  async function reviewSubmission(
    submissionId: string
  ) {
    try {
      setReviewing(submissionId);

      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          feedback: feedback[submissionId] || "",
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Submission reviewed successfully");

        setFeedback((prev) => ({
          ...prev,
          [submissionId]: "",
        }));

        await loadSubmissions();
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8">
            📝 Assignments
          </h1>

          {/* ================= MENTOR VIEW ================= */}

          {role === "mentor" && (
            <>
              {/* Create Assignment */}
              <div className="bg-white rounded-xl shadow p-6 max-w-3xl mb-8">
                <h2 className="text-xl font-semibold mb-6">
                  Create Assignment
                </h2>

                <form onSubmit={createAssignment}>
                  <div className="mb-5">
                    <label className="block mb-2 font-medium">
                      Assignment Title
                    </label>

                    <input
                      type="text"
                      value={title}
                      onChange={(e) =>
                        setTitle(e.target.value)
                      }
                      placeholder="Enter assignment title"
                      className="w-full border rounded-lg p-3"
                      required
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block mb-2 font-medium">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      placeholder="Enter assignment description"
                      className="w-full border rounded-lg p-3"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="mb-5">
                    <label className="block mb-2 font-medium">
                      Due Date
                    </label>

                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) =>
                        setDueDate(e.target.value)
                      }
                      className="w-full border rounded-lg p-3"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block mb-2 font-medium">
                      Select Students
                    </label>

                    {students.length === 0 ? (
                      <p className="text-gray-500">
                        No students assigned to you.
                      </p>
                    ) : (
                      <div className="border rounded-lg p-4 space-y-3">
                        {students.map((student) => (
                          <label
                            key={student._id}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(
                                student._id
                              )}
                              onChange={() =>
                                toggleStudent(
                                  student._id
                                )
                              }
                              className="w-5 h-5"
                            />

                            <span>
                              {student.name} -{" "}
                              {student.email}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      creating ||
                      students.length === 0
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                  >
                    {creating
                      ? "Creating..."
                      : "Create Assignment"}
                  </button>
                </form>
              </div>

              {/* Mentor Assignments */}
              <div className="bg-white rounded-xl shadow overflow-hidden mb-8">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold">
                    📚 My Assignments
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
                        {assignments.map(
                          (assignment) => (
                            <tr
                              key={assignment._id}
                              className="border-t"
                            >
                              <td className="p-4">
                                <p className="font-semibold">
                                  {assignment.title}
                                </p>

                                <p className="text-sm text-gray-500">
                                  {
                                    assignment.description
                                  }
                                </p>
                              </td>

                              <td className="p-4">
                                {assignment.students?.map(
                                  (student) => (
                                    <div
                                      key={
                                        student._id
                                      }
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
                                ).toLocaleDateString()}

                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    assignment.dueDate
                                  ).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )}
                                </p>
                              </td>

                              <td className="p-4">
                                <button
                                  onClick={() =>
                                    deleteAssignment(
                                      assignment._id
                                    )
                                  }
                                  disabled={
                                    deleting ===
                                    assignment._id
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                                >
                                  {deleting ===
                                  assignment._id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Student Submissions */}
              <div className="bg-white rounded-xl shadow overflow-hidden">
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
                    No student submissions yet.
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
                            Status
                          </th>

                          <th className="p-4 text-left">
                            Review
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {submissions.map(
                          (submission) => (
                            <tr
                              key={submission._id}
                              className="border-t"
                            >
                              <td className="p-4">
                                <p className="font-semibold">
                                  {
                                    submission
                                      .assignment
                                      ?.title
                                  }
                                </p>
                              </td>

                              <td className="p-4">
                                <p className="font-medium">
                                  {
                                    submission.student
                                      ?.name
                                  }
                                </p>

                                <p className="text-sm text-gray-500">
                                  {
                                    submission.student
                                      ?.email
                                  }
                                </p>
                              </td>

                              <td className="p-4">
                                <div className="max-w-md whitespace-pre-wrap">
                                  {
                                    submission.answer
                                  }
                                </div>
                              </td>

                              <td className="p-4">
                                <span
                                  className={
                                    submission.status ===
                                    "reviewed"
                                      ? "bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                                      : "bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm"
                                  }
                                >
                                  {submission.status ===
                                  "reviewed"
                                    ? "Reviewed"
                                    : "Pending Review"}
                                </span>
                              </td>

                              <td className="p-4">
                                {submission.status ===
                                "reviewed" ? (
                                  <p className="text-green-700 text-sm">
                                    {
                                      submission.feedback
                                    }
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    <textarea
                                      value={
                                        feedback[
                                          submission._id
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        setFeedback(
                                          (prev) => ({
                                            ...prev,
                                            [submission._id]:
                                              e.target
                                                .value,
                                          })
                                        )
                                      }
                                      placeholder="Write feedback..."
                                      className="border rounded-lg p-2 w-56"
                                      rows={3}
                                    />

                                    <button
                                      onClick={() =>
                                        reviewSubmission(
                                          submission._id
                                        )
                                      }
                                      disabled={
                                        reviewing ===
                                        submission._id
                                      }
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                    >
                                      {reviewing ===
                                      submission._id
                                        ? "Saving..."
                                        : "Save Review"}
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================= STUDENT VIEW ================= */}

          {role === "student" && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-6">
                📚 My Assignments
              </h2>

              {assignmentLoading ||
              submissionLoading ? (
                <div className="text-center py-6">
                  Loading assignments...
                </div>
              ) : assignments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No assignments available.
                </div>
              ) : (
                <div className="space-y-5">
                  {assignments.map((assignment) => {
                    const submission =
                      getSubmission(assignment._id);

                    return (
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

                        <div className="mt-4 space-y-2 text-sm">
                          <p>
                            👨‍🏫{" "}
                            <strong>
                              Mentor:
                            </strong>{" "}
                            {assignment.mentor?.name ||
                              "Mentor"}
                          </p>

                          <p>
                            📅{" "}
                            <strong>
                              Due Date:
                            </strong>{" "}
                            {new Date(
                              assignment.dueDate
                            ).toLocaleDateString(
                              "en-IN"
                            )}
                          </p>

                          <p>
                            ⏰{" "}
                            <strong>Time:</strong>{" "}
                            {new Date(
                              assignment.dueDate
                            ).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </p>
                        </div>

                        {/* Already submitted */}
                        {submission ? (
                          <div className="mt-5">
                            <div
                              className={`px-4 py-3 rounded-lg font-medium ${
                                submission.status ===
                                "reviewed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {submission.status ===
                              "reviewed"
                                ? "✅ Assignment Reviewed"
                                : "⏳ Assignment Submitted - Waiting for Review"}
                            </div>

                            <div className="mt-4 bg-gray-50 border rounded-lg p-4">
                              <p className="font-semibold mb-2">
                                Your Answer
                              </p>

                              <p className="text-gray-700 whitespace-pre-wrap">
                                {submission.answer}
                              </p>

                              <p className="text-sm text-gray-500 mt-3">
                                Submitted on:{" "}
                                {new Date(
                                  submission.submittedAt
                                ).toLocaleString()}
                              </p>
                            </div>

                            {submission.status ===
                              "reviewed" && (
                              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="font-semibold text-green-800 mb-2">
                                  👨‍🏫 Mentor Feedback
                                </p>

                                <p className="text-gray-700 whitespace-pre-wrap">
                                  {submission.feedback ||
                                    "No feedback provided."}
                                </p>

                                {submission.reviewedAt && (
                                  <p className="text-sm text-gray-500 mt-3">
                                    Reviewed on:{" "}
                                    {new Date(
                                      submission.reviewedAt
                                    ).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Submit assignment */
                          <div className="mt-5">
                            {openAssignment ===
                            assignment._id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={answer}
                                  onChange={(e) =>
                                    setAnswer(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Write your answer..."
                                  className="w-full border rounded-lg p-3"
                                  rows={6}
                                />

                                <div className="flex gap-3">
                                  <button
                                    onClick={() =>
                                      submitAssignment(
                                        assignment._id
                                      )
                                    }
                                    disabled={
                                      submitting
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                                  >
                                    {submitting
                                      ? "Submitting..."
                                      : "Submit Assignment"}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setOpenAssignment(
                                        ""
                                      );
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
                                onClick={() => {
                                  setOpenAssignment(
                                    assignment._id
                                  );
                                  setAnswer("");
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                              >
                                Submit Assignment
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}