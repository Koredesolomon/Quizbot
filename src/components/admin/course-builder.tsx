import type { ReactNode } from "react";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import type * as api from "@/lib/api";
import type { QuestionImportResult } from "@/lib/question-import";
import type { Question } from "@/types/platform";
import { CourseStructure } from "../course-structure";
import {
  emptyCourseForm,
  emptyModuleForm,
  emptyQuizForm,
  emptySubtopicForm,
  emptyTopicForm,
  type CourseBuilderStep,
} from "./config";
import { CourseEditModal, QuizUploadModal, SubtopicModal, TopicEditorShell } from "./course-builder-modals";
import { courseOutlineCounts } from "./format";
import { ShellActionButton } from "./ui";

export type CourseStatusView = "builder" | "published" | "draft";

export function CourseStateBadge({ status }: { status: api.CourseContent["status"] }) {
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

export function CourseStatusTab({
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

export function CourseStatusPanel({
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

export function CourseBuilder({
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
  onDeleteStructure,
  onReorderModules,
  onAddModule,
  onAddTopic,
  onAddSubtopic,
  onReadQuizUpload,
  onCreateQuizFromQuestions,
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
  onDeleteStructure: (input: api.StructureDelete) => Promise<void>;
  onReorderModules: (ids: string[]) => Promise<void>;
  onAddModule: () => boolean | Promise<boolean>;
  onAddTopic: () => boolean | Promise<boolean>;
  onAddSubtopic: () => boolean | Promise<boolean>;
  onReadQuizUpload: (file: File) => Promise<QuestionImportResult>;
  onCreateQuizFromQuestions: (questions: Question[], onProgress?: (stage: number) => void) => Promise<boolean>;
  onCreateEmptyQuiz: () => Promise<boolean>;
  onManageQuiz: (moduleId: string, topicId: string, subtopicId: string, quizId: string) => void;
  onOpenStep: (step: CourseBuilderStep) => void;
}) {
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
              onDeleteStructure={onDeleteStructure}
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
                    // With no subtopic to pick, the quiz goes on the topic itself.
                    activeSubtopicId || (activeTopicId ? activeTopicId : modules[0]?.topics[0]?.subtopics[0]?.id || modules[0]?.topics[0]?.id)
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
          subject={activeCourse?.subject ?? "Physics"}
          title={quizForm.title}
          onTitleChange={(title) => onQuizFormChange({ ...quizForm, title })}
          onCancel={closeQuizModal}
          onRead={onReadQuizUpload}
          onCreate={onCreateQuizFromQuestions}
          onCreateEmpty={onCreateEmptyQuiz}
          settings={quizForm}
          onSettingsChange={onQuizFormChange}
        />
      )}
    </section>
  );
}

export function CourseNameStart({
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

export function CourseEmptyState({ onAddTopic }: { onAddTopic: () => void }) {
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

export function CourseBuilderIllustration() {
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
