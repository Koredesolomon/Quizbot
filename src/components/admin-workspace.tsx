"use client";

import { usePathname } from "next/navigation";
import { AdminPortal } from "@/components/admin-portal";
import type { AdminSection, CourseBuilderStep } from "@/components/admin-dashboard-shell";

const sections: Record<string, AdminSection> = {
  courses: "courses",
  questions: "questions",
  reports: "reports",
  feedback: "feedback",
  settings: "settings",
};

const courseSteps: Record<string, CourseBuilderStep> = {
  create: "overview",
  modules: "modules",
  topics: "topics",
  subtopics: "subtopics",
  quizzes: "quizzes",
};

export function AdminWorkspace() {
  const pathname = usePathname();
  const [, , sectionPath, stepPath] = pathname.split("/");

  return (
    <AdminPortal
      section={sections[sectionPath] ?? "overview"}
      courseStep={courseSteps[stepPath] ?? "courses"}
    />
  );
}
