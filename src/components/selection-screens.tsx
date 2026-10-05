import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Sparkles, X } from "lucide-react";
import type { CourseContent, CourseModule, CourseQuiz, CourseSubtopic } from "@/lib/api";
import type { Question } from "@/types/platform";
import { BackButton, Metric, Panel, PrimaryButton } from "./ui";

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
    <Panel bare title="Register for course" subtitle="Choose a course to unlock its topics, subtopics, and quizzes.">
      <BackButton className="mb-5" label="Home" onClick={onBack} />
      <div className="stagger-list space-y-5">
        {availableCourses.length ? availableCourses.map((course, index) => {
          const registered = registeredCourses.includes(course.code);
          const moduleCount = course.modules.length;
          const topicCount = course.modules.reduce((sum, module) => sum + module.topics.length, 0);
          const subtopicCount = course.modules.reduce(
            (sum, module) => sum + module.topics.reduce((topicSum, topic) => topicSum + topic.subtopics.length, 0),
            0
          );
          const quizCount = course.modules.reduce(
            (sum, module) =>
              sum +
              module.topics.reduce(
                (topicSum, topic) =>
                  topicSum + topic.subtopics.reduce((subtopicSum, subtopic) => subtopicSum + subtopic.quizzes.length, 0),
                0
              ),
            0
          );
          const focusModule = course.modules[0];
          const focusTopic = focusModule?.topics[0];
          const focusSubtopic = focusTopic?.subtopics[0];
          const progress = Math.min(100, Math.max(12, registered ? 68 : moduleCount ? 26 + moduleCount * 12 : 16));

          return (
            <button
              className="interactive-lift group grid min-h-52 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-left shadow-[0_22px_60px_rgba(8,43,99,0.12)] transition hover:-translate-y-1 hover:border-[var(--brand-blue)] hover:shadow-[0_30px_70px_rgba(8,43,99,0.18)] sm:grid-cols-[minmax(190px,0.82fr)_minmax(0,1.5fr)]"
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
              <span className="flex min-h-48 flex-col justify-between bg-[var(--brand-blue-deep)] p-7 text-white sm:min-h-full">
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Course {index + 1}</span>
                  <strong className="mt-5 block text-2xl font-semibold leading-tight tracking-normal text-white">{course.title}</strong>
                </span>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition group-hover:text-white">
                  View modules <ChevronRight aria-hidden="true" size={18} />
                </span>
              </span>

              <span className="grid gap-8 p-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <span className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-[var(--ink-muted)]">
                    {course.code || course.subject}
                  </span>
                  <strong className="mt-4 block text-3xl font-semibold leading-tight tracking-normal text-[var(--brand-blue-deep)]">
                    {focusSubtopic?.title ?? focusTopic?.title ?? focusModule?.title ?? course.subject}
                  </strong>
                  <span className="mt-5 block text-sm font-semibold leading-6 text-[var(--ink-muted)]">
                    {course.subject} · {moduleCount} module{moduleCount === 1 ? "" : "s"} · {topicCount} topic{topicCount === 1 ? "" : "s"} · {subtopicCount} subtopic{subtopicCount === 1 ? "" : "s"}
                  </span>
                </span>

                <span className="flex min-w-[180px] flex-col items-start gap-8 sm:items-end">
                  <span className="w-full max-w-56">
                    <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                      <span className="block h-full rounded-full bg-[var(--brand-blue-deep)] transition-all" style={{ width: `${progress}%` }} />
                    </span>
                    <span className="mt-2 block text-right text-[11px] font-semibold tracking-[0.24em] text-[var(--ink-muted)]">
                      {quizCount} Quiz{quizCount === 1 ? "" : "zes"}
                    </span>
                  </span>

                  <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--brand-blue-deep)] px-8 text-base font-semibold text-white shadow-[0_16px_30px_rgba(8,43,99,0.22)] transition group-hover:bg-[var(--brand-blue)]">
                    {registered ? "Continue" : "Register"}
                  </span>
                </span>
              </span>
            </button>
          );
        }) : (
          <button
            className="interactive-lift group grid min-h-48 w-full overflow-hidden rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] text-left shadow-[0_18px_45px_rgba(8,43,99,0.08)] transition hover:border-[var(--brand-blue)] sm:grid-cols-[minmax(190px,0.82fr)_minmax(0,1.5fr)]"
            type="button"
            onClick={onComingSoon}
          >
            <span className="flex min-h-44 flex-col justify-between bg-[var(--brand-blue-deep)] p-7 text-white">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Course library</span>
                <strong className="mt-5 block text-2xl font-semibold leading-tight tracking-normal text-white">Courses are on the way</strong>
              </span>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition group-hover:text-white">
                Check back soon <Sparkles aria-hidden="true" size={18} />
              </span>
            </span>
            <span className="flex flex-col justify-between gap-6 p-7 sm:flex-row sm:items-center">
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.3em] text-[var(--brand-green)]">Coming soon</span>
                <strong className="mt-4 block text-3xl font-semibold leading-tight tracking-normal text-[var(--ink)]">New courses are being prepared.</strong>
                <span className="mt-5 block text-sm font-semibold leading-6 text-[var(--ink-muted)]">Once a course is available, it will appear here for registration.</span>
              </span>
              <span className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--brand-mint)] px-7 text-base font-semibold text-[var(--brand-green)]">
                <CheckCircle2 aria-hidden="true" size={18} />
                Ready soon
              </span>
            </span>
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
  onSelectSubtopic: (module: CourseModule, subtopic: CourseSubtopic) => void;
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
            <section className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)] shadow-sm" key={module.id}>
              <button
                className="flex min-h-20 w-full items-center gap-4 px-6 text-left transition"
                type="button"
                onClick={() => onOpenModule(open ? "" : module.id)}
              >
                {open ? <ChevronDown className="text-[#1683d8]" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                <strong className="min-w-0 flex-1 text-lg font-semibold text-[var(--ink)]">
                  Topic {moduleIndex + 1} - <span className="font-medium">{module.title}</span>
                </strong>
                <span className="hidden h-4 w-36 rounded-full bg-[#f1eee8] sm:block" />
              </button>
              {open && (
                <div className="grid gap-y-9 divide-[var(--line)] px-6 py-6 md:grid-cols-2 md:divide-x xl:grid-cols-3">
                  {module.topics.length ? module.topics.map((topic, topicIndex) => (
                    <div className="px-4 text-left text-[var(--ink)]" key={topic.id}>
                      <strong className="block text-base font-semibold">
                        {moduleIndex + 1}.{topicIndex + 1} - <span className="font-medium">{topic.title}</span>
                      </strong>
                      <div className="mt-4 grid gap-3">
                        {topic.subtopics.length ? topic.subtopics.map((subtopic, subtopicIndex) => (
                          <button
                            className="min-h-12 rounded-md border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-left text-sm font-semibold transition hover:border-[var(--brand-green)] hover:text-[var(--brand-green)]"
                            key={subtopic.id}
                            type="button"
                            onClick={() => onSelectSubtopic(module, subtopic)}
                          >
                            {moduleIndex + 1}.{topicIndex + 1}.{subtopicIndex + 1} - {subtopic.title}
                          </button>
                        )) : (
                          <span className="block h-4 w-36 rounded-full bg-[#f1eee8]" />
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="px-4 text-sm font-bold text-slate-500">No topics available yet.</p>
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
  onClose,
}: {
  subtopic?: CourseSubtopic;
  selectedQuizId?: string;
  onSelectQuiz: (quiz: CourseQuiz) => void;
  onClose: () => void;
}) {
  if (!subtopic) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
      <section className="relative min-h-[620px] w-full max-w-3xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-[var(--ink)] shadow-[0_30px_110px_rgba(15,23,42,0.35)]">
        <button
          className="absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-full border-4 border-[var(--brand-blue)] text-[var(--ink-muted)] transition hover:bg-[var(--surface-muted)]"
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
                selectedQuizId === quiz.id ? "border-[var(--brand-blue)] bg-[var(--brand-ice)]" : "border-[var(--line)] hover:border-[var(--brand-blue)]"
              }`}
              key={quiz.id}
              type="button"
              onClick={() => onSelectQuiz(quiz)}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand-blue-deep)] text-sm font-black text-white">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <strong className="block text-lg font-black">{quiz.title}</strong>
                <small className="mt-1 block text-sm font-semibold text-[var(--ink-muted)]">{quiz.timeLimitMinutes} min · {quiz.attemptsAllowed} attempt(s)</small>
              </span>
            </button>
          )) : (
            <p className="rounded-lg border border-dashed border-[var(--line)] p-5 text-center text-sm font-bold text-[var(--ink-muted)]">
              No quizzes available for this subtopic yet.
            </p>
          )}
        </div>

      </section>
    </div>
  );
}
