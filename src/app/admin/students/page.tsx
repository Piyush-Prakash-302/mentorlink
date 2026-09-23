"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  branch?: string;
  semester?: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState("");

  const [editingId, setEditingId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();

      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteStudent(id: string) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Student Deleted Successfully");
        fetchStudents();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  }

  function editStudent(student: Student) {
    setEditingId(student._id);
    setName(student.name);
    setEmail(student.email);
    setRole(student.role);
    setBranch(student.branch || "CSE");
    setSemester(student.semester || "");

    setPassword("");
    setIsEditing(true);
    setOpen(true);
  }

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();

    const url = isEditing
      ? `/api/students/${editingId}`
      : "/api/register";

    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        branch,
        semester,
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert(
        isEditing
          ? "Student Updated Successfully"
          : "Student Added Successfully"
      );

      setOpen(false);

      setName("");
      setEmail("");
      setPassword("");
      setRole("student");
      setBranch("CSE");
      setSemester("");

      setEditingId("");
      setIsEditing(false);

      fetchStudents();
    } else {
      alert(data.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              Students Management
            </h1>

            <button
              onClick={() => {
                setIsEditing(false);
                setEditingId("");
                setName("");
                setEmail("");
                setPassword("");
                setRole("student");
                setBranch("CSE");
                setSemester("");
                setOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              + Add Student
            </button>
          </div>

          {open && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg w-[450px] p-6">

                <h2 className="text-2xl font-bold mb-6">
                  {isEditing ? "Edit Student" : "Add Student"}
                </h2>

                <form
                  onSubmit={addStudent}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    required
                  />

                  <input
                    type="password"
                    placeholder={
                      isEditing
                        ? "Leave blank to keep old password"
                        : "Password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    required={!isEditing}
                  />

                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border rounded-lg p-3"
                  >
                    <option value="student">Student</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                  </select>

                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    required
                  >
                    <option value="">Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EE">EE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                  </select>

                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">1st Semester</option>
                    <option value="2">2nd Semester</option>
                    <option value="3">3rd Semester</option>
                    <option value="4">4th Semester</option>
                    <option value="5">5th Semester</option>
                    <option value="6">6th Semester</option>
                  </select>

                  <div className="flex justify-end gap-3 pt-2">

                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setIsEditing(false);
                        setEditingId("");
                      }}
                      className="px-5 py-2 rounded-lg border"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg"
                    >
                      {isEditing ? "Update" : "Save"}
                    </button>

                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden">

            <table className="w-full">

              <thead className="bg-gray-100">

                <tr>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Branch</th>
                  <th className="p-4 text-left">Semester</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Action</th>
                </tr>

              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center">
                      No Students Found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr
                      key={student._id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4">
                        {student.name}
                      </td>

                      <td className="p-4">
                        {student.email}
                      </td>

                      <td className="p-4">
                        {student.branch || "Not assigned"}
                      </td>

                      <td className="p-4">
                        {student.semester
                          ? `${student.semester}th Semester`
                          : "Not assigned"}
                      </td>

                      <td className="p-4 capitalize">
                        {student.role}
                      </td>

                      <td className="p-4">

                        <button
                          onClick={() => editStudent(student)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteStudent(student._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </main>

      </div>

    </div>
  );
}
