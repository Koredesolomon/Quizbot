import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import type * as api from "@/lib/api";
import type { QuestionInput } from "@/lib/question-editor";
import type { Question } from "@/types/platform";
import { QuestionManager } from "../question-manager";
import { SecondaryButton } from "../ui";
import type { ExamOption, QuestionBankView, SubjectOption } from "./config";
import { accentClasses, estimatedExamQuestions } from "./format";
import { DatePill } from "./ui";

export function QuestionBankActions({ view, onBack }: { view: QuestionBankView; onBack: () => void }) {
  if (view === "exams") return <DatePill />;
  return <SecondaryButton className="h-10 min-h-10 gap-2 border-0 bg-transparent px-0 text-xs" type="button" onClick={onBack}>
    <ArrowLeft size={15} /> {view === "subjects" ? "Exams" : "Subjects"}
  </SecondaryButton>;
}

export function QuestionBankFlow({ view, exams, subjects, selectedExam, selectedSubject, questions, courses,
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

export function ExamCard({ exam, questions, onClick }: { exam: ExamOption; questions: number; onClick: () => void }) {
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

export function SubjectCard({ subject, questions, onClick }: { subject: SubjectOption; questions: number; onClick: () => void }) {
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

export function Breadcrumb({ items }: { items: string[] }) {
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

export function ExamHero({ exam }: { exam: ExamOption }) {
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
