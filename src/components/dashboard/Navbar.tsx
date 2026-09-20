"use client";

import { useEffect, useState } from "react";
import { signOut, getSession } from "next-auth/react";
import { Bell, X } from "lucide-react";

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function Navbar() {
  const [title, setTitle] = useState("Dashboard");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load user role
  useEffect(() => {
    async function loadRole() {
      try {
        const session = await getSession();
        const role = (session?.user as any)?.role;

        if (role === "admin") {
          setTitle("Admin Dashboard");
        } else if (role === "mentor") {
          setTitle("Mentor Dashboard");
        } else if (role === "student") {
          setTitle("Student Dashboard");
        }
      } catch (error) {
        console.log("Error loading session:", error);
      }
    }

    loadRole();
  }, []);

  // Load notifications
  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.log("Error loading notifications:", error);
    }
  }

  useEffect(() => {
    loadNotifications();

    // Refresh notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000);

    return () => clearInterval(interval);
  }, []);

  // Time ago
  function getTimeAgo(date: string) {
    const now = Date.now();
    const notificationTime = new Date(date).getTime();

    const seconds = Math.floor(
      (now - notificationTime) / 1000
    );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} minute${
        minutes > 1 ? "s" : ""
      } ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${
        hours > 1 ? "s" : ""
      } ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 30) {
      return `${days} day${
        days > 1 ? "s" : ""
      } ago`;
    }

    return new Date(date).toLocaleDateString("en-IN");
  }

  // Notification icon
  function getNotificationIcon(type: string) {
    if (type === "meeting") return "📅";
    if (type === "assignment") return "📝";
    if (type === "announcement") return "📢";

    return "🔔";
  }

  // Mark single notification as read
  async function markAsRead(id: string) {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === id
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification
          )
        );

        setUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );
      }
    } catch (error) {
      console.log(
        "Error marking notification:",
        error
      );
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    if (unreadCount === 0) return;

    setLoading(true);

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );

        setUnreadCount(0);
      }
    } catch (error) {
      console.log(
        "Error marking all notifications:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-4 pl-20 md:pl-6">
      
      {/* Dashboard Title */}
      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      <div className="flex items-center gap-3">

        {/* Notification */}
        <div className="relative">
          <button
            onClick={() =>
              setShowNotifications(
                !showNotifications
              )
            }
            className="relative p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Notifications"
          >
            <Bell size={24} />

            {/* Unread Count */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Panel */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border z-50">

              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    Notifications
                  </h3>

                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {unreadCount} unread notification
                      {unreadCount > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 text-xs font-semibold disabled:opacity-50"
                    >
                      {loading
                        ? "Updating..."
                        : "Mark all as read"}
                    </button>
                  )}

                  <button
                    onClick={() =>
                      setShowNotifications(false)
                    }
                    className="p-1 rounded hover:bg-gray-100"
                    aria-label="Close notifications"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto">

                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell
                      size={32}
                      className="mx-auto text-gray-300 mb-2"
                    />

                    <p className="text-gray-500 text-sm">
                      No notifications
                    </p>
                  </div>
                ) : (
                  notifications.map(
                    (notification) => (
                      <button
                        key={notification._id}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead(
                              notification._id
                            );
                          }
                        }}
                        className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                          !notification.isRead
                            ? "bg-blue-50"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">

                          {/* Icon */}
                          <span className="text-xl">
                            {getNotificationIcon(
                              notification.type
                            )}
                          </span>

                          {/* Content */}
                          <div className="flex-1 min-w-0">

                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm">
                                {notification.title}
                              </p>

                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                              )}
                            </div>

                            <p className="text-gray-600 text-sm mt-1">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <p className="text-gray-400 text-xs">
                                {getTimeAgo(
                                  notification.createdAt
                                )}
                              </p>

                              {!notification.isRead && (
                                <p className="text-blue-600 text-xs font-medium">
                                  New
                                </p>
                              )}
                            </div>

                          </div>
                        </div>
                      </button>
                    )
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() =>
            signOut({
              callbackUrl: "/login",
            })
          }
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>

      </div>
    </header>
  );
}