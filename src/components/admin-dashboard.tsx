import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileUp,
  Gauge,
  LayoutDashboard,
  LibraryBig,
  ListPlus,
  LogOut,
  Menu,
  MoreVertical,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Trophy,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Question, StudentAttempt, StudentFeedback } from "@/types/platform";
import { MathContent } from "./math-content";
import { PrimaryButton, SecondaryButton, StatusBadge } from "./ui";

const emptyQuestion = {
  type: "objective",
  topic: "Physical quantities and units",
  prompt: "",
  options: "Option A\nOption B\nOption C\nOption D",
  answer: "",
  explanation: "",
  marks: 2,
  difficulty: "medium",
  learningObjective: "",
  rubricPoints: "",
  commonMistakes: "",
  keywords: "",
};

type QuestionForm = typeof emptyQuestion;

type AdminNotification = {
  id: string;
  tone: "orange" | "indigo" | "rose";
  title: string;
  message: string;
  cta: string;
  feedbackId?: string;
  targetId?: string;
};

export type AdminAccount = {
  name: string;
  email: string;
  role: string;
  accessCode: string;
  accessToken?: string;
  authProvider?: "password" | "google";
};

export function AdminRegistration({
  onRegister,
  onBack,
}: {
  onRegister: (account: AdminAccount) => boolean | Promise<boolean>;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Academic Admin");
  const [accessCode, setAccessCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");

  return (
    <AuthScene>
      <AuthCard
        title="Create account"
        subtitle="Set up your workspace and start managing quizzes"
        footer={
          <>
            <p>
              Already have an account?{" "}
              <button className="font-black text-blue-400 hover:text-blue-300" type="button" onClick={onBack}>
                Sign in
              </button>
            </p>
            <p>
              Have an invitation? <span className="font-black text-blue-400">Join workspace</span>
            </p>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!name.trim() || !email.trim() || !accessCode.trim()) {
              setError("Complete the name, email, and access code.");
              return;
            }

            if (!email.includes("@")) {
              setError("Enter a valid admin email address.");
              return;
            }

            if (accessCode.length < 6) {
              setError("Use at least 6 characters for the access code.");
              return;
            }

            if (accessCode !== confirmCode) {
              setError("The access codes do not match.");
              return;
            }

            try {
              const registered = await Promise.resolve(
                onRegister({
                  name: name.trim(),
                  email: email.trim().toLowerCase(),
                  role,
                  accessCode,
                })
              );

              if (!registered) {
                setError("Registration failed. Try again.");
              }
            } catch (registerError) {
              setError(registerError instanceof Error ? registerError.message : "Registration failed. Try again.");
            }
          }}
        >
          <AuthField label="Full Name" value={name} onChange={setName} />
          <AuthField label="Email" type="email" value={email} onChange={setEmail} />
          <label className="grid gap-2 text-sm font-bold text-slate-100">
            Role
            <select
              className="h-11 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option>Academic Admin</option>
              <option>Teacher</option>
              <option>Exam Coordinator</option>
            </select>
          </label>
          <AuthField label="Password" type="password" value={accessCode} onChange={setAccessCode} />
          <AuthField label="Confirm Password" type="password" value={confirmCode} onChange={setConfirmCode} />

          {error && <p className="text-sm font-bold text-rose-300">{error}</p>}

          <AuthSubmitButton>Create account</AuthSubmitButton>
        </form>
      </AuthCard>
    </AuthScene>
  );
}

export function AdminLogin({
  adminEmail,
  authError = "",
  onUnlock,
  onGoogleLogin,
  onBack,
}: {
  adminEmail: string;
  authError?: string;
  onUnlock: (email: string, accessCode: string) => boolean | Promise<boolean>;
  onGoogleLogin: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(adminEmail);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  return (
    <AuthScene>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to manage questions, attempts, and feedback"
        footer={
          <>
            <p>
              <button className="font-black text-blue-400 hover:text-blue-300" type="button" onClick={onBack}>
                Return to student site
              </button>
            </p>
            <p>Private admin channel</p>
          </>
        }
      >
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              const unlocked = await Promise.resolve(onUnlock(email.trim().toLowerCase(), accessCode.trim()));

              if (!unlocked) {
                setError("Incorrect admin email or password.");
                return;
              }

              setAccessCode("");
              setError("");
            } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : "Admin sign in failed.");
            }
          }}
        >
          <div className="grid gap-4">
            <AuthField
              label="Email"
              type="email"
              value={email}
              onChange={(value) => {
                setEmail(value);
                setError("");
              }}
            />
            <AuthField
              label="Password"
              type="password"
              value={accessCode}
              onChange={(value) => {
                setAccessCode(value);
                setError("");
              }}
            />
          </div>

          {(error || authError) && <p className="mt-3 text-sm font-bold text-rose-300">{error || authError}</p>}

          <AuthSubmitButton>Sign in</AuthSubmitButton>
          <button
            className="mt-3 w-full text-center text-sm font-black text-blue-400 transition hover:text-blue-300"
            type="button"
            onClick={onGoogleLogin}
          >
            Continue with Google
          </button>
        </form>
      </AuthCard>
    </AuthScene>
  );
}

function AuthScene({ children }: { children: ReactNode }) {
  return (
    <section className="surface-enter relative -mt-px min-h-[calc(100vh-4.25rem)] overflow-hidden bg-[#090d16] px-4 py-16 text-white sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(37,99,235,0.18),transparent_26rem),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.13),transparent_24rem),linear-gradient(180deg,rgba(15,23,42,0.86),rgba(2,6,23,0.96))]" />
      <div className="absolute left-12 top-20 h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.9)]" />
      <div className="absolute bottom-20 right-24 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.9)]" />
      <div className="relative mx-auto flex min-h-[560px] max-w-6xl items-center justify-center">{children}</div>
    </section>
  );
}

function AuthCard({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="modal-card-enter w-full max-w-md rounded-lg border border-slate-700/80 bg-slate-900/72 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-white">{title}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{subtitle}</p>
      </div>
      {children}
      <p className="mt-5 text-center text-xs font-semibold leading-5 text-slate-400">
        By signing in you agree to the <span className="underline">Terms of Service</span> and{" "}
        <span className="underline">Privacy Policy</span>.
      </p>
      <div className="mt-8 space-y-2 text-center text-sm font-semibold text-slate-300">{footer}</div>
    </div>
  );
}

function AuthField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-100">
      {label}
      <input
        className="h-11 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AuthSubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-600 px-4 text-sm font-black text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-0.5 hover:shadow-blue-500/20"
      type="submit"
    >
      {children}
    </button>
  );
}

export function AdminDashboard({
  adminName = "Solomon Admin",
  adminRole = "Administrator",
  questions,
  attempts,
  feedback,
  onAddQuestion,
  onImportQuestions,
  onReviewFeedback,
  onSignOut,
  onBack,
}: {
  adminName?: string;
  adminRole?: string;
  questions: Question[];
  attempts: StudentAttempt[];
  feedback: StudentFeedback[];
  onAddQuestion: (question: Question) => void | Promise<void>;
  onImportQuestions: (questions: Question[]) => void | Promise<void>;
  onReviewFeedback: (id: string) => void;
  onSignOut: () => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<QuestionForm>(emptyQuestion);
  const [importMessage, setImportMessage] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const completedAttempts = attempts.filter((attempt) => attempt.status === "completed");
  const activeAttempts = attempts.filter((attempt) => attempt.status === "active");
  const averageScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, attempt) => sum + (attempt.percent ?? 0), 0) /
            completedAttempts.length
        )
      : 0;
  const needsAttention = completedAttempts.filter((attempt) => (attempt.percent ?? 0) < 50);
  const unreadFeedback = feedback.filter((item) => item.status === "new").length;
  const notifications: AdminNotification[] = [
    ...feedback
      .filter((item) => item.status === "new")
      .map((item) => ({
        id: `feedback-${item.id}`,
        tone: "orange" as const,
        title: `${item.student} sent feedback`,
        message: `${item.rating}/5 rating - ${item.message}`,
        cta: "Mark reviewed",
        feedbackId: item.id,
      })),
    ...activeAttempts.map((attempt) => ({
      id: `active-${attempt.id}`,
      tone: "indigo" as const,
      title: `${attempt.student} has an active attempt`,
      message: `${attempt.answered}/${attempt.questionCount} answered so far.`,
      cta: "View attempts",
      targetId: "attempt-summary",
    })),
    ...needsAttention.map((attempt) => ({
      id: `watch-${attempt.id}`,
      tone: "rose" as const,
      title: `${attempt.student} needs attention`,
      message: `Scored ${attempt.percent ?? 0}% on the latest completed attempt.`,
      cta: "Open watchlist",
      targetId: "performance-watchlist",
    })),
    ...(questions.length === 0
      ? [
          {
            id: "question-bank-empty",
            tone: "rose" as const,
            title: "Question bank is empty",
            message: "Students cannot take a real backend test until questions are published.",
            cta: "Add questions",
            targetId: "question-studio",
          },
        ]
      : []),
  ];
  const unreadNotifications = notifications.filter((notification) => !readNotificationIds.includes(notification.id));
  const readNotifications = notifications.filter((notification) => readNotificationIds.includes(notification.id));
  const notificationCount = unreadNotifications.length;
  const completionRate =
    attempts.length > 0 ? Math.round((completedAttempts.length / attempts.length) * 100) : 0;
  const totalStudents = new Set(attempts.map((attempt) => attempt.student)).size;

  const topicCoverage = useMemo(() => {
    const groups = new Map<string, number>();
    questions.forEach((question) => groups.set(question.topic, (groups.get(question.topic) ?? 0) + 1));
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [questions]);
  const totalTopicQuestions = Math.max(1, topicCoverage.reduce((sum, [, count]) => sum + count, 0));
  const activity = [
    ...completedAttempts.slice(0, 2).map((attempt) => ({
      id: `attempt-${attempt.id}`,
      icon: Trophy,
      tone: "emerald" as const,
      title: `${attempt.student} completed PHS 001`,
      meta: `${attempt.percent ?? 0}% score`,
    })),
    ...feedback.slice(0, 2).map((item) => ({
      id: `feedback-${item.id}`,
      icon: Bell,
      tone: item.status === "new" ? ("orange" as const) : ("indigo" as const),
      title: `${item.student} sent feedback`,
      meta: `${item.rating}/5 rating`,
    })),
  ].slice(0, 4);
  const topQuizzes = topicCoverage.slice(0, 5).map(([topic, count]) => {
    return {
      topic,
      count,
      attempts: attempts.length,
      score: averageScore,
      completion: completionRate,
      status: count > 0 ? "Active" : "Draft",
    };
  });

  const addQuestion = async () => {
    const prompt = form.prompt.trim();
    const answer = form.answer.trim();
    const explanation = form.explanation.trim();
    const options = form.options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (!prompt || !answer || !explanation || (form.type === "objective" && options.length < 2)) {
      setImportMessage("Complete the prompt, answer, explanation, and at least two options.");
      return;
    }

    try {
      await onAddQuestion({
        id: nextQuestionId(questions),
        type: form.type as Question["type"],
        topic: form.topic.trim() || "General",
        prompt,
        options: form.type === "objective" ? options : undefined,
        answer,
        explanation,
        marks: Math.max(1, Number(form.marks) || 1),
        difficulty: form.difficulty as Question["difficulty"],
        learningObjective: form.learningObjective.trim() || undefined,
        rubricPoints: form.rubricPoints
          .split("\n")
          .map((point) => point.trim())
          .filter(Boolean),
        commonMistakes: form.commonMistakes
          .split("\n")
          .map((mistake) => mistake.trim())
          .filter(Boolean),
        keywords:
          form.type === "theory"
            ? form.keywords
                .split(",")
                .map((keyword) => keyword.trim())
                .filter(Boolean)
            : undefined,
      });
      setForm(emptyQuestion);
      setImportMessage("Question saved to the database.");
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Question could not be saved.");
    }
  };

  const importQuestions = async (file: File | null) => {
    if (!file) return;

    try {
      const payload = JSON.parse(await file.text());
      const parsedQuestions = Array.isArray(payload) ? payload : payload.questions;

      if (!Array.isArray(parsedQuestions)) {
        setImportMessage("Import failed. Use an array of questions or an object with a questions array.");
        return;
      }

      const cleanQuestions = parsedQuestions.map(normalizeQuestion).filter(Boolean) as Question[];

      if (cleanQuestions.length === 0) {
        setImportMessage("Import failed. No valid questions were found.");
        return;
      }

      await onImportQuestions(cleanQuestions);
      setImportMessage(`${cleanQuestions.length} questions imported and saved to the database.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "Import failed. Check that the file is valid JSON.");
    }
  };

  const openSection = (id: string) => {
    setIsNotificationsOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const markAllNotificationsRead = () => {
    setReadNotificationIds((current) => Array.from(new Set([...current, ...notifications.map((item) => item.id)])));
  };

  return (
    <section className="surface-enter min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-8">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-600 text-lg font-black text-white">
              Q
            </span>
            <strong className="text-xl font-black">QuizMaster</strong>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-5 text-sm font-bold">
            <SidebarItem active icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem icon={Users} label="Users" />
            <SidebarItem icon={LibraryBig} label="Quiz Management" />
            <div className="ml-8 grid gap-3 border-l border-slate-200 py-2 pl-7 text-xs font-semibold text-slate-500">
              <span>All Quizzes</span>
              <span>Categories</span>
              <span>Questions</span>
            </div>
            <SidebarItem icon={ClipboardList} label="Attempts" />
            <SidebarItem icon={Trophy} label="Leaderboard" />
            <SidebarItem icon={BarChart3} label="Analytics" />
            <SidebarItem icon={BookOpenCheck} label="Certificates" />
            <SidebarItem
              icon={Bell}
              label="Notifications"
              badge={notificationCount}
              onClick={() => setIsNotificationsOpen(true)}
            />
            <SidebarItem icon={Settings} label="Settings" />
          </nav>
          <div className="border-t border-slate-200 p-4">
            <SecondaryButton className="w-full gap-2 text-sm" type="button" onClick={onBack}>
              <BookOpenCheck size={16} />
              Student Tests
            </SecondaryButton>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
            <div className="flex items-center gap-4">
              <button
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
                type="button"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <label className="flex h-12 w-full min-w-[260px] max-w-xl items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 shadow-sm sm:min-w-[420px]">
                <Search size={18} />
                <input
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                  placeholder="Search quizzes, users, questions..."
                  type="search"
                />
                <span className="hidden rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-400 sm:inline">
                  ⌘K
                </span>
              </label>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={isNotificationsOpen}
                  onClick={() => setIsNotificationsOpen((open) => !open)}
                >
                  <Bell size={19} />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-black text-white">
                      {notificationCount}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 text-slate-950 shadow-2xl shadow-slate-200">
                    <div className="flex items-center justify-between gap-3 px-1 pb-3">
                      <span>
                        <strong className="block text-sm font-black">Notifications</strong>
                        <small className="block text-xs font-bold text-slate-500">
                          {notificationCount ? `${notificationCount} unread item${notificationCount === 1 ? "" : "s"}` : "All clear"}
                        </small>
                      </span>
                      <span className="flex items-center gap-1">
                        {notificationCount > 0 && (
                          <button
                            className="rounded-md px-2 py-1 text-xs font-black text-indigo-700 transition hover:bg-indigo-50"
                            type="button"
                            onClick={markAllNotificationsRead}
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          className="rounded-md px-2 py-1 text-xs font-black text-slate-500 transition hover:bg-slate-100"
                          type="button"
                          onClick={() => setIsNotificationsOpen(false)}
                        >
                          Close
                        </button>
                      </span>
                    </div>
                    <div className="max-h-[28rem] space-y-2 overflow-y-auto">
                      {unreadNotifications.length ? (
                        unreadNotifications.map((notification) => (
                          <NotificationCard
                            key={notification.id}
                            {...notification}
                            state="unread"
                            onMarkRead={() => markNotificationRead(notification.id)}
                            onAction={() => {
                              if (notification.feedbackId) {
                                onReviewFeedback(notification.feedbackId);
                                markNotificationRead(notification.id);
                                return;
                              }

                              if (notification.targetId) {
                                markNotificationRead(notification.id);
                                openSection(notification.targetId);
                              }
                            }}
                          />
                        ))
                      ) : (
                        <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                          No new feedback, watchlist alerts, or active attempt alerts.
                        </p>
                      )}
                      {readNotifications.length > 0 && (
                        <div className="pt-3">
                          <div className="mb-2 flex items-center justify-between px-1">
                            <strong className="text-xs font-black uppercase text-slate-400">Read</strong>
                            <span className="text-xs font-bold text-slate-400">{readNotifications.length}</span>
                          </div>
                          <div className="space-y-2">
                            {readNotifications.map((notification) => (
                              <NotificationCard
                                key={notification.id}
                                {...notification}
                                state="read"
                                onAction={() => {
                                  if (notification.targetId) {
                                    openSection(notification.targetId);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500 text-sm font-black text-white">
                  {initials(adminName)}
                </div>
                <span className="hidden sm:block">
                  <strong className="block text-sm font-black">{adminName}</strong>
                  <small className="block text-xs font-semibold text-slate-500">{adminRole}</small>
                </span>
                <ChevronDown size={16} />
              </div>
            </div>
          </header>

          <main className="px-4 py-8 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Welcome back, {firstName(adminName)}</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Here is what is happening with your quiz app today.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm" type="button">
                  <CalendarDays size={18} />
                  Live database
                </button>
                <SecondaryButton className="h-12 gap-2 px-4 py-0 text-sm" type="button" onClick={onSignOut}>
                  <LogOut size={16} />
                  Lock
                </SecondaryButton>
              </div>
            </div>

            <div className="stagger-list mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard icon={Users} tone="purple" label="Total Students" value={String(totalStudents)} trend={`${totalStudents} recorded`} detail="" />
              <StatCard icon={UserRound} tone="green" label="Active Attempts" value={String(activeAttempts.length)} trend={`${activeAttempts.length} active`} detail="" />
              <StatCard icon={ClipboardList} tone="blue" label="Total Questions" value={String(questions.length)} trend={`${topicCoverage.length} topics`} detail="" />
              <StatCard icon={Gauge} tone="orange" label="Total Attempts" value={String(attempts.length)} trend={`${completedAttempts.length} completed`} detail="" />
              <StatCard icon={Sparkles} tone="rose" label="Average Score" value={`${averageScore}%`} trend={`${needsAttention.length} watchlist`} detail="" />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.95fr_0.95fr]">
              <DashboardPanel className="min-h-[330px]" title="Attempt Summary" action="Live" id="attempt-summary">
                <div className="grid h-full content-center gap-4 sm:grid-cols-3">
                  <SummaryTile label="Active" value={String(activeAttempts.length)} />
                  <SummaryTile label="Completed" value={String(completedAttempts.length)} />
                  <SummaryTile label="Completion" value={`${completionRate}%`} />
                </div>
              </DashboardPanel>
              <DashboardPanel className="min-h-[330px]" title="Quiz Categories">
                <div className="grid items-center gap-5 sm:grid-cols-[180px_1fr] xl:grid-cols-1 2xl:grid-cols-[180px_1fr]">
                  <CategoryDonut total={questions.length} />
                  <div className="stagger-list space-y-4">
                    {topicCoverage.slice(0, 5).map(([topic, count], index) => (
                      <div className="flex items-center gap-3 text-sm" key={topic}>
                        <span className={`h-2.5 w-2.5 rounded-full ${categoryDot(index)}`} />
                        <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{topic}</span>
                        <strong className="text-slate-900">{Math.round((count / totalTopicQuestions) * 100)}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </DashboardPanel>
              <DashboardPanel title="Recent Activity" action="View all">
                <div className="stagger-list space-y-4">
                  {activity.map((item) => (
                    <ActivityItem key={item.id} {...item} />
                  ))}
                  {activity.length === 0 && (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      Activity will appear when students submit attempts or feedback.
                    </p>
                  )}
                </div>
              </DashboardPanel>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
              <DashboardPanel title="Top Performing Quizzes" action="View all quizzes">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-black uppercase text-slate-500">
                        <th className="py-3 pr-4">Quiz</th>
                        <th className="px-4 py-3">Attempts</th>
                        <th className="px-4 py-3">Average Score</th>
                        <th className="px-4 py-3">Completion Rate</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="py-3 pl-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="stagger-list">
                      {topQuizzes.map((quiz, index) => (
                        <tr className="border-b border-slate-100 last:border-0" key={quiz.topic}>
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <span className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-black text-white ${quizIconTone(index)}`}>
                                {topicInitials(quiz.topic)}
                              </span>
                              <span>
                                <strong className="block font-black text-slate-950">{quiz.topic}</strong>
                                <small className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                                  {quiz.count} questions
                                </small>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-700">{quiz.attempts.toLocaleString()}</td>
                          <td className="px-4 py-4">
                            <PerformanceBar value={quiz.score} tone="green" />
                          </td>
                          <td className="px-4 py-4">
                            <PerformanceBar value={quiz.completion} tone="purple" />
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge tone={quiz.status === "Active" ? "available" : "neutral"}>{quiz.status}</StatusBadge>
                          </td>
                          <td className="py-4 pl-4 text-right">
                            <button className="inline-grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" type="button" aria-label={`More actions for ${quiz.topic}`}>
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardPanel>

              <DashboardPanel className="bg-indigo-600 text-white shadow-indigo-200" title="Quick Actions">
                <div className="stagger-list space-y-3">
                  <QuickActionButton icon={Plus} label="Create New Quiz" />
                  <QuickActionButton icon={ListPlus} label="Add Question" />
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg bg-white px-4 text-sm font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5">
                    <Upload size={18} className="text-indigo-700" />
                    Import Question JSON
                    <input
                      className="sr-only"
                      type="file"
                      accept="application/json"
                      onChange={(event) => void importQuestions(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  <QuickActionButton icon={Send} label="Send Notification" />
                  <QuickActionButton icon={FileUp} label="Export Report" />
                </div>
                {importMessage && (
                  <p className="mt-4 rounded-lg bg-white/15 p-3 text-sm font-bold leading-6 text-white">{importMessage}</p>
                )}
              </DashboardPanel>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
              <DashboardPanel title="Question Studio" action="LaTeX enabled" id="question-studio">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Topic" value={form.topic} onChange={(value) => setForm({ ...form, topic: value })} />
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Type
                    <select
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-indigo-400"
                      value={form.type}
                      onChange={(event) => setForm({ ...form, type: event.target.value as QuestionForm["type"] })}
                    >
                      <option value="objective">Objective</option>
                      <option value="theory">Theory</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Difficulty
                    <select
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-indigo-400"
                      value={form.difficulty}
                      onChange={(event) => setForm({ ...form, difficulty: event.target.value as QuestionForm["difficulty"] })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                  <Field
                    label="Learning Objective"
                    value={form.learningObjective}
                    onChange={(value) => setForm({ ...form, learningObjective: value })}
                  />
                  <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                    Prompt
                    <textarea
                      className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-400"
                      value={form.prompt}
                      onChange={(event) => setForm({ ...form, prompt: event.target.value })}
                      placeholder="Example: Find $x$ if $$2x + 3 = 11$$"
                    />
                  </label>
                  {form.type === "objective" && (
                    <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                      Options
                      <textarea
                        className="min-h-28 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-400"
                        value={form.options}
                        onChange={(event) => setForm({ ...form, options: event.target.value })}
                        placeholder={"$x = 2$\n$x = 4$\n$x = 7$\n$x = 11$"}
                      />
                    </label>
                  )}
                  <Field label="Answer" value={form.answer} onChange={(value) => setForm({ ...form, answer: value })} />
                  <Field
                    label="Marks"
                    type="number"
                    value={String(form.marks)}
                    onChange={(value) => setForm({ ...form, marks: Number(value) })}
                  />
                  <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                    Explanation
                    <textarea
                      className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-400"
                      value={form.explanation}
                      onChange={(event) => setForm({ ...form, explanation: event.target.value })}
                      placeholder="Example: Subtract 3, then divide by 2: $x = \\frac{8}{2} = 4$."
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                    Rubric Points
                    <textarea
                      className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-400"
                      value={form.rubricPoints}
                      onChange={(event) => setForm({ ...form, rubricPoints: event.target.value })}
                      placeholder={"Mention the correct principle\nUse the correct unit\nShow the required relationship"}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                    Common Mistakes
                    <textarea
                      className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-400"
                      value={form.commonMistakes}
                      onChange={(event) => setForm({ ...form, commonMistakes: event.target.value })}
                      placeholder={"Confusing base and derived quantities\nUsing the wrong unit\nSkipping the explanation"}
                    />
                  </label>
                  {form.type === "theory" && (
                    <Field
                      label="Keywords"
                      value={form.keywords}
                      onChange={(value) => setForm({ ...form, keywords: value })}
                    />
                  )}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <PrimaryButton type="button" onClick={addQuestion}>
                    Publish Question
                  </PrimaryButton>
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-black text-indigo-700 transition hover:-translate-y-0.5 hover:shadow-md">
                    <Upload size={16} />
                    Import JSON
                    <input
                      className="sr-only"
                      type="file"
                      accept="application/json"
                      onChange={(event) => void importQuestions(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </DashboardPanel>

              <DashboardPanel title="LaTeX Preview">
                <div className="stagger-list space-y-3 text-sm font-semibold leading-7 text-slate-900">
                  <PreviewLine label="Prompt" value={form.prompt || "Question prompt preview"} />
                  {form.type === "objective" && (
                    <PreviewLine label="Options" value={form.options || "Options preview"} />
                  )}
                  <PreviewLine label="Answer" value={form.answer || "Answer preview"} />
                  <PreviewLine label="Explanation" value={form.explanation || "Explanation preview"} />
                </div>
              </DashboardPanel>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <DashboardPanel title={`Feedback Review (${unreadFeedback} new)`} id="feedback-review">
                <div className="stagger-list space-y-3">
                  {feedback.map((item) => (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm font-black text-slate-900">{item.student}</strong>
                        <StatusBadge tone={item.status === "new" ? "wrong" : "available"}>
                          {item.status === "new" ? "New" : "Reviewed"}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.message}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-indigo-700">{item.rating}/5 rating</span>
                        {item.status === "new" && (
                          <SecondaryButton
                            className="h-9 min-h-9 px-3 py-0 text-xs"
                            type="button"
                            onClick={() => onReviewFeedback(item.id)}
                          >
                            Mark Reviewed
                          </SecondaryButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardPanel>

              <DashboardPanel title="Performance Watchlist" id="performance-watchlist">
                <div className="stagger-list space-y-3">
                  {needsAttention.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No completed student is below 50%.
                    </p>
                  ) : (
                    needsAttention.map((attempt) => (
                      <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-3" key={attempt.id}>
                        <span className="font-bold text-rose-900">{attempt.student}</span>
                        <strong className="text-rose-700">{attempt.percent}%</strong>
                      </div>
                    ))
                  )}
                </div>
              </DashboardPanel>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-indigo-400"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong className="block text-xs font-black uppercase text-slate-500">{label}</strong>
      <div className="mt-1 rounded-lg border border-slate-200 bg-white p-3">
        <MathContent>{value}</MathContent>
      </div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  badge = 0,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <button
      className={`interactive-lift flex min-h-12 w-full items-center gap-4 rounded-lg px-4 text-left ${
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-950 hover:bg-slate-50"
      }`}
      type="button"
      onClick={onClick}
    >
      <Icon size={20} />
      <span className="min-w-0 flex-1">{label}</span>
      {badge > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1 text-[10px] font-black text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  trend,
  detail,
}: {
  icon: LucideIcon;
  tone: "purple" | "green" | "blue" | "orange" | "rose";
  label: string;
  value: string;
  trend: string;
  detail: string;
}) {
  const tones = {
    purple: "bg-indigo-50 text-indigo-700",
    green: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    orange: "bg-orange-100 text-orange-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <div className="interactive-lift content-rise rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={22} />
        </span>
        <span className="min-w-0">
          <small className="block truncate text-xs font-bold text-slate-500">{label}</small>
          <strong className="mt-2 block text-2xl font-black text-slate-950">{value}</strong>
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="text-slate-600">{trend}</span>
        {detail && <span className="text-slate-500">{detail}</span>}
      </div>
    </div>
  );
}

function DashboardPanel({
  title,
  action,
  id,
  className = "",
  children,
}: {
  title: string;
  action?: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`interactive-lift content-rise scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${className}`}
      id={id}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        {action && <button className="text-sm font-bold text-indigo-700" type="button">{action}</button>}
      </div>
      {children}
    </div>
  );
}

function NotificationCard({
  tone,
  title,
  message,
  cta,
  state,
  onAction,
  onMarkRead,
}: {
  tone: "orange" | "indigo" | "rose";
  title: string;
  message: string;
  cta: string;
  state: "read" | "unread";
  onAction: () => void;
  onMarkRead?: () => void;
}) {
  const tones = {
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };
  const isRead = state === "read";

  return (
    <div className={`rounded-lg border p-3 ${isRead ? "border-slate-200 bg-slate-50 text-slate-500 opacity-75" : tones[tone]}`}>
      <div className="flex items-start gap-3">
        <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/80">
          <Bell size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <strong className={`block text-sm font-black ${isRead ? "text-slate-500" : ""}`}>{title}</strong>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isRead ? "bg-slate-200 text-slate-500" : "bg-white/80 text-slate-700"}`}>
              {isRead ? "Read" : "New"}
            </span>
          </span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">{message}</span>
          <span className="mt-3 flex flex-wrap gap-2">
            <button
              className="inline-flex h-8 items-center rounded-md bg-white px-3 text-xs font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5"
              type="button"
              onClick={onAction}
            >
              {cta}
            </button>
            {!isRead && onMarkRead && (
              <button
                className="inline-flex h-8 items-center rounded-md px-3 text-xs font-black text-slate-600 transition hover:bg-white/80"
                type="button"
                onClick={onMarkRead}
              >
                Clear
              </button>
            )}
          </span>
        </span>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
      <strong className="block text-3xl font-black text-slate-950">{value}</strong>
      <span className="mt-2 block text-xs font-bold uppercase text-slate-500">{label}</span>
    </div>
  );
}

function CategoryDonut({ total }: { total: number }) {
  return (
    <div className="relative mx-auto h-44 w-44">
      <div
        className="h-full w-full rounded-full"
        style={{
          background:
            "conic-gradient(#4f46e5 0 40%, #10b981 40% 65%, #f97316 65% 80%, #e11d48 80% 90%, #94a3b8 90% 100%)",
        }}
      />
      <div className="absolute inset-10 grid place-items-center rounded-full bg-white text-center shadow-inner">
        <strong className="block text-2xl font-black">{total}</strong>
        <small className="block text-xs font-bold text-slate-500">Total</small>
      </div>
    </div>
  );
}

function ActivityItem({
  icon: Icon,
  tone,
  title,
  meta,
}: {
  icon: LucideIcon;
  tone: "emerald" | "orange" | "indigo";
  title: string;
  meta: string;
}) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-600",
    orange: "bg-orange-100 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-700",
  };

  return (
    <div className="interactive-lift flex items-start gap-4 rounded-lg p-1">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-bold leading-6 text-slate-950">{title}</strong>
        <small className="mt-1 block text-xs font-semibold text-slate-500">{meta}</small>
      </span>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button className="interactive-lift flex min-h-12 w-full items-center gap-3 rounded-lg bg-white px-4 text-left text-sm font-bold text-slate-950 shadow-sm" type="button">
      <Icon size={18} className="text-indigo-700" />
      {label}
    </button>
  );
}

function PerformanceBar({ value, tone }: { value: number; tone: "green" | "purple" }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-sm font-bold text-slate-700">{value}%</span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
        <span
          className={`bar-fill block h-full rounded-full ${tone === "green" ? "bg-emerald-500" : "bg-indigo-600"}`}
          style={{ width: `${value}%` }}
        />
      </span>
    </div>
  );
}

function categoryDot(index: number) {
  return ["bg-indigo-600", "bg-emerald-500", "bg-orange-500", "bg-rose-600", "bg-slate-400"][index % 5];
}

function quizIconTone(index: number) {
  return ["bg-orange-400", "bg-sky-500", "bg-emerald-500", "bg-indigo-600", "bg-rose-600"][index % 5];
}

function topicInitials(topic: string) {
  return topic
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function initials(name: string) {
  return topicInitials(name) || "SA";
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Admin";
}

function nextQuestionId(questions: Question[]) {
  return String(Math.max(0, ...questions.map((question) => Number(question.id) || 0)) + 1);
}

function normalizeQuestion(question: Partial<Question>, index: number): Question | null {
  if (!question.prompt || !question.answer || !question.explanation) return null;

  const type = question.type === "theory" ? "theory" : "objective";
  const options = Array.isArray(question.options) ? question.options.filter(Boolean) : undefined;

  if (type === "objective" && (!options || options.length < 2)) return null;

  return {
    id: String(question.id ?? index + 1),
    type,
    topic: question.topic || "General",
    prompt: question.prompt,
    options: type === "objective" ? options : undefined,
    answer: question.answer,
    explanation: question.explanation,
    marks: Math.max(1, Number(question.marks) || 1),
    difficulty: question.difficulty ?? "medium",
    learningObjective: question.learningObjective,
    rubricPoints: Array.isArray(question.rubricPoints) ? question.rubricPoints.filter(Boolean) : undefined,
    commonMistakes: Array.isArray(question.commonMistakes) ? question.commonMistakes.filter(Boolean) : undefined,
    keywords: type === "theory" ? question.keywords ?? [] : undefined,
  };
}
