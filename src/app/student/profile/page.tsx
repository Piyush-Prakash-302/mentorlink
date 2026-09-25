"use client";

import { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
  mobile?: string;
  role: string;
};

export default function StudentProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const [academic, setAcademic] = useState({
    semester1: null as number | null,
    semester2: null as number | null,
    semester3: null as number | null,
    semester4: null as number | null,
    semester5: null as number | null,
    semester6: null as number | null,
  });

  const [savingAcademic, setSavingAcademic] = useState(false);
  const [academicMessage, setAcademicMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();

        if (data.success) {
          setUser(data.user);
          setName(data.user.name || "");
          setMobile(data.user.mobile || "");
        } else {
          setMessage(data.message || "Failed to load profile");
        }
      } catch {
        setMessage("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();

    async function loadAcademic() {
      try {
        const res = await fetch("/api/student/academic");
        const data = await res.json();

        if (data.success && data.academic) {
          setAcademic({
            semester1: data.academic.semester1 ?? null,
            semester2: data.academic.semester2 ?? null,
            semester3: data.academic.semester3 ?? null,
            semester4: data.academic.semester4 ?? null,
            semester5: data.academic.semester5 ?? null,
            semester6: data.academic.semester6 ?? null,
          });
        }
      } catch {
        setAcademicMessage("Failed to load academic details");
      }
    }

    loadAcademic();
  }, []);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          mobile,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setMessage("Profile updated successfully!");
      } else {
        setMessage(data.message || "Update failed");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function saveAcademic(e: React.FormEvent) {
    e.preventDefault();
    setSavingAcademic(true);
    setAcademicMessage("");

    try {
      const res = await fetch("/api/student/academic", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(academic),
      });

      const data = await res.json();

      if (data.success) {
        setAcademicMessage("Academic performance saved successfully!");
      } else {
        setAcademicMessage(
          data.message || "Failed to save academic details"
        );
      }
    } catch {
      setAcademicMessage("Something went wrong");
    } finally {
      setSavingAcademic(false);
    }
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMessage("");

    try {
      const res = await fetch("/api/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMessage("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage(data.message || "Password change failed");
      }
    } catch {
      setPasswordMessage("Something went wrong");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Profile */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-6">
          My Profile
        </h1>

        {message && (
          <div className="mb-5 p-3 rounded-lg bg-blue-50 text-blue-700">
            {message}
          </div>
        )}

        <form onSubmit={updateProfile} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full border rounded-lg px-4 py-3 bg-gray-100 text-gray-500"
            />

            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mobile Number
            </label>

            <input
              type="tel"
              value={mobile}
              onChange={(e) =>
                setMobile(
                  e.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="Enter 10 digit mobile number"
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Role
            </label>

            <input
              type="text"
              value={user?.role || "student"}
              disabled
              className="w-full border rounded-lg px-4 py-3 bg-gray-100 text-gray-500 capitalize"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Academic Performance */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-2">
          Academic Performance
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Enter your CGPA for each semester.
        </p>

        {academicMessage && (
          <div className="mb-5 p-3 rounded-lg bg-blue-50 text-blue-700">
            {academicMessage}
          </div>
        )}

        <form onSubmit={saveAcademic} className="space-y-4">
          {[
            ["semester1", "Semester 1"],
            ["semester2", "Semester 2"],
            ["semester3", "Semester 3"],
            ["semester4", "Semester 4"],
            ["semester5", "Semester 5"],
            ["semester6", "Semester 6"],
          ].map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4"
            >
              <label className="font-medium text-gray-700">
                {label}
              </label>

              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={academic[key as keyof typeof academic] ?? ""}
                onChange={(e) =>
                  setAcademic((prev) => ({
                    ...prev,
                    [key]: e.target.value === ""
                      ? null
                      : Number(e.target.value),
                  }))
                }
                placeholder="0.00 - 10.00"
                className="w-40 border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={savingAcademic}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 rounded-lg mt-4"
          >
            {savingAcademic
              ? "Saving..."
              : "Save Academic Performance"}
          </button>
        </form>
      </div>
      {/* Change Password */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-6">
          Change Password
        </h2>

        {passwordMessage && (
          <div className="mb-5 p-3 rounded-lg bg-blue-50 text-blue-700">
            {passwordMessage}
          </div>
        )}

        <form onSubmit={changePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Current Password
            </label>

            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              New Password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-lg"
          >
            {changingPassword
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
