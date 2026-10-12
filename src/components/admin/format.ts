import type * as api from "@/lib/api";
import type { StudentFeedback } from "@/types/platform";
import type { AdminSection, QuestionBankView } from "./config";

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

export function getQuestionPageTitle(view: QuestionBankView, course?: { title: string }, quizLabel?: string) {
  if (view === "course" && course) return course.title;
  if (view === "quiz" && quizLabel) return quizLabel.split(" / ").pop() ?? "Quiz";
  if (view === "unassigned") return "Unassigned";
  return "Question Bank";
}

export function getQuestionPageSubtitle(view: QuestionBankView, course?: { code: string; subject: string }, quizLabel?: string) {
  if (view === "course" && course) return `${course.code} · ${course.subject} — every question in this course, grouped by module, topic, subtopic and quiz.`;
  if (view === "quiz" && quizLabel) return quizLabel;
  if (view === "unassigned") return "Questions that are not in any course. Edit a question to assign it to a quiz.";
  return "Questions grouped by the course they belong to.";
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
