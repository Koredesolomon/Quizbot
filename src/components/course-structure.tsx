"use client";

import { useState } from "react";
import { ChevronRight, GripVertical, Plus } from "lucide-react";
import type { CourseContent, CourseModule, StructureEdit } from "@/lib/api";

type Props = {
  modules: CourseModule[];
  courseStatus?: CourseContent["status"];
  activeModuleId?: string;
  activeTopicId?: string;
  activeSubtopicId?: string;
  onSelectModule: (id: string) => void;
  onSelectTopic: (id: string) => void;
  onSelectSubtopic: (id: string) => void;
  onAddTopic: (moduleId: string) => void;
  onAddSubtopic: (moduleId: string, topicId: string) => void;
  onAddQuiz: (moduleId: string, topicId: string, subtopicId: string) => void;
  onManageQuiz: (moduleId: string, topicId: string, subtopicId: string, quizId: string) => void;
  onPublishCourse: () => void;
  onDeleteCourse: () => void;
  onEdit: (input: StructureEdit) => Promise<void>;
  onReorder: (ids: string[]) => Promise<void>;
};

const action = "inline-flex min-h-9 items-center gap-1.5 px-1 text-sm font-semibold text-[#06479b] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-40";

export function CourseStructure(props: Props) {
  const [edit, setEdit] = useState<StructureEdit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const run = async (save: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try { await save(); } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save changes.");
    } finally { setBusy(false); }
  };
  const move = (source: string, targetIndex: number) => {
    const ids = props.modules.map((module) => module.id);
    const sourceIndex = ids.indexOf(source);
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= ids.length || sourceIndex === targetIndex) return;
    ids.splice(sourceIndex, 1);
    ids.splice(targetIndex, 0, source);
    void run(() => props.onReorder(ids));
  };
  const editableTitle = (input: StructureEdit) => (
    <button
      className="min-w-0 rounded text-left hover:text-[#06479b] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#06479b] disabled:opacity-40"
      type="button"
      disabled={busy}
      aria-label={`Edit ${input.title}`}
      title="Click to edit title and description"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setError("");
        setEdit(input);
      }}
    >
      {input.title}
    </button>
  );
  return (
    <div className="grid gap-4" aria-busy={busy}>
      <p className="text-sm text-[#5e7086]">Click a title to edit it. Use the arrow beside it to expand or collapse the section. Drag a module handle or use Move Up / Down to change the order.</p>
      {error && <p role="alert" className="rounded-md bg-rose-50 p-3 text-rose-700">{error}</p>}
      <span role="status" className="text-sm text-[#5e7086]">{busy ? "Saving changes…" : ""}</span>
      {props.modules.map((module, index) => (
        <article key={module.id} className={`border-b border-[#e1e7ef] py-4 ${over === module.id ? "bg-blue-50" : ""}`}
          onDragOver={(event) => { if (dragged && !busy) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(module.id); } }}
          onDrop={(event) => { event.preventDefault(); if (dragged) move(dragged, index); setDragged(null); setOver(null); }}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button type="button" className={`${action} cursor-grab`} draggable={!busy} disabled={busy} aria-label={`Drag ${module.title} to reorder`}
              onDragStart={(event) => { event.dataTransfer.setData("text/plain", module.id); event.dataTransfer.effectAllowed = "move"; setDragged(module.id); }}
              onDragEnd={() => { setDragged(null); setOver(null); }}><GripVertical size={18} /></button>
            <button className={action} disabled={busy || index === 0} onClick={() => move(module.id, index - 1)} type="button" aria-label={`Move ${module.title} up`}>Move Up</button>
            <button className={action} disabled={busy || index === props.modules.length - 1} onClick={() => move(module.id, index + 1)} type="button" aria-label={`Move ${module.title} down`}>Move Down</button>
          </div>
          <details open className="group/section">
            <summary className="flex cursor-pointer list-none items-center gap-4 py-3 text-xl font-normal text-[#123f63] [&::-webkit-details-marker]:hidden" onClick={() => props.onSelectModule(module.id)}><ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-[#8d95a5] transition-transform [[open]>summary>&]:rotate-90" /><strong className="shrink-0 font-semibold">Module {index + 1}</strong><span aria-hidden="true">-</span>{editableTitle({ moduleId: module.id, title: module.title, description: module.description ?? "" })}</summary>
            <div className="mt-3 grid gap-3 pl-4 sm:pl-6">
              {module.description && <p className="text-sm text-[#737b8d]">{module.description}</p>}
              {module.topics.map((topic, topicIndex) => (
                <div key={topic.id} className="py-2">
                  <details open className="group/section">
                    <summary className="flex cursor-pointer list-none items-center gap-4 py-3 text-lg font-normal text-[#123f63] [&::-webkit-details-marker]:hidden" onClick={() => { props.onSelectModule(module.id); props.onSelectTopic(topic.id); }}><ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-[#8d95a5] transition-transform [[open]>summary>&]:rotate-90" /><strong className="shrink-0 font-semibold">Topic {topicIndex + 1}</strong><span aria-hidden="true">-</span>{editableTitle({ moduleId: module.id, topicId: topic.id, title: topic.title, description: topic.description ?? "" })}</summary>
                    <div className="mt-2 grid gap-2 pl-4 sm:pl-6">
                      {topic.description && <p className="text-sm text-[#737b8d]">{topic.description}</p>}
                      {topic.subtopics.map((subtopic) => (
                        <div key={subtopic.id} className="py-1">
                          <details open className="group/section">
                            <summary className="flex cursor-pointer list-none items-center gap-4 py-3 text-lg font-normal text-[#123f63] [&::-webkit-details-marker]:hidden" onClick={() => { props.onSelectModule(module.id); props.onSelectTopic(topic.id); props.onSelectSubtopic(subtopic.id); }}><ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} className="shrink-0 text-[#8d95a5] transition-transform [[open]>summary>&]:rotate-90" />{editableTitle({ moduleId: module.id, topicId: topic.id, subtopicId: subtopic.id, title: subtopic.title, description: subtopic.description ?? "" })} ({subtopic.quizzes.length} quizzes)</summary>
                            {subtopic.description && <p className="mt-2 text-sm text-[#737b8d]">{subtopic.description}</p>}
                            <ul className="mt-2 grid gap-2 text-sm text-[#404756]">{subtopic.quizzes.map((quiz) => <li key={quiz.id} className="flex flex-wrap items-center justify-between gap-2 py-1 pl-4 text-[#5e7086]"><div><strong>{quiz.title}</strong> · {quiz.timeLimitMinutes} min{quiz.description && <p>{quiz.description}</p>}</div><button className={action} type="button" disabled={busy} onClick={() => props.onManageQuiz(module.id, topic.id, subtopic.id, quiz.id)}>Manage Questions</button></li>)}</ul>
                            {!subtopic.quizzes.length && <p className="mt-2 text-sm text-[#737b8d]">No quizzes yet.</p>}
                          </details>
                          <button className={`${action} ml-4`} type="button" disabled={busy} onClick={() => props.onAddQuiz(module.id, topic.id, subtopic.id)}><Plus size={16} />Add Quiz</button>
                        </div>
                      ))}
                      {!topic.subtopics.length && <p className="text-sm text-[#737b8d]">No subtopics yet.</p>}
                      <button className={`${action} justify-self-start`} type="button" disabled={busy} onClick={() => props.onAddSubtopic(module.id, topic.id)}><Plus size={16} />Add Subtopic</button>
                    </div>
                  </details>
                </div>
              ))}
              {!module.topics.length && <p className="text-sm text-[#737b8d]">No topics yet.</p>}
              <button className={`${action} justify-self-start`} type="button" disabled={busy} onClick={() => props.onAddTopic(module.id)}><Plus size={16} />Add Topic</button>
            </div>
          </details>
        </article>
      ))}
      <div className="flex gap-3">
        {props.courseStatus === "published" ? <span className="p-3 font-bold text-emerald-700">Published</span> : <button className={action} type="button" disabled={busy} onClick={props.onPublishCourse}>Publish Course</button>}
        <button className={action} type="button" disabled={busy} onClick={props.onDeleteCourse}>Delete Course</button>
      </div>
      {edit && <div className="fixed inset-0 z-50 grid place-items-center bg-[#071a38]/45 p-4">
        <form role="dialog" aria-modal="true" aria-labelledby="structure-edit-title" className="grid w-full max-w-xl gap-4 rounded-xl bg-white p-6" onSubmit={(event) => { event.preventDefault(); if (!edit.title.trim()) return; void run(async () => { await props.onEdit(edit); setEdit(null); }); }}>
          <h3 id="structure-edit-title" className="text-xl font-black">Edit {edit.subtopicId ? "subtopic" : edit.topicId ? "topic" : "module"}</h3>
          <label className="grid gap-2">Title<input autoFocus required value={edit.title} disabled={busy} onChange={(event) => setEdit({ ...edit, title: event.target.value })} className="rounded border p-3" /></label>
          <label className="grid gap-2">Description<textarea value={edit.description} disabled={busy} onChange={(event) => setEdit({ ...edit, description: event.target.value })} className="min-h-32 rounded border p-3" /></label>
          {error && <p role="alert" className="text-rose-700">{error}</p>}
          <div className="flex justify-end gap-3"><button type="button" className={action} disabled={busy} onClick={() => setEdit(null)}>Cancel</button><button type="submit" className={action} disabled={busy || !edit.title.trim()}>{busy ? "Saving…" : "Save changes"}</button></div>
        </form>
      </div>}
    </div>
  );
}
