import { BarChart3, BookOpen, Clock3, Flame, Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import type { AuthUser } from "@/lib/api";
import type { StudentAttempt } from "@/types/platform";
import { PrimaryButton, SecondaryButton, StatusBadge } from "./ui";

function formatDate(value?: string) {
  if (!value) return "Not submitted";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST"
  );
}

export function StudentDashboard({
  student,
  attempts,
  questionCount,
  totalMarks,
  onStartPractice,
  onBrowseSubjects,
  onViewOverview,
  onResumeTest,
}: {
  student: AuthUser;
  attempts: StudentAttempt[];
  questionCount: number;
  totalMarks: number;
  onStartPractice: () => void;
  onBrowseSubjects: () => void;
  onViewOverview: () => void;
  onResumeTest?: () => void;
}) {
  const completedAttempts = attempts.filter((attempt) => attempt.status === "completed");
  const activeAttempt = attempts.find((attempt) => attempt.status === "active");
  const bestScore = completedAttempts.reduce((best, attempt) => Math.max(best, attempt.percent ?? 0), 0);
  const latestAttempt = attempts[0];
  const averageScore = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum, attempt) => sum + (attempt.percent ?? 0), 0) / completedAttempts.length)
    : 0;

  return (
    <section className="surface-enter mx-auto min-h-[calc(100vh-4.25rem)] w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 text-lg font-black text-sky-700">
                {student.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="h-full w-full object-cover" src={student.avatarUrl} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span className="grid h-full w-full place-items-center">{getInitials(student.fullName)}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase text-sky-700">Student dashboard</span>
                <h1 className="mt-1 truncate text-2xl font-black text-slate-950 sm:text-3xl">
                  Welcome, {student.fullName.split(/\s+/)[0]}
                </h1>
                <span className="mt-1 block truncate text-sm font-semibold text-slate-500">{student.email}</span>
              </span>
            </div>
            <PrimaryButton className="h-11 min-h-11 gap-2 px-4 py-0 text-sm" type="button" onClick={onStartPractice}>
              <Play aria-hidden="true" size={16} />
              Start Practice
            </PrimaryButton>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStat icon={Trophy} label="Best Score" value={`${bestScore}%`} tone="emerald" />
            <DashboardStat icon={BarChart3} label="Average" value={`${averageScore}%`} tone="sky" />
            <DashboardStat icon={RotateCcw} label="Attempts" value={String(completedAttempts.length)} tone="indigo" />
            <DashboardStat icon={Clock3} label="Questions" value={String(questionCount)} tone="slate" />
          </div>

          {activeAttempt && (
            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span>
                <strong className="block text-sm font-black text-amber-800">Active test in progress</strong>
                <small className="mt-1 block font-bold text-amber-700">Started {formatDate(activeAttempt.startedAt)}</small>
              </span>
              <SecondaryButton
                className="h-10 min-h-10 gap-2 px-4 py-0 text-sm"
                disabled={!onResumeTest}
                type="button"
                onClick={onResumeTest}
              >
                <Play aria-hidden="true" size={15} />
                Continue
              </SecondaryButton>
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <button
              className="flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50"
              type="button"
              onClick={onBrowseSubjects}
            >
              <BookOpen className="text-sky-700" aria-hidden="true" size={21} />
              <span>
                <strong className="block text-sm font-black text-slate-950">Subjects</strong>
                <small className="mt-1 block text-xs font-bold text-slate-500">Browse available courses</small>
              </span>
            </button>
            <button
              className="flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50"
              type="button"
              onClick={onViewOverview}
            >
              <Sparkles className="text-indigo-700" aria-hidden="true" size={21} />
              <span>
                <strong className="block text-sm font-black text-slate-950">Test Overview</strong>
                <small className="mt-1 block text-xs font-bold text-slate-500">{totalMarks} marks available</small>
              </span>
            </button>
            <div className="flex min-h-24 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Flame className="text-orange-600" aria-hidden="true" size={21} />
              <span>
                <strong className="block text-sm font-black text-slate-950">Practice Streak</strong>
                <small className="mt-1 block text-xs font-bold text-slate-500">
                  {completedAttempts.length ? "Keep the momentum" : "Start your first test"}
                </small>
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Recent Activity</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Your latest test attempts.</p>
            </div>
            {latestAttempt && (
              <StatusBadge tone={latestAttempt.status === "completed" ? "available" : "neutral"}>
                {latestAttempt.status}
              </StatusBadge>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {attempts.length ? (
              attempts.slice(0, 5).map((attempt) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={attempt.id}>
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <strong className="block text-sm font-black text-slate-950">
                        PHS 001 Topic 1
                      </strong>
                      <small className="mt-1 block font-bold text-slate-500">
                        {attempt.status === "completed"
                          ? `Submitted ${formatDate(attempt.submittedAt)}`
                          : `Started ${formatDate(attempt.startedAt)}`}
                      </small>
                    </span>
                    <strong className="text-lg font-black text-slate-950">
                      {attempt.status === "completed" ? `${attempt.percent ?? 0}%` : "Active"}
                    </strong>
                  </div>
                  {attempt.status === "completed" && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
                        style={{ width: `${Math.max(0, Math.min(100, attempt.percent ?? 0))}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-6 text-slate-500">
                No attempts yet. Start a practice test and your results will appear here.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone: "emerald" | "sky" | "indigo" | "slate";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="min-h-24 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`} aria-hidden="true">
        <Icon size={18} />
      </span>
      <strong className="mt-3 block text-2xl font-black text-slate-950">{value}</strong>
      <span className="mt-1 block text-xs font-bold text-slate-500">{label}</span>
    </div>
  );
}
