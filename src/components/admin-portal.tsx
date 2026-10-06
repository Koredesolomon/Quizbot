"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminLogin,
  type AdminAccount,
} from "@/components/admin-dashboard";
import { AdminDashboard, type AdminSection, type CourseBuilderStep } from "@/components/admin-dashboard-shell";
import { PasswordReset } from "@/components/password-reset";
import * as api from "@/lib/api";
import { questionInput } from "@/lib/question-editor";
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

export function AdminPortal({ section, courseStep = "courses" }: { section: AdminSection; courseStep?: CourseBuilderStep }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsLoadError, setQuestionsLoadError] = useState("");
  const [courses, setCourses] = useState<api.CourseContent[]>([]);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [feedback, setFeedback] = useState<StudentFeedback[]>([]);
  const [adminAccount, setAdminAccount] = useState<AdminAccount | null>(null);
  const [adminAuthError, setAdminAuthError] = useState("");
  const [passwordResetEmail, setPasswordResetEmail] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [coursesLoadedToken, setCoursesLoadedToken] = useState<string | null>(null);
  const [coursesLoadError, setCoursesLoadError] = useState("");
  const [loadRevision, setLoadRevision] = useState(0);

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

    api
      .getQuestions()
      .then((backendQuestions) => {
        if (ignore) return;
        setQuestions(backendQuestions);
        setQuestionsLoadError("");
        setQuestionsLoaded(true);
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setQuestionsLoadError(error instanceof Error ? error.message : "Could not load admin questions.");
        setQuestionsLoaded(true);
      });

    return () => {
      ignore = true;
    };
  }, [loadRevision]);

  useEffect(() => {
    if (!adminAccount?.accessToken) return;

    let ignore = false;

    const token = adminAccount.accessToken;
    void Promise.allSettled([
      api.getAdminAttempts(token),
      api.getAdminFeedback(token),
    ]).then(([backendAttempts, backendFeedback]) => {
      if (ignore) return;
      if (backendAttempts.status === "fulfilled") {
        setAttempts(backendAttempts.value.map((attempt) => toAdminAttempt(attempt, questions.length)));
      }
      if (backendFeedback.status === "fulfilled") {
        setFeedback(backendFeedback.value.map(toStudentFeedback));
      }
    });

    void api.getAdminCourses(token).then((backendCourses) => {
      if (ignore) return;
      setCourses(backendCourses);
      setCoursesLoadError("");
      setCoursesLoadedToken(token);
    }).catch((error: unknown) => {
      if (ignore) return;
      const message = error instanceof Error ? error.message : "Could not load admin courses.";
      if (/unauthorized/i.test(message)) {
        setAdminAccount(null);
        window.localStorage.removeItem(adminStorageKey);
        setAdminAuthError("Admin session expired. Please sign in again.");
      } else {
        setCoursesLoadError(message);
      }
      setCoursesLoadedToken(token);
    });

    return () => {
      ignore = true;
    };
  }, [adminAccount?.accessToken, questions.length, loadRevision]);

  const clearAdminSession = () => {
    setAdminAccount(null);
    setAdminAuthError("");
    setCourses([]);
    setCoursesLoadedToken(null);
    setCoursesLoadError("");
    window.localStorage.removeItem(adminStorageKey);
  };

  const handleAdminRequestError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Admin request failed.";
    if (/unauthorized/i.test(message)) {
      clearAdminSession();
      return new Error("Admin session expired. Sign in again before saving.");
    }

    return error instanceof Error ? error : new Error(message);
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

  if (coursesLoadedToken !== adminAccount.accessToken || !questionsLoaded || coursesLoadError || questionsLoadError) {
    return (
      <section className="admin-shell grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-950">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-5 text-sm font-black text-slate-600 shadow-sm" role="status">
          {coursesLoadedToken !== adminAccount.accessToken || !questionsLoaded ? "Loading admin content..." : (
            <>
              <p>{coursesLoadError || questionsLoadError}</p>
              <button
                type="button"
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
                onClick={() => {
                  setCoursesLoadedToken(null);
                  setCoursesLoadError("");
                  setQuestionsLoaded(false);
                  setQuestionsLoadError("");
                  setLoadRevision((current) => current + 1);
                }}
              >
                Retry
              </button>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <AdminDashboard
      adminName={adminAccount.name}
      adminRole={adminAccount.role}
      section={section}
      courseStep={courseStep}
      courses={courses}
      questions={questions}
      attempts={attempts}
      feedback={feedback}
      onCreateCourse={async (input) => {
        try {
          const createdCourse = await api.createCourse(input, adminAccount.accessToken ?? "");
          setCourses(await api.getAdminCourses(adminAccount.accessToken ?? ""));
          return createdCourse;
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onUpdateCourse={async (courseId, input) => {
        try {
          const updatedCourse = await api.updateCourse(courseId, input, adminAccount.accessToken ?? "");
          setCourses(await api.getAdminCourses(adminAccount.accessToken ?? ""));
          return updatedCourse;
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onDeleteCourse={async (courseId) => {
        try {
          await api.deleteCourse(courseId, adminAccount.accessToken ?? "");
          setCourses(await api.getAdminCourses(adminAccount.accessToken ?? ""));
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onEditStructure={async (courseId, input) => {
        try {
          const updated = await api.editCourseStructure(courseId, input, adminAccount.accessToken ?? "");
          setCourses((current) => current.map((course) => course.id === courseId ? updated : course));
        } catch (error) { throw handleAdminRequestError(error); }
      }}
      onReorderModules={async (courseId, ids) => {
        try {
          const updated = await api.reorderCourseModules(courseId, ids, adminAccount.accessToken ?? "");
          setCourses((current) => current.map((course) => course.id === courseId ? updated : course));
        } catch (error) { throw handleAdminRequestError(error); }
      }}
      onAddModule={async (courseId, input) => {
        try {
          await api.addModule(courseId, input, adminAccount.accessToken ?? "");
          setCourses(await api.getAdminCourses(adminAccount.accessToken ?? ""));
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onAddTopic={async (courseId, moduleId, input) => {
        try {
          await api.addTopic(courseId, moduleId, input, adminAccount.accessToken ?? "");
          setCourses(await api.getAdminCourses(adminAccount.accessToken ?? ""));
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onAddSubtopic={async (courseId, moduleId, topicId, input) => {
        try {
          await api.addSubtopic(courseId, moduleId, topicId, input, adminAccount.accessToken ?? "");
          setCourses(await api.getAdminCourses(adminAccount.accessToken ?? ""));
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onAddQuiz={async (courseId, moduleId, topicId, subtopicId, input) => {
        try {
          const updatedCourse = await api.addQuiz(courseId, moduleId, topicId, subtopicId, input, adminAccount.accessToken ?? "");
          setCourses((current) => current.map((course) => course.id === courseId ? updatedCourse : course));
          return updatedCourse;
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onAddQuestion={async (question) => {
        try {
          const saved = await api.createQuestion(questionInput(question), adminAccount.accessToken ?? "");
          setQuestions((current) => [...current, saved]);
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onUpdateQuestion={async (id, question) => {
        try {
          const saved = await api.updateQuestion(id, questionInput(question), adminAccount.accessToken ?? "");
          setQuestions((current) => current.map((item) => item.id === id ? saved : item));
        } catch (error) {
          throw handleAdminRequestError(error);
        }
      }}
      onImportQuestions={async (incomingQuestions) => {
        try {
          const saved = await api.importQuestions(
            incomingQuestions.map((question) => questionInput(question)),
            adminAccount.accessToken ?? ""
          );
          setQuestions((current) => [...current, ...saved]);
        } catch (error) {
          throw handleAdminRequestError(error);
        }
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
