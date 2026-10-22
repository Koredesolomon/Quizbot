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
  passingPercent: 50,
};

/** courses: course cards · course: one course grouped by quiz · quiz: one quiz · unassigned: questions in no course */
export type QuestionBankView = "courses" | "course" | "quiz" | "unassigned";
export type SubjectOption = {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: "green" | "blue" | "purple" | "orange" | "rose";
};

export const subjectCatalog: SubjectOption[] = [
  { id: "Mathematics", title: "Mathematics", icon: Calculator, accent: "green" },
  { id: "English Language", title: "English Language", icon: BookOpen, accent: "rose" },
  { id: "Physics", title: "Physics", icon: Atom, accent: "purple" },
  { id: "Chemistry", title: "Chemistry", icon: FlaskConical, accent: "orange" },
  { id: "Biology", title: "Biology", icon: BookOpen, accent: "green" },
];
