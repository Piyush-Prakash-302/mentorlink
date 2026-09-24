"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Content {
  _id: string;
  type: string;
  title: string;
  description: string;
  dueDate?: string | null;
  createdAt: string;
  teacher?: {
    name: string;
    subject?: string;
  };
}

export default function StudentAcademicPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("announcement");

  useEffect(() => {
    loadContent();
  }, [type]);

  async function loadContent() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/student/teacher-content?type=${type}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (data.success) {
        setContents(data.contents || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    {
      value: "announcement",
      label: "Announcements",
    },
    {
      value: "assignment",
      label: "Assignments",
    },
    {
      value: "homework",
      label: "Homework",
    },    {
      value: "practical",
      label: "Practicals",
    },

    {
      value: "class-info",
      label: "Class Information",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">

          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Academic Updates
            </h1>

            <p className="text-gray-500 mt-1">
              View updates shared by your teachers.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-2 mb-8 flex flex-wrap gap-2">

            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setType(tab.value)}
                className={`px-5 py-3 rounded-lg font-medium transition ${
                  type === tab.value
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}

          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              Loading...
            </div>
          ) : contents.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
              No updates available.
            </div>
          ) : (
            <div className="space-y-5">

              {contents.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-xl shadow p-6"
                >

                  <h2 className="text-xl font-bold">
                    {item.title}
                  </h2>

                  <p className="text-gray-600 mt-3 whitespace-pre-wrap">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap gap-6 mt-5 text-sm text-gray-500">

                    {item.teacher?.name && (
                      <span>
                        Teacher:{" "}
                        <strong>{item.teacher.name}</strong>
                      </span>
                    )}

                    {item.teacher?.subject && (
                      <span>
                        Subject:{" "}
                        <strong>{item.teacher.subject}</strong>
                      </span>
                    )}

                    <span>
                      Posted:{" "}
                      {new Date(
                        item.createdAt
                      ).toLocaleString("en-IN")}
                    </span>

                    {item.dueDate && (
                      <span>
                        Due:{" "}
                        {new Date(
                          item.dueDate
                        ).toLocaleString("en-IN")}
                      </span>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </main>
      </div>
    </div>
  );
}



