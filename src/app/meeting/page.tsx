"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Student {
  _id: string;
  name: string;
  email: string;
}

export default function MeetingPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadStudents();
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

  function toggleStudent(id: string) {
    setSelectedStudents((prev) =>
      prev.includes(id)
        ? prev.filter((studentId) => studentId !== id)
        : [...prev, id]
    );
  }

  async function createMeeting(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
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
          date,
          studentIds: selectedStudents,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Meeting Created Successfully");

        setTitle("");
        setDescription("");
        setDate("");
        setSelectedStudents([]);
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8">
            📅 Meetings
          </h1>

          <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
            <h2 className="text-xl font-semibold mb-6">
              Create Meeting
            </h2>

            <form onSubmit={createMeeting}>
              <div className="mb-5">
                <label className="block mb-2 font-medium">
                  Meeting Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter meeting title"
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
                  placeholder="Enter meeting description"
                  className="w-full border rounded-lg p-3"
                  rows={4}
                  required
                />
              </div>

              <div className="mb-5">
                <label className="block mb-2 font-medium">
                  Date & Time
                </label>

                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
                disabled={
                  creating || students.length === 0
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                {creating
                  ? "Creating..."
                  : "Create Meeting"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}