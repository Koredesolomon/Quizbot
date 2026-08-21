import type { Question } from "@/types/platform";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiOptions = RequestInit & {
  token?: string;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: "admin" | "student";
  authProvider: "password" | "google";
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type ApiAttempt = {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  status: "active" | "completed";
  startedAt: string;
  submittedAt?: string;
  score: number;
  totalMarks: number;
  percent: number;
  aiSummary?: string;
  createdAt: string;
};

export type ApiMarkedAnswer = {
  id: string;
  attemptId: string;
  questionId: string;
  answer: string;
  awarded: number;
  correct: boolean;
  aiFeedback: string;
  createdAt: string;
};

export type SubmitAttemptResponse = {
  attempt: ApiAttempt;
  answers: ApiMarkedAnswer[];
};

export type ApiFeedback = {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  rating: number;
  message: string;
  status: "new" | "reviewed";
  createdAt: string;
};

export type AdminAnalytics = {
  questions: number;
  totalMarks: number;
  attempts: number;
  activeStudents: number;
  completedAttempts: number;
  averageScore: number;
  unreadFeedback: number;
  watchlist: ApiAttempt[];
};

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${apiBaseUrl}. Start it with npm run dev:all or npm run backend:dev.`);
  }

  if (!response.ok) {
    const message = await response
      .json()
      .then((body) => String(body.message ?? body.error ?? "API request failed."))
      .catch(() => "API request failed.");

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function registerAdmin(input: { fullName: string; email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/register-admin", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function registerStudent(input: { fullName: string; email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/register-student", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getQuestions() {
  return apiRequest<Question[]>("/questions");
}

export function createQuestion(question: Omit<Question, "id">, token: string) {
  return apiRequest<Question>("/questions", {
    method: "POST",
    token,
    body: JSON.stringify(question),
  });
}

export function importQuestions(questions: Omit<Question, "id">[], token: string) {
  return apiRequest<Question[]>("/questions/import", {
    method: "POST",
    token,
    body: JSON.stringify({ questions }),
  });
}

export function startAttempt(token: string) {
  return apiRequest<ApiAttempt>("/attempts/start", {
    method: "POST",
    token,
  });
}

export function submitAttempt(attemptId: string, answers: Record<string, string>, token: string) {
  return apiRequest<SubmitAttemptResponse>(`/attempts/${attemptId}/submit`, {
    method: "POST",
    token,
    body: JSON.stringify({
      answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
    }),
  });
}

export function getMyAttempts(token: string) {
  return apiRequest<ApiAttempt[]>("/attempts/me", { token });
}

export function submitFeedback(input: { message: string; rating: number }, token: string) {
  return apiRequest<ApiFeedback>("/feedback", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function getAdminAnalytics(token: string) {
  return apiRequest<AdminAnalytics>("/admin/analytics", { token });
}

export function getAdminAttempts(token: string) {
  return apiRequest<ApiAttempt[]>("/admin/attempts", { token });
}

export function getAdminFeedback(token: string) {
  return apiRequest<ApiFeedback[]>("/admin/feedback", { token });
}

export function markFeedbackReviewed(id: string, token: string) {
  return apiRequest<ApiFeedback>(`/admin/feedback/${id}/reviewed`, {
    method: "PATCH",
    token,
  });
}
