/** What the admin sees for each registered student. Never includes password hashes or reset tokens. */
export type StudentRow = {
  id: string;
  fullName: string;
  email: string;
  username?: string;
  signInMethod: "password" | "google";
  joinedAt: string;
  quizzesStarted: number;
  quizzesCompleted: number;
  /** Average percent over completed quizzes, or null when none are completed. */
  averageScore: number | null;
  lastActiveAt?: string;
};

export type StudentRecord = {
  _id: { toString(): string };
  fullName: string;
  email: string;
  username?: string;
  authProvider?: "password" | "google";
  createdAt: Date;
};

export type StudentActivity = {
  studentId: string;
  started: number;
  completed: number;
  averagePercent: number | null;
  lastActive?: Date;
};

/** Joins registered students with their quiz activity. Students who never started a quiz are kept, with zeros. */
export function buildStudentRows(students: StudentRecord[], activity: StudentActivity[]): StudentRow[] {
  const byStudent = new Map(activity.map((item) => [item.studentId, item]));
  return students.map((student) => {
    const stats = byStudent.get(student._id.toString());
    return {
      id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
      username: student.username || undefined,
      signInMethod: student.authProvider === "google" ? "google" : "password",
      joinedAt: student.createdAt.toISOString(),
      quizzesStarted: stats?.started ?? 0,
      quizzesCompleted: stats?.completed ?? 0,
      averageScore: stats?.averagePercent === null || stats?.averagePercent === undefined ? null : Math.round(stats.averagePercent),
      lastActiveAt: stats?.lastActive?.toISOString(),
    };
  });
}
