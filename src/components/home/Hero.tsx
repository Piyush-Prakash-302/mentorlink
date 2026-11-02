
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 sm:py-20 md:grid-cols-2 lg:gap-16 lg:py-24">

        {/* Left content */}
        <div className="max-w-2xl">
          <p className="inline-block rounded-full border border-blue-300/30 px-4 py-2 text-sm text-blue-200">
            Smart Academic Collaboration
          </p>

          <h1 className="mt-7 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Smart Mentor-Mentee
            <span className="mt-2 block text-blue-400">
              Management Portal
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
            Manage mentors, students, meetings, assignments and
            announcements from one centralized platform. Stay
            organized and support academic progress through
            better communication.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
            </Link>

            <a
              href="#features"
              className="rounded-lg border border-slate-400 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Learn More
            </a>
          </div>

          <p className="mt-8 text-sm text-slate-400">
            Designed for administrators, mentors and students.
          </p>
        </div>

        {/* Right side logo image */}
        <div className="flex justify-center md:justify-end">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <Image
              src="/mentor-connect.png"
              alt="Mentor Connect CSE - Your Progress Partner"
              width={640}
              height={640}
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
