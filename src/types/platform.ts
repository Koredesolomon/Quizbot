export type Screen =
  | "landing"
  | "programme"
  | "subjects"
  | "courses"
  | "topics"
  | "overview"
  | "test"
  | "marking"
  | "results"
  | "details"
  | "admin"
  | "comingSoon";

export type QuestionType = "objective" | "theory";

export type Question = {
  id: number;
  type: QuestionType;
  topic: string;
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
  marks: number;
  keywords?: string[];
};

export type MarkedQuestion = Question & {
  userAnswer: string;
  awarded: number;
  correct: boolean;
  aiFeedback: string;
};

export type TopicBreakdown = {
  topic: string;
  scored: number;
  available: number;
  weak: number;
  percent: number;
};

export type StudentAttempt = {
  id: string;
  student: string;
  status: "active" | "completed";
  startedAt: string;
  submittedAt?: string;
  answered: number;
  questionCount: number;
  score?: number;
  totalMarks: number;
  percent?: number;
};

export type StudentFeedback = {
  id: string;
  student: string;
  rating: number;
  message: string;
  submittedAt: string;
  status: "new" | "reviewed";
};
