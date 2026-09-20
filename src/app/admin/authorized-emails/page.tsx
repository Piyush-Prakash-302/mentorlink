"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

type AuthorizedEmail = {
  _id: string;
  email: string;
};

export default function AuthorizedEmailsPage() {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<AuthorizedEmail[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadEmails() {
    try {
      const res = await fetch("/api/authorized-emails");
      const data = await res.json();

      if (data.success) {
        setEmails(data.emails);
      }
    } catch (error) {
      console.log("Error loading emails:", error);
    }
  }

  useEffect(() => {
    loadEmails();
  }, []);

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter an email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/authorized-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert("Email authorized successfully");
      setEmail("");
      loadEmails();
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function deleteEmail(id: string) {
    const confirmDelete = confirm(
      "Are you sure you want to remove this email?"
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/authorized-emails/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        loadEmails();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Something went wrong");
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            Authorized Student Emails
          </h1>

          <div className="bg-white p-5 rounded-xl shadow mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Add Student Email
            </h2>

            <form
              onSubmit={addEmail}
              className="flex flex-col md:flex-row gap-3"
            >
              <input
                type="email"
                placeholder="Enter student email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-lg px-4 py-3 flex-1"
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                {loading ? "Adding..." : "Add Email"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="text-xl font-semibold">
                Authorized Emails ({emails.length})
              </h2>
            </div>

            {emails.length === 0 ? (
              <p className="p-5 text-gray-500">
                No authorized emails added yet.
              </p>
            ) : (
              <div className="divide-y">
                {emails.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <span className="break-all">
                      {item.email}
                    </span>

                    <button
                      onClick={() => deleteEmail(item._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      Remove
                    </button>
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