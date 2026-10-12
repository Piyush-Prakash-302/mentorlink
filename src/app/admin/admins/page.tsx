"use client";

import { useEffect, useState, type FormEvent } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Admin {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAdmins() {
    try {
      const res = await fetch("/api/admins");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to load admins.");
      }

      setAdmins(data.admins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function handleDelete(admin: Admin) {
    const confirmed = window.confirm(
      `Are you sure you want to delete admin "${admin.name}"?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `/api/admins?id=${encodeURIComponent(admin._id)}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to delete admin.");
      }

      setMessage("Admin deleted successfully.");
      await loadAdmins();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete admin."
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Unable to create admin.");
      }

      setMessage("Admin created successfully.");
      setName("");
      setEmail("");
      setPassword("");
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Navbar />

        <main className="p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-2">Manage Admins</h1>
          <p className="text-gray-600 mb-8">
            Create and view MentorLink administrator accounts.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="bg-white rounded-xl shadow-sm p-6 h-fit">
              <h2 className="text-xl font-semibold mb-5">Add New Admin</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Enter admin name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Minimum 8 characters"
                  />
                </div>

                {message && (
                  <p className="text-green-700 text-sm">{message}</p>
                )}

                {error && (
                  <p className="text-red-600 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg py-3 font-medium"
                >
                  {saving ? "Creating..." : "Create Admin"}
                </button>
              </form>
            </section>

            <section className="xl:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-5">
                Registered Admins ({admins.length})
              </h2>

              {loading ? (
                <p className="text-gray-500">Loading admins...</p>
              ) : admins.length === 0 ? (
                <p className="text-gray-500">No admins found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-gray-500 text-sm">
                        <th className="py-3 pr-4">Name</th>
                        <th className="py-3 pr-4">Email</th>
                        <th className="py-3">Created</th>
                        <th className="py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin._id} className="border-b last:border-0">
                          <td className="py-4 pr-4 font-medium">{admin.name}</td>
                          <td className="py-4 pr-4 break-all">{admin.email}</td>
                          <td className="py-4 whitespace-nowrap">
                            {admin.createdAt
                              ? new Date(admin.createdAt).toLocaleDateString("en-IN")
                              : "—"}
                          </td>
                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() => handleDelete(admin)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}


