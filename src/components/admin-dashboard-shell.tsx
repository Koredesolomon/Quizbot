"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Bell,
  BookOpen,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileQuestion,
  FlaskConical,
  Gauge,
  GraduationCap,
  GripVertical,
  LayoutDashboard,
  LogOut,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type * as api from "@/lib/api";
import { parseQuestionImportFile } from "@/lib/question-import";
import { quizQuestionContexts, questionInput, type QuestionInput, type QuizQuestionContext } from "@/lib/question-editor";
import { QuestionManager } from "./question-manager";
import type { Question, StudentAttempt, StudentFeedback } from "@/types/platform";
import { CourseStructure } from "./course-structure";
import { PrimaryButton, SecondaryButton, StatusBadge } from "./ui";

export type AdminSection = "overview" | "courses" | "questions" | "reports" | "feedback" | "settings";
export type CourseBuilderStep = "overview" | "courses" | "modules" | "topics" | "subtopics" | "quizzes";

const sectionPaths: Record<AdminSection, string> = {
  overview: "/admin",
  courses: "/admin/courses",
  questions: "/admin/questions",
  reports: "/admin/reports",
  feedback: "/admin/feedback",
  settings: "/admin/settings",
};

const courseStepPaths: Record<CourseBuilderStep, string> = {
  overview: "/admin/courses/create",
  courses: "/admin/courses",
  modules: "/admin/courses/modules",
  topics: "/admin/courses/topics",
  subtopics: "/admin/courses/subtopics",
  quizzes: "/admin/courses/quizzes",
};

const courseBuilderStorageKey = "tlchub-admin-course-builder-selection";

function savedCourseBuilderSelection() {
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

const emptyCourseForm = {
  title: "",
  code: "",
  subject: "Physics",
  description: "",
  status: "draft" as "draft" | "published",
};

const emptyModuleForm = {
  title: "",
  description: "",
};

const emptyTopicForm = {
  title: "",
  description: "",
};

const emptySubtopicForm = {
  title: "",
  description: "",
};

const emptyQuizForm = {
  title: "",
  description: "",
  timeLimitMinutes: 10,
  attemptsAllowed: 1,
  passingPercent: 50,
};

type QuestionBankView = "exams" | "subjects" | "bank";
type ExamOption = {
  id: string;
  title: string;
  description: string;
  subjects: number;
  accent: "green" | "blue" | "purple" | "orange";
};
type SubjectOption = {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: "green" | "blue" | "purple" | "orange" | "rose";
};

const examOptions: ExamOption[] = [
  { id: "ssce", title: "SSCE", description: "Senior School Certificate Examination", subjects: 4, accent: "green" },
  { id: "utme", title: "UTME", description: "Unified Tertiary Matriculation Examination", subjects: 4, accent: "blue" },
  { id: "jupeb", title: "JUPEB", description: "Joint Universities Preliminary Examinations Board", subjects: 3, accent: "purple" },
  { id: "ijmb", title: "IJMB", description: "Interim Joint Matriculation Board", subjects: 3, accent: "orange" },
];
const subjectCatalog: SubjectOption[] = [
  { id: "Mathematics", title: "Mathematics", icon: Calculator, accent: "green" },
  { id: "English Language", title: "English Language", icon: BookOpen, accent: "rose" },
  { id: "Physics", title: "Physics", icon: Atom, accent: "purple" },
  { id: "Chemistry", title: "Chemistry", icon: FlaskConical, accent: "orange" },
  { id: "Biology", title: "Biology", icon: BookOpen, accent: "green" },
];

export function AdminDashboard({
  adminName = "TLCHub Admin",
  adminRole = "Instructor",
  section = "overview",
  courseStep = "overview",
  courses,
  questions,
  attempts,
  feedback,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onEditStructure,
  onReorderModules,
  onAddModule,
  onAddTopic,
  onAddSubtopic,
  onAddQuiz,
  onAddQuestion,
  onUpdateQuestion,
  onImportQuestions,
  onReviewFeedback,
  onSignOut,
  onBack,
}: {
  adminName?: string;
  adminRole?: string;
  section?: AdminSection;
  courseStep?: CourseBuilderStep;
  courses: api.CourseContent[];
  questions: Question[];
  attempts: StudentAttempt[];
  feedback: StudentFeedback[];
  onCreateCourse: (input: {
    title: string;
    code: string;
    subject: string;
    description?: string;
    status?: "draft" | "published";
  }) => api.CourseContent | void | Promise<api.CourseContent | void>;
  onUpdateCourse: (
    courseId: string,
    input: { title?: string; code?: string; subject?: string; description?: string; status?: "draft" | "published" }
  ) => api.CourseContent | void | Promise<api.CourseContent | void>;
  onDeleteCourse: (courseId: string) => void | Promise<void>;
  onEditStructure: (courseId: string, input: api.StructureEdit) => Promise<void>;
  onReorderModules: (courseId: string, ids: string[]) => Promise<void>;
  onAddModule: (courseId: string, input: { title: string; description?: string }) => void | Promise<void>;
  onAddTopic: (courseId: string, moduleId: string, input: { title: string; description?: string }) => void | Promise<void>;
  onAddSubtopic: (courseId: string, moduleId: string, topicId: string, input: { title: string; description?: string }) => void | Promise<void>;
  onAddQuiz: (
    courseId: string,
    moduleId: string,
    topicId: string,
    subtopicId: string,
    input: { title: string; description?: string; timeLimitMinutes: number; attemptsAllowed: number; passingPercent: number }
  ) => api.CourseContent | void | Promise<api.CourseContent | void>;
  onAddQuestion: (question: QuestionInput) => Promise<void>;
  onUpdateQuestion: (id: string, question: QuestionInput) => Promise<void>;
  onImportQuestions: (questions: QuestionInput[]) => Promise<void>;
  onReviewFeedback: (id: string) => void;
  onSignOut: () => void;
  onBack: () => void;
}) {
  const router = useRouter();
  const initialCourseSelection = useMemo(() => savedCourseBuilderSelection(), []);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [topicForm, setTopicForm] = useState(emptyTopicForm);
  const [subtopicForm, setSubtopicForm] = useState(emptySubtopicForm);
  const [quizForm, setQuizForm] = useState(emptyQuizForm);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseSelection.courseId);
  const [selectedModuleId, setSelectedModuleId] = useState(initialCourseSelection.moduleId);
  const [selectedTopicId, setSelectedTopicId] = useState(initialCourseSelection.topicId);
  const [selectedSubtopicId, setSelectedSubtopicId] = useState(initialCourseSelection.subtopicId);
  const [managedQuiz, setManagedQuiz] = useState<QuizQuestionContext | null>(null);
  const [questionBankView, setQuestionBankView] = useState<QuestionBankView>("exams");
  const [selectedExamId, setSelectedExamId] = useState(examOptions[0].id);
  const [selectedSubjectId, setSelectedSubjectId] = useState("Physics");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [message, setMessage] = useState("");

  const completedAttempts = attempts.filter((attempt) => attempt.status === "completed");
  const activeAttempts = attempts.filter((attempt) => attempt.status === "active");
  const averageScore = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum, attempt) => sum + (attempt.percent ?? 0), 0) / completedAttempts.length)
    : 0;
  const totalStudents = new Set(attempts.map((attempt) => attempt.student)).size;
  const completionRate = attempts.length ? Math.round((completedAttempts.length / attempts.length) * 100) : 0;
  const unreadFeedback = feedback.filter((item) => item.status === "new").length;
  const moduleCount = courses.reduce((sum, course) => sum + (course.modules ?? []).length, 0);
  const activeCourseId = selectedCourseId || courses[0]?.id || "";
  const activeCourse = (courses ?? []).find((course) => course.id === activeCourseId) ?? courses[0];
  const activeModuleId = selectedModuleId || activeCourse?.modules?.[0]?.id || "";
  const activeModule = (activeCourse?.modules ?? []).find((module) => module.id === activeModuleId) ?? activeCourse?.modules?.[0];
  const activeTopicId = selectedTopicId || activeModule?.topics?.[0]?.id || "";
  const activeTopic = (activeModule?.topics ?? []).find((topic) => topic.id === activeTopicId) ?? activeModule?.topics?.[0];
  const activeSubtopicId = selectedSubtopicId || activeTopic?.subtopics?.[0]?.id || "";
  const activeSubtopic = (activeTopic?.subtopics ?? []).find((subtopic) => subtopic.id === activeSubtopicId) ?? activeTopic?.subtopics?.[0];

  const topicRows = useMemo(() => {
    const groups = new Map<string, { count: number; subject: string; difficulty: NonNullable<Question["difficulty"]> }>();
    questions.forEach((question) => {
      const current = groups.get(question.topic);
      groups.set(question.topic, {
        count: (current?.count ?? 0) + 1,
        subject: current?.subject ?? question.subject ?? "Physics",
        difficulty: current?.difficulty ?? question.difficulty ?? "medium",
      });
    });
    return Array.from(groups.entries()).map(([topic, value]) => ({ topic, ...value }));
  }, [questions]);
  const questionCountsBySubject = useMemo(() => {
    const groups = new Map<string, number>();
    questions.forEach((question) => groups.set(question.subject ?? "Physics", (groups.get(question.subject ?? "Physics") ?? 0) + 1));
    return groups;
  }, [questions]);
  const selectedExam = (examOptions ?? []).find((exam) => exam.id === selectedExamId) ?? examOptions[0];
  const selectedSubject = (subjectCatalog ?? []).find((subject) => subject.id === selectedSubjectId) ?? subjectCatalog[2];
  const selectedSubjectQuestions = questions.filter((question) => (question.subject ?? "Physics") === selectedSubject.id);
  const questionPageTitle = getQuestionPageTitle(questionBankView, selectedExam, selectedSubject);
  const questionPageSubtitle = getQuestionPageSubtitle(questionBankView, selectedExam, selectedSubject);

  const openSection = (target: AdminSection) => {
    setIsProfileOpen(false);
    router.push(sectionPaths[target]);
  };

  const openCourseStep = (step: CourseBuilderStep) => {
    setIsProfileOpen(false);
    router.push(courseStepPaths[step]);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      courseBuilderStorageKey,
      JSON.stringify({
        courseId: selectedCourseId,
        moduleId: selectedModuleId,
        topicId: selectedTopicId,
        subtopicId: selectedSubtopicId,
      })
    );
  }, [selectedCourseId, selectedModuleId, selectedSubtopicId, selectedTopicId]);

  const chooseExam = (examId: string) => {
    setSelectedExamId(examId);
    setQuestionBankView("subjects");
  };

  const chooseSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setQuestionBankView("bank");
  };

  const manageQuiz = (moduleId: string, topicId: string, subtopicId: string, quizId: string) => {
    const context = quizQuestionContexts(courses).find((quiz) => quiz.courseId === activeCourseId && quiz.quizId === quizId);
    if (!context) { setMessage("Quiz was not found. Refresh and try again."); return; }
    setSelectedModuleId(moduleId);
    setSelectedTopicId(topicId);
    setSelectedSubtopicId(subtopicId);
    setManagedQuiz(context);
    setMessage("");
  };

  const createQuiz = async (): Promise<QuizQuestionContext> => {
    if (!activeCourseId || !activeModuleId || !activeTopicId || !activeSubtopicId || !activeCourse) {
      throw new Error("Create or select a subtopic before creating a quiz.");
    }
    if (!quizForm.title.trim()) throw new Error("Enter a quiz title.");
    const existingQuizIds = new Set(activeSubtopic?.quizzes.map((quiz) => quiz.id) ?? []);
    const updatedCourse = await onAddQuiz(activeCourseId, activeModuleId, activeTopicId, activeSubtopicId, {
      title: quizForm.title.trim(),
      description: quizForm.description.trim() || undefined,
      timeLimitMinutes: Math.max(1, Number(quizForm.timeLimitMinutes) || 1),
      attemptsAllowed: Math.max(1, Number(quizForm.attemptsAllowed) || 1),
      passingPercent: Math.min(100, Math.max(0, Number(quizForm.passingPercent) || 0)),
    });
    const created = updatedCourse && quizQuestionContexts([updatedCourse]).find((quiz) =>
      quiz.moduleId === activeModuleId && quiz.subtopicId === activeSubtopicId && !existingQuizIds.has(quiz.quizId ?? ""));
    if (!created) throw new Error("Could not identify the created quiz. Refresh before trying again.");
    return created;
  };

  const createEmptyQuiz = async () => {
    const created = await createQuiz();
    setManagedQuiz(created);
    setQuizForm(emptyQuizForm);
    setMessage("Quiz created. Add your first question below.");
    return true;
  };

  const createQuizFromUpload = async (file: File | null, onProgress?: (stage: number) => void) => {
    if (!file) return false;

    if (!activeCourseId || !activeModuleId || !activeTopicId || !activeSubtopicId || !activeCourse || !activeSubtopic) {
      throw new Error("Create or select a subtopic before creating a quiz.");
    }

    if (!quizForm.title.trim()) {
      throw new Error("Enter a quiz title before uploading questions.");
    }

    try {
      onProgress?.(0);
      const cleanQuestions = await parseQuestionImportFile(file, {
        defaultSubject: activeCourse.subject,
        idOffset: questions.length,
      });

      if (!cleanQuestions.length) {
        throw new Error("No valid questions were found in that Excel file.");
      }

      onProgress?.(1);
      const createdQuiz = await createQuiz();

      onProgress?.(2);
      await onImportQuestions(
        cleanQuestions.map((question) => ({
          ...questionInput(question),
          courseId: createdQuiz.courseId,
          moduleId: createdQuiz.moduleId,
          subtopicId: createdQuiz.subtopicId,
          quizId: createdQuiz.quizId,
          subject: createdQuiz.subject,
        }))
      );
      onProgress?.(3);
      setMessage(`Quiz created and ${cleanQuestions.length} questions uploaded.`);
      setManagedQuiz(createdQuiz);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Quiz could not be created from that Excel file.");
      throw error;
    }
  };

  const createCourse = async () => {
    if (!courseForm.title.trim()) {
      setMessage("Enter a course name.");
      return;
    }

    try {
      const createdCourse = await onCreateCourse({
        title: courseForm.title.trim(),
        code: courseForm.code.trim() || slugCode(courseForm.title),
        subject: courseForm.subject,
        description: courseForm.description.trim() || undefined,
        status: courseForm.status,
      });
      if (createdCourse?.id) {
        setSelectedCourseId(createdCourse.id);
        setSelectedModuleId("");
        setSelectedTopicId("");
        setSelectedSubtopicId("");
      }
      setCourseForm(emptyCourseForm);
      setMessage("Course saved. Add your first module.");
      openCourseStep("courses");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Course could not be saved.");
    }
  };

  const updateCourse = async (input: { title: string; code: string; subject: string; description?: string; status?: "draft" | "published" }) => {
    if (!activeCourseId) {
      setMessage("Select a course before editing.");
      return false;
    }

    if (!input.title.trim() || !input.code.trim() || !input.subject.trim()) {
      setMessage("Complete the course title, code, and subject.");
      return false;
    }

    try {
      await onUpdateCourse(activeCourseId, {
        title: input.title.trim(),
        code: input.code.trim(),
        subject: input.subject.trim(),
        description: input.description?.trim() || undefined,
        status: input.status,
      });
      setMessage("Course updated.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Course could not be updated.");
      return false;
    }
  };

  const deleteCourse = async () => {
    if (!activeCourseId) {
      setMessage("Select a course before deleting.");
      return false;
    }

    try {
      await onDeleteCourse(activeCourseId);
      setSelectedCourseId("");
      setSelectedModuleId("");
      setSelectedTopicId("");
      setSelectedSubtopicId("");
      setMessage("Course deleted.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Course could not be deleted.");
      return false;
    }
  };

  const deleteCourseById = async (courseId: string) => {
    const course = courses.find((item) => item.id === courseId);

    if (typeof window !== "undefined" && !window.confirm(`Delete ${course?.title ?? "this course"}? This cannot be undone.`)) {
      return false;
    }

    try {
      await onDeleteCourse(courseId);
      if (courseId === activeCourseId) {
        setSelectedCourseId("");
        setSelectedModuleId("");
        setSelectedTopicId("");
        setSelectedSubtopicId("");
      }
      setMessage("Course deleted.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Course could not be deleted.");
      return false;
    }
  };

  const publishCourse = async () => {
    if (!activeCourseId || !activeCourse) {
      setMessage("Select a course before publishing.");
      return false;
    }

    try {
      await onUpdateCourse(activeCourseId, {
        title: activeCourse.title,
        code: activeCourse.code,
        subject: activeCourse.subject,
        description: activeCourse.description,
        status: "published",
      });
      setMessage("Course published online.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Course could not be published.");
      return false;
    }
  };

  const publishCourseById = async (courseId: string) => {
    const course = courses.find((item) => item.id === courseId);

    if (!course) {
      setMessage("Select a course before publishing.");
      return false;
    }

    try {
      await onUpdateCourse(courseId, {
        title: course.title,
        code: course.code,
        subject: course.subject,
        description: course.description,
        status: "published",
      });
      setMessage("Course published online.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Course could not be published.");
      return false;
    }
  };

  const addModule = async () => {
    if (!activeCourseId) {
      setMessage("Create or select a course before adding modules.");
      return false;
    }

    if (!moduleForm.title.trim()) {
      setMessage("Enter a module title.");
      return false;
    }

    try {
      await onAddModule(activeCourseId, {
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim() || undefined,
      });
      setModuleForm(emptyModuleForm);
      setMessage("Module added.");
      openCourseStep("topics");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Module could not be saved.");
      return false;
    }
  };

  const addTopic = async () => {
    if (!activeCourseId || !activeModuleId) {
      setMessage("Create or select a module before adding topics.");
      return false;
    }

    if (!topicForm.title.trim()) {
      setMessage("Enter a topic title.");
      return false;
    }

    try {
      await onAddTopic(activeCourseId, activeModuleId, {
        title: topicForm.title.trim(),
        description: topicForm.description.trim() || undefined,
      });
      setTopicForm(emptyTopicForm);
      setMessage("Topic added.");
      openCourseStep("subtopics");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Topic could not be saved.");
      return false;
    }
  };

  const addSubtopic = async () => {
    if (!activeCourseId || !activeModuleId || !activeTopicId) {
      setMessage("Create or select a topic before adding subtopics.");
      return false;
    }

    if (!subtopicForm.title.trim()) {
      setMessage("Enter a subtopic title.");
      return false;
    }

    try {
      await onAddSubtopic(activeCourseId, activeModuleId, activeTopicId, {
        title: subtopicForm.title.trim(),
        description: subtopicForm.description.trim() || undefined,
      });
      setSubtopicForm(emptySubtopicForm);
      setMessage("Subtopic added.");
      openCourseStep("subtopics");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Subtopic could not be saved.");
      return false;
    }
  };

  return (
    <section className="admin-dashboard min-h-screen bg-[#f7fbff] text-[#10243f]">
      <div className="grid min-h-screen lg:grid-cols-[292px_1fr]">
        <aside className="hidden bg-[#071a38] text-white lg:flex lg:flex-col">
          <button className="flex h-20 items-center gap-3 px-6 text-left" type="button" onClick={onBack}>
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#0b63d1] text-white shadow-lg shadow-blue-950/30">
              <GraduationCap size={24} />
            </span>
            <span>
              <strong className="block text-base font-black">TLCHub</strong>
              <small className="text-[11px] font-semibold text-blue-100/80">Learn · Practice · Excel</small>
            </span>
          </button>

          <nav className="flex-1 space-y-1 px-4 py-3 text-sm font-bold">
            <SideItem active={section === "overview"} icon={LayoutDashboard} label="Dashboard" onClick={() => openSection("overview")} />
            <SideItem active={section === "questions"} icon={FileQuestion} label="Question Bank" onClick={() => openSection("questions")} />
            <SideItem active={section === "courses"} icon={BookOpen} label="Courses" onClick={() => openSection("courses")} />
            <SideItem active={section === "reports"} icon={Users} label="Students" onClick={() => openSection("reports")} />
            <SideItem active={section === "feedback"} icon={Bell} label="Feedback" badge={unreadFeedback} onClick={() => openSection("feedback")} />
            <SideItem active={section === "settings"} icon={Settings} label="Settings" onClick={() => openSection("settings")} />
          </nav>

          <div className="m-4 rounded-lg border border-white/10 bg-white/5 p-4 text-xs font-semibold text-blue-100/80">
            <ShieldCheck className="mb-3 text-[#7fb7ff]" size={20} />
            Build better learning experiences.
            <button className="mt-4 flex w-full items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-left font-black text-white transition hover:bg-white/15" type="button" onClick={onSignOut}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-[#d5e2f0] bg-white/90 px-4 backdrop-blur sm:px-6">
            <label className="flex h-10 w-full max-w-xl items-center gap-3 rounded-lg border border-[#d5e2f0] bg-[#f8fbff] px-3 text-sm font-semibold text-[#5e7086]">
              <Search size={16} />
              <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search exams, topics, questions, or students..." type="search" />
            </label>
            <div className="flex items-center gap-3">
              <button className="relative grid h-10 w-10 place-items-center rounded-lg border border-[#d5e2f0] bg-white text-[#06479b]" type="button" aria-label="Notifications">
                <Bell size={17} />
                {unreadFeedback > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />}
              </button>
              <div className="relative">
                <button
                  className="flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-[#edf5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06479b]"
                  type="button"
                  aria-label="Open admin profile menu"
                  aria-expanded={isProfileOpen}
                  onClick={() => setIsProfileOpen((open) => !open)}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#071a38] text-xs font-black text-white">{initials(adminName)}</span>
                  <span className="hidden leading-tight sm:block">
                    <strong className="block text-xs font-black">{firstName(adminName)}</strong>
                    <small className="block text-[10px] font-semibold text-[#5e7086]">{adminRole}</small>
                  </span>
                  <ChevronDown className={`transition ${isProfileOpen ? "rotate-180" : ""}`} size={14} />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 top-12 z-40 w-72 rounded-lg border border-[#d5e2f0] bg-white p-2 text-sm shadow-[0_24px_70px_rgba(8,43,99,0.18)]">
                    <div className="border-b border-[#e8f0fa] px-3 py-3">
                      <strong className="block truncate text-sm font-black text-[#10243f]">{adminName}</strong>
                      <span className="mt-1 block truncate text-xs font-semibold text-[#5e7086]">{adminRole}</span>
                    </div>
                    <div className="grid gap-1 py-2">
                      <ProfileMenuItem icon={BookOpen} label="Courses" onClick={() => openSection("courses")} />
                      <ProfileMenuItem icon={Users} label="Students" onClick={() => openSection("reports")} />
                      <ProfileMenuItem icon={Settings} label="Settings" onClick={() => openSection("settings")} />
                      <ProfileMenuItem
                        icon={GraduationCap}
                        label="Student site"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onBack();
                        }}
                      />
                    </div>
                    <div className="border-t border-[#e8f0fa] pt-2">
                      <ProfileMenuItem
                        destructive
                        icon={LogOut}
                        label="Sign out"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onSignOut();
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="space-y-5 px-4 py-5 sm:px-6">
            {!(section === "questions" && questionBankView === "exams") && (
              <PageHeading
                title={section === "questions" ? questionPageTitle : pageTitle(section)}
                subtitle={section === "questions" ? questionPageSubtitle : pageSubtitle(section, firstName(adminName))}
                action={
                  section === "questions" ? (
                    <QuestionBankActions
                      view={questionBankView}
                      onBack={() => {
                        if (questionBankView === "subjects") setQuestionBankView("exams");
                        if (questionBankView === "bank") setQuestionBankView("subjects");
                      }}
                    />
                  ) : (
                    <DatePill />
                  )
                }
              />
            )}

            {message && <p className="rounded-lg border border-[#b8d8ff] bg-[#edf5ff] px-4 py-3 text-sm font-bold text-[#06479b]">{message}</p>}

            {section === "overview" && (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard icon={FileQuestion} label="Question Bank" value={String(questions.length)} trend={`${topicRows.length} topics covered`} tone="blue" />
                  <MetricCard icon={BookOpen} label="Courses" value={String(courses.length)} trend={`${moduleCount} modules`} tone="green" />
                  <MetricCard icon={Users} label="Total Students" value={String(totalStudents)} trend={`${activeAttempts.length} active attempts`} tone="green" />
                  <MetricCard icon={Gauge} label="Avg. Score" value={`${averageScore}%`} trend={`${completionRate}% completion rate`} tone="purple" />
                  <MetricCard icon={Star} label="Feedback Rating" value={feedbackRating(feedback)} trend={`${unreadFeedback} new responses`} tone="rose" />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.7fr]">
                  <Panel title="Recent Activity">
                    <ActivityList attempts={attempts} feedback={feedback} questions={questions.length} />
                  </Panel>
                  <Panel title="Performance Overview">
                    <LineChart score={averageScore} completion={completionRate} />
                  </Panel>
                  <Panel title="Quick Actions">
                    <div className="grid gap-3">
                      <ActionButton icon={BookOpen} label="Build Course" onClick={() => openSection("courses")} tone="green" />
                      <ActionButton icon={Users} label="View Students" onClick={() => openSection("reports")} tone="green" />
                      <ActionButton icon={Bell} label="Check Feedback" onClick={() => openSection("feedback")} tone="orange" />
                    </div>
                  </Panel>
                </div>
              </>
            )}

            {section === "courses" && (managedQuiz ? (
              <div className="space-y-4">
                <SecondaryButton type="button" onClick={() => setManagedQuiz(null)}><ArrowLeft size={16} /> Back to Course</SecondaryButton>
                <QuestionManager key={managedQuiz.quizId} context={managedQuiz} subject={managedQuiz.subject}
                  courses={courses} questions={questions} onCreate={onAddQuestion} onUpdate={onUpdateQuestion} onImport={onImportQuestions} />
              </div>
            ) : (
              <CourseBuilder
                courses={courses}
                step={courseStep}
                courseForm={courseForm}
                moduleForm={moduleForm}
                topicForm={topicForm}
                subtopicForm={subtopicForm}
                quizForm={quizForm}
                activeCourse={activeCourse}
                activeModuleId={activeModuleId}
                activeTopicId={activeTopicId}
                activeTopic={activeTopic}
                activeSubtopicId={activeSubtopicId}
                onCourseFormChange={setCourseForm}
                onModuleFormChange={setModuleForm}
                onTopicFormChange={setTopicForm}
                onSubtopicFormChange={setSubtopicForm}
                onQuizFormChange={setQuizForm}
                onSelectCourse={(courseId) => {
                  setSelectedCourseId(courseId);
                  setSelectedModuleId("");
                  setSelectedTopicId("");
                  setSelectedSubtopicId("");
                }}
                onSelectModule={(moduleId) => {
                  setSelectedModuleId(moduleId);
                  setSelectedTopicId("");
                  setSelectedSubtopicId("");
                }}
                onSelectTopic={(topicId) => {
                  setSelectedTopicId(topicId);
                  setSelectedSubtopicId("");
                }}
                onSelectSubtopic={setSelectedSubtopicId}
                onCreateCourse={createCourse}
                onUpdateCourse={updateCourse}
                onDeleteCourse={deleteCourse}
                onPublishCourse={publishCourse}
                onDeleteCourseById={deleteCourseById}
                onPublishCourseById={publishCourseById}
                onEditStructure={(input) => onEditStructure(activeCourseId, input)}
                onReorderModules={(ids) => onReorderModules(activeCourseId, ids)}
                onAddModule={addModule}
                onAddTopic={addTopic}
                onAddSubtopic={addSubtopic}
                onCreateQuizFromUpload={createQuizFromUpload}
                onCreateEmptyQuiz={createEmptyQuiz}
                onManageQuiz={manageQuiz}
                onOpenStep={openCourseStep}
              />
            ))}

            {section === "questions" && (
              <QuestionBankFlow
                view={questionBankView}
                exams={examOptions}
                subjects={subjectCatalog}
                selectedExam={selectedExam}
                selectedSubject={selectedSubject}
                questions={selectedSubjectQuestions}
                questionCountsBySubject={questionCountsBySubject}
                courses={courses}
                onChooseExam={chooseExam}
                onChooseSubject={chooseSubject}
                onCreateQuestion={onAddQuestion}
                onUpdateQuestion={onUpdateQuestion}
                onImportQuestions={onImportQuestions}
              />
            )}

            {section === "reports" && (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard icon={Gauge} label="Average Score" value={`${averageScore}%`} trend="Across completed attempts" tone="blue" />
                  <MetricCard icon={CheckCircle2} label="Completion Rate" value={`${completionRate}%`} trend={`${completedAttempts.length} completed`} tone="green" />
                  <MetricCard icon={CheckCircle2} label="Total Attempts" value={String(attempts.length)} trend={`${activeAttempts.length} in progress`} tone="purple" />
                  <MetricCard icon={CalendarDays} label="Time Spent" value={`${completedAttempts.length * 8}m`} trend="Estimated activity" tone="rose" />
                </div>
                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <Panel title="Students">
                    <DataTable
                      headers={["Name", "Answered", "Avg. Score", "Status", "Last Active"]}
                      rows={attempts.slice(0, 8).map((attempt) => [
                        attempt.student,
                        `${attempt.answered}/${attempt.questionCount}`,
                        `${attempt.percent ?? 0}%`,
                        <StatusBadge key="status" tone={attempt.status === "completed" ? "available" : "neutral"}>{attempt.status}</StatusBadge>,
                        formatDate(attempt.submittedAt ?? attempt.startedAt),
                      ])}
                    />
                  </Panel>
                  <Panel title="Analytics">
                    <TopicBars topics={topicRows} />
                  </Panel>
                </div>
              </>
            )}

            {section === "feedback" && (
              <Panel title="Feedback" toolbar={<FeedbackSummary feedback={feedback} />}>
                <div className="grid gap-3">
                  {feedback.slice(0, 10).map((item) => (
                    <div className="grid gap-3 rounded-lg border border-[#d5e2f0] bg-white p-4 sm:grid-cols-[180px_1fr_auto] sm:items-center" key={item.id}>
                      <div>
                        <strong className="block text-sm font-black">{item.student}</strong>
                        <small className="text-xs font-semibold text-[#5e7086]">{formatDate(item.submittedAt)}</small>
                      </div>
                      <div>
                        <div className="text-sm text-amber-400">{"★".repeat(Math.max(1, item.rating))}</div>
                        <p className="mt-1 text-sm font-semibold leading-6 text-[#5e7086]">{item.message}</p>
                      </div>
                      {item.status === "new" ? (
                        <SecondaryButton className="h-9 min-h-9 px-3 text-xs" type="button" onClick={() => onReviewFeedback(item.id)}>Review</SecondaryButton>
                      ) : (
                        <StatusBadge tone="available">Reviewed</StatusBadge>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {section === "settings" && (
              <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="Platform Settings">
                  <div className="grid gap-3">
                    <Field label="Platform Name" value="TLCHub" onChange={() => undefined} />
                    <Field label="Timezone" value="West Africa Time" onChange={() => undefined} />
                    <Field label="Language" value="English" onChange={() => undefined} />
                    <PrimaryButton className="h-10 min-h-10 w-fit" type="button">Save Changes</PrimaryButton>
                  </div>
                </Panel>
                <Panel title="Quiz Defaults">
                  <SettingToggle label="Show correct answers after submission" enabled />
                  <SettingToggle label="Allow multiple attempts" enabled />
                  <SettingToggle label="Randomize questions" enabled />
                  <SettingToggle label="Randomize options" enabled={false} />
                  <Field label="Default time limit (minutes)" type="number" value="60" onChange={() => undefined} />
                </Panel>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}

function PageHeading({ title, subtitle, action }: { title: string; subtitle: string; action: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-normal">{title}</h1>
        <p className="mt-1 text-sm font-semibold text-[#5e7086]">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Panel({ title, toolbar, children }: { title: string; toolbar?: ReactNode; children: ReactNode }) {
  return (
    <section className="content-rise rounded-lg border border-[#d5e2f0] bg-white p-4 shadow-[0_18px_55px_rgba(8,43,99,0.07)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-black">{title}</h2>
        {toolbar}
      </div>
      {children}
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, trend, tone }: { icon: LucideIcon; label: string; value: string; trend: string; tone: "blue" | "green" | "purple" | "rose" }) {
  const tones = {
    blue: "bg-[#edf5ff] text-[#06479b]",
    green: "bg-[#edf8ef] text-[#087c22]",
    purple: "bg-violet-50 text-violet-700",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="rounded-lg border border-[#d5e2f0] bg-white p-5 shadow-[0_18px_55px_rgba(8,43,99,0.06)]">
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon size={19} />
      </span>
      <span className="mt-4 block text-sm font-bold text-[#5e7086]">{label}</span>
      <strong className="mt-1 block text-3xl font-black">{value}</strong>
      <small className="mt-2 block text-xs font-black text-[#087c22]">↑ {trend}</small>
    </div>
  );
}

function SideItem({ icon: Icon, label, active, badge = 0, onClick }: { icon: LucideIcon; label: string; active: boolean; badge?: number; onClick: () => void }) {
  return (
    <button
      className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left transition ${
        active ? "bg-[#06479b] text-white shadow-lg shadow-blue-950/20" : "text-blue-100/85 hover:bg-white/10 hover:text-white"
      }`}
      type="button"
      onClick={onClick}
    >
      <Icon size={17} />
      <span className="min-w-0 flex-1">{label}</span>
      {badge > 0 && <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-[#06479b]">{badge}</span>}
    </button>
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  destructive = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-black transition ${
        destructive ? "text-rose-600 hover:bg-rose-50" : "text-[#10243f] hover:bg-[#edf5ff] hover:text-[#06479b]"
      }`}
      type="button"
      onClick={onClick}
    >
      <Icon size={16} />
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th className="border-b border-[#d5e2f0] bg-[#f8fbff] px-3 py-3 text-xs font-black text-[#5e7086]" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, rowIndex) => (
            <tr className="border-b border-[#d5e2f0]" key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="border-b border-[#e8f0fa] px-3 py-3 align-top font-semibold text-[#10243f]" key={`${rowIndex}-${cellIndex}`}>
                  {cell}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className="px-3 py-8 text-center text-sm font-bold text-[#5e7086]" colSpan={headers.length}>No records yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CourseEditModal({
  form,
  onChange,
  onCancel,
  onDelete,
  onSave,
}: {
  form: typeof emptyCourseForm;
  onChange: (form: typeof emptyCourseForm) => void;
  onCancel: () => void;
  onDelete: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071a38]/45 px-4 py-6">
      <section className="w-full max-w-3xl rounded-xl border border-[#d5e2f0] bg-white p-6 text-[#10243f] shadow-[0_24px_90px_rgba(8,43,99,0.22)]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <span>
            <span className="text-xs font-black uppercase tracking-wide text-[#06479b]">Course</span>
            <h3 className="mt-1 text-2xl font-black">Edit course</h3>
          </span>
          <button className="min-h-10 px-2 text-sm font-black text-[#596273]" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Course title" value={form.title} onChange={(title) => onChange({ ...form, title })} />
          <Field label="Course code" value={form.code} onChange={(code) => onChange({ ...form, code })} />
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Subject
            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
              value={form.subject}
              onChange={(event) => onChange({ ...form, subject: event.target.value })}
            >
              {subjectCatalog.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.title}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Status
            <select
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-emerald-400"
              value={form.status}
              onChange={(event) => onChange({ ...form, status: event.target.value as typeof form.status })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <TextArea label="Course description" value={form.description} onChange={(description) => onChange({ ...form, description })} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rose-200 px-4 text-sm font-black text-rose-700 transition hover:bg-rose-50"
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={16} /> Delete Course
          </button>
          <div className="flex items-center gap-3">
            <button className="min-h-11 rounded-md px-4 text-sm font-black text-[#596273]" type="button" onClick={onCancel}>
              Cancel
            </button>
            <PrimaryButton className="min-h-11 gap-2 px-5" type="button" onClick={onSave}>
              <Pencil size={16} /> Save Course
            </PrimaryButton>
          </div>
        </div>
      </section>
    </div>
  );
}

type CourseStatusView = "builder" | "published" | "draft";

function courseOutlineCounts(course: api.CourseContent) {
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

function CourseStateBadge({ status }: { status: api.CourseContent["status"] }) {
  const isPublished = status === "published";

  return (
    <span
      className={`inline-flex min-h-9 items-center rounded-md px-4 text-xs font-black uppercase tracking-wide ${
        isPublished ? "bg-emerald-50 text-emerald-700" : "bg-[#edf1f6] text-[#596273]"
      }`}
    >
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

function CourseStatusTab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-11 rounded-md px-4 text-sm font-black transition ${
        active ? "bg-[#0d3472] text-white shadow-[0_10px_22px_rgba(13,52,114,0.18)]" : "bg-white text-[#596273] hover:bg-[#edf5ff] hover:text-[#06479b]"
      }`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function CourseStatusPanel({
  title,
  courses,
  emptyText,
  onOpenCourse,
  onPublishCourse,
  onDeleteCourse,
}: {
  title: string;
  courses: api.CourseContent[];
  emptyText: string;
  onOpenCourse: (courseId: string) => void;
  onPublishCourse: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
}) {
  return (
    <div className="grid gap-4 p-4">
      <div>
        <span className="text-xs font-black uppercase tracking-wide text-[#06479b]">Course states</span>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#10243f]">{title}</h2>
      </div>

      {courses.length ? (
        <div className="grid gap-3">
          {courses.map((course) => {
            const counts = courseOutlineCounts(course);

            return (
              <article className="rounded-lg border border-[#d5e2f0] bg-white p-5" key={course.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-xs font-black uppercase tracking-wide text-[#5e7086]">{course.code}</span>
                    <h3 className="mt-1 truncate text-xl font-semibold tracking-normal text-[#10243f]">{course.title}</h3>
                    <p className="mt-2 text-sm font-bold text-[#5e7086]">{course.subject}</p>
                  </div>
                  <CourseStateBadge status={course.status} />
                </div>

                <div className="mt-5 grid gap-2 text-sm font-black text-[#596273] sm:grid-cols-4">
                  <span className="rounded-md bg-[#f8fbff] px-3 py-2">{counts.modules} modules</span>
                  <span className="rounded-md bg-[#f8fbff] px-3 py-2">{counts.topics} topics</span>
                  <span className="rounded-md bg-[#f8fbff] px-3 py-2">{counts.subtopics} subtopics</span>
                  <span className="rounded-md bg-[#f8fbff] px-3 py-2">{counts.quizzes} quizzes</span>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  {course.status !== "published" && (
                    <button
                      className="inline-flex min-h-11 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
                      type="button"
                      onClick={() => onPublishCourse(course.id)}
                    >
                      <UploadCloud size={16} />
                      Publish Course
                    </button>
                  )}
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rose-200 bg-white px-5 text-sm font-black text-rose-700 transition hover:bg-rose-50"
                    type="button"
                    onClick={() => onDeleteCourse(course.id)}
                  >
                    <Trash2 size={16} />
                    Delete Course
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#e9edff] px-5 text-sm font-black text-[#3867ee] transition hover:bg-[#dfe5ff]"
                    type="button"
                    onClick={() => onOpenCourse(course.id)}
                  >
                    Open in Builder <ArrowRight size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[#d5e2f0] bg-white p-8 text-center text-sm font-bold text-[#5e7086]">{emptyText}</p>
      )}
    </div>
  );
}

function CourseBuilder({
  courses,
  step,
  courseForm,
  moduleForm,
  topicForm,
  subtopicForm,
  quizForm,
  activeCourse,
  activeModuleId,
  activeTopicId,
  activeTopic,
  activeSubtopicId,
  onCourseFormChange,
  onModuleFormChange,
  onTopicFormChange,
  onSubtopicFormChange,
  onQuizFormChange,
  onSelectCourse,
  onSelectModule,
  onSelectTopic,
  onSelectSubtopic,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onPublishCourse,
  onDeleteCourseById,
  onPublishCourseById,
  onEditStructure,
  onReorderModules,
  onAddModule,
  onAddTopic,
  onAddSubtopic,
  onCreateQuizFromUpload,
  onCreateEmptyQuiz,
  onManageQuiz,
  onOpenStep,
}: {
  courses: api.CourseContent[];
  step: CourseBuilderStep;
  courseForm: typeof emptyCourseForm;
  moduleForm: typeof emptyModuleForm;
  topicForm: typeof emptyTopicForm;
  subtopicForm: typeof emptySubtopicForm;
  quizForm: typeof emptyQuizForm;
  activeCourse?: api.CourseContent;
  activeModuleId: string;
  activeTopicId: string;
  activeTopic?: api.CourseTopic;
  activeSubtopicId: string;
  onCourseFormChange: (form: typeof emptyCourseForm) => void;
  onModuleFormChange: (form: typeof emptyModuleForm) => void;
  onTopicFormChange: (form: typeof emptyTopicForm) => void;
  onSubtopicFormChange: (form: typeof emptySubtopicForm) => void;
  onQuizFormChange: (form: typeof emptyQuizForm) => void;
  onSelectCourse: (courseId: string) => void;
  onSelectModule: (moduleId: string) => void;
  onSelectTopic: (topicId: string) => void;
  onSelectSubtopic: (subtopicId: string) => void;
  onCreateCourse: () => void;
  onUpdateCourse: (input: { title: string; code: string; subject: string; description?: string; status?: "draft" | "published" }) => boolean | Promise<boolean>;
  onDeleteCourse: () => boolean | Promise<boolean>;
  onPublishCourse: () => boolean | Promise<boolean>;
  onDeleteCourseById: (courseId: string) => boolean | Promise<boolean>;
  onPublishCourseById: (courseId: string) => boolean | Promise<boolean>;
  onEditStructure: (input: api.StructureEdit) => Promise<void>;
  onReorderModules: (ids: string[]) => Promise<void>;
  onAddModule: () => boolean | Promise<boolean>;
  onAddTopic: () => boolean | Promise<boolean>;
  onAddSubtopic: () => boolean | Promise<boolean>;
  onCreateQuizFromUpload: (file: File | null, onProgress?: (stage: number) => void) => boolean | Promise<boolean>;
  onCreateEmptyQuiz: () => Promise<boolean>;
  onManageQuiz: (moduleId: string, topicId: string, subtopicId: string, quizId: string) => void;
  onOpenStep: (step: CourseBuilderStep) => void;
}) {
  const quizUploadRef = useRef<HTMLInputElement>(null);
  const [courseView, setCourseView] = useState<CourseStatusView>("builder");
  const [courseEditorOpen, setCourseEditorOpen] = useState(false);
  const [courseEditForm, setCourseEditForm] = useState(emptyCourseForm);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [subtopicModalOpen, setSubtopicModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const modules = activeCourse?.modules ?? [];
  const publishedCourses = courses.filter((course) => course.status === "published");
  const draftCourses = courses.filter((course) => course.status !== "published");
  const statusCourses = courseView === "published" ? publishedCourses : draftCourses;
  const isAddingModule = step === "modules" && !modules.length;
  const openCourseFromStatus = (courseId: string) => {
    onSelectCourse(courseId);
    setCourseView("builder");
    onOpenStep("courses");
  };
  const openModuleModal = () => {
    setModuleModalOpen(true);
    onOpenStep("modules");
  };
  const saveModule = async () => {
    const saved = await Promise.resolve(onAddModule());
    if (saved) setModuleModalOpen(false);
  };
  const openTopicModal = (moduleId?: string) => {
    if (moduleId) onSelectModule(moduleId);
    setTopicModalOpen(true);
    onOpenStep("topics");
  };
  const saveTopic = async () => {
    const saved = await Promise.resolve(onAddTopic());
    if (saved) setTopicModalOpen(false);
  };
  const openSubtopicModal = (moduleId?: string, topicId?: string) => {
    if (moduleId) onSelectModule(moduleId);
    if (topicId) onSelectTopic(topicId);
    setSubtopicModalOpen(true);
    onOpenStep("subtopics");
  };
  const saveSubtopic = async () => {
    const saved = await Promise.resolve(onAddSubtopic());
    if (saved) setSubtopicModalOpen(false);
  };
  const openQuizModal = (moduleId?: string, topicId?: string, subtopicId?: string) => {
    if (moduleId) onSelectModule(moduleId);
    if (topicId) onSelectTopic(topicId);
    if (subtopicId) onSelectSubtopic(subtopicId);
    setQuizModalOpen(true);
    onOpenStep("quizzes");
  };
  const closeQuizModal = () => {
    onQuizFormChange(emptyQuizForm);
    setQuizModalOpen(false);
  };
  const uploadQuizQuestions = async (file: File | null, onProgress?: (stage: number) => void) => {
    return await Promise.resolve(onCreateQuizFromUpload(file, onProgress));
  };
  const openCourseEditor = () => {
    if (!activeCourse) return;

    setCourseEditForm({
      title: activeCourse.title,
      code: activeCourse.code,
      subject: activeCourse.subject,
      description: activeCourse.description ?? "",
      status: activeCourse.status,
    });
    setCourseEditorOpen(true);
  };
  const saveCourseEdit = async () => {
    const saved = await Promise.resolve(onUpdateCourse(courseEditForm));
    if (saved) setCourseEditorOpen(false);
  };
  const deleteActiveCourse = async () => {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${activeCourse?.title ?? "this course"}? This cannot be undone.`)) {
      return;
    }

    const deleted = await Promise.resolve(onDeleteCourse());
    if (deleted) setCourseEditorOpen(false);
  };
  const publishActiveCourse = () => {
    void onPublishCourse();
  };

  return (
    <section className="min-h-[calc(100vh-150px)] overflow-hidden rounded-lg border border-[#d5e2f0] bg-[#fbfcff]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d5e2f0] bg-[#f8fbff] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CourseStatusTab active={courseView === "builder"} onClick={() => setCourseView("builder")}>
            Builder
          </CourseStatusTab>
          <CourseStatusTab active={courseView === "published"} onClick={() => setCourseView("published")}>
            Published ({publishedCourses.length})
          </CourseStatusTab>
          <CourseStatusTab active={courseView === "draft"} onClick={() => setCourseView("draft")}>
            Draft ({draftCourses.length})
          </CourseStatusTab>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#0d3472] px-5 text-sm font-black text-white shadow-[0_10px_22px_rgba(13,52,114,0.18)] transition hover:bg-[#06479b]"
          type="button"
          onClick={() => {
            setCourseView("builder");
            onOpenStep("overview");
          }}
        >
          <Plus size={17} />
          Create Course
        </button>
      </div>

      {courseView === "builder" ? (
        step === "overview" || !activeCourse ? (
          <CourseNameStart
            value={courseForm.title}
            onChange={(title) => onCourseFormChange({ ...courseForm, title })}
            onConfirm={onCreateCourse}
          />
        ) : !modules.length && !isAddingModule ? (
          <CourseEmptyState onAddTopic={() => onOpenStep("modules")} />
        ) : isAddingModule ? (
          <TopicEditorShell
            title={moduleForm.title}
            summary={moduleForm.description}
            onTitleChange={(title) => onModuleFormChange({ ...moduleForm, title })}
            onSummaryChange={(description) => onModuleFormChange({ ...moduleForm, description })}
            onCancel={() => {
              onModuleFormChange(emptyModuleForm);
              onOpenStep("overview");
            }}
            onConfirm={onAddModule}
          />
        ) : (
          <div className="grid gap-4 p-4">
            <CourseStructure
              onEdit={onEditStructure}
              onReorder={onReorderModules}
              modules={modules}
              courseStatus={activeCourse?.status}
              activeModuleId={activeModuleId}
              activeTopicId={activeTopic?.id}
              activeSubtopicId={activeSubtopicId}
              onSelectModule={onSelectModule}
              onSelectTopic={onSelectTopic}
              onSelectSubtopic={onSelectSubtopic}
              onAddTopic={openTopicModal}
              onAddSubtopic={openSubtopicModal}
              onAddQuiz={openQuizModal}
              onManageQuiz={onManageQuiz}
              onPublishCourse={publishActiveCourse}
              onDeleteCourse={deleteActiveCourse}
            />
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#d5e2f0] bg-white p-4">
              <ShellActionButton label="Module" onClick={openModuleModal} />
              <ShellActionButton label="Topic" onClick={() => openTopicModal(activeModuleId || modules[0]?.id)} />
              <ShellActionButton label="Subtopic" onClick={() => openSubtopicModal(activeModuleId || modules[0]?.id, activeTopicId || modules[0]?.topics[0]?.id)} />
              <ShellActionButton
                label="Quiz"
                onClick={() =>
                  openQuizModal(
                    activeModuleId || modules[0]?.id,
                    activeTopicId || modules[0]?.topics[0]?.id,
                    activeSubtopicId || modules[0]?.topics[0]?.subtopics[0]?.id
                  )
                }
              />
              <button
                className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#c4cad4] bg-white px-5 text-sm font-black text-[#596273] transition hover:border-[#8dbcf5] hover:bg-[#f8fbff] hover:text-[#06479b]"
                type="button"
                onClick={openCourseEditor}
              >
                <Pencil className="text-[#aab2bf]" size={18} />
                Edit Course
              </button>
            </div>
            <input
              ref={quizUploadRef}
              className="sr-only"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={(event) => {
                onCreateQuizFromUpload(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </div>
        )
      ) : (
        <CourseStatusPanel
          title={courseView === "published" ? "Published courses" : "Draft courses"}
          courses={statusCourses}
          emptyText={courseView === "published" ? "No published courses yet." : "No draft courses yet."}
          onOpenCourse={openCourseFromStatus}
          onPublishCourse={(courseId) => {
            void onPublishCourseById(courseId);
          }}
          onDeleteCourse={(courseId) => {
            void onDeleteCourseById(courseId);
          }}
        />
      )}
      {courseEditorOpen && (
        <CourseEditModal
          form={courseEditForm}
          onChange={setCourseEditForm}
          onCancel={() => setCourseEditorOpen(false)}
          onDelete={deleteActiveCourse}
          onSave={saveCourseEdit}
        />
      )}
      {moduleModalOpen && (
        <SubtopicModal
          title={moduleForm.title}
          notes={moduleForm.description}
          titlePlaceholder="Add a module title"
          notesPlaceholder="Add module summary"
          onTitleChange={(title) => onModuleFormChange({ ...moduleForm, title })}
          onNotesChange={(description) => onModuleFormChange({ ...moduleForm, description })}
          onCancel={() => {
            onModuleFormChange(emptyModuleForm);
            setModuleModalOpen(false);
          }}
          onConfirm={saveModule}
        />
      )}
      {topicModalOpen && (
        <SubtopicModal
          title={topicForm.title}
          notes={topicForm.description}
          titlePlaceholder="Add a topic title"
          notesPlaceholder="Add topic notes"
          onTitleChange={(title) => onTopicFormChange({ ...topicForm, title })}
          onNotesChange={(description) => onTopicFormChange({ ...topicForm, description })}
          onCancel={() => {
            onTopicFormChange(emptyTopicForm);
            setTopicModalOpen(false);
          }}
          onConfirm={saveTopic}
        />
      )}
      {subtopicModalOpen && (
        <SubtopicModal
          title={subtopicForm.title}
          notes={subtopicForm.description}
          titlePlaceholder="Add a subtopic title"
          notesPlaceholder="Add subtopic notes"
          onTitleChange={(title) => onSubtopicFormChange({ ...subtopicForm, title })}
          onNotesChange={(description) => onSubtopicFormChange({ ...subtopicForm, description })}
          onCancel={() => {
            onSubtopicFormChange(emptySubtopicForm);
            setSubtopicModalOpen(false);
          }}
          onConfirm={saveSubtopic}
        />
      )}
      {quizModalOpen && (
        <QuizUploadModal
          title={quizForm.title}
          onTitleChange={(title) => onQuizFormChange({ ...quizForm, title })}
          onCancel={closeQuizModal}
          onUpload={uploadQuizQuestions}
          onCreateEmpty={onCreateEmptyQuiz}
          settings={quizForm}
          onSettingsChange={onQuizFormChange}
        />
      )}
    </section>
  );
}

function CourseNameStart({
  value,
  onChange,
  onConfirm,
}: {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-152px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-xl border border-[#d5e2f0] bg-white p-8 shadow-[0_18px_55px_rgba(8,43,99,0.07)]">
        <span className="text-sm font-black uppercase tracking-wide text-[#3867ee]">Course setup</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal text-[#252831]">Name your course</h2>
        <p className="mt-3 text-base font-semibold leading-7 text-[#7a8193]">
          Start with the course name. Modules, topics, subtopics, and quizzes come next.
        </p>
        <label className="mt-8 block">
          <span className="mb-3 block text-sm font-black text-[#596273]">Course name</span>
          <input
            className="min-h-16 w-full rounded-lg border-2 border-[#cfe0f5] bg-[#f8fbff] px-5 text-xl font-semibold text-[#10243f] outline-none transition placeholder:text-[#9aa3b2] focus:border-[#4772f2] focus:bg-white"
            placeholder="e.g. GCSE Biology Triple"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
        <div className="mt-8 flex justify-end">
          <button
            className="inline-flex min-h-14 items-center gap-3 rounded-md bg-[#e9edff] px-8 text-lg font-semibold text-[#3867ee] transition hover:bg-[#dfe5ff]"
            type="button"
            onClick={onConfirm}
          >
            Continue <ArrowRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseEmptyState({ onAddTopic }: { onAddTopic: () => void }) {
  return (
    <div className="relative flex min-h-[calc(100vh-152px)] flex-col items-center justify-center px-4 py-12 text-center">
      <CourseBuilderIllustration />
      <h2 className="mt-10 text-3xl font-semibold tracking-normal text-[#252831]">Start building your course!</h2>
      <p className="mt-6 text-xl font-semibold text-[#7a8193]">Add Modules, Topics, Subtopics, and Quizzes to get started.</p>
      <button
        className="mt-12 inline-flex min-h-14 items-center gap-3 rounded-md bg-[#e9edff] px-10 text-lg font-semibold text-[#3867ee] transition hover:bg-[#dfe5ff]"
        type="button"
        onClick={onAddTopic}
      >
        <span className="grid h-5 w-5 place-items-center rounded-sm bg-[#4772f2] text-white">
          <Plus size={17} strokeWidth={3} />
        </span>
        Add Module
      </button>

      <div className="absolute bottom-8 right-8 flex items-center gap-6">
        <button
          className="grid h-16 w-16 place-items-center rounded-lg border-2 border-[#c4cad4] bg-white text-[#9aa3b2]"
          type="button"
          aria-label="Previous"
        >
          <ArrowLeft size={30} />
        </button>
        <button
          className="inline-flex h-16 items-center gap-4 rounded-lg border-2 border-[#c4cad4] bg-white px-7 text-xl font-semibold text-[#596273]"
          type="button"
        >
          Next <ArrowRight size={27} />
        </button>
      </div>
    </div>
  );
}

function CourseBuilderIllustration() {
  return (
    <svg className="h-auto w-full max-w-4xl" viewBox="0 0 920 320" role="img" aria-label="Course builder illustration">
      <rect width="920" height="320" rx="24" fill="#f4f7ff" />
      <g fill="#dfe8fb">
        <circle cx="214" cy="192" r="86" />
        <circle cx="438" cy="128" r="94" />
        <circle cx="704" cy="177" r="88" />
        <path d="M68 216h784c-17-36-54-61-97-61-15 0-29 3-42 9-27-42-74-69-128-69-73 0-134 51-149 119-30-32-72-52-119-52-60 0-112 33-140 82-25-18-56-28-89-28H68Z" opacity=".7" />
      </g>
      <g className="origin-center animate-[float_4s_ease-in-out_infinite]">
        <rect x="330" y="154" width="210" height="92" rx="18" fill="#ffd25f" />
        <path d="M330 174c35-57 176-57 210 0v36H330v-36Z" fill="#357cf4" />
        <circle cx="391" cy="153" r="28" fill="#fff" />
        <circle cx="479" cy="153" r="28" fill="#fff" />
        <circle cx="402" cy="158" r="9" fill="#0455d8" />
        <circle cx="491" cy="158" r="9" fill="#0455d8" />
        <path d="M416 184c9 31 62 31 72 0H416Z" fill="#0d3472" />
        <path d="M377 212h126M377 230h100" stroke="#0d62d9" strokeWidth="6" strokeLinecap="round" />
      </g>
      <g className="origin-center animate-[float_3.2s_ease-in-out_infinite_0.4s]" transform="translate(604 184)">
        <rect x="0" y="36" width="104" height="44" rx="12" fill="#d3e0ff" />
        <circle cx="36" cy="34" r="32" fill="#357cf4" />
        <circle cx="74" cy="34" r="32" fill="#357cf4" />
        <circle cx="39" cy="26" r="17" fill="#fff" />
        <circle cx="76" cy="26" r="17" fill="#fff" />
        <circle cx="43" cy="29" r="6" fill="#0455d8" />
        <circle cx="72" cy="29" r="6" fill="#0455d8" />
        <path d="M47 49c6 17 32 17 38 0H47Z" fill="#0d3472" />
      </g>
      <g fill="#2f6fea" opacity=".95">
        <rect x="350" y="286" width="78" height="22" rx="11" />
        <rect x="468" y="286" width="78" height="22" rx="11" />
        <rect x="586" y="286" width="78" height="22" rx="11" />
      </g>
    </svg>
  );
}

function TopicEditorShell({
  title,
  summary,
  onTitleChange,
  onSummaryChange,
  onCancel,
  onConfirm,
}: {
  title: string;
  summary: string;
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-152px)] rounded-lg border-2 border-[#4772f2] bg-[#f6f7fb]">
      <div className="grid grid-cols-[36px_1fr] gap-6 px-8 py-6">
        <GripVertical className="mt-4 text-[#9aa3b2]" size={28} />
        <div className="grid gap-12">
          <input
            className="min-h-20 rounded-lg border-0 bg-white px-8 text-2xl font-semibold text-[#404756] outline-none placeholder:text-[#737b8d]"
            placeholder="Add a module title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
          />
          <textarea
            className="min-h-72 resize-y rounded-lg border-0 bg-white px-8 py-8 text-2xl font-semibold leading-9 text-[#404756] outline-none placeholder:text-[#737b8d]"
            placeholder="Add a module summary"
            value={summary}
            onChange={(event) => onSummaryChange(event.target.value)}
          />
          <div className="flex justify-end gap-8 pr-1 text-xl font-semibold">
            <button className="min-h-16 px-2 text-[#596273]" type="button" onClick={onCancel}>Cancel</button>
            <button className="min-h-16 rounded-lg bg-[#e9edff] px-8 text-[#3867ee]" type="button" onClick={onConfirm}>Ok</button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 border-t border-[#d9dde5] px-8 py-8">
        <ShellActionButton label="Topic" onClick={() => undefined} />
        <ShellActionButton label="Subtopic" onClick={() => undefined} />
        <button
          className="ml-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#9aa3b2]"
          type="button"
          aria-label="Module options"
        >
          <MoreVertical size={30} />
        </button>
      </div>
    </div>
  );
}

function SubtopicModal({
  title,
  notes,
  titlePlaceholder = "Add a subtopic title",
  notesPlaceholder = "Add subtopic notes",
  onTitleChange,
  onNotesChange,
  onCancel,
  onConfirm,
}: {
  title: string;
  notes: string;
  titlePlaceholder?: string;
  notesPlaceholder?: string;
  onTitleChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071a38]/45 px-4 py-6">
      <div className="w-full max-w-3xl rounded-xl border border-[#d5e2f0] bg-[#f6f7fb] p-6 shadow-[0_24px_90px_rgba(8,43,99,0.26)]">
        <div className="grid grid-cols-[28px_1fr] gap-5">
          <GripVertical className="mt-4 text-[#9aa3b2]" size={24} />
          <div className="grid gap-5">
            <input
              className="min-h-16 rounded-lg border-0 bg-white px-5 text-xl font-semibold text-[#404756] outline-none placeholder:text-[#737b8d]"
              placeholder={titlePlaceholder}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              autoFocus
            />
            <textarea
              className="min-h-48 resize-y rounded-lg border-0 bg-white px-5 py-5 text-lg font-semibold leading-8 text-[#404756] outline-none placeholder:text-[#737b8d]"
              placeholder={notesPlaceholder}
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
            <div className="flex justify-end gap-5 text-base font-semibold">
              <button className="min-h-12 px-2 text-[#596273]" type="button" onClick={onCancel}>Cancel</button>
              <button className="min-h-12 rounded-lg bg-[#e9edff] px-6 text-[#3867ee]" type="button" onClick={onConfirm}>Ok</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizUploadModal({
  title,
  onTitleChange,
  onCancel,
  onUpload,
  onCreateEmpty,
  settings,
  onSettingsChange,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  onCancel: () => void;
  onUpload: (file: File | null, onProgress?: (stage: number) => void) => Promise<boolean>;
  onCreateEmpty: () => Promise<boolean>;
  settings: typeof emptyQuizForm;
  onSettingsChange: (settings: typeof emptyQuizForm) => void;
}) {
  const inputId = "course-quiz-upload";
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "creating" | "done" | "error">("idle");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const uploading = status === "uploading" || status === "creating";
  const busyRef = useRef(false);
  const steps = ["Reading Excel file", "Creating quiz", "Saving questions"];
  const upload = async (selected: File) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setFile(selected);
    setStatus("uploading");
    setStage(0);
    setError("");
    try {
      const saved = await onUpload(selected, setStage);
      if (!saved) throw new Error("Upload did not complete. Please try again.");
      setStage(3);
      setStatus("done");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed. Please try again.");
      setStatus("error");
    } finally { busyRef.current = false; }
  };
  const createEmpty = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setStatus("creating");
    setError("");
    try {
      if (!await onCreateEmpty()) throw new Error("Quiz could not be created.");
      onCancel();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Quiz could not be created.");
      setStatus("error");
    } finally { busyRef.current = false; }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071a38]/45 px-4 py-6">
      <div role="dialog" aria-modal="true" aria-labelledby="quiz-upload-title" aria-busy={uploading} className="max-h-full w-full max-w-3xl overflow-y-auto rounded-xl border border-[#d5e2f0] bg-[#f6f7fb] p-6 shadow-[0_24px_90px_rgba(8,43,99,0.26)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-[#06479b]">Quiz</span>
            <h3 id="quiz-upload-title" className="mt-1 text-2xl font-black text-[#10243f]">Create Quiz</h3>
          </div>
          <button className="min-h-10 px-2 text-sm font-black text-[#596273] disabled:opacity-40" type="button" disabled={uploading} onClick={onCancel}>{status === "done" ? "Done" : "Cancel"}</button>
        </div>
        <div className="grid gap-5">
          <input
            aria-label="Quiz title"
            className="min-h-16 rounded-lg border-0 bg-white px-5 text-xl font-semibold text-[#404756] outline-none placeholder:text-[#737b8d]"
            placeholder="Quiz title"
            value={title}
            disabled={uploading || status === "done"}
            onChange={(event) => onTitleChange(event.target.value)}
            autoFocus
          />
          <fieldset disabled={uploading} className="grid gap-3 sm:grid-cols-3">
            <Field label="Time limit (minutes)" type="number" value={String(settings.timeLimitMinutes)} onChange={(value) => onSettingsChange({ ...settings, timeLimitMinutes: Number(value) })} />
            <Field label="Attempts allowed" type="number" value={String(settings.attemptsAllowed)} onChange={(value) => onSettingsChange({ ...settings, attemptsAllowed: Number(value) })} />
            <Field label="Passing score (%)" type="number" value={String(settings.passingPercent)} onChange={(value) => onSettingsChange({ ...settings, passingPercent: Number(value) })} />
          </fieldset>
          <div className="rounded-lg border border-[#d5e2f0] bg-white p-4">
            <p className="mb-3 text-sm text-[#5e7086]">Create an empty quiz, then add questions one at a time.</p>
            <PrimaryButton type="button" disabled={uploading || !title.trim()} onClick={() => void createEmpty()}>
              {status === "creating" ? "Creating…" : "Create Quiz & Add Questions"}
            </PrimaryButton>
          </div>
          <div className="grid min-h-72 place-items-center rounded-lg border-2 border-dashed border-[#8dbcf5] bg-white p-8 text-center">
            <div className="w-full min-w-0">
              {status === "done" ? <CheckCircle2 className="mx-auto text-emerald-600" size={46} /> : <UploadCloud className="mx-auto text-[#3867ee]" size={46} />}
              <strong className="mt-4 block text-xl font-black text-[#10243f]">{file ? file.name : "Bulk upload quiz questions"}</strong>
              {file && <small className="mt-1 block text-[#737b8d]">{(file.size / 1024).toFixed(1)} KB</small>}
              <div role="status" aria-live="polite" className="mt-4 text-sm font-bold text-[#06479b]">
                {uploading ? `${steps[stage] ?? "Finishing upload"}…` : status === "done" ? "Upload complete — quiz and questions saved." : ""}
              </div>
              {(uploading || status === "done") && <div className="mt-4">
                <progress className="h-3 w-full accent-[#3867ee]" value={stage} max={3} aria-label="Quiz upload steps completed" />
                <ol className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-[#737b8d]">{steps.map((step, index) => <li key={step}>{stage > index ? "✓ " : ""}{step}</li>)}</ol>
              </div>}
              {error && <p role="alert" className="mt-3 text-sm font-bold text-rose-700">{error}</p>}
              {!uploading && status !== "done" && <label htmlFor={inputId} className="mt-3 inline-flex cursor-pointer rounded-md bg-[#e9edff] px-6 py-3 text-base font-black text-[#3867ee]">{file ? "Choose another Excel file" : "Choose Excel file"}</label>}
              <small className="mt-4 block font-semibold text-[#737b8d]">Supports .xlsx and .xls question templates</small>
              <input id={inputId} className="sr-only" type="file" disabled={uploading || status === "done"}
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(event) => { const selected = event.target.files?.[0]; event.currentTarget.value = ""; if (selected) void upload(selected); }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShellActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="inline-flex min-h-12 items-center gap-3 rounded-md border border-[#c4cad4] bg-white px-5 text-sm font-black text-[#596273] transition hover:border-[#8dbcf5] hover:bg-[#f8fbff] hover:text-[#06479b]"
      type="button"
      onClick={onClick}
    >
      <Plus className="text-[#aab2bf]" size={20} />
      {label}
    </button>
  );
}

function QuestionBankActions({ view, onBack }: { view: QuestionBankView; onBack: () => void }) {
  if (view === "exams") return <DatePill />;
  return <SecondaryButton className="h-10 min-h-10 gap-2 border-0 bg-transparent px-0 text-xs" type="button" onClick={onBack}>
    <ArrowLeft size={15} /> {view === "subjects" ? "Exams" : "Subjects"}
  </SecondaryButton>;
}

function QuestionBankFlow({ view, exams, subjects, selectedExam, selectedSubject, questions, courses,
  questionCountsBySubject, onChooseExam, onChooseSubject, onCreateQuestion, onUpdateQuestion, onImportQuestions,
}: {
  view: QuestionBankView;
  exams: ExamOption[];
  subjects: SubjectOption[];
  selectedExam: ExamOption;
  selectedSubject: SubjectOption;
  questions: Question[];
  courses: api.CourseContent[];
  questionCountsBySubject: Map<string, number>;
  onChooseExam: (examId: string) => void;
  onChooseSubject: (subjectId: string) => void;
  onCreateQuestion: (input: QuestionInput) => Promise<void>;
  onUpdateQuestion: (id: string, input: QuestionInput) => Promise<void>;
  onImportQuestions: (questions: QuestionInput[]) => Promise<void>;
}) {
  if (view === "exams") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            questions={estimatedExamQuestions(exam, questionCountsBySubject)}
            onClick={() => onChooseExam(exam.id)}
          />
        ))}
      </div>
    );
  }

  if (view === "subjects") {
    return (
      <div className="space-y-5">
        <Breadcrumb items={["Question Bank", selectedExam.title]} />
        <ExamHero exam={selectedExam} />
        <div className="grid gap-4 md:grid-cols-2">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              questions={questionCountsBySubject.get(subject.id) ?? 0}
              onClick={() => onChooseSubject(subject.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return <div className="space-y-5">
    <Breadcrumb items={["Question Bank", selectedExam.title, selectedSubject.title]} />
    <QuestionManager key={selectedSubject.id} subject={selectedSubject.id} questions={questions} courses={courses}
      onCreate={onCreateQuestion} onUpdate={onUpdateQuestion} onImport={onImportQuestions} />
  </div>;
}

function ExamCard({ exam, questions, onClick }: { exam: ExamOption; questions: number; onClick: () => void }) {
  return (
    <button
      className={`group min-h-44 rounded-lg border p-6 text-left shadow-[0_18px_55px_rgba(8,43,99,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_65px_rgba(8,43,99,0.12)] ${accentClasses(exam.accent).card}`}
      type="button"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid h-14 w-14 place-items-center rounded-full ${accentClasses(exam.accent).icon}`}>
          <GraduationCap size={25} />
        </span>
        <span className={`grid h-10 w-10 place-items-center rounded-full ${accentClasses(exam.accent).soft}`}>
          <ArrowRight className="transition group-hover:translate-x-0.5" size={18} />
        </span>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-black">{exam.title}</h2>
        <p className="mt-1 min-h-10 max-w-xs text-sm font-semibold leading-5 text-[#5e7086]">{exam.description}</p>
      </div>
      <div className="mt-5 grid gap-1 text-sm font-black">
        <span>{exam.subjects} Subjects</span>
        <span>{questions.toLocaleString()} Questions</span>
      </div>
    </button>
  );
}

function SubjectCard({ subject, questions, onClick }: { subject: SubjectOption; questions: number; onClick: () => void }) {
  const Icon = subject.icon;

  return (
    <button className={`group min-h-36 rounded-lg border p-5 text-left transition hover:-translate-y-0.5 ${accentClasses(subject.accent).card}`} type="button" onClick={onClick}>
      <div className="flex items-start gap-4">
        <span className={`grid h-14 w-14 place-items-center rounded-lg ${accentClasses(subject.accent).icon}`}>
          <Icon size={25} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-lg font-black">{subject.title}</strong>
          <span className="mt-6 block text-sm font-black">{questions.toLocaleString()} Questions</span>
          <span className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#edf5ff] px-3 py-2 text-xs font-black text-[#06479b]">
            Manage Questions <ArrowRight className="transition group-hover:translate-x-0.5" size={15} />
          </span>
        </span>
      </div>
    </button>
  );
}

function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs font-black text-[#5e7086]" aria-label="Question bank breadcrumb">
      {items.map((item, index) => (
        <span className="flex items-center gap-2" key={`${item}-${index}`}>
          <span className={index === items.length - 1 ? "text-[#10243f]" : "text-[#06479b]"}>{item}</span>
          {index < items.length - 1 && <ArrowRight size={13} />}
        </span>
      ))}
    </nav>
  );
}

function ExamHero({ exam }: { exam: ExamOption }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-[#d5e2f0] bg-white p-5 shadow-[0_18px_55px_rgba(8,43,99,0.06)]">
      <span className={`grid h-16 w-16 place-items-center rounded-full ${accentClasses(exam.accent).icon}`}>
        <GraduationCap size={30} />
      </span>
      <span>
        <strong className="block text-3xl font-black">{exam.title}</strong>
        <span className="mt-1 block text-sm font-semibold text-[#5e7086]">{exam.description}</span>
      </span>
    </div>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string; type?: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#5e7086]">
      {label}
      <input className="h-10 rounded-md border border-[#d5e2f0] bg-[#f8fbff] px-3 text-sm font-semibold text-[#10243f] outline-none focus:border-[#06479b]" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#5e7086]">
      {label}
      <textarea className="min-h-20 resize-y rounded-md border border-[#d5e2f0] bg-[#f8fbff] p-3 text-sm font-semibold text-[#10243f] outline-none focus:border-[#06479b]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function DatePill() {
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d5e2f0] bg-white px-3 text-xs font-black text-[#5e7086]">
      Sep 22, 2026 <CalendarDays size={15} />
    </span>
  );
}

function ActionButton({ icon: Icon, label, tone, onClick }: { icon: LucideIcon; label: string; tone: "blue" | "green" | "purple" | "orange"; onClick: () => void }) {
  const tones = {
    blue: "bg-[#edf5ff] text-[#06479b]",
    green: "bg-[#edf8ef] text-[#087c22]",
    purple: "bg-violet-50 text-violet-700",
    orange: "bg-orange-50 text-orange-700",
  };

  return (
    <button className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-black ${tones[tone]}`} type="button" onClick={onClick}>
      <Icon size={16} />
      {label}
    </button>
  );
}

function ActivityList({ attempts, feedback, questions }: { attempts: StudentAttempt[]; feedback: StudentFeedback[]; questions: number }) {
  const items = [
    ...attempts.slice(0, 2).map((attempt) => ({ title: `${attempt.student} ${attempt.status === "completed" ? "completed" : "started"} an attempt`, detail: formatDate(attempt.submittedAt ?? attempt.startedAt), icon: FileQuestion })),
    ...feedback.slice(0, 1).map((item) => ({ title: `${item.student} sent feedback`, detail: `${item.rating}/5 rating`, icon: Bell })),
    { title: "Question bank updated", detail: `${questions} questions available`, icon: FileQuestion },
  ];

  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div className="flex items-center gap-3 border-b border-[#e8f0fa] pb-3 last:border-0 last:pb-0" key={`${item.title}-${index}`}>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edf5ff] text-[#06479b]"><Icon size={17} /></span>
            <span>
              <strong className="block text-sm font-black">{item.title}</strong>
              <small className="text-xs font-semibold text-[#5e7086]">{item.detail}</small>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ score, completion }: { score: number; completion: number }) {
  const scoreLine = `10,86 74,${80 - score * 0.35} 138,${92 - score * 0.3} 202,${82 - score * 0.25} 266,${78 - score * 0.4} 330,${62 - score * 0.2}`;
  const completionLine = `10,94 74,88 138,86 202,${90 - completion * 0.25} 266,${84 - completion * 0.28} 330,${80 - completion * 0.2}`;

  return (
    <svg className="h-56 w-full" viewBox="0 0 350 130" role="img" aria-label="Performance chart">
      {[20, 50, 80, 110].map((y) => <line key={y} x1="0" x2="350" y1={y} y2={y} stroke="#e8f0fa" />)}
      <polyline points={completionLine} fill="none" stroke="#9fb8d8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={scoreLine} fill="none" stroke="#06479b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {[10, 74, 138, 202, 266, 330].map((x, index) => <circle key={x} cx={x} cy={[86, 52, 65, 58, 42, 50][index]} r="4" fill="#06479b" />)}
    </svg>
  );
}

function TopicBars({ topics }: { topics: Array<{ topic: string; count: number }> }) {
  const max = Math.max(1, ...topics.map((topic) => topic.count));
  return (
    <div className="grid gap-4">
      {topics.slice(0, 6).map((topic) => (
        <div className="grid gap-1" key={topic.topic}>
          <div className="flex justify-between text-sm font-bold">
            <span>{topic.topic}</span>
            <span>{Math.round((topic.count / max) * 100)}%</span>
          </div>
          <span className="h-2 overflow-hidden rounded-full bg-[#edf5ff]">
            <span className="block h-full rounded-full bg-[#06479b]" style={{ width: `${Math.max(12, (topic.count / max) * 100)}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

function FeedbackSummary({ feedback }: { feedback: StudentFeedback[] }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-black">
      <span className="rounded-md bg-[#edf8ef] px-3 py-2 text-[#087c22]">Positive {feedback.filter((item) => item.rating >= 4).length}</span>
      <span className="rounded-md bg-[#edf5ff] px-3 py-2 text-[#06479b]">Neutral {feedback.filter((item) => item.rating === 3).length}</span>
      <span className="rounded-md bg-rose-50 px-3 py-2 text-rose-600">Negative {feedback.filter((item) => item.rating < 3).length}</span>
    </div>
  );
}

function SettingToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e8f0fa] py-3 last:border-0">
      <span className="text-sm font-bold">{label}</span>
      <span className={`flex h-6 w-11 items-center rounded-full p-1 ${enabled ? "justify-end bg-[#06479b]" : "justify-start bg-[#d5e2f0]"}`}>
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>
    </div>
  );
}

function accentClasses(accent: ExamOption["accent"] | SubjectOption["accent"]) {
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

function estimatedExamQuestions(exam: ExamOption, questionCountsBySubject: Map<string, number>) {
  const actual = subjectCatalog.reduce((sum, subject) => sum + (questionCountsBySubject.get(subject.id) ?? 0), 0);
  const fallback = { ssce: 1420, utme: 980, jupeb: 640, ijmb: 520 }[exam.id] ?? 0;
  return actual || fallback;
}

function getQuestionPageTitle(view: QuestionBankView, exam: ExamOption, subject: SubjectOption) {
  if (view === "subjects") return exam.title;
  if (view === "bank") return subject.title;
  return "Question Bank";
}

function getQuestionPageSubtitle(view: QuestionBankView, exam: ExamOption, subject: SubjectOption) {
  if (view === "subjects") return "Choose a subject under the selected exam.";
  if (view === "bank") return `View, search, and manage questions for ${exam.title} - ${subject.title}.`;
  return "Select an examination to manage questions.";
}

function pageTitle(section: AdminSection) {
  return {
    overview: "Welcome back",
    courses: "Courses",
    questions: "Question Bank",
    reports: "Students",
    feedback: "Feedback",
    settings: "Settings",
  }[section];
}

function pageSubtitle(section: AdminSection, name: string) {
  return {
    overview: `${name}, here's what's happening with your question bank and students.`,
    courses: "Create courses, modules, topics, and quizzes.",
    questions: "Upload, organise, and manage your questions.",
    reports: "View student progress, responses, and performance.",
    feedback: "Student ratings and comments on learning activity.",
    settings: "Manage platform, question, and account preferences.",
  }[section];
}

function feedbackRating(feedback: StudentFeedback[]) {
  if (!feedback.length) return "0/5";
  const rating = feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length;
  return `${rating.toFixed(1)}/5`;
}

function formatDate(value?: string) {
  if (!value) return "Sep 22, 2026";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Admin";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TA";
}

function slugCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "COURSE";
}
