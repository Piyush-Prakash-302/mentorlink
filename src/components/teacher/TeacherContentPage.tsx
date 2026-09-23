"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  type: "announcement" | "assignment" | "homework" | "class-info";
  title: string;
  icon: string;
  description: string;
  showDueDate?: boolean;
};

export default function TeacherContentPage({
  type,
  title,
  icon,
  description,
  showDueDate = false,
}: Props) {
  const [contents, setContents] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);

  const loadContent = async () => {
    const res = await fetch(`/api/teacher/content?type=${type}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (data.success) {
      setContents(data.contents);
    }
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.description) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/teacher/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: form.title,
          description: form.description,
          dueDate: form.dueDate || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert(`Successfully shared with ${data.studentsNotified} students`);

      setForm({
        title: "",
        description: "",
        dueDate: "",
      });

      loadContent();
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm("Delete this content?")) return;

    await fetch("/api/teacher/content", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    loadContent();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/teacher/dashboard"
          className="text-blue-600 font-semibold"
        >
          ? Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow p-7 mt-5">
          <h1 className="text-3xl font-bold">
            {icon} {title}
          </h1>

          <p className="text-gray-500 mt-2">{description}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <input
              type="text"
              placeholder="Enter title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              className="w-full border rounded-lg p-3"
              required
            />

            <textarea
              placeholder="Write details..."
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="w-full border rounded-lg p-3 min-h-32"
              required
            />

            {showDueDate && (
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dueDate: e.target.value,
                  })
                }
                className="w-full border rounded-lg p-3"
              />
            )}

            <button
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {loading ? "Sharing..." : "Share with Entire Class"}
            </button>
          </form>
        </div>

        <div className="mt-8 space-y-4">
          {contents.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow text-gray-500">
              No content added yet.
            </div>
          ) : (
            contents.map((item) => (
              <div
                key={item._id}
                className="bg-white p-6 rounded-xl shadow"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {item.title}
                    </h2>

                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                      {item.description}
                    </p>

                    {item.dueDate && (
                      <p className="text-red-600 mt-3 font-medium">
                        Due:{" "}
                        {new Date(item.dueDate).toLocaleString("en-IN")}
                      </p>
                    )}

                    <p className="text-sm text-gray-400 mt-3">
                      {new Date(item.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteContent(item._id)}
                    className="text-red-600 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
