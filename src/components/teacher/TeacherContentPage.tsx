"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  type: "announcement" | "assignment" | "homework" | "practical" | "class-info";
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadContent = async () => {
    try {
      const res = await fetch(`/api/teacher/content?type=${type}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setContents(data.contents || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadContent();
  }, [type]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      dueDate: "",
    });

    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const method = editingId ? "PUT" : "POST";

      const body: any = {
        type,
        title: form.title,
        description: form.description,
        dueDate: form.dueDate || null,
      };

      if (editingId) {
        body.id = editingId;
      }

      const res = await fetch("/api/teacher/content", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      if (editingId) {
        alert("Content updated successfully.");
      } else {
        alert(
          `Successfully shared with ${data.studentsCount || 0} students`
        );
      }

      resetForm();
      loadContent();
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const editContent = (item: any) => {
    setEditingId(item._id);

    setForm({
      title: item.title || "",
      description: item.description || "",
      dueDate: item.dueDate
        ? new Date(item.dueDate).toISOString().slice(0, 16)
        : "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteContent = async (id: string) => {
    if (!confirm("Delete this content?")) return;

    try {
      const res = await fetch(
        `/api/teacher/content?id=${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      alert("Content deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      loadContent();
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">

        <Link
          href="/teacher/dashboard"
          className="text-blue-600 font-semibold"
        >
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow p-7 mt-5">

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">
                {icon} {title}
              </h1>

              <p className="text-gray-500 mt-2">
                {description}
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-4"
          >
            <input
              type="text"
              placeholder="Enter title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
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
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Content"
                : "Share with Entire Class"}
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

                <div className="flex flex-col md:flex-row md:justify-between gap-5">

                  <div className="flex-1">

                    <h2 className="text-xl font-bold">
                      {item.title}
                    </h2>

                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                      {item.description}
                    </p>

                    {item.dueDate && (
                      <p className="text-red-600 mt-3 font-medium">
                        Due:{" "}
                        {new Date(
                          item.dueDate
                        ).toLocaleString("en-IN")}
                      </p>
                    )}

                    <p className="text-sm text-gray-400 mt-3">
                      Posted:{" "}
                      {new Date(
                        item.createdAt
                      ).toLocaleString("en-IN")}
                    </p>

                  </div>

                  <div className="flex gap-3 items-start">

                    <button
                      onClick={() => editContent(item)}
                      className="text-blue-600 font-semibold border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteContent(item._id)
                      }
                      className="text-red-600 font-semibold border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
