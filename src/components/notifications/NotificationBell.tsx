"use client";

import { useEffect, useState } from "react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.log("Notification error:", error);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function markRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: id,
        }),
      });

      loadNotifications();
    } catch (error) {
      console.log(error);
    }
  }

  async function markAllRead() {
    try {
      setLoading(true);

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });

      await loadNotifications();
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100"
        title="Notifications"
      >
        <span className="text-xl">Notifications</span>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border z-50">

          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="font-bold text-lg">
                Notifications
              </h3>

              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">
                  {unreadCount} unread
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-sm text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() =>
                    !notification.isRead &&
                    markRead(notification._id)
                  }
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    !notification.isRead
                      ? "bg-blue-50"
                      : ""
                  }`}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex-1">

                      <h4
                        className={`font-semibold ${
                          !notification.isRead
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {notification.title}
                      </h4>

                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(
                          notification.createdAt
                        ).toLocaleString("en-IN")}
                      </p>

                    </div>

                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                    )}

                  </div>

                </div>
              ))
            )}

          </div>
        </div>
      )}
    </div>
  );
}
