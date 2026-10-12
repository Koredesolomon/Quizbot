import { ArrowLeft, ArrowRight, BookOpen, Inbox } from "lucide-react";
import type * as api from "@/lib/api";
import { unassignedQuestions, type QuestionInput, type QuizQuestionContext } from "@/lib/question-editor";
import type { Question } from "@/types/platform";
import { QuestionManager } from "../question-manager";
import { SecondaryButton, StatusBadge } from "../ui";
import type { QuestionBankView } from "./config";
import { DatePill } from "./ui";

export function QuestionBankActions({ view, onBack }: { view: QuestionBankView; onBack: () => void }) {
  if (view === "courses") return <DatePill />;
  return <SecondaryButton className="h-10 min-h-10 gap-2 border-0 bg-transparent px-0 text-xs" type="button" onClick={onBack}>
    <ArrowLeft size={15} /> {view === "quiz" ? "Course" : "Courses"}
  </SecondaryButton>;
}

export function QuestionBankFlow({ view, courses, questions, selectedCourse, selectedQuiz, onOpenCourse, onOpenUnassigned, onOpenQuiz,
  onCreateQuestion, onUpdateQuestion, onImportQuestions,
}: {
  view: QuestionBankView;
  courses: api.CourseContent[];
  questions: Question[];
  selectedCourse?: api.CourseContent;
  selectedQuiz?: QuizQuestionContext;
  onOpenCourse: (courseId: string) => void;
  onOpenUnassigned: () => void;
  onOpenQuiz: (quiz: QuizQuestionContext) => void;
  onCreateQuestion: (input: QuestionInput) => Promise<void>;
  onUpdateQuestion: (id: string, input: QuestionInput) => Promise<void>;
  onImportQuestions: (questions: QuestionInput[]) => Promise<void>;
}) {
  const unassigned = unassignedQuestions(questions, courses);
  const managerProps = { questions, courses, onCreate: onCreateQuestion, onUpdate: onUpdateQuestion, onImport: onImportQuestions };

  if (view === "quiz" && selectedQuiz && selectedCourse) {
    return <div className="space-y-5">
      <Breadcrumb items={["Question Bank", selectedCourse.title, selectedQuiz.label.split(" / ").pop() ?? "Quiz"]} />
      <QuestionManager key={selectedQuiz.quizId} subject={selectedQuiz.subject} context={selectedQuiz} {...managerProps} />
    </div>;
  }

  if (view === "course" && selectedCourse) {
    return <div className="space-y-5">
      <Breadcrumb items={["Question Bank", selectedCourse.title]} />
      <QuestionManager key={selectedCourse.id} subject={selectedCourse.subject} scope={{ kind: "course", course: selectedCourse, onOpenQuiz }} {...managerProps} />
    </div>;
  }

  if (view === "unassigned") {
    return <div className="space-y-5">
      <Breadcrumb items={["Question Bank", "Unassigned"]} />
      <QuestionManager subject={courses[0]?.subject ?? "Physics"} scope={{ kind: "unassigned" }} {...managerProps} />
    </div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course) => {
        const courseQuestions = questions.filter((question) => question.courseId === course.id);
        const quizzes = course.modules.flatMap((module) => module.topics.flatMap((topic) => topic.subtopics.flatMap((subtopic) => subtopic.quizzes)));
        return (
          <button key={course.id} type="button" onClick={() => onOpenCourse(course.id)}
            className="group flex min-h-44 flex-col rounded-lg border border-[#b8d8ff] bg-gradient-to-br from-white to-[#edf5ff] p-5 text-left shadow-[0_18px_55px_rgba(8,43,99,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_65px_rgba(8,43,99,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#06479b] text-white"><BookOpen size={22} /></span>
              <StatusBadge tone={course.status === "published" ? "available" : "neutral"}>{course.status === "published" ? "Published" : "Draft"}</StatusBadge>
            </div>
            <span className="mt-4 text-xs font-black uppercase tracking-wide text-[#5e7086]">{course.code} · {course.subject}</span>
            <strong className="mt-1 text-xl font-black text-[#10243f]">{course.title}</strong>
            <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm font-black text-[#10243f]">
              <span>{courseQuestions.length} question{courseQuestions.length === 1 ? "" : "s"} · {quizzes.length} quiz{quizzes.length === 1 ? "" : "zes"}</span>
              <ArrowRight className="text-[#06479b] transition group-hover:translate-x-0.5" size={18} />
            </span>
          </button>
        );
      })}
      <button type="button" onClick={onOpenUnassigned}
        className="group flex min-h-44 flex-col rounded-lg border border-dashed border-[#c4cad4] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#8dbcf5]">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-600"><Inbox size={22} /></span>
        <strong className="mt-4 text-xl font-black text-[#10243f]">Unassigned</strong>
        <span className="mt-1 text-sm font-semibold text-[#5e7086]">Questions that are not in any course yet. Upload new questions here, then assign them to a quiz.</span>
        <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm font-black text-[#10243f]">
          <span>{unassigned.length} question{unassigned.length === 1 ? "" : "s"}</span>
          <ArrowRight className="text-[#06479b] transition group-hover:translate-x-0.5" size={18} />
        </span>
      </button>
      {!courses.length && <p className="text-sm font-semibold text-[#5e7086] md:col-span-2 xl:col-span-3">No courses yet. Create one under Courses to organise questions by module, topic and quiz.</p>}
    </div>
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
