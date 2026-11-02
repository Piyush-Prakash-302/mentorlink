
import Link from "next/link";

const features = [
  {
    number: "01",
    icon: "📅",
    title: "Smart Meetings",
    description:
      "Coordinate mentor sessions and make academic discussions easier to manage.",
    accent: "from-blue-500 to-cyan-400",
    glow: "group-hover:shadow-blue-500/10",
  },
  {
    number: "02",
    icon: "📝",
    title: "Assignments",
    description:
      "Share academic tasks, access learning resources and manage assignment work.",
    accent: "from-violet-500 to-purple-400",
    glow: "group-hover:shadow-violet-500/10",
  },
  {
    number: "03",
    icon: "📢",
    title: "Announcements",
    description:
      "Keep students informed with important updates, notices and attachments.",
    accent: "from-pink-500 to-rose-400",
    glow: "group-hover:shadow-pink-500/10",
  },
  {
    number: "04",
    icon: "📊",
    title: "Academic Progress",
    description:
      "Keep academic information organized and follow student progress.",
    accent: "from-emerald-500 to-teal-400",
    glow: "group-hover:shadow-emerald-500/10",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            WHAT YOU CAN DO
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              work together
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            A centralized workspace designed to make mentor-student
            collaboration more organized, connected and productive.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.number}
              className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-xl ${feature.glow}`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.accent}`}
              />

              <div className="flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl transition duration-300 group-hover:scale-110 group-hover:bg-blue-50">
                  {feature.icon}
                </div>

                <span className="text-sm font-bold tracking-widest text-slate-300">
                  {feature.number}
                </span>
              </div>

              <h3 className="mt-7 text-xl font-bold text-slate-900">
                {feature.title}
              </h3>

              <p className="mt-3 min-h-20 text-sm leading-7 text-slate-600">
                {feature.description}
              </p>

              <div
                className={`mt-6 h-1 w-10 rounded-full bg-gradient-to-r ${feature.accent} transition-all duration-300 group-hover:w-20`}
              />
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-5 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-7 text-center shadow-xl sm:p-10 md:flex-row md:text-left">
          <div>
            <h3 className="text-2xl font-bold text-white">
              Ready to get started?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Bring your academic collaboration into one workspace.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 font-semibold text-white transition hover:-translate-y-1 hover:bg-blue-400"
          >
            Explore MentorLink <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
