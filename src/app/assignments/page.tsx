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
  fileId?: string | null;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [openAssignment, setOpenAssignment] = useState("");
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(true);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    try {
      const res = await fetch("/api/mentor/students");
      const data = await res.json();

      if (data.success) {
        setStudents(
          data.students.map((item: any) => item.student)
        );
      }
    } catch (error) {
      console.error(error);
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
      console.error(error);
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
      console.error(error);
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

    if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
      alert("Maximum attachment size is 10 MB");
      return;
    }

    try {
      setCreating(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("dueDate", dueDate);
      formData.append("studentIds", JSON.stringify(selectedStudents));

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Unable to create assignment");
        return;
      }

      alert("Assignment Created Successfully");

      setTitle("");
      setDescription("");
      setDueDate("");
      setSelectedStudents([]);
      setSelectedFile(null);

      const fileInput = document.getElementById(
        "assignment-attachment"
      ) as HTMLInputElement | null;

      if (fileInput) fileInput.value = "";

      await loadAssignments();
      await loadSubmissions();
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setCreating(false);
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
          prev.filter((item) => item._id !== assignmentId)
        );

        await loadSubmissions();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setDeleting("");
    }
  }

  function getSubmission(assignmentId: string) {
    return submissions.find(
      (submission) => submission.assignment?._id === assignmentId
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
        body: JSON.stringify({ assignmentId, answer }),
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
      console.error(error);
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
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
      console.error(error);
      alert("Something went wrong");
    } finally {
      setReviewing("");
    }
  }

  function attachmentLinks(assignment: Assignment) {
    if (!assignment.fileId || !assignment.fileName) {
      return null;
    }

    const url = `/api/assignments/download?id=${encodeURIComponent(
      assignment._id
    )}`;

    return (
      <div className="mt-4 rounded-lg border bg-blue-50 p-3">
        <p className="mb-2 font-semibold text-gray-800">
          📎 Attachment
        </p>

        <p className="mb-3 break-all text-sm text-gray-600">
          {assignment.fileName}
          {assignment.fileSize
            ? ` (${(assignment.fileSize / 1024).toFixed(1)} KB)`
            : ""}
        </p>

        <div className="flex flex-wrap gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            View File
          </a>

          <a
            href={`${url}&download=1`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            Download
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1">
          <Navbar />
          <main className="p-8">Loading assignments...</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Navbar />

        <main className="p-4 md:p-8">
          <h1 className="mb-8 text-3xl font-bold">
            📝 Assignments
          </h1>

          {/* MENTOR VIEW */}
          {role === "mentor" && (
            <>
              <div className="mb-8 max-w-3xl rounded-xl bg-white p-6 shadow">
                <h2 className="mb-6 text-xl font-semibold">
                  Create Assignment
                </h2>

                <form onSubmit={createAssignment}>
                  <div className="mb-5">
                    <label className="mb-2 block font-medium">
                      Assignment Title
                    </label>

                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter assignment title"
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
                      placeholder="Enter assignment description"
                      className="w-full rounded-lg border p-3"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="mb-5">
                    <label className="mb-2 block font-medium">
                      Due Date
                    </label>

                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border p-3"
                      required
                    />
                  </div>

                  <div className="mb-5">
                    <label
                      htmlFor="assignment-attachment"
                      className="mb-2 block font-medium"
                    >
                      Attach File (Optional)
                    </label>

                    <input
                      id="assignment-attachment"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                      className="w-full rounded-lg border p-3"
                    />

                    <p className="mt-1 text-sm text-gray-500">
                      PDF, DOC, DOCX, PPT, PPTX, JPG, PNG or WEBP.
                      Maximum 10 MB.
                    </p>

                    {selectedFile && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                        <span className="break-all">
                          Selected: {selectedFile.name}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            const input = document.getElementById(
                              "assignment-attachment"
                            ) as HTMLInputElement | null;
                            if (input) input.value = "";
                          }}
                          className="text-red-600 underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="mb-2 block font-medium">
                      Select Students
                    </label>

                    {students.length === 0 ? (
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
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Assignment"}
                  </button>
                </form>
              </div>

              {/* MENTOR ASSIGNMENTS */}
              <div className="mb-8 overflow-hidden rounded-xl bg-white shadow">
                <div className="border-b p-6">
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
                          <th className="p-4 text-left">Assignment</th>
                          <th className="p-4 text-left">Students</th>
                          <th className="p-4 text-left">Due Date</th>
                          <th className="p-4 text-left">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {assignments.map((assignment) => (
                          <tr key={assignment._id} className="border-t">
                            <td className="p-4">
                              <p className="font-semibold">
                                {assignment.title}
                              </p>

                              <p className="text-sm text-gray-500">
                                {assignment.description}
                              </p>

                              {attachmentLinks(assignment)}
                            </td>

                            <td className="p-4">
                              {assignment.students?.map((student) => (
                                <div key={student._id} className="mb-1">
                                  {student.name}
                                </div>
                              ))}
                            </td>

                            <td className="p-4">
                              {new Date(
                                assignment.dueDate
                              ).toLocaleDateString("en-IN")}

                              <p className="text-sm text-gray-500">
                                {new Date(
                                  assignment.dueDate
                                ).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </td>

                            <td className="p-4">
                              <button
                                onClick={() =>
                                  deleteAssignment(assignment._id)
                                }
                                disabled={deleting === assignment._id}
                                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
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

              {/* STUDENT SUBMISSIONS */}
              <div className="overflow-hidden rounded-xl bg-white shadow">
                <div className="border-b p-6">
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
                          <th className="p-4 text-left">Assignment</th>
                          <th className="p-4 text-left">Student</th>
                          <th className="p-4 text-left">Answer</th>
                          <th className="p-4 text-left">Status</th>
                          <th className="p-4 text-left">Review</th>
                        </tr>
                      </thead>

                      <tbody>
                        {submissions.map((submission) => (
                          <tr key={submission._id} className="border-t">
                            <td className="p-4 font-semibold">
                              {submission.assignment?.title}
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
                              <span
                                className={
                                  submission.status === "reviewed"
                                    ? "rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                                    : "rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700"
                                }
                              >
                                {submission.status === "reviewed"
                                  ? "Reviewed"
                                  : "Pending Review"}
                              </span>
                            </td>

                            <td className="p-4">
                              {submission.status === "reviewed" ? (
                                <p className="text-sm text-green-700">
                                  {submission.feedback}
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  <textarea
                                    value={feedback[submission._id] || ""}
                                    onChange={(e) =>
                                      setFeedback((prev) => ({
                                        ...prev,
                                        [submission._id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Write feedback..."
                                    className="w-56 rounded-lg border p-2"
                                    rows={3}
                                  />

                                  <button
                                    onClick={() =>
                                      reviewSubmission(submission._id)
                                    }
                                    disabled={
                                      reviewing === submission._id
                                    }
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    {reviewing === submission._id
                                      ? "Saving..."
                                      : "Save Review"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* STUDENT VIEW */}
          {role === "student" && (
            <div className="rounded-xl bg-white p-6 shadow">
              <h2 className="mb-6 text-xl font-semibold">
                📚 My Assignments
              </h2>

              {assignmentLoading || submissionLoading ? (
                <div className="py-6 text-center">
                  Loading assignments...
                </div>
              ) : assignments.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No assignments available.
                </div>
              ) : (
                <div className="space-y-5">
                  {assignments.map((assignment) => {
                    const submission = getSubmission(assignment._id);

                    return (
                      <div
                        key={assignment._id}
                        className="rounded-xl border p-5"
                      >
                        <h3 className="text-xl font-bold">
                          {assignment.title}
                        </h3>

                        <p className="mt-2 whitespace-pre-wrap text-gray-600">
                          {assignment.description}
                        </p>

                        <div className="mt-4 space-y-2 text-sm">
                          <p>
                            👨‍🏫 <strong>Mentor:</strong>{" "}
                            {assignment.mentor?.name || "Mentor"}
                          </p>

                          <p>
                            📅 <strong>Due Date:</strong>{" "}
                            {new Date(
                              assignment.dueDate
                            ).toLocaleDateString("en-IN")}
                          </p>

                          <p>
                            ⏰ <strong>Time:</strong>{" "}
                            {new Date(
                              assignment.dueDate
                            ).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {attachmentLinks(assignment)}

                        {submission ? (
                          <div className="mt-5">
                            <div
                              className={`rounded-lg px-4 py-3 font-medium ${
                                submission.status === "reviewed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {submission.status === "reviewed"
                                ? "✅ Assignment Reviewed"
                                : "⏳ Assignment Submitted - Waiting for Review"}
                            </div>

                            <div className="mt-4 rounded-lg border bg-gray-50 p-4">
                              <p className="mb-2 font-semibold">
                                Your Answer
                              </p>

                              <p className="whitespace-pre-wrap text-gray-700">
                                {submission.answer}
                              </p>

                              <p className="mt-3 text-sm text-gray-500">
                                Submitted on:{" "}
                                {new Date(
                                  submission.submittedAt
                                ).toLocaleString()}
                              </p>
                            </div>

                            {submission.status === "reviewed" && (
                              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                                <p className="mb-2 font-semibold text-green-800">
                                  👨‍🏫 Mentor Feedback
                                </p>

                                <p className="whitespace-pre-wrap text-gray-700">
                                  {submission.feedback ||
                                    "No feedback provided."}
                                </p>

                                {submission.reviewedAt && (
                                  <p className="mt-3 text-sm text-gray-500">
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
                          <div className="mt-5">
                            {openAssignment === assignment._id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={answer}
                                  onChange={(e) =>
                                    setAnswer(e.target.value)
                                  }
                                  placeholder="Write your answer..."
                                  className="w-full rounded-lg border p-3"
                                  rows={6}
                                />

                                <div className="flex flex-wrap gap-3">
                                  <button
                                    onClick={() =>
                                      submitAssignment(assignment._id)
                                    }
                                    disabled={submitting}
                                    className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
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
                                    className="rounded-lg bg-gray-500 px-5 py-2 text-white hover:bg-gray-600"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setOpenAssignment(assignment._id);
                                  setAnswer("");
                                }}
                                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
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

          {role !== "mentor" && role !== "student" && (
            <p className="rounded-lg bg-white p-6 text-gray-600 shadow">
              Your account does not have access to this page.
            </p>
          )}
        </main>
      </div>
    </div>
  );
}