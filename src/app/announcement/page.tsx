
"use client";

import { useEffect, useRef, useState } from "react";
import { getSession } from "next-auth/react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  fileId?: string | null;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mentor?: {
    name: string;
    email: string;
  };
}

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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AnnouncementPage() {
  const [role, setRole] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      const session = await getSession();
      const userRole = (session?.user as any)?.role;

      setRole(userRole || "");
      await loadAnnouncements();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnnouncements() {
    try {
      const res = await fetch("/api/announcements", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleFileChange(file: File | null) {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      alert(
        "Allowed files: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG and WEBP."
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("Maximum file size is 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  function removeSelectedFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function createAnnouncement(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      alert("Please enter the title and message.");
      return;
    }

    try {
      setCreating(true);

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("message", message.trim());

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await fetch("/api/announcements", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Announcement created successfully!");

        setTitle("");
        setMessage("");
        removeSelectedFile();

        await loadAnnouncements();
      } else {
        alert(data.message || "Unable to create announcement.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while creating the announcement.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteAnnouncement(announcementId: string) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmDelete) return;

    try {
      setDeleting(announcementId);

      const res = await fetch("/api/announcements", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ announcementId }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Announcement deleted successfully.");

        setAnnouncements((prev) =>
          prev.filter((item) => item._id !== announcementId)
        );
      } else {
        alert(data.message || "Unable to delete announcement.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting the announcement.");
    } finally {
      setDeleting("");
    }
  }

  function attachmentUrl(announcementId: string, download = false) {
    return `/api/announcements/download?id=${encodeURIComponent(
      announcementId
    )}${download ? "&download=1" : ""}`;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Navbar />

        <main className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              📢 Announcements
            </h1>
            <p className="mt-2 text-gray-500">
              Stay updated with important messages and shared documents.
            </p>
          </div>

          {/* MENTOR: CREATE ANNOUNCEMENT */}
          {role === "mentor" && (
            <div className="mb-8 max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Create Announcement
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Share an update with your mentees. You can attach a document
                  if needed.
                </p>
              </div>

              <form onSubmit={createAnnouncement} className="space-y-5">
                <div>
                  <label
                    htmlFor="announcement-title"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Announcement Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="announcement-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Important Notice for Students"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    maxLength={200}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="announcement-message"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="announcement-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your announcement here..."
                    className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    rows={5}
                    required
                  />
                </div>

                {/* ATTACHMENT PICKER */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Attachment <span className="font-normal text-gray-400">(Optional)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    id="announcement-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) =>
                      handleFileChange(e.target.files?.[0] || null)
                    }
                  />

                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-7 text-center transition hover:border-blue-500 hover:bg-blue-100"
                    >
                      <span className="mb-2 text-3xl">📎</span>
                      <span className="font-semibold text-blue-700">
                        Choose a file to attach
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        PDF, Word, PowerPoint or images · Maximum 10 MB
                      </span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-2xl shadow-sm">
                          📄
                        </div>
                        <div className="min-w-0">
                          <p className="break-all font-medium text-gray-800">
                            {selectedFile.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <p className="text-xs text-gray-500">
                    Your assigned mentees will receive this announcement.
                  </p>

                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating ? "Publishing..." : "📢 Publish Announcement"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ANNOUNCEMENT LIST */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b p-5 md:p-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {role === "mentor" ? "My Announcements" : "Announcements"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {role === "student"
                  ? "Announcements shared by your assigned mentor."
                  : "View and manage announcement updates."}
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-gray-500">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mb-3 text-4xl">📭</div>
                <p className="font-medium text-gray-700">
                  No announcements available
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  New announcements will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {announcements.map((announcement) => (
                  <article key={announcement._id} className="p-5 md:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-bold text-gray-800">
                          {announcement.title}
                        </h3>

                        <p className="mt-2 whitespace-pre-wrap break-words leading-7 text-gray-600">
                          {announcement.message}
                        </p>

                        <div className="mt-4 space-y-1 text-sm text-gray-400">
                          <p>
                            📅{" "}
                            {new Date(announcement.createdAt).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          {announcement.mentor?.name && (
                            <p>👨‍🏫 Mentor: {announcement.mentor.name}</p>
                          )}
                        </div>

                        {/* ATTACHMENT VIEW / DOWNLOAD */}
                        {announcement.fileId && announcement.fileName && (
                          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="text-2xl">📎</span>
                                <div className="min-w-0">
                                  <p className="break-all text-sm font-semibold text-gray-800">
                                    {announcement.fileName}
                                  </p>
                                  {typeof announcement.fileSize === "number" &&
                                    announcement.fileSize > 0 && (
                                      <p className="mt-1 text-xs text-gray-500">
                                        {formatFileSize(announcement.fileSize)}
                                      </p>
                                    )}
                                </div>
                              </div>

                              {(role === "mentor" || role === "student") && (
                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <a
                                    href={attachmentUrl(announcement._id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                                  >
                                    👁 View
                                  </a>

                                  <a
                                    href={attachmentUrl(announcement._id, true)}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                  >
                                    ⬇ Download
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {role === "mentor" && (
                        <button
                          type="button"
                          onClick={() => deleteAnnouncement(announcement._id)}
                          disabled={deleting === announcement._id}
                          className="shrink-0 self-start rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          {deleting === announcement._id
                            ? "Deleting..."
                            : "🗑 Delete"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
