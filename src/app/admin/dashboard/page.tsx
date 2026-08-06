import Sidebar from "@/components/dashboard/Sidebar";
import Navbar from "@/components/dashboard/Navbar";
import StatCard from "@/components/dashboard/StatCard";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1">

        <Navbar />

        <main className="p-8">

          <h1 className="text-3xl font-bold mb-8">
            Welcome Admin 👋
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <StatCard
              title="Total Students"
              value="120"
            />

            <StatCard
              title="Total Mentors"
              value="18"
            />

            <StatCard
              title="Meetings"
              value="45"
            />

          </div>

        </main>

      </div>

    </div>
  );
}