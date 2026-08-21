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
  | "student"
  | "studentRegister"
  | "studentDashboard"
  | "admin"
  | "comingSoon";

export type QuestionType = "objective" | "theory";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export type Question = {
  id: string;
  type: QuestionType;
  topic: string;
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
  marks: number;
  difficulty?: QuestionDifficulty;
  learningObjective?: string;
  rubricPoints?: string[];
  commonMistakes?: string[];
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
  aiSummary?: string;
};

export type StudentFeedback = {
  id: string;
  student: string;
  rating: number;
  message: string;
  submittedAt: string;
  status: "new" | "reviewed";
};
