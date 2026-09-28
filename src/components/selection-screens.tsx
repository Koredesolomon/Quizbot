import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Sparkles, X } from "lucide-react";
import type { CourseContent, CourseModule, CourseQuiz, CourseTopic } from "@/lib/api";
import type { Question } from "@/types/platform";
import { BackButton, Metric, Panel, PrimaryButton, StatusBadge, TileIcon } from "./ui";

const rowClass =
  "interactive-lift flex min-h-18 w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-950 transition hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg hover:shadow-indigo-100";
const lockedRowClass =
  "interactive-lift flex min-h-18 w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-slate-950";

export function HowItWorks({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const steps = [
    { icon: ClipboardCheck, title: "Choose a focused test", text: "Pick a subject, course, and topic so every session has a clear purpose." },
    { icon: Sparkles, title: "Take it at your pace", text: "Work through objective and theory questions in one calm, focused session." },
    { icon: CheckCircle2, title: "Get useful feedback", text: "See your score, marking, explanations, and the topics worth revisiting next." },
  ];

  return (
    <Panel title="A clearer way to practise" subtitle="Every session moves you from a question to a useful next step.">
      <BackButton className="mb-6" label="Home" onClick={onBack} />
      <div className="stagger-list grid gap-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <div className="flex items-start gap-4 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-4 sm:p-5" key={title}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-md text-white ${index === 1 ? "bg-[var(--brand-green)]" : "bg-[var(--brand-blue)]"}`}>
              <Icon aria-hidden="true" size={20} />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ink-muted)]">Step 0{index + 1}</span>
              <strong className="mt-1 block text-base font-black text-[var(--ink)]">{title}</strong>
              <span className="mt-2 block text-sm font-semibold leading-6 text-[var(--ink-muted)]">{text}</span>
            </span>
          </div>
        ))}
      </div>
      <PrimaryButton className="mt-6 w-full" type="button" onClick={onStart}>
        Start a practice session <ArrowRight aria-hidden="true" className="ml-2" size={17} />
      </PrimaryButton>
    </Panel>
  );
}

export function Courses({
  courses,
  registeredCourses,
  onSelectCourse,
  onRegisterCourse,
  onComingSoon,
  onBack,
}: {
  courses: CourseContent[];
  registeredCourses: string[];
  onSelectCourse: (courseId: string) => void;
  onRegisterCourse: (course: CourseContent) => void | Promise<void>;
  onComingSoon: () => void;
  onBack: () => void;
}) {
  const availableCourses = courses;

  return (
    <Panel title="Register for course" subtitle="Choose a course to unlock its topics, subtopics, and quizzes.">
      <BackButton className="mb-5" label="Home" onClick={onBack} />
      <div className="stagger-list space-y-3">
        {availableCourses.length ? availableCourses.map((course, index) => {
          const registered = registeredCourses.includes(course.code);

          return (
          <button
            className={rowClass}
            key={course.id}
            type="button"
            onClick={() => {
              if (registered) {
                onSelectCourse(course.id);
                return;
              }

              void onRegisterCourse(course);
            }}
          >
            <TileIcon>{index + 1}</TileIcon>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-black">{course.title}</strong>
              <small className="mt-1 block text-xs font-semibold text-slate-500">
                {course.code} · {course.modules.length} module{course.modules.length === 1 ? "" : "s"} · {registered ? "Registered" : "Available to register"}
              </small>
            </span>
            <StatusBadge tone="available">
              {registered ? "Continue" : "Register"}
            </StatusBadge>
          </button>
        );
        }) : (
          <button className={lockedRowClass} type="button" onClick={onComingSoon}>
            <TileIcon>0</TileIcon>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-black">No courses available</strong>
              <small className="mt-1 block text-xs font-semibold text-slate-500">Ask an admin to publish a course.</small>
            </span>
            <StatusBadge tone="neutral">Empty</StatusBadge>
          </button>
        )}
      </div>
    </Panel>
  );
}

export function Topics({
  course,
  openModuleId,
  onOpenModule,
  onSelectSubtopic,
  onBack,
}: {
  course?: CourseContent;
  openModuleId?: string;
  onOpenModule: (moduleId: string) => void;
  onSelectSubtopic: (module: CourseModule, subtopic: CourseTopic) => void;
  onBack: () => void;
}) {
  if (!course) {
    return (
      <Panel title="Course topics" subtitle="Select a course first.">
        <BackButton className="mb-5" label="Courses" onClick={onBack} />
        <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-5 text-center text-sm font-bold text-[var(--ink-muted)]">
          No selected course.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title={course.title} subtitle="Select a topic, then choose a subtopic.">
      <BackButton className="mb-5" label="Courses" onClick={onBack} />
      <div className="space-y-4">
        {course.modules.length ? course.modules.map((module, moduleIndex) => {
          const open = openModuleId === module.id;

          return (
            <section className="overflow-hidden rounded-lg border border-[#ece9e3] bg-white shadow-sm" key={module.id}>
              <button
                className={`flex min-h-20 w-full items-center gap-4 border-b px-6 text-left transition ${open ? "border-[#42b6ff]" : "border-transparent"}`}
                type="button"
                onClick={() => onOpenModule(open ? "" : module.id)}
              >
                {open ? <ChevronDown className="text-[#1683d8]" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                <strong className="min-w-0 flex-1 text-lg font-black text-[#0d4167]">
                  Topic {moduleIndex + 1} - {module.title}
                </strong>
                <span className="hidden h-4 w-36 rounded-full bg-[#f1eee8] sm:block" />
              </button>
              {open && (
                <div className="grid gap-y-9 divide-[#ece9e3] px-6 py-6 md:grid-cols-2 md:divide-x xl:grid-cols-3">
                  {module.topics.length ? module.topics.map((subtopic, subtopicIndex) => (
                    <button
                      className="min-h-24 px-4 text-left text-[#0d4167] transition hover:text-[#1683d8]"
                      key={subtopic.id}
                      type="button"
                      onClick={() => onSelectSubtopic(module, subtopic)}
                    >
                      <strong className="block text-base font-black">
                        {moduleIndex + 1}.{subtopicIndex + 1} - {subtopic.title}
                      </strong>
                      <span className="mt-5 block h-4 w-36 rounded-full bg-[#f1eee8]" />
                    </button>
                  )) : (
                    <p className="px-4 text-sm font-bold text-slate-500">No subtopics available yet.</p>
                  )}
                </div>
              )}
            </section>
          );
        }) : (
          <p className="rounded-lg border border-dashed border-[var(--line)] bg-[var(--surface-muted)] p-5 text-center text-sm font-bold text-[var(--ink-muted)]">
            No topics available yet.
          </p>
        )}
      </div>
    </Panel>
  );
}

export function Overview({
  questions,
  totalMarks,
  title = "Quiz overview",
  subtitle = "Review the selected quiz before starting.",
  onStart,
  onBack,
}: {
  questions: Question[];
  totalMarks: number;
  title?: string;
  subtitle?: string;
  onStart: () => void;
  onBack: () => void;
}) {
  const uploadedTopics = Array.from(new Set(questions.map((question) => question.topic).filter(Boolean)));

  return (
    <Panel title={title} subtitle={subtitle}>
      <BackButton className="mb-5" label="Topics" onClick={onBack} />
      <div className="stagger-list grid gap-3 sm:grid-cols-3">
        <Metric label="Questions" value={String(questions.length)} />
        <Metric label="Marks" value={String(totalMarks)} />
        <Metric label="Time" value="30 min" />
      </div>
      <div className="content-rise-delay mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-black text-slate-900">Topics Covered</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {uploadedTopics.length ? (
            uploadedTopics.map((topic) => <li key={topic}>{topic}</li>)
          ) : (
            <li>No uploaded questions yet.</li>
          )}
        </ul>
      </div>
      <PrimaryButton className="mt-6 w-full" disabled={questions.length === 0} type="button" onClick={onStart}>
        Start Test
      </PrimaryButton>
    </Panel>
  );
}

export function QuizPickerModal({
  subtopic,
  selectedQuizId,
  onSelectQuiz,
  onStart,
  onClose,
}: {
  subtopic?: CourseTopic;
  selectedQuizId?: string;
  onSelectQuiz: (quiz: CourseQuiz) => void;
  onStart: () => void;
  onClose: () => void;
}) {
  if (!subtopic) return null;
  const selectedQuiz = (subtopic.quizzes ?? []).find((quiz) => quiz.id === selectedQuizId);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
      <section className="relative min-h-[620px] w-full max-w-3xl rounded-2xl bg-white p-8 text-[#182437] shadow-[0_30px_110px_rgba(15,23,42,0.35)]">
        <button
          className="absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-full border-4 border-[#2293ee] text-slate-500 transition hover:bg-slate-50"
          type="button"
          aria-label="Close quiz picker"
          onClick={onClose}
        >
          <X size={30} />
        </button>
        <h2 className="pr-16 text-3xl font-semibold tracking-normal">{subtopic.title}</h2>
        <div className="mt-10 space-y-4">
          {subtopic.quizzes.length ? subtopic.quizzes.map((quiz, index) => (
            <button
              className={`flex w-full items-center gap-5 rounded-lg border p-4 text-left transition ${
                selectedQuizId === quiz.id ? "border-[#2293ee] bg-[#edf7ff]" : "border-slate-200 hover:border-[#2293ee]"
              }`}
              key={quiz.id}
              type="button"
              onClick={() => onSelectQuiz(quiz)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#182437] text-sm font-black text-white">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <strong className="block text-lg font-black">{quiz.title}</strong>
                <small className="mt-1 block text-sm font-semibold text-slate-500">{quiz.timeLimitMinutes} min · {quiz.attemptsAllowed} attempt(s)</small>
              </span>
            </button>
          )) : (
            <p className="rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm font-bold text-slate-500">
              No quizzes available for this subtopic yet.
            </p>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-end border-t border-[#ece9e3] px-8 py-6">
          {selectedQuiz && (
            <button
              className="rounded-lg border-4 border-[#182437] px-8 py-4 text-xl font-black text-[#182437] shadow-[6px_8px_0_#182437] transition hover:-translate-y-0.5"
              type="button"
              onClick={onStart}
            >
              Get started
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
