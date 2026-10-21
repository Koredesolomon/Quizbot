"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminAccount } from "@/components/admin/admin-login";
import { TlchubAiAssistant } from "@/components/ai-assistant";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Landing } from "@/components/landing";
import {
  Courses,
  HowItWorks,
  Overview,
  QuizPickerModal,
  Topics,
} from "@/components/selection-screens";
import { ComingSoon, Details, Marking, Results } from "@/components/results-screens";
import { PasswordReset } from "@/components/password-reset";
import { StudentAuth } from "@/components/student-auth";
import { StudentDashboard } from "@/components/student-dashboard";
import { TestInterface } from "@/components/test-interface";
import * as api from "@/lib/api";
import { getTopicBreakdown } from "@/lib/marker";
import { markedAttemptQuestions, submitSavedAttempt } from "@/lib/test-attempt";
import type { MarkedQuestion, QuizQuestion, Screen, StudentAttempt, StudentFeedback } from "@/types/platform";

const studentName = "Practice Student";
const adminStorageKey = "stem-jupeb-admin-account";
const studentStorageKey = "stem-jupeb-student-session";
const themeStorageKey = "stem-jupeb-theme";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const screens = new Set<Screen>([
  "landing",
  "howItWorks",
  "courses",
  "topics",
  "overview",
  "test",
  "marking",
  "results",
  "details",
  "student",
  "studentRegister",
  "studentDashboard",
  "passwordReset",
  "comingSoon",
]);

type GoogleCallback =
  | { role: "student"; session: api.AuthResponse; error?: never }
  | { role: "student"; error: string }
  | null;

type PasswordResetCallback = { token: string; email: string } | null;

function getPasswordResetCallback(): PasswordResetCallback {
  if (typeof window === "undefined" || !window.location.hash.includes("resetPassword=1")) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get("token") ?? "";
  if (!token) return null;

  return {
    token,
    email: params.get("email") ?? "",
  };
}

function getGoogleCallback(): GoogleCallback {
  if (typeof window === "undefined" || !window.location.hash.includes("authGoogle=1")) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const role = "student";
  const error = params.get("error");
  if (error) return { role, error };

  const accessToken = params.get("accessToken") ?? "";
  const email = params.get("email") ?? "";
  const fullName = params.get("name") ?? "Google Student";

  return {
    role,
    session: {
      accessToken,
      user: {
        id: params.get("id") ?? "",
        fullName,
          email,
          username: params.get("username") || undefined,
          avatarUrl: params.get("avatarUrl") || undefined,
          role: params.get("userRole") === "admin" ? "admin" : "student",
          authProvider: "google",
          registeredCourses: params.get("registeredCourses")?.split(",").filter(Boolean) ?? [],
          createdAt: params.get("createdAt") ?? new Date().toISOString(),
        },
    },
  };
}

// Admin Google sign-in is handled by /admin; forward any admin callback that lands here.
function isAdminGoogleCallbackHash() {
  if (typeof window === "undefined") return false;

  const hash = window.location.hash;
  return hash.includes("adminGoogle=1") || (hash.includes("authGoogle=1") && hash.includes("role=admin"));
}

function isAdminChannelHash() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get("admin") === "1";
}

function isScreen(value: unknown): value is Screen {
  return typeof value === "string" && screens.has(value as Screen);
}

function currentBrowserPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function toStudentAttempt(attempt: api.ApiAttempt, questionCount: number, answered: number, student: string): StudentAttempt {
  return {
    id: attempt.id,
    student,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    answered: attempt.answeredCount ?? answered,
    questionCount: attempt.questionCount || questionCount,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percent: attempt.percent,
    aiSummary: attempt.aiSummary,
    aiSummarySource: attempt.aiSummarySource,
  };
}

function toAdminAttempt(attempt: api.ApiAttempt, questionCount: number): StudentAttempt {
  return {
    ...toStudentAttempt(attempt, questionCount, attempt.status === "completed" ? questionCount : 0, "Student"),
    student: attempt.studentName ?? `Student ${attempt.studentId.slice(-4)}`,
  };
}

function toStudentFeedback(feedback: api.ApiFeedback): StudentFeedback {
  return {
    id: feedback.id,
    student: feedback.studentName ?? `Student ${feedback.studentId.slice(-4)}`,
    rating: feedback.rating,
    message: feedback.message,
    submittedAt: feedback.createdAt,
    status: feedback.status,
  };
}

export default function Home() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("landing");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptQuestions, setAttemptQuestions] = useState<QuizQuestion[]>([]);
  const [courses, setCourses] = useState<api.CourseContent[]>([]);
  const [coursesFailed, setCoursesFailed] = useState(false);
  const [coursesReload, setCoursesReload] = useState(0);
  const [testError, setTestError] = useState("");
  const testRequestBusyRef = useRef(false);
  const testRequestVersionRef = useRef(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<MarkedQuestion[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummarySource, setAiSummarySource] = useState<"ai" | "auto" | undefined>();
  const [selectedDetail, setSelectedDetail] = useState(0);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [feedback, setFeedback] = useState<StudentFeedback[]>([]);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  const [studentSession, setStudentSession] = useState<api.AuthResponse | null>(null);
  const [studentAuthError, setStudentAuthError] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [passwordResetToken, setPasswordResetToken] = useState("");
  const [passwordResetEmail, setPasswordResetEmail] = useState("");
  const [comingSoonBackScreen, setComingSoonBackScreen] = useState<Screen>("courses");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedSubtopicId, setSelectedSubtopicId] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [quizPickerOpen, setQuizPickerOpen] = useState(false);
  const historyReadyRef = useRef(false);
  const restoringHistoryRef = useRef(false);
  const activeStudentName = studentSession?.user.fullName ?? studentName;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentState = window.history.state;
    if (!isScreen(currentState?.tlcScreen)) {
      window.history.replaceState({ ...currentState, tlcScreen: screen }, "", currentBrowserPath());
    }

    historyReadyRef.current = true;

    const handlePopState = (event: PopStateEvent) => {
      const nextScreen = event.state?.tlcScreen;
      if (!isScreen(nextScreen)) return;

      restoringHistoryRef.current = true;
      setScreen(nextScreen);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [screen]);

  useEffect(() => {
    if (typeof window === "undefined" || !historyReadyRef.current) return;

    if (restoringHistoryRef.current) {
      restoringHistoryRef.current = false;
      return;
    }

    if (window.history.state?.tlcScreen === screen) return;

    window.history.pushState(
      { ...(window.history.state ?? {}), tlcScreen: screen },
      "",
      currentBrowserPath()
    );
  }, [screen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadBrowserState = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
      setTheme(savedTheme);
      setThemeLoaded(true);
      const resetCallback = getPasswordResetCallback();
      if (resetCallback) {
        setPasswordResetToken(resetCallback.token);
        setPasswordResetEmail(resetCallback.email);
        setScreen("passwordReset");
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }

      if (isAdminGoogleCallbackHash()) {
        window.location.replace(`/admin${window.location.hash}`);
        return;
      }

      const shouldOpenAdminChannel = isAdminChannelHash();

      const googleCallback = getGoogleCallback();
      if (googleCallback?.error) {
        setStudentAuthError(googleCallback.error);
        setScreen("student");
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      if (googleCallback && "session" in googleCallback) {
        setStudentSession(googleCallback.session);
        setScreen("studentDashboard");
        window.localStorage.setItem(studentStorageKey, JSON.stringify(googleCallback.session));
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
      }

      const savedAdmin = window.localStorage.getItem(adminStorageKey);
      if (savedAdmin) {
        try {
          const restoredAdmin = JSON.parse(savedAdmin) as AdminAccount;
          setAdminAccount(restoredAdmin);
          setAdminUnlocked(Boolean(restoredAdmin.accessToken));
        } catch {
          window.localStorage.removeItem(adminStorageKey);
        }
      }

      if (shouldOpenAdminChannel) {
        router.replace("/admin");
        return;
      }

      const savedStudent = window.localStorage.getItem(studentStorageKey);
      if (!savedStudent) return;

      try {
        setStudentSession(JSON.parse(savedStudent) as api.AuthResponse);
      } catch {
        window.localStorage.removeItem(studentStorageKey);
      }
    }, 0);

    return () => window.clearTimeout(loadBrowserState);
  }, [router]);

  useEffect(() => {
    let ignore = false;

    const courseRequest = adminUnlocked && adminAccount?.accessToken
      ? api.getAdminCourses(adminAccount.accessToken)
      : api.getCourses();
    // Load independently so a failing questions request cannot hide the published courses.
    // Content stays empty when the backend is unavailable so demo questions do not leak into real tests.
    courseRequest
      .then((backendCourses) => {
        if (ignore) return;
        setCourses(backendCourses);
        setCoursesFailed(false);
      })
      .catch(() => {
        if (!ignore) setCoursesFailed(true);
      });
    api.getQuestions()
      .then((backendQuestions) => {
        if (!ignore) setQuestions(backendQuestions);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, [adminAccount?.accessToken, adminUnlocked, coursesReload]);

  useEffect(() => {
    if (typeof window === "undefined" || !themeLoaded) return;

    window.localStorage.setItem(themeStorageKey, theme);
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    document.documentElement.classList.toggle("theme-light", theme === "light");
  }, [theme, themeLoaded]);

  useEffect(() => {
    if (!adminUnlocked || !adminAccount?.accessToken) return;

    let ignore = false;

    Promise.allSettled([
      api.getAdminAttempts(adminAccount.accessToken),
      api.getAdminFeedback(adminAccount.accessToken),
    ])
      .then(([backendAttempts, backendFeedback]) => {
        if (ignore) return;

        if (backendAttempts.status === "fulfilled") {
          setAttempts(backendAttempts.value.map((attempt) => toAdminAttempt(attempt, questions.length)));
        }
        if (backendFeedback.status === "fulfilled") {
          setFeedback(backendFeedback.value.map(toStudentFeedback));
        }
      })
      .catch(() => {
        // Leave the local dashboard data in place when the API is not available.
      });

    return () => {
      ignore = true;
    };
  }, [adminAccount?.accessToken, adminUnlocked, questions.length]);

  useEffect(() => {
    if (!studentSession?.accessToken) return;

    let ignore = false;

    api
      .getMyAttempts(studentSession.accessToken)
      .then((backendAttempts) => {
        if (ignore) return;

        setAttempts(backendAttempts.map((attempt) => toStudentAttempt(attempt, questions.length, 0, activeStudentName)));
      })
      .catch(() => {
        // Keep local attempts available when the API is not reachable.
      });

    return () => {
      ignore = true;
    };
  }, [activeStudentName, questions.length, studentSession?.accessToken]);

  const registeredCourseCodes = studentSession?.user.registeredCourses ?? [];
  const selectedCourse =
    (courses ?? []).find((course) => course.id === selectedCourseId) ??
    (courses ?? []).find((course) => registeredCourseCodes.includes(course.code)) ??
    courses[0];
  const selectedModule = (selectedCourse?.modules ?? []).find((module) => module.id === selectedModuleId) ?? selectedCourse?.modules?.[0];
  const selectedSubtopic = (selectedModule?.topics ?? [])
    .flatMap((topic) => topic.subtopics)
    .find((subtopic) => subtopic.id === selectedSubtopicId);
  const selectedQuiz = (selectedSubtopic?.quizzes ?? []).find((quiz) => quiz.id === selectedQuizId);
  const getQuizQuestions = useCallback((quizId: string) => questions.filter((question) => question.quizId === quizId), [questions]);
  const activeQuestions = useMemo(() =>
    currentAttemptId && ["test", "marking", "results", "details"].includes(screen)
      ? attemptQuestions : getQuizQuestions(selectedQuizId),
  [attemptQuestions, currentAttemptId, getQuizQuestions, screen, selectedQuizId]);
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const totalMarks = useMemo(() => activeQuestions.reduce((sum, question) => sum + question.marks, 0), [activeQuestions]);
  const score = marked.reduce((sum, question) => sum + question.awarded, 0);
  const percent = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
  const topicBreakdown = useMemo(() => getTopicBreakdown(marked), [marked]);

  const saveStudentSession = (nextSession: api.AuthResponse) => {
    setStudentSession(nextSession);
    window.localStorage.setItem(studentStorageKey, JSON.stringify(nextSession));
    return nextSession;
  };

  const loginStudent = async (input: { identifier: string; password: string }) => {
    const nextSession = await api.login(input);
    if (nextSession.user.role !== "student") {
      throw new Error("Use a student account to take tests.");
    }

    resetTest();
    saveStudentSession(nextSession);
    setScreen("studentDashboard");
    return nextSession;
  };

  const registerStudent = async (input: { fullName: string; email: string; username?: string; password: string }) => {
    const nextSession = await api.registerStudent(input);
    if (nextSession.user.role !== "student") {
      throw new Error("Use a student account to take tests.");
    }

    resetTest();
    saveStudentSession(nextSession);
    setScreen("studentDashboard");
    return nextSession;
  };

  const startMarking = async () => {
    if (testRequestBusyRef.current) return;
    if (!currentAttemptId || !studentSession?.accessToken) {
      setTestError("Sign in and start a test before submitting your answers.");
      return;
    }
    testRequestBusyRef.current = true;
    const requestVersion = ++testRequestVersionRef.current;
    setTestError("");
    setScreen("marking");
    try {
      const submitted = await submitSavedAttempt(currentAttemptId, answers, studentSession.accessToken);
      if (requestVersion !== testRequestVersionRef.current) return;
      const markedResponses = markedAttemptQuestions(submitted);
      const completed = toStudentAttempt(submitted.attempt, submitted.questions.length, answeredCount, activeStudentName);
      setMarked(markedResponses);
      setAiSummary(submitted.attempt.aiSummary ?? "");
      setAiSummarySource(submitted.attempt.aiSummarySource);
      setAttempts((current) => current.map((attempt) => attempt.id === currentAttemptId ? completed : attempt));
      setSelectedDetail(0);
      setScreen("results");
    } catch (error) {
      if (requestVersion !== testRequestVersionRef.current) return;
      setTestError(`${error instanceof Error ? error.message : "Submission failed."} Your answers are still here. Please retry your submission.`);
      setScreen("test");
    } finally { if (requestVersion === testRequestVersionRef.current) testRequestBusyRef.current = false; }
  };

  const startTest = async (quizId: string = selectedQuizId) => {
    if (testRequestBusyRef.current) return;
    if (!studentSession?.accessToken) {
      setScreen("student");
      return;
    }
    testRequestBusyRef.current = true;
    const requestVersion = ++testRequestVersionRef.current;
    setTestError("");
    try {
      const started = await api.startAttempt(quizId, studentSession.accessToken);
      if (requestVersion !== testRequestVersionRef.current) return;
      const nextAttempt = toStudentAttempt(started.attempt, started.questions.length, 0, activeStudentName);
      setCurrentAttemptId(nextAttempt.id);
      setAttemptQuestions(started.questions);
      setAnswers({});
      setMarked([]);
      setAiSummary("");
      setSelectedDetail(0);
      setAttempts((current) => [nextAttempt, ...current]);
      setCurrentQuestion(0);
      setScreen("test");
    } catch (error) {
      if (requestVersion !== testRequestVersionRef.current) return;
      setTestError(error instanceof Error ? error.message : "Could not start this test. Please try again.");
      setScreen("overview");
    } finally { if (requestVersion === testRequestVersionRef.current) testRequestBusyRef.current = false; }
  };

  const resetTest = () => {
    testRequestVersionRef.current += 1;
    testRequestBusyRef.current = false;
    setTestError("");
    setAttemptQuestions([]);
    setAnswers({});
    setMarked([]);
    setAiSummary("");
    setCurrentQuestion(0);
    setSelectedDetail(0);
    setCurrentAttemptId(null);
    setScreen("overview");
  };

  const updateAnswer = (id: string, value: string) => {
    setAnswers((current) => {
      const next = { ...current, [id]: value };
      const nextAnsweredCount = Object.values(next).filter(Boolean).length;

      setAttempts((currentAttempts) =>
        currentAttempts.map((attempt) =>
          attempt.id === currentAttemptId ? { ...attempt, answered: nextAnsweredCount } : attempt
        )
      );

      return next;
    });
  };

  const submitFeedback = (message: string, rating: number) => {
    if (studentSession?.accessToken) {
      void api.submitFeedback({ message, rating }, studentSession.accessToken).catch(() => undefined);
    }

    setFeedback((current) => [
      {
        id: `feedback-${Date.now()}`,
        student: activeStudentName,
        rating,
        message,
        submittedAt: new Date().toISOString(),
        status: "new",
      },
      ...current,
    ]);
  };

  const saveUpdatedStudent = (user: api.AuthUser) => {
    if (!studentSession) return;

    saveStudentSession({
      ...studentSession,
      user,
    });
  };

  const uploadStudentAvatar = async (file: File) => {
    if (!studentSession?.accessToken) {
      throw new Error("Sign in before updating your profile image.");
    }

    const response = await api.uploadProfileAvatar(file, studentSession.accessToken);
    saveUpdatedStudent(response.user);
  };

  const removeStudentAvatar = async () => {
    if (!studentSession?.accessToken) {
      throw new Error("Sign in before updating your profile image.");
    }

    const response = await api.removeProfileAvatar(studentSession.accessToken);
    saveUpdatedStudent(response.user);
  };

  const registerStudentCourse = async (courseCode: string) => {
    if (!studentSession?.accessToken) {
      setScreen("student");
      return;
    }

    const response = await api.registerCourse(courseCode, studentSession.accessToken);
    saveUpdatedStudent(response.user);
  };

  const openCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId("");
    setSelectedSubtopicId("");
    setSelectedQuizId("");
    setQuizPickerOpen(false);
    setScreen("topics");
  };

  const registerAndOpenCourse = async (course: api.CourseContent) => {
    if (!studentSession?.accessToken) {
      setScreen("student");
      return;
    }

    await registerStudentCourse(course.code);
    openCourse(course.id);
  };

  const openSubtopicQuizzes = (module: api.CourseModule, subtopic: api.CourseSubtopic) => {
    setSelectedModuleId(module.id);
    setSelectedSubtopicId(subtopic.id);
    setSelectedQuizId("");
    setQuizPickerOpen(true);
  };

  const selectQuiz = (quiz: api.CourseQuiz) => {
    setSelectedQuizId(quiz.id);
    setQuizPickerOpen(false);
    void startTest(quiz.id);
  };

  const continueWithGoogle = async () => {
    setStudentAuthError("");

    const googleUrl = `${apiBaseUrl}/auth/google/student`;

    router.push(googleUrl);
  };

  const showComingSoon = (backScreen: Screen) => {
    setComingSoonBackScreen(backScreen);
    setScreen("comingSoon");
  };

  const signOutStudent = () => {
    resetTest();
    setStudentSession(null);
    setScreen("landing");
    window.localStorage.removeItem(studentStorageKey);
  };

  const openPasswordReset = (email = "") => {
    setPasswordResetToken("");
    setPasswordResetEmail(email);
    setScreen("passwordReset");
  };

  const isDark = theme === "dark";

  return (
    <main
      className={`min-h-screen transition-colors duration-200 ${
        isDark ? "theme-dark bg-slate-950 text-slate-100" : "theme-light bg-slate-50 text-slate-950"
      }`}
    >
      <Header
        theme={theme}
        studentName={studentSession?.user.fullName}
        studentAvatarUrl={studentSession?.user.avatarUrl}
        onNavigate={setScreen}
        onStudentSignOut={signOutStudent}
        onToggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />

      {testError && ["topics", "overview", "test"].includes(screen) && (
        <div role="alert" className="mx-auto my-4 flex max-w-6xl flex-wrap items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          <p>{testError}</p>
          {screen === "test" && <button className="min-h-10 rounded-md border border-rose-300 px-4 font-bold hover:bg-rose-100" type="button" onClick={() => void startMarking()}>Retry submission</button>}
          {screen === "overview" && selectedQuizId && <button className="min-h-10 rounded-md border border-rose-300 px-4 font-bold hover:bg-rose-100" type="button" onClick={() => void startTest()}>Retry starting test</button>}
        </div>
      )}

      {screen === "landing" && (
        <Landing
          onStart={() => setScreen("courses")}
          onBrowseSubjects={() => setScreen("courses")}
        />
      )}

      {screen === "howItWorks" && <HowItWorks onStart={() => setScreen("courses")} onBack={() => setScreen("landing")} />}

      {screen === "courses" && (
        <Courses
          courses={courses}
          loadFailed={coursesFailed}
          onRetry={() => setCoursesReload((count) => count + 1)}
          registeredCourses={studentSession?.user.registeredCourses ?? []}
          onSelectCourse={openCourse}
          onRegisterCourse={registerAndOpenCourse}
          onComingSoon={() => showComingSoon("courses")}
          onBack={() => setScreen("landing")}
        />
      )}
      {screen === "topics" && (
        <Topics
          course={selectedCourse}
          openModuleId={selectedModuleId}
          onOpenModule={setSelectedModuleId}
          onSelectSubtopic={openSubtopicQuizzes}
          onBack={() => setScreen("courses")}
        />
      )}
      {screen === "overview" && (
        <Overview
          questions={activeQuestions}
          totalMarks={totalMarks}
          title={selectedQuiz?.title ?? selectedSubtopic?.title ?? "Quiz overview"}
          subtitle={selectedSubtopic ? `${selectedCourse?.title ?? "Course"} · ${selectedModule?.title ?? "Topic"} · ${selectedSubtopic.title}` : "Review the selected quiz before starting."}
          onStart={() => void startTest()}
          onBack={() => setScreen("topics")}
        />
      )}
      {screen === "studentDashboard" && studentSession?.user && (
        <StudentDashboard
          student={studentSession.user}
          courses={courses}
          attempts={attempts}
          questionCount={questions.length}
          totalMarks={totalMarks}
          onStartPractice={() => {
            const firstRegisteredCourse = (courses ?? []).find((course) => (studentSession.user.registeredCourses ?? []).includes(course.code));
            if (firstRegisteredCourse) {
              openCourse(firstRegisteredCourse.id);
            } else {
              setScreen("courses");
            }
          }}
          onBrowseSubjects={() => setScreen("courses")}
          onViewOverview={() => {
            const firstRegisteredCourse = (courses ?? []).find((course) => (studentSession.user.registeredCourses ?? []).includes(course.code));
            if (firstRegisteredCourse) {
              openCourse(firstRegisteredCourse.id);
            } else {
              setScreen("courses");
            }
          }}
          onResumeTest={currentAttemptId ? () => setScreen("test") : undefined}
          onRemoveProfileAvatar={removeStudentAvatar}
          onUploadProfileAvatar={uploadStudentAvatar}
        />
      )}
      {(screen === "student" || screen === "studentRegister") && (
        <StudentAuth
          key={screen}
          authError={studentAuthError}
          initialMode={screen === "studentRegister" ? "register" : "login"}
          onLogin={loginStudent}
          onRegister={registerStudent}
          onGoogleLogin={() => void continueWithGoogle()}
          onForgotPassword={openPasswordReset}
          onBack={() => setScreen(studentSession ? "studentDashboard" : "landing")}
        />
      )}
      {screen === "passwordReset" && (
        <PasswordReset
          initialEmail={passwordResetEmail}
          token={passwordResetToken}
          onRequestReset={api.forgotPassword}
          onResetPassword={api.resetPassword}
          onBack={() => {
            setPasswordResetToken("");
            setPasswordResetEmail("");
            setScreen("landing");
          }}
        />
      )}
      {screen === "test" && (
        <TestInterface
          questions={activeQuestions}
          answers={answers}
          currentQuestion={currentQuestion}
          onAnswer={updateAnswer}
          onCurrentQuestion={setCurrentQuestion}
          onBack={() => setScreen("overview")}
          onSubmit={startMarking}
        />
      )}
      {screen === "marking" && <Marking />}
      {screen === "results" && (
        <Results
          marked={marked}
          percent={percent}
	          score={score}
	          answeredCount={answeredCount}
	          questions={activeQuestions}
	          totalMarks={totalMarks}
          aiSummary={aiSummary}
          aiSummarySource={aiSummarySource}
          onFeedback={submitFeedback}
          onBack={() => setScreen("overview")}
          onDetails={() => setScreen("details")}
          onRetry={resetTest}
        />
      )}
	      {screen === "details" && (
        <Details
          marked={marked}
          selectedDetail={selectedDetail}
          topicBreakdown={topicBreakdown}
          onSelectDetail={setSelectedDetail}
          onBack={() => setScreen("results")}
        />
	      )}
	      {quizPickerOpen && (
	        <QuizPickerModal
	          subtopic={selectedSubtopic}
	          selectedQuizId={selectedQuizId}
	          onSelectQuiz={selectQuiz}
	          onClose={() => setQuizPickerOpen(false)}
	        />
	      )}
      {screen === "comingSoon" && (
        <ComingSoon onBack={() => setScreen(comingSoonBackScreen)} />
      )}
      <Footer theme={theme} />
      <TlchubAiAssistant
        screen={screen}
        questions={questions}
        answers={answers}
        marked={marked}
        attempts={attempts}
        feedback={feedback}
        currentQuestion={currentQuestion}
        studentName={studentSession?.user.fullName}
        adminName={adminAccount?.name}
        isAdmin={false}
        isStudentSignedIn={Boolean(studentSession)}
        aiSummary={aiSummary}
      />
    </main>
  );
}
