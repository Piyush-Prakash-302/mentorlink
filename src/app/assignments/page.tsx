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
  title: string;
  description: string;
  dueDate: string;
  students: Student[];
  createdAt: string;
}

export default function AssignmentPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");

  useEffect(() => {
    loadStudents();
    loadAssignments();
  }, []);

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
    } finally {
      setLoading(false);
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

  async function deleteAssignment(assignmentId: string) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmDelete) {
      return;
    }

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
            (assignment) => assignment._id !== assignmentId
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8">
            📝 Assignments
          </h1>

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
                  onChange={(e) => setTitle(e.target.value)}
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
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full border rounded-lg p-3"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  Select Students
                </label>

                {loading ? (
                  <p className="text-gray-500">
                    Loading students...
                  </p>
                ) : students.length === 0 ? (
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
                            toggleStudent(student._id)
                          }
                          className="w-5 h-5"
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                {creating
                  ? "Creating..."
                  : "Create Assignment"}
              </button>
            </form>
          </div>

          {/* My Assignments */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
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
                    {assignments.map((assignment) => (
                      <tr
                        key={assignment._id}
                        className="border-t"
                      >
                        <td className="p-4">
                          <p className="font-semibold">
                            {assignment.title}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {assignment.description}
                          </p>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1">
                            {assignment.students?.map(
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
                            assignment.dueDate
                          ).toLocaleDateString()}

                          <p className="text-sm text-gray-500">
                            {new Date(
                              assignment.dueDate
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
                              deleting === assignment._id
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
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
        </main>
      </div>
    </div>
  );
}
