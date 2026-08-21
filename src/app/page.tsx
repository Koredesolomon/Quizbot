"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminDashboard, AdminLogin, AdminRegistration, type AdminAccount } from "@/components/admin-dashboard";
import { Header } from "@/components/header";
import { Landing } from "@/components/landing";
import {
  Courses,
  Overview,
  Programme,
  Subjects,
  Topics,
} from "@/components/selection-screens";
import { ComingSoon, Details, Marking, Results } from "@/components/results-screens";
import { StudentAuth } from "@/components/student-auth";
import { StudentDashboard } from "@/components/student-dashboard";
import { TestInterface } from "@/components/test-interface";
import { questions as starterQuestions } from "@/data/platform";
import * as api from "@/lib/api";
import { getTopicBreakdown, markResponses } from "@/lib/marker";
import type { MarkedQuestion, Question, Screen, StudentAttempt, StudentFeedback } from "@/types/platform";

const studentName = "Practice Student";
const adminStorageKey = "stem-jupeb-admin-account";
const studentStorageKey = "stem-jupeb-student-session";
const themeStorageKey = "stem-jupeb-theme";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type GoogleCallback =
  | { role: "admin"; account: AdminAccount; error?: never }
  | { role: "student"; session: api.AuthResponse; error?: never }
  | { role: "admin" | "student"; error: string }
  | null;

function getGoogleCallback(): GoogleCallback {
  if (typeof window === "undefined" || !window.location.hash.includes("authGoogle=1")) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const role = params.get("role") === "admin" ? "admin" : "student";
  const error = params.get("error");
  if (error) return { role, error };

  const accessToken = params.get("accessToken") ?? "";
  const email = params.get("email") ?? "";
  const fullName = params.get("name") ?? (role === "admin" ? "Google Admin" : "Google Student");

  if (role === "admin") {
    return {
      role,
      account: {
        name: fullName,
        email,
        role: "Academic Admin",
        accessCode: "",
        accessToken,
        authProvider: "google",
      },
    };
  }

  return {
    role,
    session: {
      accessToken,
      user: {
        id: params.get("id") ?? "",
        fullName,
        email,
        avatarUrl: params.get("avatarUrl") || undefined,
        role: "student",
        authProvider: "google",
        createdAt: params.get("createdAt") ?? new Date().toISOString(),
      },
    },
  };
}

function getGoogleAdminCallback(): GoogleCallback {
  if (typeof window === "undefined" || !window.location.hash.includes("adminGoogle=1")) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const error = params.get("error");
  if (error) return { role: "admin", error };

  return {
    role: "admin",
    account: {
      name: params.get("name") ?? "Google Admin",
      email: params.get("email") ?? "",
      role: "Academic Admin",
      accessCode: "",
      accessToken: params.get("accessToken") ?? undefined,
      authProvider: "google",
    },
  };
}

function isAdminChannelHash() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.hash.slice(1));
  return params.get("admin") === "1";
}

function toQuestionPayload(question: Question): Omit<Question, "id"> {
  return {
    type: question.type,
    topic: question.topic,
    prompt: question.prompt,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    marks: question.marks,
    difficulty: question.difficulty,
    learningObjective: question.learningObjective,
    rubricPoints: question.rubricPoints,
    commonMistakes: question.commonMistakes,
    keywords: question.keywords,
  };
}

function mapBackendMarkedAnswers(
  response: api.SubmitAttemptResponse,
  submittedAnswers: Record<string, string>,
  questions: Question[]
): MarkedQuestion[] {
  const answersByQuestion = new Map(response.answers.map((answer) => [answer.questionId, answer]));

  return questions.map((question) => {
    const backendAnswer = answersByQuestion.get(question.id);

    return {
      ...question,
      userAnswer: backendAnswer?.answer ?? submittedAnswers[question.id] ?? "",
      awarded: backendAnswer?.awarded ?? 0,
      correct: backendAnswer?.correct ?? false,
      aiFeedback: backendAnswer?.aiFeedback ?? "No response was submitted for this question.",
    };
  });
}

function toStudentAttempt(attempt: api.ApiAttempt, questionCount: number, answered: number, student: string): StudentAttempt {
  return {
    id: attempt.id,
    student,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    answered,
    questionCount,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percent: attempt.percent,
    aiSummary: attempt.aiSummary,
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
  const [questions, setQuestions] = useState<Question[]>(starterQuestions);
  const [backendQuestionsLoaded, setBackendQuestionsLoaded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<MarkedQuestion[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(0);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [feedback, setFeedback] = useState<StudentFeedback[]>([]);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  const [adminAuthMode, setAdminAuthMode] = useState<"login" | "register">("login");
  const [adminAuthError, setAdminAuthError] = useState("");
  const [studentSession, setStudentSession] = useState<api.AuthResponse | null>(null);
  const [studentAuthError, setStudentAuthError] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [comingSoonBackScreen, setComingSoonBackScreen] = useState<Screen>("subjects");
  const activeStudentName = studentSession?.user.fullName ?? studentName;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadBrowserState = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
      setTheme(savedTheme);
      setThemeLoaded(true);
      const shouldOpenAdminChannel = isAdminChannelHash();

      const googleCallback = getGoogleCallback() ?? getGoogleAdminCallback();
      if (googleCallback?.error) {
        if (googleCallback.role === "admin") {
          setAdminAuthError(googleCallback.error);
          setScreen("admin");
        } else {
          setStudentAuthError(googleCallback.error);
          setScreen("student");
        }
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      if (googleCallback && "account" in googleCallback) {
        setAdminAccount(googleCallback.account);
        setAdminUnlocked(true);
        setScreen("admin");
        window.localStorage.setItem(adminStorageKey, JSON.stringify(googleCallback.account));
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        return;
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
          setAdminAccount(JSON.parse(savedAdmin) as AdminAccount);
        } catch {
          window.localStorage.removeItem(adminStorageKey);
        }
      }

      if (shouldOpenAdminChannel) {
        setScreen("admin");
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
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
  }, []);

  useEffect(() => {
    let ignore = false;

    api
      .getQuestions()
      .then((backendQuestions) => {
        if (!ignore) {
          setQuestions(backendQuestions);
          setBackendQuestionsLoaded(true);
        }
      })
      .catch(() => {
        // Keep starter questions available when the backend is not running locally.
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !themeLoaded) return;

    window.localStorage.setItem(themeStorageKey, theme);
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
  }, [theme, themeLoaded]);

  useEffect(() => {
    if (!adminUnlocked || !adminAccount?.accessToken) return;

    let ignore = false;

    Promise.all([api.getAdminAttempts(adminAccount.accessToken), api.getAdminFeedback(adminAccount.accessToken)])
      .then(([backendAttempts, backendFeedback]) => {
        if (ignore) return;

        setAttempts(backendAttempts.map((attempt) => toAdminAttempt(attempt, questions.length)));
        setFeedback(backendFeedback.map(toStudentFeedback));
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

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const totalMarks = useMemo(() => questions.reduce((sum, question) => sum + question.marks, 0), [questions]);
  const score = marked.reduce((sum, question) => sum + question.awarded, 0);
  const percent = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
  const topicBreakdown = useMemo(() => getTopicBreakdown(marked), [marked]);

  const saveStudentSession = (nextSession: api.AuthResponse) => {
    setStudentSession(nextSession);
    window.localStorage.setItem(studentStorageKey, JSON.stringify(nextSession));
    return nextSession;
  };

  const loginStudent = async (input: { email: string; password: string }) => {
    const nextSession = await api.login(input);
    if (nextSession.user.role !== "student") {
      throw new Error("Use a student account to take tests.");
    }

    saveStudentSession(nextSession);
    setScreen("studentDashboard");
    return nextSession;
  };

  const registerStudent = async (input: { fullName: string; email: string; password: string }) => {
    const nextSession = await api.registerStudent(input);
    saveStudentSession(nextSession);
    setScreen("studentDashboard");
    return nextSession;
  };

  const startMarking = () => {
    setScreen("marking");
    window.setTimeout(() => {
      void (async () => {
        const answered = Object.values(answers).filter(Boolean).length;
        let markedResponses = markResponses(answers, questions);
        let completedAttempt: StudentAttempt | null = null;

        if (backendQuestionsLoaded && currentAttemptId && studentSession?.accessToken) {
          try {
            const submittedAttempt = await api.submitAttempt(currentAttemptId, answers, studentSession.accessToken);
            markedResponses = mapBackendMarkedAnswers(submittedAttempt, answers, questions);
            completedAttempt = toStudentAttempt(submittedAttempt.attempt, questions.length, answered, activeStudentName);
            setAiSummary(submittedAttempt.attempt.aiSummary ?? "");
          } catch {
            completedAttempt = null;
          }
        }

        const finalScore = markedResponses.reduce((sum, question) => sum + question.awarded, 0);
        const finalPercent = totalMarks ? Math.round((finalScore / totalMarks) * 100) : 0;

        setMarked(markedResponses);
        setAttempts((current) =>
          current.map((attempt) =>
            attempt.id === currentAttemptId
              ? completedAttempt ?? {
                  ...attempt,
                  status: "completed",
                  submittedAt: new Date().toISOString(),
                  answered,
                  score: finalScore,
                  totalMarks,
                  percent: finalPercent,
                }
              : attempt
          )
        );
        setSelectedDetail(0);
        setScreen("results");
      })();
    }, 1100);
  };

  const startTest = async () => {
    if (!studentSession?.accessToken) {
      setScreen("student");
      return;
    }

    let nextAttempt: StudentAttempt = {
      id: `attempt-${Date.now()}`,
      student: activeStudentName,
      status: "active",
      startedAt: new Date().toISOString(),
      answered: 0,
      questionCount: questions.length,
      totalMarks,
    };

    if (backendQuestionsLoaded) {
      const backendAttempt = await api.startAttempt(studentSession.accessToken);
      nextAttempt = toStudentAttempt(backendAttempt, questions.length, 0, activeStudentName);
    }

    setCurrentAttemptId(nextAttempt.id);
    setAnswers({});
    setMarked([]);
    setAiSummary("");
    setSelectedDetail(0);
    setAttempts((current) => [nextAttempt, ...current]);
    setCurrentQuestion(0);
    setScreen("test");
  };

  const resetTest = () => {
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

  const addQuestion = async (question: Question) => {
    if (!adminAccount?.accessToken) {
      throw new Error("Sign in with a backend admin account before saving questions.");
    }

    await api.createQuestion(toQuestionPayload(question), adminAccount.accessToken);
    setQuestions(await api.getQuestions());
    setBackendQuestionsLoaded(true);
  };

  const importQuestions = async (incomingQuestions: Question[]) => {
    if (!adminAccount?.accessToken) {
      throw new Error("Sign in with a backend admin account before importing questions.");
    }

    await api.importQuestions(
      incomingQuestions.map((question) => toQuestionPayload(question)),
      adminAccount.accessToken
    );
    setQuestions(await api.getQuestions());
    setBackendQuestionsLoaded(true);
    setAnswers({});
    setMarked([]);
    setCurrentQuestion(0);
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

  const registerAdmin = async (account: AdminAccount) => {
    setAdminAuthError("");
    const response = await api.registerAdmin({
      fullName: account.name,
      email: account.email,
      password: account.accessCode,
    });
    const nextAccount: AdminAccount = {
      ...account,
      name: response.user.fullName,
      email: response.user.email,
      accessToken: response.accessToken,
      authProvider: "password",
    };

    setAdminAccount(nextAccount);
    setAdminUnlocked(true);
    window.localStorage.setItem(adminStorageKey, JSON.stringify(nextAccount));
    return true;
  };

  const continueWithGoogle = async (role: "admin" | "student") => {
    if (role === "admin") {
      setAdminAuthError("");
    } else {
      setStudentAuthError("");
    }

    const googleUrl = `${apiBaseUrl}/auth/google/${role}`;

    router.push(googleUrl);
  };

  const showComingSoon = (backScreen: Screen) => {
    setComingSoonBackScreen(backScreen);
    setScreen("comingSoon");
  };

  const signOutStudent = () => {
    setStudentSession(null);
    setScreen("landing");
    window.localStorage.removeItem(studentStorageKey);
  };

  const clearAdminSession = () => {
    setAdminAccount(null);
    setAdminUnlocked(false);
    setAdminAuthError("");
    setAdminAuthMode("login");
    window.localStorage.removeItem(adminStorageKey);
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

      {screen === "landing" && (
        <Landing
          onStart={() => setScreen("programme")}
          onBrowseSubjects={() => setScreen("subjects")}
        />
      )}

      {screen === "programme" && <Programme onNext={() => setScreen("subjects")} onBack={() => setScreen("landing")} />}
      {screen === "subjects" && (
        <Subjects
          onPhysics={() => setScreen("courses")}
          onComingSoon={() => showComingSoon("subjects")}
          onBack={() => setScreen("programme")}
        />
      )}
      {screen === "courses" && (
        <Courses
          onPHS001={() => setScreen("topics")}
          onComingSoon={() => showComingSoon("courses")}
          onBack={() => setScreen("subjects")}
        />
      )}
      {screen === "topics" && (
        <Topics
          onTopicOne={() => setScreen("overview")}
          onComingSoon={() => showComingSoon("topics")}
          onBack={() => setScreen("courses")}
        />
      )}
      {screen === "overview" && (
        <Overview
          questions={questions}
          totalMarks={totalMarks}
          onStart={startTest}
          onBack={() => setScreen("topics")}
        />
      )}
      {screen === "studentDashboard" && studentSession?.user && (
        <StudentDashboard
          student={studentSession.user}
          attempts={attempts}
          questionCount={questions.length}
          totalMarks={totalMarks}
          onStartPractice={() => setScreen("overview")}
          onBrowseSubjects={() => setScreen("subjects")}
          onViewOverview={() => setScreen("overview")}
          onResumeTest={currentAttemptId ? () => setScreen("test") : undefined}
        />
      )}
      {(screen === "student" || screen === "studentRegister") && (
        <StudentAuth
          key={screen}
          authError={studentAuthError}
          initialMode={screen === "studentRegister" ? "register" : "login"}
          onLogin={loginStudent}
          onRegister={registerStudent}
          onGoogleLogin={() => void continueWithGoogle("student")}
          onBack={() => setScreen(studentSession ? "studentDashboard" : "landing")}
        />
      )}
      {screen === "test" && (
        <TestInterface
          questions={questions}
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
          questions={questions}
          totalMarks={totalMarks}
          aiSummary={aiSummary}
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
      {screen === "admin" && (
        !adminAccount && adminAuthMode === "register" ? (
          <AdminRegistration onRegister={registerAdmin} onBack={() => setAdminAuthMode("login")} />
        ) : adminAccount && adminUnlocked && adminAccount.accessToken ? (
          <AdminDashboard
            adminName={adminAccount.name}
            adminRole={adminAccount.role}
            questions={questions}
            attempts={attempts}
            feedback={feedback}
            onAddQuestion={addQuestion}
            onImportQuestions={importQuestions}
            onReviewFeedback={(id) => {
              if (adminAccount.accessToken) {
                void api.markFeedbackReviewed(id, adminAccount.accessToken).catch(() => undefined);
              }

              setFeedback((current) =>
                current.map((item) => (item.id === id ? { ...item, status: "reviewed" } : item))
              );
            }}
            onSignOut={() => setAdminUnlocked(false)}
            onBack={() => setScreen("landing")}
          />
        ) : (
          <AdminLogin
            adminEmail={adminAccount?.email ?? ""}
            authError={adminAuthError}
            onUnlock={(email, accessCode) => {
              setAdminAuthError("");

              if (adminAccount?.authProvider === "google") {
                const unlocked = email === adminAccount.email && Boolean(adminAccount.accessToken);
                setAdminUnlocked(unlocked);
                return unlocked;
              }

              return api.login({ email, password: accessCode }).then((response) => {
                if (response.user.role !== "admin") return false;

                const nextAccount: AdminAccount = {
                  accessCode: "",
                  role: "Academic Admin",
                  ...adminAccount,
                  name: response.user.fullName,
                  email: response.user.email,
                  accessToken: response.accessToken,
                  authProvider: response.user.authProvider,
                };

                setAdminAccount(nextAccount);
                setAdminUnlocked(true);
                window.localStorage.setItem(adminStorageKey, JSON.stringify(nextAccount));
                return true;
              });
            }}
            onGoogleLogin={() => void continueWithGoogle("admin")}
            onBack={() => {
              clearAdminSession();
              setScreen("landing");
            }}
          />
        )
      )}
      {screen === "comingSoon" && (
        <ComingSoon onAvailable={() => setScreen("overview")} onBack={() => setScreen(comingSoonBackScreen)} />
      )}
    </main>
  );
}
