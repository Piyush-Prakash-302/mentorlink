"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Announcement {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
}

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();

      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function createAnnouncement(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setCreating(true);

      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Announcement Created Successfully");

        setTitle("");
        setMessage("");

        await loadAnnouncements();
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

  async function deleteAnnouncement(
    announcementId: string
  ) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(announcementId);

      const res = await fetch("/api/announcements", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          announcementId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Announcement Deleted Successfully");

        setAnnouncements((prev) =>
          prev.filter(
            (announcement) =>
              announcement._id !== announcementId
          )
        );
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setDeleting("");
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8">
            📢 Announcements
          </h1>

          {/* Create Announcement */}
          <div className="bg-white rounded-xl shadow p-6 max-w-3xl mb-8">
            <h2 className="text-xl font-semibold mb-6">
              Create Announcement
            </h2>

            <form onSubmit={createAnnouncement}>
              <div className="mb-5">
                <label className="block mb-2 font-medium">
                  Announcement Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Enter announcement title"
                  className="w-full border rounded-lg p-3"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  Message
                </label>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  placeholder="Write announcement message"
                  className="w-full border rounded-lg p-3"
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                {creating
                  ? "Creating..."
                  : "Create Announcement"}
              </button>
            </form>
          </div>

          {/* My Announcements */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                My Announcements
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                Loading announcements...
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No announcements created yet.
              </div>
            ) : (
              <div className="divide-y">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="p-6"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold">
                          {announcement.title}
                        </h3>

                        <p className="text-gray-600 mt-2">
                          {announcement.message}
                        </p>

                        <p className="text-sm text-gray-400 mt-3">
                          {new Date(
                            announcement.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          deleteAnnouncement(
                            announcement._id
                          )
                        }
                        disabled={
                          deleting === announcement._id
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg h-fit"
                      >
                        {deleting === announcement._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
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