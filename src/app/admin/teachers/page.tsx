"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Teacher {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: string;
  subject?: string;
  branch?: string;
  semester?: string;
  section?: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [subject, setSubject] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");

  const [editingId, setEditingId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      setLoading(true);

      const res = await fetch("/api/teachers", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setTeachers(data.teachers || []);
      } else {
        alert(data.message);
      }
    } catch (error: any) {
      alert("Teacher Fetch Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setMobile("");
    setPassword("");
    setSubject("");
    setBranch("CSE");
    setSemester("");
    setSection("");
    setEditingId("");
    setIsEditing(false);
  }

  function editTeacher(teacher: Teacher) {
    setEditingId(teacher._id);
    setName(teacher.name);
    setEmail(teacher.email);
    setMobile(teacher.mobile || "");
    setSubject(teacher.subject || "");
    setBranch(teacher.branch || "CSE");
    setSemester(teacher.semester || "");
    setSection(teacher.section || "");
    setPassword("");
    setIsEditing(true);
    setOpen(true);
  }

  async function deleteTeacher(id: string) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this teacher?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/teachers/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Teacher Deleted Successfully");
        fetchTeachers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function saveTeacher(e: React.FormEvent) {
    e.preventDefault();

    try {
      const url = isEditing
        ? `/api/teachers/${editingId}`
        : "/api/teachers";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          mobile,
          password,
          subject,
          branch,
          semester,
          section,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          isEditing
            ? "Teacher Updated Successfully"
            : "Teacher Added Successfully"
        );

        setOpen(false);
        resetForm();
        fetchTeachers();
      } else {
        alert(data.message);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                Teachers Management
              </h1>

              <p className="text-gray-500 mt-1">
                Manage teachers and their academic information
              </p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              + Add Teacher
            </button>
          </div>

          {open && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">
                  {isEditing ? "Edit Teacher" : "Add Teacher"}
                </h2>

                <form onSubmit={saveTeacher} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Teacher Name"
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
                    type="text"
                    placeholder="Mobile Number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full border rounded-lg p-3"
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

                  <input
                    type="text"
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full border rounded-lg p-3"
                    >
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="ME">ME</option>
                      <option value="CE">CE</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Semester"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full border rounded-lg p-3"
                    />

                    <input
                      type="text"
                      placeholder="Section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full border rounded-lg p-3"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        resetForm();
                      }}
                      className="px-5 py-2 rounded-lg border"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                    >
                      {isEditing ? "Update Teacher" : "Save Teacher"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Subject</th>
                    <th className="p-4 text-left">Class</th>
                    <th className="p-4 text-left">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : teachers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center">
                        No Teachers Found
                      </td>
                    </tr>
                  ) : (
                    teachers.map((teacher) => (
                      <tr
                        key={teacher._id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="p-4 font-medium">
                          {teacher.name}
                        </td>

                        <td className="p-4">
                          {teacher.email}
                        </td>

                        <td className="p-4">
                          {teacher.subject || "-"}
                        </td>

                        <td className="p-4">
                          {teacher.branch || "-"}
                          {teacher.semester
                            ? ` / Sem ${teacher.semester}`
                            : ""}
                          {teacher.section
                            ? ` / ${teacher.section}`
                            : ""}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <button
                            onClick={() => editTeacher(teacher)}
                            className="text-blue-600 hover:text-blue-800 mr-4"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              deleteTeacher(teacher._id)
                            }
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
          </div>
        </main>
      </div>
    </div>
  );
}