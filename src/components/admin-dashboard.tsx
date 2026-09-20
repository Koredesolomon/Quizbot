import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  FileQuestion,
  Gauge,
  GraduationCap,
  Eye,
  EyeOff,
  LayoutDashboard,
  LibraryBig,
  LineChart,
  LogOut,
  Menu,
  MonitorPlay,
  Search,
  Sparkles,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type * as api from "@/lib/api";
import type { Question, StudentAttempt, StudentFeedback } from "@/types/platform";
import { MathContent } from "./math-content";
import { GoogleIcon, PrimaryButton, SecondaryButton, StatusBadge } from "./ui";

const emptyQuestion = {
  type: "objective",
  subject: "Physics",
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

const subjectOptions = ["Physics", "Mathematics", "Chemistry", "Biology"];

type AdminNotification = {
  id: string;
  tone: "orange" | "indigo" | "rose";
  title: string;
  message: string;
  cta: string;
  feedbackId?: string;
  targetId?: string;
};

export type AdminSection = "overview" | "courses" | "questions" | "reports" | "feedback";

const adminSectionPaths: Record<string, string> = {
  "admin-overview": "/admin",
  "course-builder": "/admin/courses",
  "question-studio": "/admin/questions",
  "attempt-summary": "/admin/reports",
  "performance-watchlist": "/admin/reports",
  "feedback-review": "/admin/feedback",
};

const emptyCourseForm = {
  title: "",
  code: "",
  subject: "Physics",
  description: "",
  status: "draft" as "draft" | "published",
};

const emptyLessonForm = {
  title: "",
  description: "",
  videoUrl: "",
  materialUrl: "",
};

const emptyQuizForm = {
  title: "",
  description: "",
  timeLimitMinutes: 10,
  attemptsAllowed: 1,
  passingPercent: 50,
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const googleOnlyAuthMessage = "This email is linked to Google sign-in.";

function isGoogleOnlyAuthError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("google sign-in");
}

export type AdminAccount = {
  name: string;
  email: string;
  role: string;
  accessCode: string;
  accessToken?: string;
  authProvider?: "password" | "google";
};

export function AdminLogin({
  adminEmail,
  authError = "",
  onUnlock,
  onGoogleLogin,
  onForgotPassword,
  onBack,
}: {
  adminEmail: string;
  authError?: string;
  onUnlock: (identifier: string, accessCode: string) => boolean | Promise<boolean>;
  onGoogleLogin: () => void;
  onForgotPassword: (email: string) => void;
  onBack: () => void;
}) {
  const [identifier, setIdentifier] = useState(adminEmail);
  const [accessCode, setAccessCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [googleOnlyEmail, setGoogleOnlyEmail] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <AuthScene>
      <AuthCard
        title="Welcome back"
        subtitle="Sign in to manage questions, attempts, and feedback"
        footer={
          <>
            <p>
              <button className="font-black text-emerald-300 hover:text-emerald-200" type="button" onClick={onBack}>
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
            setError("");
            setGoogleOnlyEmail("");

            const email = identifier.trim().toLowerCase();
            const password = accessCode.trim();

            if (!email || !password) {
              setError("Enter your admin email address and password.");
              return;
            }

            if (!emailPattern.test(email)) {
              setError("Enter a valid admin email address.");
              return;
            }

            setBusy(true);
            try {
              const unlocked = await Promise.resolve(onUnlock(email, password));

              if (!unlocked) {
                setError("Incorrect admin email or password.");
                return;
              }

              setAccessCode("");
              setError("");
            } catch (loginError) {
              if (isGoogleOnlyAuthError(loginError)) {
                setGoogleOnlyEmail(identifier.trim().toLowerCase());
                setError(googleOnlyAuthMessage);
              } else {
                setError(loginError instanceof Error ? loginError.message : "Admin sign in failed.");
              }
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-4">
            <AuthField
              label="Email address"
              type="email"
              value={identifier}
              autoComplete="email"
              onChange={(value) => {
                setIdentifier(value);
                setError("");
                setGoogleOnlyEmail("");
              }}
            />
            <AuthField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={accessCode}
              autoComplete="current-password"
              onChange={(value) => {
                setAccessCode(value);
                setError("");
                setGoogleOnlyEmail("");
              }}
              trailing={
                <button
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="grid h-9 w-9 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                </button>
              }
            />
          </div>

          {googleOnlyEmail ? (
            <div className="mt-3 grid gap-3 rounded-md border border-sky-300/30 bg-sky-300/10 p-3 text-sm font-bold text-sky-100">
              <p>{googleOnlyAuthMessage}</p>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-black text-slate-950 transition hover:bg-sky-50"
                type="button"
                onClick={onGoogleLogin}
              >
                <GoogleIcon className="h-4 w-4 shrink-0" />
                Continue with Google
              </button>
            </div>
          ) : (
            (error || authError) && <p className="mt-3 text-sm font-bold text-rose-300">{error || authError}</p>
          )}

          <AuthSubmitButton disabled={busy}>{busy ? "Please wait..." : "Sign in"}</AuthSubmitButton>
          <button
            className="mt-3 inline-flex w-full items-center justify-center text-center text-sm font-black text-sky-200 transition hover:text-white"
            type="button"
            onClick={() => {
              const resetEmail = identifier.trim().toLowerCase();
              setGoogleOnlyEmail("");

              if (!emailPattern.test(resetEmail)) {
                setError("Enter your admin email address before resetting your password.");
                return;
              }

              setError("");
              onForgotPassword(resetEmail);
            }}
          >
            Forgot password?
          </button>
          <button
            className="mt-3 inline-flex w-full items-center justify-center gap-2 text-center text-sm font-black text-emerald-300 transition hover:text-emerald-200"
            type="button"
            onClick={onGoogleLogin}
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            Sign in with Google
          </button>
        </form>
      </AuthCard>
    </AuthScene>
  );
}

function AuthScene({ children }: { children: ReactNode }) {
  return (
    <section className="surface-enter relative -mt-px min-h-[calc(100vh-4.25rem)] overflow-hidden bg-black px-4 py-16 text-white sm:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(0,0,0,0.98),rgba(6,71,155,0.55)_52%,rgba(8,124,34,0.42))]" />
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
    <div className="modal-card-enter w-full max-w-md rounded-lg border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-logo mx-auto mb-6 h-auto w-56" src="/Logo.png" alt="TLCHub" />
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
  autoComplete,
  onChange,
  trailing,
}: {
  label: string;
  value: string;
  type?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-100">
      {label}
      <span className="flex h-11 items-center rounded-lg border border-sky-200 bg-white px-3 text-slate-950 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/20">
        <input
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {trailing}
      </span>
    </label>
  );
}

function AuthSubmitButton({ children, disabled = false }: { children: ReactNode; disabled?: boolean }) {
  return (
    <button
      className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white shadow-xl shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-emerald-950/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  );
}

export function AdminDashboard({
  adminName = "Solomon Admin",
  adminRole = "Administrator",
  section = "overview",
  courses,
  questions,
  attempts,
  feedback,
  onCreateCourse,
  onAddLesson,
  onAddQuiz,
  onAddQuestion,
  onImportQuestions,
  onReviewFeedback,
  onSignOut,
  onBack,
}: {
  adminName?: string;
  adminRole?: string;
  section?: AdminSection;
  courses: api.CourseContent[];
  questions: Question[];
  attempts: StudentAttempt[];
  feedback: StudentFeedback[];
  onCreateCourse: (input: {
    title: string;
    code: string;
    subject: string;
    description?: string;
    status?: "draft" | "published";
  }) => void | Promise<void>;
  onAddLesson: (
    courseId: string,
    input: { title: string; description?: string; videoUrl?: string; materialUrl?: string }
  ) => void | Promise<void>;
  onAddQuiz: (
    courseId: string,
    input: { title: string; description?: string; timeLimitMinutes: number; attemptsAllowed: number; passingPercent: number }
  ) => void | Promise<void>;
  onAddQuestion: (question: Question) => void | Promise<void>;
  onImportQuestions: (questions: Question[]) => void | Promise<void>;
  onReviewFeedback: (id: string) => void;
  onSignOut: () => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<QuestionForm>(emptyQuestion);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);
  const [quizForm, setQuizForm] = useState(emptyQuizForm);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [contentMessage, setContentMessage] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
  const lessonCount = courses.reduce((sum, course) => sum + course.lessons.length, 0);
  const quizCount = courses.reduce((sum, course) => sum + course.quizzes.length, 0);
  const publishedCourses = courses.filter((course) => course.status === "published").length;
  const lmsModules = [
    {
      label: "Courses",
      value: String(courses.length),
      detail: `${publishedCourses} published`,
      icon: BookOpenCheck,
      tone: "blue" as const,
      targetId: "course-builder",
    },
    {
      label: "Lessons",
      value: String(lessonCount),
      detail: "Video and materials",
      icon: MonitorPlay,
      tone: "green" as const,
      targetId: "course-builder",
    },
    {
      label: "Quizzes",
      value: String(quizCount),
      detail: "Course assessments",
      icon: ClipboardList,
      tone: "purple" as const,
      targetId: "course-builder",
    },
    {
      label: "Question Bank",
      value: String(questions.length),
      detail: `${topicCoverage.length} topics`,
      icon: FileQuestion,
      tone: "orange" as const,
      targetId: "question-studio",
    },
    {
      label: "Learners",
      value: String(totalStudents),
      detail: `${activeAttempts.length} active attempts`,
      icon: GraduationCap,
      tone: "rose" as const,
      targetId: "attempt-summary",
    },
    {
      label: "Reports",
      value: `${averageScore}%`,
      detail: `${needsAttention.length} watchlist`,
      icon: LineChart,
      tone: "blue" as const,
      targetId: "performance-watchlist",
    },
  ];

  const activeCourseId = selectedCourseId || courses[0]?.id || "";
  const activeCourse = courses.find((course) => course.id === activeCourseId) ?? courses[0];

  const createCourse = async () => {
    if (!courseForm.title.trim() || !courseForm.code.trim() || !courseForm.subject.trim()) {
      setContentMessage("Complete the course title, code, and subject.");
      return;
    }

    try {
      await onCreateCourse({
        title: courseForm.title.trim(),
        code: courseForm.code.trim(),
        subject: courseForm.subject.trim(),
        description: courseForm.description.trim() || undefined,
        status: courseForm.status,
      });
      setCourseForm(emptyCourseForm);
      setContentMessage("Course saved.");
    } catch (error) {
      setContentMessage(error instanceof Error ? error.message : "Course could not be saved.");
    }
  };

  const addLesson = async () => {
    if (!activeCourseId) {
      setContentMessage("Create or select a course before adding lessons.");
      return;
    }

    if (!lessonForm.title.trim()) {
      setContentMessage("Enter a lesson title.");
      return;
    }

    try {
      await onAddLesson(activeCourseId, {
        title: lessonForm.title.trim(),
        description: lessonForm.description.trim() || undefined,
        videoUrl: lessonForm.videoUrl.trim() || undefined,
        materialUrl: lessonForm.materialUrl.trim() || undefined,
      });
      setLessonForm(emptyLessonForm);
      setContentMessage("Lesson added.");
    } catch (error) {
      setContentMessage(error instanceof Error ? error.message : "Lesson could not be saved.");
    }
  };

  const addQuiz = async () => {
    if (!activeCourseId) {
      setContentMessage("Create or select a course before adding quizzes.");
      return;
    }

    if (!quizForm.title.trim()) {
      setContentMessage("Enter a quiz title.");
      return;
    }

    try {
      await onAddQuiz(activeCourseId, {
        title: quizForm.title.trim(),
        description: quizForm.description.trim() || undefined,
        timeLimitMinutes: Math.max(1, Number(quizForm.timeLimitMinutes) || 1),
        attemptsAllowed: Math.max(1, Number(quizForm.attemptsAllowed) || 1),
        passingPercent: Math.min(100, Math.max(0, Number(quizForm.passingPercent) || 0)),
      });
      setQuizForm(emptyQuizForm);
      setContentMessage("Quiz added.");
    } catch (error) {
      setContentMessage(error instanceof Error ? error.message : "Quiz could not be saved.");
    }
  };

  const addQuestion = async () => {
    const prompt = form.prompt.trim();
    const answer = form.answer.trim();
    const explanation = form.explanation.trim();
    const options = form.options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (!form.subject.trim() || !prompt || !answer || !explanation || (form.type === "objective" && options.length < 2)) {
      setImportMessage("Complete the subject, question, answer, explanation, and at least two options.");
      return;
    }

    try {
      await onAddQuestion({
        id: nextQuestionId(questions),
        type: form.type as Question["type"],
        subject: form.subject.trim(),
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
    const path = adminSectionPaths[id];
    if (path && typeof window !== "undefined" && window.location.pathname !== path) {
      router.push(path);
      return;
    }

    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const markNotificationRead = (id: string) => {
    setReadNotificationIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const markAllNotificationsRead = () => {
    setReadNotificationIds((current) => Array.from(new Set([...current, ...notifications.map((item) => item.id)])));
  };

  return (
    <section className="admin-shell surface-enter min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="admin-sidebar hidden border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="relative flex h-20 items-center justify-between border-b border-slate-200 px-6">
            <button className="rounded-sm text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)]" type="button" onClick={onBack} aria-label="Return to student site">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brand-logo h-auto w-40" src="/Logo.png" alt="TLCHub" />
            </button>
            <div className="admin-profile-top hidden">
            <button
              className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand-ice)] text-xs font-black text-[var(--brand-blue)] transition hover:bg-[var(--brand-blue)] hover:text-white"
              type="button"
              aria-label="Open admin profile"
              aria-expanded={isProfileOpen}
              onClick={() => setIsProfileOpen((open) => !open)}
            >
              {initials(adminName)}
            </button>
            {isProfileOpen && (
              <div className="absolute left-5 right-5 top-[4.5rem] z-30 grid grid-cols-2 gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm shadow-xl">
                <div className="col-span-2 border-b border-[var(--line)] px-3 pb-3 pt-2">
                  <strong className="block truncate text-[var(--ink)]">{adminName}</strong>
                  <span className="mt-1 block truncate text-xs font-semibold text-[var(--ink-muted)]">{adminRole}</span>
                </div>
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold text-[var(--ink)] transition hover:bg-[var(--brand-ice)] hover:text-[var(--brand-blue)]" type="button" onClick={() => { setIsProfileOpen(false); openSection("question-studio"); }}>
                  <LibraryBig size={16} /> Question bank
                </button>
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold text-[var(--ink)] transition hover:bg-[var(--brand-ice)] hover:text-[var(--brand-blue)]" type="button" onClick={() => { setIsProfileOpen(false); openSection("course-builder"); }}>
                  <BookOpenCheck size={16} /> Course builder
                </button>
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold text-[var(--ink)] transition hover:bg-[var(--brand-ice)] hover:text-[var(--brand-blue)]" type="button" onClick={() => { setIsProfileOpen(false); openSection("attempt-summary"); }}>
                  <ClipboardList size={16} /> Attempts
                </button>
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold text-[var(--ink)] transition hover:bg-[var(--brand-ice)] hover:text-[var(--brand-blue)]" type="button" onClick={() => { setIsProfileOpen(false); openSection("feedback-review"); }}>
                  <Bell size={16} /> Feedback
                </button>
                <div className="col-span-2 my-1 h-px bg-[var(--line)]" />
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold text-[var(--ink)] transition hover:bg-[var(--brand-ice)] hover:text-[var(--brand-blue)]" type="button" onClick={() => { setIsProfileOpen(false); onBack(); }}>
                  <BookOpenCheck size={16} /> Student tests
                </button>
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold text-rose-700 transition hover:bg-rose-50" type="button" onClick={() => { setIsProfileOpen(false); onSignOut(); }}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-5 text-sm font-bold">
            <SidebarItem active={section === "overview"} icon={LayoutDashboard} label="Dashboard" onClick={() => openSection("admin-overview")} />
            <SidebarItem active={section === "courses"} icon={BookOpenCheck} label="Course builder" onClick={() => openSection("course-builder")} />
            <SidebarItem active={section === "questions"} icon={LibraryBig} label="Question bank" onClick={() => openSection("question-studio")} />
            <SidebarItem active={section === "reports"} icon={ClipboardList} label="Attempts" onClick={() => openSection("attempt-summary")} />
            <SidebarItem active={section === "feedback"} icon={Bell} label="Feedback" badge={unreadFeedback} onClick={() => openSection("feedback-review")} />
            <SidebarItem
              icon={BarChart3}
              label="Watchlist"
              active={section === "reports"}
              badge={notificationCount}
              onClick={() => openSection("performance-watchlist")}
            />
          </nav>
          <div className="border-t border-slate-200 p-4">
            <SecondaryButton className="w-full gap-2 text-sm" type="button" onClick={onBack}>
              <BookOpenCheck size={16} />
              Student Tests
            </SecondaryButton>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="admin-header hidden flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
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
                  className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={isNotificationsOpen}
                  onClick={() => setIsNotificationsOpen((open) => !open)}
                >
                  <Bell size={19} />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1 text-[10px] font-black text-white">
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
                            className="rounded-md px-2 py-1 text-xs font-black text-sky-700 transition hover:bg-sky-50"
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
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#06479b] to-emerald-500 text-sm font-black text-white">
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

          <main className="admin-main px-4 py-8 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-normal sm:text-3xl">Learning Management Console</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Welcome back, {firstName(adminName)}. Build courses, lessons, quizzes, questions, and learner reports from one place.
                </p>
              </div>
              <div className="relative flex flex-wrap gap-2">
                <button
                  className="flex h-12 items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-left transition hover:border-[var(--brand-blue)]"
                  type="button"
                  aria-expanded={isProfileOpen}
                  onClick={() => setIsProfileOpen((open) => !open)}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-blue)] text-[10px] font-black text-white">{initials(adminName)}</span>
                  <span className="hidden sm:block"><strong className="block text-xs font-black text-[var(--ink)]">{adminName}</strong><small className="block text-[10px] font-semibold text-[var(--ink-muted)]">{adminRole}</small></span>
                  <ChevronDown className={`text-[var(--ink-muted)] transition ${isProfileOpen ? "rotate-180" : ""}`} size={15} />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 top-14 z-30 grid w-60 grid-cols-2 gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-sm shadow-xl">
                    <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold text-[var(--ink)] hover:bg-[var(--brand-ice)]" type="button" onClick={() => { setIsProfileOpen(false); onBack(); }}><BookOpenCheck size={16} /> Student tests</button>
                    <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left font-bold text-rose-700 hover:bg-rose-50" type="button" onClick={() => { setIsProfileOpen(false); onSignOut(); }}><LogOut size={16} /> Sign out</button>
                  </div>
                )}
              </div>
            </div>

            {section === "overview" && (
              <>
            <DashboardPanel className="mt-7" title="TutorPro-Style Workspace" action="LMS modules" id="admin-overview">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                {lmsModules.map((module) => (
                  <ModuleCard
                    key={module.label}
                    icon={module.icon}
                    tone={module.tone}
                    label={module.label}
                    value={module.value}
                    detail={module.detail}
                    onClick={() => openSection(module.targetId)}
                  />
                ))}
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-5">
                {["Create Course", "Add Lessons", "Attach Quizzes", "Publish Questions", "Track Reports"].map(
                  (step, index) => (
                    <button
                      className="flex min-h-14 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 text-left text-sm font-black text-slate-800 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      key={step}
                      type="button"
                      onClick={() => openSection(index < 3 ? "course-builder" : index === 3 ? "question-studio" : "performance-watchlist")}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-xs font-black text-sky-700 shadow-sm">
                        {index + 1}
                      </span>
                      {step}
                    </button>
                  )
                )}
              </div>
            </DashboardPanel>

            <div className="stagger-list mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard icon={Users} tone="purple" label="Total Students" value={String(totalStudents)} trend={`${totalStudents} recorded`} detail="" />
              <StatCard icon={UserRound} tone="green" label="Active Attempts" value={String(activeAttempts.length)} trend={`${activeAttempts.length} active`} detail="" />
              <StatCard icon={ClipboardList} tone="blue" label="Total Questions" value={String(questions.length)} trend={`${topicCoverage.length} topics`} detail="" />
              <StatCard icon={Gauge} tone="orange" label="Total Attempts" value={String(attempts.length)} trend={`${completedAttempts.length} completed`} detail="" />
              <StatCard icon={Sparkles} tone="rose" label="Average Score" value={`${averageScore}%`} trend={`${needsAttention.length} watchlist`} detail="" />
            </div>
              </>
            )}

            {(section === "overview" || section === "reports") && (
            <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <DashboardPanel className="min-h-[330px]" title="Attempt Summary" action="Live" id="attempt-summary">
                <div className="grid h-full content-center gap-4 sm:grid-cols-3">
                  <SummaryTile label="Active" value={String(activeAttempts.length)} />
                  <SummaryTile label="Completed" value={String(completedAttempts.length)} />
                  <SummaryTile label="Completion" value={`${completionRate}%`} />
                </div>
              </DashboardPanel>
              <DashboardPanel className="min-h-[330px]" title="Top Performing Quizzes">
                <div className="stagger-list grid gap-3">
                  {topQuizzes.slice(0, 4).map((quiz, index) => (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3" key={quiz.topic}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-black text-white ${quizIconTone(index)}`}>
                        {topicInitials(quiz.topic)}
                      </span>
                      <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-black text-slate-950">{quiz.topic}</strong><small className="mt-1 block text-xs font-semibold text-slate-500">{quiz.count} questions · {quiz.score}% average</small></span>
                      <PerformanceBar value={quiz.score} tone="green" />
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            </div>
            )}

            {section === "courses" && (
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <DashboardPanel title="Course Builder" action="Courses · Lessons · Quizzes" id="course-builder">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Course title" value={courseForm.title} onChange={(value) => setCourseForm({ ...courseForm, title: value })} />
                  <Field label="Course code" value={courseForm.code} onChange={(value) => setCourseForm({ ...courseForm, code: value })} />
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Subject
                    <select
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
                      value={courseForm.subject}
                      onChange={(event) => setCourseForm({ ...courseForm, subject: event.target.value })}
                    >
                      {subjectOptions.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Status
                    <select
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
                      value={courseForm.status}
                      onChange={(event) => setCourseForm({ ...courseForm, status: event.target.value as typeof courseForm.status })}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                    Course description
                    <textarea
                      className="min-h-20 resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                      value={courseForm.description}
                      onChange={(event) => setCourseForm({ ...courseForm, description: event.target.value })}
                    />
                  </label>
                </div>
                <PrimaryButton className="mt-4" type="button" onClick={createCourse}>
                  Save Course
                </PrimaryButton>

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Active course
                    <select
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
                      value={activeCourseId}
                      onChange={(event) => setSelectedCourseId(event.target.value)}
                    >
                      {courses.length ? (
                        courses.map((course) => (
                          <option key={course.id} value={course.id}>{course.code} · {course.title}</option>
                        ))
                      ) : (
                        <option value="">Create a course first</option>
                      )}
                    </select>
                  </label>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Field label="Lesson title" value={lessonForm.title} onChange={(value) => setLessonForm({ ...lessonForm, title: value })} />
                    <Field label="Lesson video URL" value={lessonForm.videoUrl} onChange={(value) => setLessonForm({ ...lessonForm, videoUrl: value })} />
                    <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                      Lesson description
                      <textarea
                        className="min-h-16 resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                        value={lessonForm.description}
                        onChange={(event) => setLessonForm({ ...lessonForm, description: event.target.value })}
                      />
                    </label>
                    <Field label="Material URL" value={lessonForm.materialUrl} onChange={(value) => setLessonForm({ ...lessonForm, materialUrl: value })} />
                  </div>
                  <SecondaryButton className="mt-4" type="button" onClick={addLesson}>
                    Add Lesson
                  </SecondaryButton>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <Field label="Quiz title" value={quizForm.title} onChange={(value) => setQuizForm({ ...quizForm, title: value })} />
                    <Field label="Time limit" type="number" value={String(quizForm.timeLimitMinutes)} onChange={(value) => setQuizForm({ ...quizForm, timeLimitMinutes: Number(value) })} />
                    <Field label="Attempts" type="number" value={String(quizForm.attemptsAllowed)} onChange={(value) => setQuizForm({ ...quizForm, attemptsAllowed: Number(value) })} />
                    <Field label="Passing %" type="number" value={String(quizForm.passingPercent)} onChange={(value) => setQuizForm({ ...quizForm, passingPercent: Number(value) })} />
                    <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                      Quiz description
                      <textarea
                        className="min-h-16 resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-400"
                        value={quizForm.description}
                        onChange={(event) => setQuizForm({ ...quizForm, description: event.target.value })}
                      />
                    </label>
                  </div>
                  <SecondaryButton className="mt-4" type="button" onClick={addQuiz}>
                    Add Quiz
                  </SecondaryButton>
                </div>
                {contentMessage && (
                  <p className="mt-4 rounded-lg bg-[var(--brand-mint)] p-3 text-sm font-bold text-[var(--brand-green)]">{contentMessage}</p>
                )}
              </DashboardPanel>

              <DashboardPanel title="Course Structure">
                {activeCourse ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wide text-sky-700">{activeCourse.subject}</span>
                      <strong className="mt-1 block text-base font-black text-slate-950">{activeCourse.code} · {activeCourse.title}</strong>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{activeCourse.description || "No description yet."}</p>
                    </div>
                    <StructureList title="Lessons" items={activeCourse.lessons.map((lesson) => lesson.title)} empty="No lessons yet." />
                    <StructureList title="Quizzes" items={activeCourse.quizzes.map((quiz) => `${quiz.title} · ${quiz.timeLimitMinutes} min`)} empty="No quizzes yet." />
                  </div>
                ) : (
                  <p className="text-sm font-semibold leading-6 text-slate-500">Create a course to start adding lessons and quizzes.</p>
                )}
              </DashboardPanel>
            </div>
            )}

            {section === "questions" && (
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
              <DashboardPanel title="Question Studio" action="LaTeX enabled" id="question-studio">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Subject
                    <select
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
                      value={form.subject}
                      onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    >
                      {subjectOptions.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </label>
                  <Field label="Topic" value={form.topic} onChange={(value) => setForm({ ...form, topic: value })} />
                  <label className="grid gap-1 text-sm font-bold text-slate-700">
                    Type
                    <select
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
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
                      className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
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
                    Question box
                    <textarea
                      className="min-h-36 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-emerald-400"
                      value={form.prompt}
                      onChange={(event) => setForm({ ...form, prompt: event.target.value })}
                      placeholder="Type the full question. Example: Find $x$ if $$2x + 3 = 11$$"
                    />
                  </label>
                  {form.type === "objective" && (
                    <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                      Options
                      <textarea
                        className="min-h-28 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-emerald-400"
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
                      className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-emerald-400"
                      value={form.explanation}
                      onChange={(event) => setForm({ ...form, explanation: event.target.value })}
                      placeholder="Example: Subtract 3, then divide by 2: $x = \\frac{8}{2} = 4$."
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                    Rubric Points
                    <textarea
                      className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-emerald-400"
                      value={form.rubricPoints}
                      onChange={(event) => setForm({ ...form, rubricPoints: event.target.value })}
                      placeholder={"Mention the correct principle\nUse the correct unit\nShow the required relationship"}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-bold text-slate-700 sm:col-span-2">
                    Common Mistakes
                    <textarea
                      className="min-h-24 resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-emerald-400"
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
                  <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 text-sm font-black text-sky-700 transition hover:-translate-y-0.5 hover:shadow-md">
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
                {importMessage && (
                  <p className="mt-4 rounded-lg bg-[var(--brand-mint)] p-3 text-sm font-bold text-[var(--brand-green)]">{importMessage}</p>
                )}
              </DashboardPanel>

              <DashboardPanel title="LaTeX Preview">
                <div className="stagger-list space-y-3 text-sm font-semibold leading-7 text-slate-900">
                  <PreviewLine label="Subject" value={form.subject || "Subject preview"} />
                  <PreviewLine label="Question" value={form.prompt || "Question preview"} />
                  {form.type === "objective" && (
                    <PreviewLine label="Options" value={form.options || "Options preview"} />
                  )}
                  <PreviewLine label="Answer" value={form.answer || "Answer preview"} />
                  <PreviewLine label="Explanation" value={form.explanation || "Explanation preview"} />
                </div>
              </DashboardPanel>
            </div>
            )}

            {(section === "feedback" || section === "reports") && (
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              {section === "feedback" && (
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
                        <span className="text-xs font-black text-sky-700">{item.rating}/5 rating</span>
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
              )}

              {section === "reports" && (
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
              )}
            </div>
            )}
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
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
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

function StructureList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <strong className="block text-xs font-black uppercase tracking-wide text-slate-500">{title}</strong>
      <div className="mt-2 grid gap-2">
        {items.length ? (
          items.map((item, index) => (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800" key={`${item}-${index}`}>
              {item}
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500">{empty}</p>
        )}
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
        active ? "bg-sky-50 text-sky-700" : "text-slate-950 hover:bg-slate-50"
      }`}
      type="button"
      onClick={onClick}
    >
      <Icon size={20} />
      <span className="min-w-0 flex-1">{label}</span>
      {badge > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#06479b] px-1 text-[10px] font-black text-white">
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
    purple: "bg-sky-50 text-sky-700",
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

function ModuleCard({
  icon: Icon,
  tone,
  label,
  value,
  detail,
  onClick,
}: {
  icon: LucideIcon;
  tone: "purple" | "green" | "blue" | "orange" | "rose";
  label: string;
  value: string;
  detail: string;
  onClick: () => void;
}) {
  const tones = {
    purple: "bg-violet-50 text-violet-700 border-violet-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue: "bg-sky-50 text-sky-700 border-sky-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };

  return (
    <button
      className="interactive-lift min-h-36 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-200 hover:shadow-md"
      type="button"
      onClick={onClick}
    >
      <span className={`grid h-11 w-11 place-items-center rounded-lg border ${tones[tone]}`}>
        <Icon size={21} />
      </span>
      <strong className="mt-4 block text-2xl font-black text-slate-950">{value}</strong>
      <span className="mt-1 block text-sm font-black text-slate-800">{label}</span>
      <span className="mt-2 block text-xs font-bold leading-5 text-slate-500">{detail}</span>
    </button>
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
        {action && <button className="text-sm font-bold text-sky-700" type="button">{action}</button>}
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
    indigo: "border-sky-200 bg-sky-50 text-sky-700",
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

function PerformanceBar({ value, tone }: { value: number; tone: "green" | "purple" }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-sm font-bold text-slate-700">{value}%</span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
        <span
          className={`bar-fill block h-full rounded-full ${tone === "green" ? "bg-emerald-500" : "bg-[#06479b]"}`}
          style={{ width: `${value}%` }}
        />
      </span>
    </div>
  );
}

function quizIconTone(index: number) {
  return ["bg-orange-400", "bg-sky-500", "bg-emerald-500", "bg-[#06479b]", "bg-rose-600"][index % 5];
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
    subject: question.subject || "Physics",
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
