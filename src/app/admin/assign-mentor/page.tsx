"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface Mentor {
  _id: string;
  name: string;
  email: string;
}

interface Assignment {
  _id: string;
  student: Student;
  mentor: Mentor;
  assignedAt: string;
}

export default function AssignMentorPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [studentId, setStudentId] = useState("");
  const [mentorId, setMentorId] = useState("");

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [studentsRes, mentorsRes, assignmentsRes] =
        await Promise.all([
          fetch("/api/students"),
          fetch("/api/mentors"),
          fetch("/api/mentor-assignments"),
        ]);

      const studentsData = await studentsRes.json();
      const mentorsData = await mentorsRes.json();
      const assignmentsData = await assignmentsRes.json();

      if (studentsData.success) {
        setStudents(studentsData.students || []);
      }

      if (mentorsData.success) {
        setMentors(mentorsData.mentors || []);
      }

      if (assignmentsData.success) {
        setAssignments(assignmentsData.assignments || []);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function assignMentor() {
    if (!studentId || !mentorId) {
      alert("Please select Student and Mentor");
      return;
    }

    try {
      setAssigning(true);

      const res = await fetch("/api/mentor-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          mentorId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Mentor Assigned Successfully");

        setStudentId("");
        setMentorId("");

        await loadData();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.log(error);
      alert("Something went wrong");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main className="p-8">
          <h1 className="text-3xl font-bold mb-8">
            Assign Mentor
          </h1>

          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">
              Assign Mentor to Student
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">
                  Select Student
                </label>

                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full border rounded-lg p-3"
                >
                  <option value="">
                    -- Select Student --
                  </option>

                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} - {student.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Select Mentor
                </label>

                <select
                  value={mentorId}
                  onChange={(e) => setMentorId(e.target.value)}
                  className="w-full border rounded-lg p-3"
                >
                  <option value="">
                    -- Select Mentor --
                  </option>

                  {mentors.map((mentor) => (
                    <option key={mentor._id} value={mentor._id}>
                      {mentor.name} - {mentor.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={assignMentor}
              disabled={assigning}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              {assigning ? "Assigning..." : "Assign Mentor"}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Assigned Students
              </h2>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                Loading...
              </div>
            ) : assignments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No Mentor Assignments Found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">
                      Student
                    </th>
                    <th className="p-4 text-left">
                      Student Email
                    </th>
                    <th className="p-4 text-left">
                      Mentor
                    </th>
                    <th className="p-4 text-left">
                      Mentor Email
                    </th>
                    <th className="p-4 text-left">
                      Assigned Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((assignment) => (
                    <tr
                      key={assignment._id}
                      className="border-t"
                    >
                      <td className="p-4">
                        {assignment.student?.name}
                      </td>

                      <td className="p-4">
                        {assignment.student?.email}
                      </td>

                      <td className="p-4">
                        {assignment.mentor?.name}
                      </td>

                      <td className="p-4">
                        {assignment.mentor?.email}
                      </td>

                      <td className="p-4">
                        {new Date(
                          assignment.assignedAt
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}