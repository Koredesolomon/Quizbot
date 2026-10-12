export type Screen =
  | "landing"
  | "howItWorks"
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
  | "passwordReset"
  | "comingSoon";

/** objective: one correct option · multiple: MCQ with one or more correct options · theory: written answer */
export type QuestionType = "objective" | "multiple" | "theory";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export type Question = {
  id: string;
  type: QuestionType;
  subject?: string;
  courseId?: string;
  moduleId?: string;
  subtopicId?: string;
  quizId?: string;
  topic: string;
  prompt: string;
  imageUrl?: string;
  options?: string[];
  /** Objective/MCQ only: also show an answer box for the student to explain their choice. */
  answerBox?: boolean;
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

export type QuizQuestion = Omit<Question, "answer" | "explanation" | "rubricPoints" | "commonMistakes" | "keywords">;

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
