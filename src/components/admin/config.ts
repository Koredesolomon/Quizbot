import { Atom, BookOpen, Calculator, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminSection = "overview" | "courses" | "questions" | "reports" | "feedback" | "settings";
export type CourseBuilderStep = "overview" | "courses" | "modules" | "topics" | "subtopics" | "quizzes";

export const sectionPaths: Record<AdminSection, string> = {
  overview: "/admin",
  courses: "/admin/courses",
  questions: "/admin/questions",
  reports: "/admin/reports",
  feedback: "/admin/feedback",
  settings: "/admin/settings",
};

export const courseStepPaths: Record<CourseBuilderStep, string> = {
  overview: "/admin/courses/create",
  courses: "/admin/courses",
  modules: "/admin/courses/modules",
  topics: "/admin/courses/topics",
  subtopics: "/admin/courses/subtopics",
  quizzes: "/admin/courses/quizzes",
};

export const courseBuilderStorageKey = "tlchub-admin-course-builder-selection";

export function savedCourseBuilderSelection() {
  if (typeof window === "undefined") {
    return { courseId: "", moduleId: "", topicId: "", subtopicId: "" };
  }

  try {
    const savedSelection = JSON.parse(window.localStorage.getItem(courseBuilderStorageKey) ?? "{}") as {
      courseId?: string;
      moduleId?: string;
      topicId?: string;
      subtopicId?: string;
    };

    return {
      courseId: savedSelection.courseId ?? "",
      moduleId: savedSelection.moduleId ?? "",
      topicId: savedSelection.topicId ?? "",
      subtopicId: savedSelection.subtopicId ?? "",
    };
  } catch {
    window.localStorage.removeItem(courseBuilderStorageKey);
    return { courseId: "", moduleId: "", topicId: "", subtopicId: "" };
  }
}

export const emptyCourseForm = {
  title: "",
  code: "",
  subject: "Physics",
  description: "",
  status: "draft" as "draft" | "published",
};

export const emptyModuleForm = {
  title: "",
  description: "",
};

export const emptyTopicForm = {
  title: "",
  description: "",
};

export const emptySubtopicForm = {
  title: "",
  description: "",
};

export const emptyQuizForm = {
  title: "",
  description: "",
  timeLimitMinutes: 10,
  attemptsAllowed: 1,
  passingPercent: 50,
};

export type QuestionBankView = "exams" | "subjects" | "bank";
export type ExamOption = {
  id: string;
  title: string;
  description: string;
  subjects: number;
  accent: "green" | "blue" | "purple" | "orange";
};
export type SubjectOption = {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: "green" | "blue" | "purple" | "orange" | "rose";
};

export const examOptions: ExamOption[] = [
  { id: "ssce", title: "SSCE", description: "Senior School Certificate Examination", subjects: 4, accent: "green" },
  { id: "utme", title: "UTME", description: "Unified Tertiary Matriculation Examination", subjects: 4, accent: "blue" },
  { id: "jupeb", title: "JUPEB", description: "Joint Universities Preliminary Examinations Board", subjects: 3, accent: "purple" },
  { id: "ijmb", title: "IJMB", description: "Interim Joint Matriculation Board", subjects: 3, accent: "orange" },
];
export const subjectCatalog: SubjectOption[] = [
  { id: "Mathematics", title: "Mathematics", icon: Calculator, accent: "green" },
  { id: "English Language", title: "English Language", icon: BookOpen, accent: "rose" },
  { id: "Physics", title: "Physics", icon: Atom, accent: "purple" },
  { id: "Chemistry", title: "Chemistry", icon: FlaskConical, accent: "orange" },
  { id: "Biology", title: "Biology", icon: BookOpen, accent: "green" },
];
