import type * as api from "@/lib/api";
import type { StudentFeedback } from "@/types/platform";
import { subjectCatalog, type AdminSection, type ExamOption, type QuestionBankView, type SubjectOption } from "./config";

export function courseOutlineCounts(course: api.CourseContent) {
  const modules = course.modules ?? [];
  const topics = modules.reduce((sum, module) => sum + (module.topics ?? []).length, 0);
  const subtopics = modules.reduce(
    (sum, module) => sum + (module.topics ?? []).reduce((topicSum, topic) => topicSum + (topic.subtopics ?? []).length, 0),
    0
  );
  const quizzes = modules.reduce(
    (sum, module) =>
      sum +
      (module.topics ?? []).reduce(
        (topicSum, topic) =>
          topicSum + (topic.subtopics ?? []).reduce((subtopicSum, subtopic) => subtopicSum + (subtopic.quizzes ?? []).length, 0),
        0
      ),
    0
  );

  return { modules: modules.length, topics, subtopics, quizzes };
}

export function accentClasses(accent: ExamOption["accent"] | SubjectOption["accent"]) {
  return {
    green: {
      card: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50",
      icon: "bg-[#087c22] text-white",
      soft: "bg-[#edf8ef] text-[#087c22]",
    },
    blue: {
      card: "border-[#b8d8ff] bg-gradient-to-br from-white to-[#edf5ff]",
      icon: "bg-[#06479b] text-white",
      soft: "bg-[#edf5ff] text-[#06479b]",
    },
    purple: {
      card: "border-violet-200 bg-gradient-to-br from-white to-violet-50",
      icon: "bg-violet-700 text-white",
      soft: "bg-violet-50 text-violet-700",
    },
    orange: {
      card: "border-orange-200 bg-gradient-to-br from-white to-orange-50",
      icon: "bg-orange-500 text-white",
      soft: "bg-orange-50 text-orange-700",
    },
    rose: {
      card: "border-rose-200 bg-gradient-to-br from-white to-rose-50",
      icon: "bg-rose-500 text-white",
      soft: "bg-rose-50 text-rose-700",
    },
  }[accent];
}

export function estimatedExamQuestions(exam: ExamOption, questionCountsBySubject: Map<string, number>) {
  const actual = subjectCatalog.reduce((sum, subject) => sum + (questionCountsBySubject.get(subject.id) ?? 0), 0);
  const fallback = { ssce: 1420, utme: 980, jupeb: 640, ijmb: 520 }[exam.id] ?? 0;
  return actual || fallback;
}

export function getQuestionPageTitle(view: QuestionBankView, exam: ExamOption, subject: SubjectOption) {
  if (view === "subjects") return exam.title;
  if (view === "bank") return subject.title;
  return "Question Bank";
}

export function getQuestionPageSubtitle(view: QuestionBankView, exam: ExamOption, subject: SubjectOption) {
  if (view === "subjects") return "Choose a subject under the selected exam.";
  if (view === "bank") return `View, search, and manage questions for ${exam.title} - ${subject.title}.`;
  return "Select an examination to manage questions.";
}

export function pageTitle(section: AdminSection) {
  return {
    overview: "Welcome back",
    courses: "Courses",
    questions: "Question Bank",
    reports: "Students",
    feedback: "Feedback",
    settings: "Settings",
  }[section];
}

export function pageSubtitle(section: AdminSection, name: string) {
  return {
    overview: `${name}, here's what's happening with your question bank and students.`,
    courses: "Create courses, modules, topics, and quizzes.",
    questions: "Upload, organise, and manage your questions.",
    reports: "View student progress, responses, and performance.",
    feedback: "Student ratings and comments on learning activity.",
    settings: "Manage platform, question, and account preferences.",
  }[section];
}

export function feedbackRating(feedback: StudentFeedback[]) {
  if (!feedback.length) return "0/5";
  const rating = feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length;
  return `${rating.toFixed(1)}/5`;
}

export function formatDate(value?: string) {
  if (!value) return "Sep 22, 2026";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Admin";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TA";
}

export function slugCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "COURSE";
}
