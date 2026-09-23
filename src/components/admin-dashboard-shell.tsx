"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
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
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
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
import type { Question, StudentAttempt, StudentFeedback } from "@/types/platform";
import { MathContent } from "./math-content";
import { PrimaryButton, SecondaryButton, StatusBadge } from "./ui";

export type AdminSection = "overview" | "questions" | "reports" | "feedback" | "settings";

const sectionPaths: Record<AdminSection, string> = {
  overview: "/admin",
  questions: "/admin/questions",
  reports: "/admin/reports",
  feedback: "/admin/feedback",
  settings: "/admin/settings",
};

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
  questions,
  attempts,
  feedback,
  onAddQuestion,
  onImportQuestions,
  onReviewFeedback,
  onSignOut,
  onBack,
}: {
  adminName?: string;
  adminRole?: string;
  section?: AdminSection;
  questions: Question[];
  attempts: StudentAttempt[];
  feedback: StudentFeedback[];
  onAddQuestion: (question: Question) => void | Promise<void>;
  onImportQuestions: (questions: Question[]) => void | Promise<void>;
  onReviewFeedback: (id: string) => void;
  onSignOut: () => void;
  onBack: () => void;
}) {
  const router = useRouter();
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
  const selectedExam = examOptions.find((exam) => exam.id === selectedExamId) ?? examOptions[0];
  const selectedSubject = subjectCatalog.find((subject) => subject.id === selectedSubjectId) ?? subjectCatalog[2];
  const selectedSubjectQuestions = questions.filter((question) => (question.subject ?? "Physics") === selectedSubject.id);
  const questionPageTitle = getQuestionPageTitle(questionBankView, selectedExam, selectedSubject);
  const questionPageSubtitle = getQuestionPageSubtitle(questionBankView, selectedExam, selectedSubject);

  const openSection = (target: AdminSection) => {
    setIsProfileOpen(false);
    router.push(sectionPaths[target]);
  };

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
      const text = await file.text();
      const parsedQuestions = file.name.toLowerCase().endsWith(".csv")
        ? parseCsvQuestions(text, selectedSubject.id, questions.length)
        : (() => {
            const payload = JSON.parse(text);
            return Array.isArray(payload) ? payload : payload.questions;
          })();
      const cleanQuestions = Array.isArray(parsedQuestions)
        ? (parsedQuestions.map(normalizeQuestion).filter(Boolean) as Question[])
        : [];

      if (!cleanQuestions.length) {
        setMessage("No valid questions were found in that file.");
        return;
      }

      await onImportQuestions(cleanQuestions);
      setMessage(`${cleanQuestions.length} questions imported.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Import failed. Use a valid JSON file.");
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
                      <ProfileMenuItem icon={FileQuestion} label="Question Bank" onClick={() => openSection("questions")} />
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
                      <ActionButton icon={Plus} label="Add Question" onClick={() => { openSection("questions"); setQuestionBankView("add"); }} tone="blue" />
                      <ActionButton icon={Upload} label="Upload Questions" onClick={() => { openSection("questions"); setQuestionBankView("bulk"); }} tone="purple" />
                      <ActionButton icon={Users} label="View Students" onClick={() => openSection("reports")} tone="green" />
                      <ActionButton icon={Bell} label="Check Feedback" onClick={() => openSection("feedback")} tone="orange" />
                    </div>
                  </Panel>
                </div>
              </>
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
                <td className="border-b border-[#e8f0fa] px-3 py-3 font-semibold text-[#10243f]" key={`${rowIndex}-${cellIndex}`}>
                  <span className="line-clamp-2">{cell}</span>
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
      <SecondaryButton className="h-10 min-h-10 gap-2 rounded-md px-4 text-xs" type="button" onClick={onBack}>
        <ArrowLeft size={15} /> Back
      </SecondaryButton>
    );
  }

  if (view === "subjects") {
    return (
      <SecondaryButton className="h-10 min-h-10 gap-2 rounded-md px-4 text-xs" type="button" onClick={onBack}>
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
              <strong className="mt-4 block text-base font-black">Drag and drop your JSON or CSV file here</strong>
              <span className="mt-2 inline-flex rounded-md border border-[#8dbcf5] bg-white px-5 py-2 text-sm font-black text-[#06479b]">Browse File</span>
              <small className="mt-3 block font-semibold text-[#5e7086]">Supports: .json, .csv</small>
            </span>
            <input className="sr-only" type="file" accept=".json,.csv,application/json,text/csv" onChange={(event) => onImportQuestions(event.target.files?.[0] ?? null)} />
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
          headers={["", "#", "Question", "Topic", "Type", "Year", "Status", "Actions"]}
          rows={questions.slice(0, 10).map((question, index) => [
            <input key="select" aria-label={`Select question ${index + 1}`} type="checkbox" />,
            String(index + 1),
            question.prompt,
            question.topic,
            question.type === "objective" ? "MCQ" : "Theory",
            "2025",
            <StatusBadge key="status" tone="available">Published</StatusBadge>,
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
    questions: "Question Bank",
    reports: "Students",
    feedback: "Feedback",
    settings: "Settings",
  }[section];
}

function pageSubtitle(section: AdminSection, name: string) {
  return {
    overview: `${name}, here's what's happening with your question bank and students.`,
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

function normalizeQuestion(question: Partial<Question>, index: number): Question | null {
  if (!question.prompt || !question.answer || !question.explanation) return null;

  const type = question.type === "theory" ? "theory" : "objective";
  const options = Array.isArray(question.options) ? question.options.filter(Boolean) : undefined;
  if (type === "objective" && (!options || options.length < 2)) return null;

  return {
    id: String(question.id ?? index + 1),
    type,
    subject: question.subject || "Physics",
    topic: question.topic || "General",
    prompt: question.prompt,
    imageUrl: question.imageUrl,
    options: type === "objective" ? options : undefined,
    answer: question.answer,
    explanation: question.explanation,
    marks: Math.max(1, Number(question.marks) || 1),
    difficulty: question.difficulty ?? "medium",
    learningObjective: question.learningObjective,
    rubricPoints: Array.isArray(question.rubricPoints) ? question.rubricPoints.filter(Boolean) : undefined,
    commonMistakes: Array.isArray(question.commonMistakes) ? question.commonMistakes.filter(Boolean) : undefined,
    keywords: type === "theory" ? question.keywords ?? [] : undefined,
  };
}

function parseCsvQuestions(text: string, subject: string, offset: number): Partial<Question>[] {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map(parseCsvRow);

  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((row, index) => {
    const values = new Map(headers.map((header, headerIndex) => [header, row[headerIndex] ?? ""]));
    const type = values.get("type") === "theory" ? "theory" : "objective";
    const options = ["option a", "option b", "option c", "option d"]
      .map((header) => values.get(header))
      .filter((value): value is string => Boolean(value));

    return {
      id: String(offset + index + 1),
      type,
      subject: values.get("subject") || subject,
      topic: values.get("topic") || "General",
      prompt: values.get("question") || values.get("prompt") || "",
      imageUrl: values.get("imageurl") || values.get("image url") || values.get("diagram") || undefined,
      options: type === "objective" ? options : undefined,
      answer: values.get("answer") || "",
      explanation: values.get("explanation") || values.get("feedback") || "",
      marks: Number(values.get("marks")) || 1,
      difficulty: (values.get("difficulty") as Question["difficulty"]) || "medium",
      keywords: commaList(values.get("keywords") || ""),
    };
  });
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

function parseCsvRow(row: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (const character of row) {
    if (character === "\"") {
      quoted = !quoted;
      continue;
    }

    if (character === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}
