import { BarChart3, BookOpen, CalendarDays, Camera, ChevronRight, Clock3, LayoutDashboard, LogOut, Play, RotateCcw, Sparkles, Trash2, Trophy } from "lucide-react";
import type { ComponentType } from "react";
import { useRef, useState } from "react";
import type { AuthUser } from "@/lib/api";
import type { StudentAttempt } from "@/types/platform";
import { PrimaryButton, SecondaryButton } from "./ui";

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
  onRemoveProfileAvatar,
  onUploadProfileAvatar,
}: {
  student: AuthUser;
  attempts: StudentAttempt[];
  questionCount: number;
  totalMarks: number;
  onStartPractice: () => void;
  onBrowseSubjects: () => void;
  onViewOverview: () => void;
  onResumeTest?: () => void;
  onRemoveProfileAvatar: () => Promise<void>;
  onUploadProfileAvatar: (file: File) => Promise<void>;
}) {
  const completedAttempts = attempts.filter((attempt) => attempt.status === "completed");
  const activeAttempt = attempts.find((attempt) => attempt.status === "active");
  const bestScore = completedAttempts.reduce((best, attempt) => Math.max(best, attempt.percent ?? 0), 0);
  const averageScore = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum, attempt) => sum + (attempt.percent ?? 0), 0) / completedAttempts.length)
    : 0;
  const completion = questionCount ? Math.round((completedAttempts.reduce((sum, attempt) => sum + attempt.answered, 0) / Math.max(1, completedAttempts.length)) / questionCount * 100) : 0;
  const firstName = student.fullName.split(/\s+/)[0];
  const registeredCourses = student.registeredCourses ?? [];
  const hasPhs001 = registeredCourses.includes("PHS 001");
  const [avatarError, setAvatarError] = useState("");
  const [avatarStatus, setAvatarStatus] = useState("");
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const uploadAvatar = async (file: File) => {
    setAvatarError("");
    setAvatarStatus("");

    if (!file.type.startsWith("image/")) {
      setAvatarError("Choose a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Choose an image smaller than 2 MB.");
      return;
    }

    setIsSavingAvatar(true);
    try {
      await onUploadProfileAvatar(file);
      setAvatarStatus("Profile image saved.");
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Could not update profile image.");
    } finally {
      setIsSavingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const removeAvatar = async () => {
    setAvatarError("");
    setAvatarStatus("");
    setIsSavingAvatar(true);

    try {
      await onRemoveProfileAvatar();
      setAvatarStatus("Profile image removed.");
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "Could not remove profile image.");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  return (
    <section className="surface-enter mx-auto min-h-[calc(100vh-4.25rem)] w-full max-w-[1500px] px-3 py-4 sm:px-6 lg:px-8">
      <div className="dashboard-shell grid min-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-muted)] shadow-[0_24px_70px_rgba(8,43,99,0.1)] lg:grid-cols-[220px_1fr]">
        <aside className="dashboard-sidebar hidden border-r border-[var(--line)] bg-[var(--surface)] p-5 lg:flex lg:flex-col">
          <div className="flex items-center gap-2 text-[var(--brand-blue)]"><span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--brand-blue)] text-white"><BookOpen size={17} /></span><strong className="text-sm font-black">STEM Hub</strong></div>
          <nav className="mt-12 grid gap-2 text-sm font-black">
            <span className="flex items-center gap-3 rounded-md bg-[var(--brand-ice)] px-3 py-3 text-[var(--brand-blue)]"><LayoutDashboard size={17} /> Dashboard</span>
            <button className="flex items-center gap-3 rounded-md px-3 py-3 text-[var(--ink-muted)] transition hover:bg-[var(--brand-ice)] hover:text-[var(--brand-blue)]" type="button" onClick={onBrowseSubjects}><BookOpen size={17} /> Subjects</button>
          </nav>
          <div className="mt-auto grid gap-2 text-sm font-black text-[var(--ink-muted)]"><button className="flex items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-[var(--brand-ice)]" type="button" onClick={onBrowseSubjects}><Sparkles size={17} /> Explore more</button><span className="flex items-center gap-3 px-3 py-3"><LogOut size={17} /> Sign out in profile</span></div>
        </aside>

        <div className="min-w-0 p-4 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h1 className="text-2xl font-black tracking-tight text-[var(--ink)] sm:text-3xl">Welcome back, {firstName}.</h1></div>
            <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><strong className="block text-sm font-black text-[var(--ink)]">{student.fullName}</strong></span><span className="grid h-11 w-11 overflow-hidden rounded-full bg-[var(--brand-mint)] font-black text-[var(--brand-green)]">{student.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="h-full w-full object-cover" src={student.avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : <span className="grid h-full w-full place-items-center">{getInitials(student.fullName)}</span>}</span></div>
          </div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_285px]">
            <main className="dashboard-main min-w-0">
              <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-sm">
                <div className="relative h-52 overflow-hidden bg-[radial-gradient(ellipse_at_15%_130%,rgba(255,255,255,0.7)_0_17%,transparent_18%),radial-gradient(ellipse_at_44%_130%,rgba(255,255,255,0.5)_0_17%,transparent_18%),radial-gradient(ellipse_at_78%_130%,rgba(255,255,255,0.42)_0_17%,transparent_18%),linear-gradient(135deg,#7da8ff,#bcd4ff)] sm:h-64">
                  <div className="absolute inset-y-0 left-[14%] w-2 rotate-[-24deg] bg-lime-200/80 blur-[1px]" />
                  <div className="absolute inset-y-0 left-[43%] w-2 rotate-[-24deg] bg-lime-200/80 blur-[1px]" />
                  <div className="absolute inset-y-0 right-[12%] w-2 rotate-[-24deg] bg-lime-200/80 blur-[1px]" />
                  <div className="absolute right-4 top-4 flex gap-2">
                    <button
                      aria-label={student.avatarUrl ? "Replace profile image" : "Add profile image"}
                      className="grid h-12 w-12 place-items-center rounded-lg border-2 border-white bg-yellow-300 text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-200"
                      disabled={isSavingAvatar}
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera size={18} />
                    </button>
                    <button
                      aria-label="Remove profile image"
                      className="grid h-12 w-12 place-items-center rounded-lg border-2 border-white bg-yellow-300 text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSavingAvatar || !student.avatarUrl}
                      type="button"
                      onClick={() => void removeAvatar()}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="-mt-16 px-5 pb-6 text-center sm:px-8 sm:pb-8">
                  <div className="relative mx-auto h-32 w-32 sm:h-36 sm:w-36">
                    <span className="grid h-32 w-32 overflow-hidden rounded-full border-[6px] border-white bg-slate-200 text-3xl font-black text-slate-500 shadow-xl sm:h-36 sm:w-36">
                      {student.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="h-full w-full object-cover" src={student.avatarUrl} alt="" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="grid h-full w-full place-items-center">{getInitials(student.fullName)}</span>
                      )}
                    </span>
                    <button
                      aria-label={student.avatarUrl ? "Replace profile image" : "Add profile image"}
                      className="absolute -bottom-1 -right-1 grid h-12 w-12 place-items-center rounded-full border-4 border-yellow-100 bg-slate-100 text-slate-900 shadow-lg transition hover:-translate-y-0.5"
                      disabled={isSavingAvatar}
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Camera size={17} />
                    </button>
                  </div>
                  <input
                    ref={avatarInputRef}
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="sr-only"
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadAvatar(file);
                    }}
                  />
                  {avatarError && <p className="mt-3 text-sm font-bold text-rose-600">{avatarError}</p>}
                  {avatarStatus && <p className="mt-3 text-sm font-bold text-[var(--brand-green)]">{avatarStatus}</p>}
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <PrimaryButton className="bg-[var(--brand-green)]" type="button" onClick={onStartPractice}>
                      <Play size={16} /> {hasPhs001 ? "Start Practice" : "Register a course"}
                    </PrimaryButton>
                    <SecondaryButton disabled={isSavingAvatar} type="button" onClick={() => avatarInputRef.current?.click()}>
                      <Camera size={16} /> {student.avatarUrl ? "Replace image" : "Add image"}
                    </SecondaryButton>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between"><div><h2 className="text-xl font-black text-[var(--ink)]">My course</h2><p className="mt-1 text-sm font-semibold text-[var(--ink-muted)]">{hasPhs001 ? "Physics · PHS 001" : "No course registered yet"}</p></div><button className="text-xs font-black text-[var(--brand-blue)]" type="button" onClick={onBrowseSubjects}>View subjects <ChevronRight className="inline" size={14} /></button></div>
              {hasPhs001 ? (
                <button className="mt-4 w-full rounded-xl border-2 border-[var(--brand-blue)] bg-[var(--surface)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg" type="button" onClick={onViewOverview}><div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--brand-ice)] text-[var(--brand-blue)]"><BookOpen size={22} /></span><span className="rounded-full bg-[var(--brand-mint)] px-3 py-1 text-[10px] font-black uppercase text-[var(--brand-green)]">Active</span></div><strong className="mt-5 block text-lg font-black text-[var(--ink)]">Physical Quantities and Measurement</strong><span className="mt-1 block text-sm font-semibold text-[var(--ink-muted)]">PHS 001 · Topic 1</span><div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--brand-ice)]"><div className="h-full rounded-full bg-[var(--brand-green)]" style={{ width: `${completion}%` }} /></div><div className="mt-2 flex justify-between text-xs font-bold text-[var(--ink-muted)]"><span>{completion}% progress</span><span>{totalMarks} marks available</span></div></button>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-5 text-center">
                  <BookOpen className="mx-auto text-[var(--brand-blue)]" size={30} />
                  <strong className="mt-3 block text-lg font-black text-[var(--ink)]">Register a course to begin</strong>
                  <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[var(--ink-muted)]">
                    Your dashboard will show course topics, progress, and attempts after you register.
                  </p>
                  <PrimaryButton className="mt-5" type="button" onClick={onBrowseSubjects}>
                    Register course
                  </PrimaryButton>
                </div>
              )}
              <div className="mt-8 grid gap-3 sm:grid-cols-3"><DashboardStat icon={Trophy} label="Best score" value={`${bestScore}%`} tone="emerald" /><DashboardStat icon={BarChart3} label="Average" value={`${averageScore}%`} tone="sky" /><DashboardStat icon={RotateCcw} label="Attempts" value={String(completedAttempts.length)} tone="indigo" /></div>
            </main>

            <aside className="dashboard-rail space-y-6">
              <div className="dashboard-card rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[var(--ink)]">My schedule</h2>
                  <CalendarDays className="text-[var(--brand-blue)]" size={19} />
                </div>
                <div className="mt-5 rounded-lg bg-[var(--brand-ice)] p-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--brand-blue)]">Next focus</span>
                  <strong className="mt-2 block text-sm font-black text-[var(--ink)]">
                    {activeAttempt ? "Finish your active test" : hasPhs001 ? "Start PHS 001 Topic 1" : "Register your first course"}
                  </strong>
                  <span className="mt-1 block text-xs font-semibold text-[var(--ink-muted)]">
                    {activeAttempt ? `Started ${formatDate(activeAttempt.startedAt)}` : "Ready whenever you are"}
                  </span>
                  {activeAttempt ? (
                    <SecondaryButton className="mt-4 h-9 min-h-9 w-full px-3 py-0 text-xs" type="button" onClick={onResumeTest}>
                      <Play size={14} /> Resume
                    </SecondaryButton>
                  ) : !hasPhs001 ? (
                    <PrimaryButton className="mt-4 h-9 min-h-9 w-full px-3 py-0 text-xs" type="button" onClick={onBrowseSubjects}>
                      Register
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton className="mt-4 h-9 min-h-9 w-full px-3 py-0 text-xs" type="button" onClick={onStartPractice}>
                      <Play size={14} /> Begin
                    </PrimaryButton>
                  )}
                </div>
              </div>

              <div className="dashboard-card rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-[var(--ink)]">Recent attempts</h2>
                  <Clock3 className="text-[var(--brand-green)]" size={19} />
                </div>
                <div className="mt-4 grid gap-3">
                  {attempts.length ? (
                    attempts.slice(0, 3).map((attempt) => (
                      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0" key={attempt.id}>
                        <span className="min-w-0">
                          <strong className="block truncate text-xs font-black text-[var(--ink)]">PHS 001 · Topic 1</strong>
                          <small className="mt-1 block text-[10px] font-semibold text-[var(--ink-muted)]">
                            {attempt.status === "completed" ? formatDate(attempt.submittedAt) : "In progress"}
                          </small>
                        </span>
                        <span className="text-sm font-black text-[var(--brand-blue)]">
                          {attempt.status === "completed" ? `${attempt.percent ?? 0}%` : "Live"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-semibold leading-6 text-[var(--ink-muted)]">Your completed attempts will appear here.</p>
                  )}
                </div>
              </div>
            </aside>
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
    indigo: "bg-sky-50 text-sky-700",
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
