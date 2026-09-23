"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminLogin,
  type AdminAccount,
} from "@/components/admin-dashboard";
import { AdminDashboard, type AdminSection } from "@/components/admin-dashboard-shell";
import { PasswordReset } from "@/components/password-reset";
import { questions as starterQuestions } from "@/data/platform";
import * as api from "@/lib/api";
import type { Question, StudentAttempt, StudentFeedback } from "@/types/platform";

const adminStorageKey = "stem-jupeb-admin-account";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type GoogleAdminCallback =
  | { account: AdminAccount; error?: never }
  | { error: string }
  | null;

function getGoogleAdminCallback(): GoogleAdminCallback {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash;
  if (!hash.includes("adminGoogle=1") && !(hash.includes("authGoogle=1") && hash.includes("role=admin"))) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(1));
  const error = params.get("error");
  if (error) return { error };

  return {
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

function toQuestionPayload(question: Question): Omit<Question, "id"> {
  return {
    type: question.type,
    subject: question.subject,
    topic: question.topic,
    prompt: question.prompt,
    imageUrl: question.imageUrl,
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

function toAdminAttempt(attempt: api.ApiAttempt, questionCount: number): StudentAttempt {
  return {
    id: attempt.id,
    student: attempt.studentName ?? `Student ${attempt.studentId.slice(-4)}`,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    answered: attempt.status === "completed" ? questionCount : 0,
    questionCount,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percent: attempt.percent,
    aiSummary: attempt.aiSummary,
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

export function AdminPortal({ section }: { section: AdminSection }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(starterQuestions);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [feedback, setFeedback] = useState<StudentFeedback[]>([]);
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  const [adminAuthError, setAdminAuthError] = useState("");
  const [passwordResetEmail, setPasswordResetEmail] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadAdminSession = window.setTimeout(() => {
      const googleCallback = getGoogleAdminCallback();
      if (googleCallback?.error) {
        setAdminAuthError(googleCallback.error);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        setSessionReady(true);
        return;
      }

      if (googleCallback && "account" in googleCallback) {
        setAdminAccount(googleCallback.account);
        window.localStorage.setItem(adminStorageKey, JSON.stringify(googleCallback.account));
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        setSessionReady(true);
        return;
      }

      const savedAdmin = window.localStorage.getItem(adminStorageKey);
      if (!savedAdmin) {
        setSessionReady(true);
        return;
      }

      try {
        setAdminAccount(JSON.parse(savedAdmin) as AdminAccount);
      } catch {
        window.localStorage.removeItem(adminStorageKey);
      } finally {
        setSessionReady(true);
      }
    }, 0);

    return () => window.clearTimeout(loadAdminSession);
  }, []);

  useEffect(() => {
    let ignore = false;

    api.getQuestions()
      .then((backendQuestions) => {
        if (ignore) return;
        if (backendQuestions.length > 0) setQuestions(backendQuestions);
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!adminAccount?.accessToken) return;

    let ignore = false;

    Promise.all([api.getAdminAttempts(adminAccount.accessToken), api.getAdminFeedback(adminAccount.accessToken)])
      .then(([backendAttempts, backendFeedback]) => {
        if (ignore) return;
        setAttempts(backendAttempts.map((attempt) => toAdminAttempt(attempt, questions.length)));
        setFeedback(backendFeedback.map(toStudentFeedback));
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, [adminAccount?.accessToken, questions.length]);

  const clearAdminSession = () => {
    setAdminAccount(null);
    setAdminAuthError("");
    window.localStorage.removeItem(adminStorageKey);
  };

  if (!sessionReady) {
    return (
      <section className="admin-shell grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-sm font-black text-slate-600 shadow-sm">
          Loading admin workspace...
        </div>
      </section>
    );
  }

  if (passwordResetEmail !== null) {
    return (
      <PasswordReset
        initialEmail={passwordResetEmail}
        token=""
        onRequestReset={api.forgotPassword}
        onResetPassword={api.resetPassword}
        onBack={() => setPasswordResetEmail(null)}
      />
    );
  }

  if (!adminAccount?.accessToken) {
    return (
      <AdminLogin
        adminEmail={adminAccount?.email ?? ""}
        authError={adminAuthError}
        onUnlock={(identifier, accessCode) => {
          setAdminAuthError("");

          return api.login({ identifier, password: accessCode }).then((response) => {
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
            window.localStorage.setItem(adminStorageKey, JSON.stringify(nextAccount));
            return true;
          });
        }}
        onGoogleLogin={() => router.push(`${apiBaseUrl}/auth/google/admin`)}
        onForgotPassword={(email) => setPasswordResetEmail(email)}
        onBack={() => router.push("/")}
      />
    );
  }

  return (
    <AdminDashboard
      adminName={adminAccount.name}
      adminRole={adminAccount.role}
      section={section}
      questions={questions}
      attempts={attempts}
      feedback={feedback}
      onAddQuestion={async (question) => {
        await api.createQuestion(toQuestionPayload(question), adminAccount.accessToken ?? "");
        setQuestions(await api.getQuestions());
      }}
      onImportQuestions={async (incomingQuestions) => {
        await api.importQuestions(
          incomingQuestions.map((question) => toQuestionPayload(question)),
          adminAccount.accessToken ?? ""
        );
        setQuestions(await api.getQuestions());
      }}
      onReviewFeedback={(id) => {
        void api.markFeedbackReviewed(id, adminAccount.accessToken ?? "").catch(() => undefined);
        setFeedback((current) => current.map((item) => (item.id === id ? { ...item, status: "reviewed" } : item)));
      }}
      onSignOut={clearAdminSession}
      onBack={() => router.push("/")}
    />
  );
}
