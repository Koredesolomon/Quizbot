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
  Download,
  FileQuestion,
  FileSpreadsheet,
  FlaskConical,
  Gauge,
  GraduationCap,
  GripVertical,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MoreVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sigma,
  Star,
  Trash2,
  Upload,
  UploadCloud,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type * as api from "@/lib/api";
import { parseQuestionImportFile } from "@/lib/question-import";
import type { Question, StudentAttempt, StudentFeedback } from "@/types/platform";
import { CourseStructure } from "./course-structure";
import { MathContent } from "./math-content";
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

const emptyQuestion = {
  type: "objective",
  subject: "Physics",
  topic: "Physical quantities and units",
  prompt: "",
  imageUrl: "",
  options: "Option A\nOption B\nOption C\nOption D",
  answer: "",
  explanation: "",
  marks: 2,
  difficulty: "medium",
  learningObjective: "",
  rubricPoints: "",
  commonMistakes: "",
  keywords: "",
};

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

type QuestionForm = typeof emptyQuestion;
type QuestionBankView = "exams" | "subjects" | "bank" | "add" | "bulk";
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
  onAddQuestion: (question: Question) => void | Promise<void>;
  onImportQuestions: (questions: Question[]) => void | Promise<void>;
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
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestion);
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
    setQuestionForm((current) => ({ ...current, subject: subjectId }));
    setQuestionBankView("bank");
  };

  const createQuestion = async () => {
    const options = questionForm.options
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (!questionForm.prompt.trim() || !questionForm.answer.trim() || !questionForm.explanation.trim()) {
      setMessage("Complete the question, answer, and explanation.");
      return;
    }

    if (questionForm.type === "objective" && options.length < 2) {
      setMessage("Objective questions need at least two options.");
      return;
    }

    try {
      await onAddQuestion({
        id: nextQuestionId(questions),
        type: questionForm.type as Question["type"],
        subject: questionForm.subject,
        topic: questionForm.topic.trim() || "General",
        prompt: questionForm.prompt.trim(),
        imageUrl: questionForm.imageUrl || undefined,
        options: questionForm.type === "objective" ? options : undefined,
        answer: questionForm.answer.trim(),
        explanation: questionForm.explanation.trim(),
        marks: Math.max(1, Number(questionForm.marks) || 1),
        difficulty: questionForm.difficulty as Question["difficulty"],
        learningObjective: questionForm.learningObjective.trim() || undefined,
        rubricPoints: lines(questionForm.rubricPoints),
        commonMistakes: lines(questionForm.commonMistakes),
        keywords: questionForm.type === "theory" ? commaList(questionForm.keywords) : undefined,
      });
      setQuestionForm({ ...emptyQuestion, subject: selectedSubject.id });
      setMessage("Question saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Question could not be saved.");
    }
  };

  const importQuestions = async (file: File | null) => {
    if (!file) return;

    try {
      const cleanQuestions = await parseQuestionImportFile(file, {
        defaultSubject: selectedSubject.id,
        idOffset: questions.length,
      });

      if (!cleanQuestions.length) {
        setMessage("No valid questions were found in that file.");
        return;
      }

      await onImportQuestions(cleanQuestions);
      setMessage(`${cleanQuestions.length} questions imported.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed. Use a valid Excel file.");
    }
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
      const existingQuizIds = new Set((activeSubtopic?.quizzes ?? []).map((quiz) => quiz.id));
      const updatedCourse = await onAddQuiz(activeCourseId, activeModuleId, activeTopicId, activeSubtopicId, {
        title: quizForm.title.trim(),
        description: quizForm.description.trim() || undefined,
        timeLimitMinutes: Math.max(1, Number(quizForm.timeLimitMinutes) || 1),
        attemptsAllowed: Math.max(1, Number(quizForm.attemptsAllowed) || 1),
        passingPercent: Math.min(100, Math.max(0, Number(quizForm.passingPercent) || 0)),
      });
      const updatedTopic = (updatedCourse?.modules ?? [])
        .find((module) => module.id === activeModuleId)
        ?.topics?.find((topic) => topic.id === activeTopicId);
      const updatedSubtopic = updatedTopic?.subtopics?.find((subtopic) => subtopic.id === activeSubtopicId);
      const createdQuiz =
        (updatedSubtopic?.quizzes ?? []).find((quiz) => !existingQuizIds.has(quiz.id)) ??
        updatedSubtopic?.quizzes?.at(-1);

      onProgress?.(2);
      await onImportQuestions(
        cleanQuestions.map((question) => ({
          ...question,
          courseId: activeCourseId,
          moduleId: activeModuleId,
          subtopicId: activeSubtopicId,
          quizId: createdQuiz?.id,
        }))
      );
      onProgress?.(3);
      setMessage(`Quiz created and ${cleanQuestions.length} questions uploaded.`);
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
                      onAdd={() => setQuestionBankView("add")}
                      onBulk={() => setQuestionBankView("bulk")}
                      onBack={() => {
                        if (questionBankView === "subjects") setQuestionBankView("exams");
                        if (questionBankView === "bank") setQuestionBankView("subjects");
                        if (questionBankView === "add" || questionBankView === "bulk") setQuestionBankView("bank");
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

            {section === "courses" && (
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
                onOpenStep={openCourseStep}
              />
            )}

            {section === "questions" && (
              <QuestionBankFlow
                view={questionBankView}
                exams={examOptions}
                subjects={subjectCatalog}
                selectedExam={selectedExam}
                selectedSubject={selectedSubject}
                questions={selectedSubjectQuestions}
                questionCountsBySubject={questionCountsBySubject}
                questionForm={questionForm}
                onChooseExam={chooseExam}
                onChooseSubject={chooseSubject}
                onQuestionFormChange={setQuestionForm}
                onCreateQuestion={createQuestion}
                onImportQuestions={importQuestions}
                onDownloadTemplate={() => setMessage("Template download will use the selected exam and subject format.")}
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
}: {
  title: string;
  onTitleChange: (value: string) => void;
  onCancel: () => void;
  onUpload: (file: File | null, onProgress?: (stage: number) => void) => Promise<boolean>;
}) {
  const inputId = "course-quiz-upload";
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const uploading = status === "uploading";
  const steps = ["Reading Excel file", "Creating quiz", "Saving questions"];
  const upload = async (selected: File) => {
    if (uploading) return;
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
    }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#071a38]/45 px-4 py-6">
      <div role="dialog" aria-modal="true" aria-labelledby="quiz-upload-title" aria-busy={uploading} className="w-full max-w-3xl rounded-xl border border-[#d5e2f0] bg-[#f6f7fb] p-6 shadow-[0_24px_90px_rgba(8,43,99,0.26)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wide text-[#06479b]">Quiz</span>
            <h3 id="quiz-upload-title" className="mt-1 text-2xl font-black text-[#10243f]">Add quiz questions</h3>
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

function QuestionBankActions({
  view,
  onAdd,
  onBulk,
  onBack,
}: {
  view: QuestionBankView;
  onAdd: () => void;
  onBulk: () => void;
  onBack: () => void;
}) {
  if (view === "exams") return <DatePill />;

  if (view === "add" || view === "bulk") {
    return (
      <SecondaryButton className="h-10 min-h-10 gap-2 border-0 bg-transparent px-0 text-xs" type="button" onClick={onBack}>
        <ArrowLeft size={15} /> Back
      </SecondaryButton>
    );
  }

  if (view === "subjects") {
    return (
      <SecondaryButton className="h-10 min-h-10 gap-2 border-0 bg-transparent px-0 text-xs" type="button" onClick={onBack}>
        <ArrowLeft size={15} /> Exams
      </SecondaryButton>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <PrimaryButton className="h-10 min-h-10 gap-2 rounded-md px-4 text-xs" type="button" onClick={onAdd}>
        <Plus size={15} /> Add Question
      </PrimaryButton>
      <SecondaryButton className="h-10 min-h-10 gap-2 rounded-md px-4 text-xs" type="button" onClick={onBulk}>
        <Upload size={15} /> Bulk Upload
      </SecondaryButton>
    </div>
  );
}

function QuestionBankFlow({
  view,
  exams,
  subjects,
  selectedExam,
  selectedSubject,
  questions,
  questionCountsBySubject,
  questionForm,
  onChooseExam,
  onChooseSubject,
  onQuestionFormChange,
  onCreateQuestion,
  onImportQuestions,
  onDownloadTemplate,
}: {
  view: QuestionBankView;
  exams: ExamOption[];
  subjects: SubjectOption[];
  selectedExam: ExamOption;
  selectedSubject: SubjectOption;
  questions: Question[];
  questionCountsBySubject: Map<string, number>;
  questionForm: QuestionForm;
  onChooseExam: (examId: string) => void;
  onChooseSubject: (subjectId: string) => void;
  onQuestionFormChange: (form: QuestionForm) => void;
  onCreateQuestion: () => void;
  onImportQuestions: (file: File | null) => void;
  onDownloadTemplate: () => void;
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

  if (view === "add") {
    return (
      <div className="space-y-5">
        <Breadcrumb items={["Question Bank", selectedExam.title, selectedSubject.title, "Add Question"]} />
        <Panel title="Add Question">
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <ReadOnlyField label="Exam" value={selectedExam.title} />
              <ReadOnlyField label="Subject" value={selectedSubject.title} />
              <Field label="Topic" value={questionForm.topic} onChange={(value) => onQuestionFormChange({ ...questionForm, topic: value })} />
              <Select label="Question Type" value={questionForm.type} onChange={(value) => onQuestionFormChange({ ...questionForm, type: value as QuestionForm["type"] })}>
                <option value="objective">Multiple Choice</option>
                <option value="theory">Theory</option>
              </Select>
              <Select label="Year" value="2025" onChange={() => undefined}>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </Select>
              <Select label="Difficulty" value={questionForm.difficulty} onChange={(value) => onQuestionFormChange({ ...questionForm, difficulty: value as QuestionForm["difficulty"] })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_240px]">
              <TextArea label="Question" value={questionForm.prompt} onChange={(value) => onQuestionFormChange({ ...questionForm, prompt: value })} />
              <ImagePicker
                imageUrl={questionForm.imageUrl}
                onChange={(imageUrl) => onQuestionFormChange({ ...questionForm, imageUrl })}
              />
            </div>
            {subjectUsesLatex(selectedSubject.id) && (
              <LatexHelper
                subject={selectedSubject.id}
                value={questionForm.prompt}
                onInsert={(snippet) =>
                  onQuestionFormChange({
                    ...questionForm,
                    prompt: `${questionForm.prompt}${questionForm.prompt.endsWith(" ") || !questionForm.prompt ? "" : " "}${snippet}`,
                  })
                }
              />
            )}

            {questionForm.type === "objective" && (
              <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
                <div className="grid gap-2">
                  {["A", "B", "C", "D"].map((label, index) => (
                    <OptionField
                      key={label}
                      label={label}
                      value={questionForm.options.split("\n")[index] ?? ""}
                      onChange={(value) => {
                        const options = questionForm.options.split("\n");
                        options[index] = value;
                        onQuestionFormChange({ ...questionForm, options: options.join("\n") });
                      }}
                    />
                  ))}
                </div>
                <div className="grid gap-3">
                  <Field label="Correct Answer" value={questionForm.answer} onChange={(value) => onQuestionFormChange({ ...questionForm, answer: value })} />
                  <TextArea label="Explanation / Feedback" value={questionForm.explanation} onChange={(value) => onQuestionFormChange({ ...questionForm, explanation: value })} />
                </div>
              </div>
            )}

            {questionForm.type === "theory" && (
              <div className="grid gap-3 xl:grid-cols-2">
                <Field label="Model Answer" value={questionForm.answer} onChange={(value) => onQuestionFormChange({ ...questionForm, answer: value })} />
                <TextArea label="Explanation / Feedback" value={questionForm.explanation} onChange={(value) => onQuestionFormChange({ ...questionForm, explanation: value })} />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <SecondaryButton className="h-10 min-h-10 rounded-md px-8 text-xs" type="button">Save as Draft</SecondaryButton>
              <PrimaryButton className="h-10 min-h-10 gap-2 rounded-md px-8 text-xs" type="button" onClick={onCreateQuestion}>
                Save & Add Next <ArrowRight size={15} />
              </PrimaryButton>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  if (view === "bulk") {
    return (
      <div className="space-y-5">
        <Breadcrumb items={["Question Bank", selectedExam.title, selectedSubject.title, "Bulk Upload"]} />
        <Panel
          title="Bulk Upload Questions"
          toolbar={
            <SecondaryButton className="h-10 min-h-10 gap-2 rounded-md px-4 text-xs" type="button" onClick={onDownloadTemplate}>
              <Download size={15} /> Download Template
            </SecondaryButton>
          }
        >
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-[#edf5ff] p-4 text-sm font-bold text-[#10243f]">
            <SubjectIconBadge subject={selectedSubject} />
            <span>
              You are uploading to:
              <strong className="ml-2">{selectedExam.title} | {selectedSubject.title}</strong>
            </span>
          </div>
          <label className="grid min-h-56 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-[#8dbcf5] bg-[#f8fbff] p-8 text-center">
            <span>
              <UploadCloud className="mx-auto text-[#06479b]" size={42} />
              <strong className="mt-4 block text-base font-black">Drag and drop your Excel file here</strong>
              <span className="mt-2 inline-flex rounded-md border border-[#8dbcf5] bg-white px-5 py-2 text-sm font-black text-[#06479b]">Browse File</span>
              <small className="mt-3 block font-semibold text-[#5e7086]">Supports: .xlsx, .xls</small>
            </span>
            <input className="sr-only" type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={(event) => onImportQuestions(event.target.files?.[0] ?? null)} />
          </label>
          <div className="mt-4 rounded-lg bg-[#edf5ff] p-4 text-sm font-semibold text-[#06479b]">
            <strong className="mb-2 flex items-center gap-2 text-[#10243f]"><FileSpreadsheet size={16} /> Follow these steps:</strong>
            <ol className="ml-5 list-decimal space-y-1">
              <li>Download the template and fill in your questions.</li>
              <li>Upload the completed file.</li>
              <li>Preview and correct errors before import.</li>
              <li>Import your questions.</li>
            </ol>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Breadcrumb items={["Question Bank", selectedExam.title, selectedSubject.title]} />
      <Panel
        title={`${selectedSubject.title} Question Bank`}
        toolbar={<span className="rounded-md bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">{questions.length} Questions</span>}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex h-10 min-w-[260px] flex-1 items-center gap-2 rounded-md border border-[#d5e2f0] bg-[#f8fbff] px-3 text-sm font-semibold text-[#5e7086]">
            <Search size={15} />
            <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search questions, topics or keywords..." type="search" />
          </label>
          <FilterPills labels={["All Topics", "All Types"]} />
        </div>
        <DataTable
          headers={["", "#", "Question", "Topic", "Type", "Linked To", "Status", "Actions"]}
          rows={questions.map((question, index) => [
            <input key="select" aria-label={`Select question ${index + 1}`} type="checkbox" />,
            String(index + 1),
            <span className="line-clamp-3 max-w-xl" key="prompt">{question.prompt}</span>,
            question.topic,
            question.type === "objective" ? "MCQ" : "Theory",
            <span className="text-xs font-black text-[#5e7086]" key="linked">
              {question.quizId ? "Quiz" : question.subtopicId ? "Subtopic" : question.courseId ? "Course" : "Unassigned"}
            </span>,
            <StatusBadge key="status" tone={question.quizId || question.subtopicId ? "available" : "neutral"}>
              {question.quizId || question.subtopicId ? "Frontend ready" : "Question bank"}
            </StatusBadge>,
            <MoreHorizontal key="more" size={18} className="text-[#06479b]" />,
          ])}
        />
      </Panel>
    </div>
  );
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

function SubjectIconBadge({ subject }: { subject: SubjectOption }) {
  const Icon = subject.icon;

  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${accentClasses(subject.accent).icon}`}>
      <Icon size={20} />
    </span>
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#5e7086]">
      {label}
      <span className="flex h-10 items-center rounded-md border border-[#d5e2f0] bg-[#eef3f8] px-3 text-sm font-semibold text-[#10243f]">
        {value}
      </span>
    </label>
  );
}

function OptionField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-black text-[#5e7086]">
      <span className="grid h-9 w-9 place-items-center rounded-md border border-[#8dbcf5] bg-[#edf5ff] text-[#06479b]">{label}</span>
      <input
        className="h-10 min-w-0 flex-1 rounded-md border border-[#d5e2f0] bg-[#f8fbff] px-3 text-sm font-semibold text-[#10243f] outline-none focus:border-[#06479b]"
        placeholder={`Enter option ${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-black text-[#5e7086]">
      {label}
      <select className="h-10 rounded-md border border-[#d5e2f0] bg-[#f8fbff] px-3 text-sm font-semibold text-[#10243f] outline-none focus:border-[#06479b]" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
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

function LatexHelper({
  subject,
  value,
  onInsert,
}: {
  subject: string;
  value: string;
  onInsert: (snippet: string) => void;
}) {
  const snippets = latexSnippets(subject);

  return (
    <div className="rounded-lg border border-[#b8d8ff] bg-[#edf5ff] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-black text-[#06479b]">
          <Sigma size={17} /> LaTeX enabled
        </span>
        <span className="text-xs font-bold text-[#5e7086]">{subject}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {snippets.map((snippet) => (
          <button
            className="rounded-md border border-[#b8d8ff] bg-white px-3 py-2 text-xs font-black text-[#06479b] transition hover:border-[#06479b] hover:bg-[#f8fbff]"
            key={snippet.label}
            type="button"
            onClick={() => onInsert(snippet.value)}
          >
            {snippet.label}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-[#d5e2f0] bg-white p-3 text-sm font-semibold text-[#10243f]">
        <strong className="mb-2 block text-xs font-black uppercase text-[#5e7086]">Preview</strong>
        <MathContent>{value || "$x^2$"}</MathContent>
      </div>
    </div>
  );
}

function ImagePicker({ imageUrl, onChange }: { imageUrl: string; onChange: (imageUrl: string) => void }) {
  const [error, setError] = useState("");

  const handleFile = async (file: File | null) => {
    setError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose a valid image file.");
      return;
    }

    if (file.size > 1_500_000) {
      setError("Choose an image smaller than 1.5 MB.");
      return;
    }

    try {
      onChange(await readFileAsDataUrl(file));
    } catch {
      setError("Image could not be loaded.");
    }
  };

  return (
    <div className="grid gap-2">
      <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#b8d8ff] bg-[#edf5ff] px-3 text-center text-sm font-black text-[#06479b] transition hover:border-[#06479b]">
        <ImageIcon size={17} /> {imageUrl ? "Replace Image / Diagram" : "Add Image / Diagram"}
        <input
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
      {imageUrl && (
        <div className="rounded-md border border-[#d5e2f0] bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="max-h-40 w-full rounded object-contain" src={imageUrl} alt="Question diagram preview" />
          <button
            className="mt-2 inline-flex h-8 w-full items-center justify-center gap-2 rounded-md bg-rose-50 px-3 text-xs font-black text-rose-600 transition hover:bg-rose-100"
            type="button"
            onClick={() => onChange("")}
          >
            <Trash2 size={14} /> Remove image
          </button>
        </div>
      )}
    </div>
  );
}

function DatePill() {
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d5e2f0] bg-white px-3 text-xs font-black text-[#5e7086]">
      Sep 22, 2026 <CalendarDays size={15} />
    </span>
  );
}

function FilterPills({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label, index) => (
        <button className={`rounded-md px-3 py-1.5 text-xs font-black ${index === 0 ? "bg-[#06479b] text-white" : "bg-[#edf5ff] text-[#06479b]"}`} key={label} type="button">
          {label}
        </button>
      ))}
    </div>
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

function subjectUsesLatex(subject: string) {
  return ["Mathematics", "Physics", "Chemistry"].includes(subject);
}

function latexSnippets(subject: string) {
  const common = [
    { label: "Inline", value: "$x^2$" },
    { label: "Display", value: "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$" },
    { label: "Fraction", value: "$\\frac{a}{b}$" },
    { label: "Root", value: "$\\sqrt{x}$" },
  ];

  if (subject === "Physics") {
    return [
      ...common,
      { label: "Vector", value: "$\\vec{F}$" },
      { label: "Unit", value: "$\\mathrm{m\\,s^{-2}}$" },
      { label: "Dimension", value: "$MLT^{-2}$" },
    ];
  }

  if (subject === "Chemistry") {
    return [
      ...common,
      { label: "Formula", value: "$\\mathrm{H_2O}$" },
      { label: "Ion", value: "$\\mathrm{Na^+}$" },
      { label: "State", value: "$\\mathrm{CO_2(g)}$" },
    ];
  }

  return [
    ...common,
    { label: "Power", value: "$a^n$" },
    { label: "Subscript", value: "$x_1$" },
    { label: "Integral", value: "$\\int_0^1 x\\,dx$" },
  ];
}

function estimatedExamQuestions(exam: ExamOption, questionCountsBySubject: Map<string, number>) {
  const actual = subjectCatalog.reduce((sum, subject) => sum + (questionCountsBySubject.get(subject.id) ?? 0), 0);
  const fallback = { ssce: 1420, utme: 980, jupeb: 640, ijmb: 520 }[exam.id] ?? 0;
  return actual || fallback;
}

function getQuestionPageTitle(view: QuestionBankView, exam: ExamOption, subject: SubjectOption) {
  if (view === "subjects") return exam.title;
  if (view === "bank") return subject.title;
  if (view === "add") return "Add Question";
  if (view === "bulk") return "Bulk Upload Questions";
  return "Question Bank";
}

function getQuestionPageSubtitle(view: QuestionBankView, exam: ExamOption, subject: SubjectOption) {
  if (view === "subjects") return "Choose a subject under the selected exam.";
  if (view === "bank") return `View, search, and manage questions for ${exam.title} - ${subject.title}.`;
  if (view === "add") return `Create a new question for ${exam.title} - ${subject.title}.`;
  if (view === "bulk") return `Upload multiple questions for ${exam.title} - ${subject.title}.`;
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

function nextQuestionId(questions: Question[]) {
  return String(Math.max(0, ...questions.map((question) => Number(question.id) || 0)) + 1);
}

function lines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function commaList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function slugCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "COURSE";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("File reader returned an unsupported result."));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("File could not be read.")));
    reader.readAsDataURL(file);
  });
}
