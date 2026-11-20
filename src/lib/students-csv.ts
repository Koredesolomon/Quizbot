import type { RegisteredStudent } from "@/types/platform";

/**
 * A CSV cell. Names and emails are typed by students, and spreadsheet apps run text that starts with = + - or @ as a
 * formula, so those cells get a leading apostrophe. Cells with commas, quotes or line breaks are quoted.
 */
export function csvCell(value: string | number | null | undefined) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const studentCsvHeaders = [
  "Full name", "Email", "Username", "Sign-in method", "Date joined", "Quizzes started", "Quizzes completed", "Average score (%)", "Last active",
];

export function studentsToCsv(students: RegisteredStudent[]) {
  const rows = students.map((student) => [
    student.fullName,
    student.email,
    student.username ?? "",
    student.signInMethod === "google" ? "Google" : "Email and password",
    student.joinedAt.slice(0, 10),
    student.quizzesStarted,
    student.quizzesCompleted,
    student.averageScore ?? "",
    student.lastActiveAt?.slice(0, 10) ?? "",
  ]);
  return [studentCsvHeaders, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/** Case-insensitive match on name, email or username. */
export function filterStudents(students: RegisteredStudent[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return students;
  return students.filter((student) => [student.fullName, student.email, student.username ?? ""].some((field) => field.toLowerCase().includes(needle)));
}
