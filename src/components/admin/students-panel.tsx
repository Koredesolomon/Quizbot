import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { filterStudents, studentsToCsv } from "@/lib/students-csv";
import type { RegisteredStudent } from "@/types/platform";
import { DataTable, Panel } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });
const day = (value?: string) => (value ? dateFormat.format(new Date(value)) : "—");

function downloadCsv(students: RegisteredStudent[]) {
  const blob = new Blob(["﻿", studentsToCsv(students)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Everyone who has created a student account, newest first, with a search box and a CSV download. */
export function StudentsPanel({ students }: { students: RegisteredStudent[] }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => filterStudents(students, query), [students, query]);
  const neverStarted = students.filter((student) => student.quizzesStarted === 0).length;

  return (
    <Panel
      title={`Registered students (${students.length})`}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Search students</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5e7086]" size={15} />
            <input
              className="h-9 w-56 rounded-md border border-[#d5e2f0] bg-white pl-9 pr-3 text-sm font-semibold outline-none focus:border-[#06479b]"
              placeholder="Search name or email"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d5e2f0] bg-white px-3 text-xs font-black text-[#06479b] transition hover:bg-[#edf5ff] disabled:opacity-50"
            disabled={!shown.length}
            type="button"
            onClick={() => downloadCsv(shown)}
          >
            <Download aria-hidden="true" size={14} /> Download CSV
          </button>
        </div>
      }
    >
      <p className="mb-3 text-xs font-semibold text-[#5e7086]">
        {query.trim() ? `${shown.length} of ${students.length} students match. ` : ""}
        {neverStarted} of {students.length} have not started a quiz yet.
      </p>
      <DataTable
        headers={["Name", "Email", "Joined", "Sign-in", "Quizzes done", "Avg. score", "Last active"]}
        rows={shown.map((student) => [
          <span key="name" className="block">
            {student.fullName}
            {student.username && <small className="block text-xs font-semibold text-[#5e7086]">@{student.username}</small>}
          </span>,
          student.email,
          day(student.joinedAt),
          student.signInMethod === "google" ? "Google" : "Email",
          `${student.quizzesCompleted}/${student.quizzesStarted}`,
          student.averageScore === null ? "—" : `${student.averageScore}%`,
          day(student.lastActiveAt),
        ])}
      />
    </Panel>
  );
}
