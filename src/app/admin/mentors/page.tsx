"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Mentor {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("mentor");

  const [editingId, setEditingId] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, []);

async function fetchMentors() {
  try {
    setLoading(true);

    const url = window.location.origin + "/api/mentors";

    console.log("Fetching:", url);

    const res = await fetch(url, {
      cache: "no-store",
    });

    console.log("Status:", res.status);

    const data = await res.json();

    console.log("Data:", data);

    if (data.success) {
      setMentors(data.mentors || []);
    } else {
      alert("API Error: " + data.message);
    }
  } catch (error: any) {
    console.log("ERROR:", error);
    alert("Mentor Fetch Error: " + error.message);
  } finally {
    setLoading(false);
  }
}

  async function deleteMentor(id: string) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this mentor?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/mentors/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Mentor Deleted Successfully");
        fetchMentors();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  }

  function editMentor(mentor: Mentor) {
    setEditingId(mentor._id);
    setName(mentor.name);
    setEmail(mentor.email);
    setRole(mentor.role);

    setPassword("");
    setIsEditing(true);
    setOpen(true);
  }

  async function addMentor(e: React.FormEvent) {
    e.preventDefault();

    const url = isEditing
      ? `/api/mentors/${editingId}`
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
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert(
        isEditing
          ? "Mentor Updated Successfully"
          : "Mentor Added Successfully"
      );

      setOpen(false);

      setName("");
      setEmail("");
      setPassword("");
      setRole("mentor");

      setEditingId("");
      setIsEditing(false);

      fetchMentors();
    } else {
      alert(data.message);
    }
  }

  return (    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              Mentors Management
            </h1>

            <button
              onClick={() => {
                setIsEditing(false);
                setEditingId("");
                setName("");
                setEmail("");
                setPassword("");
                setRole("mentor");
                setOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              + Add Mentor
            </button>
          </div>

          {open && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-lg w-[450px] p-6">

                <h2 className="text-2xl font-bold mb-6">
                  {isEditing ? "Edit Mentor" : "Add Mentor"}
                </h2>

                <form
                  onSubmit={addMentor}
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
                    <option value="mentor">Mentor</option>
                    <option value="student">Student</option>
                    <option value="admin">Admin</option>
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
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Action</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : mentors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center">
                      No Mentors Found
                    </td>
                  </tr>
                ) : (
                  mentors.map((mentor) => (
                    <tr
                      key={mentor._id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="p-4">
                        {mentor.name}
                      </td>

                      <td className="p-4">
                        {mentor.email}
                      </td>

                      <td className="p-4 capitalize">
                        {mentor.role}
                      </td>

                      <td className="p-4">

                        <button
                          onClick={() => editMentor(mentor)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteMentor(mentor._id)}
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