import { Bell, FileQuestion } from "lucide-react";
import type { StudentAttempt, StudentFeedback } from "@/types/platform";
import { formatDate } from "./format";

export function ActivityList({ attempts, feedback, questions }: { attempts: StudentAttempt[]; feedback: StudentFeedback[]; questions: number }) {
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

export function LineChart({ score, completion }: { score: number; completion: number }) {
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

export function TopicBars({ topics }: { topics: Array<{ topic: string; count: number }> }) {
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

export function FeedbackSummary({ feedback }: { feedback: StudentFeedback[] }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs font-black">
      <span className="rounded-md bg-[#edf8ef] px-3 py-2 text-[#087c22]">Positive {feedback.filter((item) => item.rating >= 4).length}</span>
      <span className="rounded-md bg-[#edf5ff] px-3 py-2 text-[#06479b]">Neutral {feedback.filter((item) => item.rating === 3).length}</span>
      <span className="rounded-md bg-rose-50 px-3 py-2 text-rose-600">Negative {feedback.filter((item) => item.rating < 3).length}</span>
    </div>
  );
}

export function SettingToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#e8f0fa] py-3 last:border-0">
      <span className="text-sm font-bold">{label}</span>
      <span className={`flex h-6 w-11 items-center rounded-full p-1 ${enabled ? "justify-end bg-[#06479b]" : "justify-start bg-[#d5e2f0]"}`}>
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>
    </div>
  );
}
