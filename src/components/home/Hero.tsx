export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-100 py-24">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">

        {/* Left Side */}
        <div className="max-w-xl">

          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            Smart Mentor-Mentee
            <br />
            Management Portal
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Manage mentors, students, meetings,
            assignments and announcements from one
            centralized platform.
          </p>

          <div className="mt-8 flex gap-4">

            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
              Get Started
            </button>

            <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50">
              Learn More
            </button>

          </div>

        </div>

        {/* Right Side */}

        <div className="mt-12 md:mt-0">
          <div className="w-[450px] h-[320px] bg-blue-100 rounded-3xl shadow-xl flex items-center justify-center">
  <div className="text-center">
    <div className="text-7xl">🎓</div>
    <h2 className="text-2xl font-bold text-blue-700 mt-4">
      MentorLink
    </h2>
    <p className="text-gray-600">
      Mentor • Student • Success
    </p>
  </div>
</div>
        </div>

      </div>
    </section>
  );
}