
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  type:
    | "announcement"
    | "assignment"
    | "homework"
    | "practical"
    | "class-info";
  title: string;
  icon: string;
  description: string;
  showDueDate?: boolean;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "webp",
];

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadContent = async () => {
    try {
      const res = await fetch(
        "/api/teacher/content?type=" + encodeURIComponent(type),
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.success) {
        setContents(data.contents || []);
      } else {
        alert(data.message || "Unable to load content.");
      }
    } catch (error) {
      console.error("Load content error:", error);
    }
  };

  useEffect(() => {
    loadContent();
  }, [type]);

  const clearSelectedFile = () => {
    setSelectedFile(null);

    const input = document.getElementById(
      "content-attachment"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      dueDate: "",
    });

    clearSelectedFile();
    setEditingId(null);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      alert(
        "Allowed formats: PDF, DOC, DOCX, PPT, PPTX, JPG, JPEG, PNG and WEBP."
      );
      clearSelectedFile();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File size must not exceed 10 MB.");
      clearSelectedFile();
      return;
    }

    setSelectedFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + " bytes";
    }

    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      alert("Please fill in the title and details.");
      return;
    }

    setLoading(true);

    try {
      let res: Response;

      if (editingId) {
        res = await fetch("/api/teacher/content", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingId,
            type: type,
            title: form.title.trim(),
            description: form.description.trim(),
            dueDate: form.dueDate || null,
          }),
        });
      } else {
        const body = new FormData();

        body.append("type", type);
        body.append("title", form.title.trim());
        body.append("description", form.description.trim());
        body.append("dueDate", form.dueDate || "");

        if (selectedFile) {
          body.append("file", selectedFile);
        }

        res = await fetch("/api/teacher/content", {
          method: "POST",
          body: body,
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Unable to save content.");
        return;
      }

      if (editingId) {
        alert("Content updated successfully.");
      } else {
        alert(
          "Successfully shared with " +
            (data.studentsCount || 0) +
            " students."
        );
      }

      resetForm();
      await loadContent();
    } catch (error) {
      console.error("Save content error:", error);
      alert("Something went wrong. Please try again.");
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

    clearSelectedFile();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const deleteContent = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this content?")) {
      return;
    }

    try {
      const res = await fetch(
        "/api/teacher/content?id=" + encodeURIComponent(id),
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Unable to delete content.");
        return;
      }

      alert("Content deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadContent();
    } catch (error) {
      console.error("Delete content error:", error);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/teacher/dashboard"
          className="inline-block font-semibold text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Dashboard
        </Link>

        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
                {icon} {title}
              </h1>

              <p className="mt-2 text-gray-500">{description}</p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-100"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="content-title"
                className="mb-2 block font-medium text-gray-700"
              >
                Title <span className="text-red-500">*</span>
              </label>

              <input
                id="content-title"
                type="text"
                placeholder="Enter title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="content-description"
                className="mb-2 block font-medium text-gray-700"
              >
                Details <span className="text-red-500">*</span>
              </label>

              <textarea
                id="content-description"
                placeholder="Write details..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="min-h-32 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
                disabled={loading}
              />
            </div>

            {showDueDate && (
              <div>
                <label
                  htmlFor="content-due-date"
                  className="mb-2 block font-medium text-gray-700"
                >
                  Due Date (Optional)
                </label>

                <input
                  id="content-due-date"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={loading}
                />
              </div>
            )}

            <div className="rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 p-5 md:p-6">
              <label
                htmlFor="content-attachment"
                className="mb-2 block text-lg font-bold text-gray-900"
              >
                📎 Any Attachments
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Optional)
                </span>
              </label>

              <p className="mb-4 text-sm leading-6 text-gray-600">
                File attach karne ke liye neeche diye gaye Choose File button
                par click karein. Aap PDF, Word document, PowerPoint ya image
                select kar sakte hain.
              </p>

              <input
                id="content-attachment"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                disabled={!!editingId || loading}
                onChange={(e) =>
                  handleFileChange(e.target.files?.[0] || null)
                }
                className="block w-full cursor-pointer rounded-lg border border-blue-300 bg-white text-sm text-gray-800 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-blue-600 file:px-5 file:py-3 file:font-semibold file:text-white hover:file:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-3 text-xs text-gray-600">
                Supported: PDF, DOC, DOCX, PPT, PPTX, JPG, JPEG, PNG and WEBP.
                Maximum size: 10 MB.
              </p>

              {selectedFile && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-green-300 bg-green-50 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-green-800">
                      ✓ File selected successfully
                    </p>

                    <p className="mt-1 break-all text-sm text-gray-700">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    disabled={loading}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove File
                  </button>
                </div>
              )}

              {editingId && (
                <p className="mt-3 text-sm text-amber-700">
                  File replacement during editing is not enabled yet.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
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
            <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
              No content added yet.
            </div>
          ) : (
            contents.map((item) => (
              <div
                key={item._id}
                className="rounded-xl bg-white p-5 shadow-sm md:p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-xl font-bold text-gray-900">
                      {item.title}
                    </h2>

                    <p className="mt-2 whitespace-pre-wrap break-words text-gray-600">
                      {item.description}
                    </p>

                    {item.fileName && (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="font-semibold text-blue-800">
                          📎 Attached File
                        </p>

                        <p className="mt-1 break-all text-sm text-gray-700">
                          {item.fileName}
                        </p>

                        {item.fileSize > 0 && (
                          <p className="mt-1 text-xs text-gray-500">
                            {formatFileSize(item.fileSize)}
                          </p>
                        )}
                      </div>
                    )}

                    {item.dueDate && (
                      <p className="mt-3 font-medium text-red-600">
                        Due:{" "}
                        {new Date(item.dueDate).toLocaleString("en-IN")}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-gray-400">
                      Posted:{" "}
                      {new Date(item.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => editContent(item)}
                      className="rounded-lg border border-blue-200 px-4 py-2 font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteContent(item._id)}
                      className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
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
