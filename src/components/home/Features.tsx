export default function Features() {
  return (
    <section className="py-20 bg-white">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-4xl font-bold text-center mb-12">
          Features
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

          <div className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-bold mb-2">
              Meetings
            </h3>
            <p className="text-gray-600">
              Schedule mentor meetings easily.
            </p>
          </div>

          <div className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-bold mb-2">
              Assignments
            </h3>
            <p className="text-gray-600">
              Create and submit assignments.
            </p>
          </div>

          <div className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition">
            <div className="text-5xl mb-4">📢</div>
            <h3 className="text-xl font-bold mb-2">
              Announcements
            </h3>
            <p className="text-gray-600">
              Important notices for students.
            </p>
          </div>

          <div className="p-6 rounded-xl shadow-lg hover:shadow-2xl transition">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">
              Progress
            </h3>
            <p className="text-gray-600">
              Track academic performance.
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}