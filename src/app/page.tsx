"use client";

import { useEffect, useMemo, useState } from "react";
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
import { TestInterface } from "@/components/test-interface";
import { Workflow } from "@/components/workflow";
import { questions as starterQuestions } from "@/data/platform";
import { getTopicBreakdown, markResponses } from "@/lib/marker";
import type { MarkedQuestion, Question, Screen, StudentAttempt, StudentFeedback } from "@/types/platform";

const studentName = "Practice Student";
const adminStorageKey = "stem-jupeb-admin-account";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getGoogleAdminCallbackAccount(): AdminAccount | null {
  if (typeof window === "undefined" || !window.location.hash.includes("adminGoogle=1")) return null;

  const params = new URLSearchParams(window.location.hash.slice(1));
  if (params.get("error")) return null;

  return {
    name: params.get("name") ?? "Google Admin",
    email: params.get("email") ?? "",
    role: "Academic Admin",
    accessCode: "",
    accessToken: params.get("accessToken") ?? undefined,
    authProvider: "google",
  };
}

const seedAttempts: StudentAttempt[] = [
  {
    id: "attempt-1",
    student: "Amaka Obi",
    status: "completed",
    startedAt: "2026-07-18T08:12:00.000Z",
    submittedAt: "2026-07-18T08:39:00.000Z",
    answered: 10,
    questionCount: 10,
    score: 22,
    totalMarks: 26,
    percent: 85,
  },
  {
    id: "attempt-2",
    student: "David Musa",
    status: "completed",
    startedAt: "2026-07-18T09:05:00.000Z",
    submittedAt: "2026-07-18T09:35:00.000Z",
    answered: 8,
    questionCount: 10,
    score: 12,
    totalMarks: 26,
    percent: 46,
  },
];

const seedFeedback: StudentFeedback[] = [
  {
    id: "feedback-1",
    student: "Amaka Obi",
    rating: 4,
    message: "The explanations after marking helped me understand dimensional analysis better.",
    submittedAt: "2026-07-18T08:42:00.000Z",
    status: "new",
  },
  {
    id: "feedback-2",
    student: "David Musa",
    rating: 3,
    message: "Please add a timer and show the correct formulas before retrying the test.",
    submittedAt: "2026-07-18T09:38:00.000Z",
    status: "reviewed",
  },
];

export default function Home() {
  const [googleAdminCallbackAccount] = useState(getGoogleAdminCallbackAccount);
  const [screen, setScreen] = useState<Screen>(googleAdminCallbackAccount ? "admin" : "landing");
  const [questions, setQuestions] = useState<Question[]>(starterQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [marked, setMarked] = useState<MarkedQuestion[]>([]);
  const [selectedDetail, setSelectedDetail] = useState(0);
  const [attempts, setAttempts] = useState<StudentAttempt[]>(seedAttempts);
  const [feedback, setFeedback] = useState<StudentFeedback[]>(seedFeedback);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(() => {
    if (typeof window === "undefined") return null;

    if (googleAdminCallbackAccount) return googleAdminCallbackAccount;

    const savedAdmin = window.localStorage.getItem(adminStorageKey);
    if (!savedAdmin) return null;

    try {
      return JSON.parse(savedAdmin) as AdminAccount;
    } catch {
      window.localStorage.removeItem(adminStorageKey);
      return null;
    }
  });
  const [adminUnlocked, setAdminUnlocked] = useState(Boolean(googleAdminCallbackAccount));
  const [comingSoonBackScreen, setComingSoonBackScreen] = useState<Screen>("subjects");

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash.includes("adminGoogle=1")) return;

    if (googleAdminCallbackAccount) {
      window.localStorage.setItem(adminStorageKey, JSON.stringify(googleAdminCallbackAccount));
    }

    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [googleAdminCallbackAccount]);

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const totalMarks = useMemo(() => questions.reduce((sum, question) => sum + question.marks, 0), [questions]);
  const score = marked.reduce((sum, question) => sum + question.awarded, 0);
  const percent = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
  const topicBreakdown = useMemo(() => getTopicBreakdown(marked), [marked]);

  const startMarking = () => {
    setScreen("marking");
    window.setTimeout(() => {
      const markedResponses = markResponses(answers, questions);
      const finalScore = markedResponses.reduce((sum, question) => sum + question.awarded, 0);
      const finalPercent = totalMarks ? Math.round((finalScore / totalMarks) * 100) : 0;

      setMarked(markedResponses);
      setAttempts((current) =>
        current.map((attempt) =>
          attempt.id === currentAttemptId
            ? {
                ...attempt,
                status: "completed",
                submittedAt: new Date().toISOString(),
                answered: Object.values(answers).filter(Boolean).length,
                score: finalScore,
                totalMarks,
                percent: finalPercent,
              }
            : attempt
        )
      );
      setSelectedDetail(0);
      setScreen("results");
    }, 1100);
  };

  const startTest = () => {
    const attemptId = `attempt-${Date.now()}`;
    setCurrentAttemptId(attemptId);
    setAnswers({});
    setMarked([]);
    setSelectedDetail(0);
    setAttempts((current) => [
      {
        id: attemptId,
        student: studentName,
        status: "active",
        startedAt: new Date().toISOString(),
        answered: 0,
        questionCount: questions.length,
        totalMarks,
      },
      ...current,
    ]);
    setCurrentQuestion(0);
    setScreen("test");
  };

  const resetTest = () => {
    setAnswers({});
    setMarked([]);
    setCurrentQuestion(0);
    setSelectedDetail(0);
    setCurrentAttemptId(null);
    setScreen("overview");
  };

  const updateAnswer = (id: number, value: string) => {
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

  const addQuestion = (question: Question) => {
    setQuestions((current) => [...current, question]);
  };

  const importQuestions = (incomingQuestions: Question[]) => {
    setQuestions(incomingQuestions);
    setAnswers({});
    setMarked([]);
    setCurrentQuestion(0);
  };

  const submitFeedback = (message: string, rating: number) => {
    setFeedback((current) => [
      {
        id: `feedback-${Date.now()}`,
        student: studentName,
        rating,
        message,
        submittedAt: new Date().toISOString(),
        status: "new",
      },
      ...current,
    ]);
  };

  const registerAdmin = (account: AdminAccount) => {
    setAdminAccount(account);
    setAdminUnlocked(true);
    window.localStorage.setItem(adminStorageKey, JSON.stringify(account));
    return true;
  };

  const showComingSoon = (backScreen: Screen) => {
    setComingSoonBackScreen(backScreen);
    setScreen("comingSoon");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Header onNavigate={setScreen} />

      {screen === "landing" && (
        <Landing
          onStart={() => setScreen("programme")}
          onHowItWorks={() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })}
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
        !adminAccount ? (
          <AdminRegistration onRegister={registerAdmin} onBack={() => setScreen("overview")} />
        ) : adminUnlocked ? (
          <AdminDashboard
            adminName={adminAccount.name}
            adminRole={adminAccount.role}
            questions={questions}
            attempts={attempts}
            feedback={feedback}
            onAddQuestion={addQuestion}
            onImportQuestions={importQuestions}
            onReviewFeedback={(id) =>
              setFeedback((current) =>
                current.map((item) => (item.id === id ? { ...item, status: "reviewed" } : item))
              )
            }
            onSignOut={() => setAdminUnlocked(false)}
            onBack={() => setScreen("overview")}
          />
        ) : (
          <AdminLogin
            adminEmail={adminAccount.email}
            onUnlock={(email, accessCode) => {
              const unlocked =
                adminAccount.authProvider === "google"
                  ? email === adminAccount.email
                  : email === adminAccount.email && accessCode === adminAccount.accessCode;
              setAdminUnlocked(unlocked);
              return unlocked;
            }}
            onGoogleLogin={() => {
              window.location.href = `${apiBaseUrl}/auth/google/admin`;
            }}
            onBack={() => setScreen("overview")}
          />
        )
      )}
      {screen === "comingSoon" && (
        <ComingSoon onAvailable={() => setScreen("overview")} onBack={() => setScreen(comingSoonBackScreen)} />
      )}

      <Workflow />
    </main>
  );
}
