"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileQuestion,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import type * as api from "@/lib/api";
import { parseQuestionImportFile } from "@/lib/question-import";
import { quizQuestionContexts, questionInput, type QuestionInput, type QuizQuestionContext } from "@/lib/question-editor";
import type { Question, StudentAttempt, StudentFeedback } from "@/types/platform";
import { QuestionManager } from "./question-manager";
import { PrimaryButton, SecondaryButton, StatusBadge } from "./ui";
import {
  courseBuilderStorageKey,
  courseStepPaths,
  emptyCourseForm,
  emptyModuleForm,
  emptyQuizForm,
  emptySubtopicForm,
  emptyTopicForm,
  examOptions,
  savedCourseBuilderSelection,
  sectionPaths,
  subjectCatalog,
  type AdminSection,
  type CourseBuilderStep,
  type QuestionBankView,
} from "./admin/config";
import { CourseBuilder } from "./admin/course-builder";
import {
  feedbackRating,
  firstName,
  formatDate,
  getQuestionPageSubtitle,
  getQuestionPageTitle,
  initials,
  pageSubtitle,
  pageTitle,
  slugCode,
} from "./admin/format";
import { ActivityList, FeedbackSummary, LineChart, SettingToggle, TopicBars } from "./admin/overview-widgets";
import { QuestionBankActions, QuestionBankFlow } from "./admin/question-bank";
import { ActionButton, DataTable, DatePill, Field, MetricCard, PageHeading, Panel, ProfileMenuItem, SideItem } from "./admin/ui";

export type { AdminSection, CourseBuilderStep } from "./admin/config";


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
  onDeleteStructure,
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
  onDeleteStructure: (courseId: string, input: api.StructureDelete) => Promise<void>;
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

  const deleteStructure = async (input: api.StructureDelete) => {
    await onDeleteStructure(activeCourseId, input);
    if (input.kind === "topic" && activeTopic?.id === input.topicId) {
      setSelectedTopicId("");
      setSelectedSubtopicId("");
    } else if (input.kind === "subtopic" && activeSubtopic?.id === input.subtopicId) {
      setSelectedSubtopicId("");
    }
    setManagedQuiz(null);
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

  const readQuizUpload = async (file: File) => {
    if (!activeCourseId || !activeModuleId || !activeTopicId || !activeSubtopicId || !activeCourse || !activeSubtopic) {
      throw new Error("Create or select a subtopic before creating a quiz.");
    }

    if (!quizForm.title.trim()) {
      throw new Error("Enter a quiz title before uploading questions.");
    }

    const result = await parseQuestionImportFile(file, {
      defaultSubject: activeCourse.subject,
      idOffset: questions.length,
    });
    if (!result.questions.length && !result.needsAnswer.length) {
      const reasons = result.skipped.slice(0, 3).map((issue) => `${issue.location}: ${issue.message}`).join(" ");
      throw new Error(`No questions could be read from ${file.name}.${reasons ? ` ${reasons}` : ""}`);
    }
    return result;
  };

  const createQuizFromQuestions = async (parsedQuestions: Question[], onProgress?: (stage: number) => void) => {
    try {
      onProgress?.(1);
      const createdQuiz = await createQuiz();

      onProgress?.(2);
      await onImportQuestions(
        parsedQuestions.map((question) => ({
          ...questionInput(question),
          courseId: createdQuiz.courseId,
          moduleId: createdQuiz.moduleId,
          subtopicId: createdQuiz.subtopicId,
          quizId: createdQuiz.quizId,
          subject: createdQuiz.subject,
        }))
      );
      onProgress?.(3);
      setMessage(`Quiz created and ${parsedQuestions.length} questions uploaded.`);
      setManagedQuiz(createdQuiz);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Quiz could not be created from that file.");
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
                onDeleteStructure={deleteStructure}
                onReorderModules={(ids) => onReorderModules(activeCourseId, ids)}
                onAddModule={addModule}
                onAddTopic={addTopic}
                onAddSubtopic={addSubtopic}
                onReadQuizUpload={readQuizUpload}
                onCreateQuizFromQuestions={createQuizFromQuestions}
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

