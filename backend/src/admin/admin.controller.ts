import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AttemptsService } from "../attempts/attempts.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { FeedbackService } from "../feedback/feedback.service";
import { QuestionsService } from "../questions/questions.service";
import { UsersService } from "../users/users.service";
import { buildStudentRows } from "./students";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(
    private readonly attempts: AttemptsService,
    private readonly feedback: FeedbackService,
    private readonly questions: QuestionsService,
    private readonly users: UsersService
  ) {}

  @Get("attempts")
  async attemptsList() {
    return this.attempts.allAttempts();
  }

  /** Everyone who has created a student account, including those who never started a quiz. */
  @Get("students")
  async studentsList() {
    const [students, activity] = await Promise.all([this.users.listStudents(), this.attempts.studentActivity()]);
    return buildStudentRows(students, activity);
  }

  @Get("feedback")
  async feedbackList() {
    return this.feedback.list();
  }

  @Patch("feedback/:id/reviewed")
  async markFeedbackReviewed(@Param("id") id: string) {
    return this.feedback.markReviewed(id);
  }

  @Get("analytics")
  async analytics() {
    const attempts = await this.attempts.allAttempts();
    const feedback = await this.feedback.list();
    const questions = await this.questions.list();
    const totalMarks = await this.questions.totalMarks();
    const completed = attempts.filter((attempt) => attempt.status === "completed");
    const averageScore = completed.length
      ? Math.round(completed.reduce((sum, attempt) => sum + attempt.percent, 0) / completed.length)
      : 0;

    return {
      questions: questions.length,
      totalMarks,
      attempts: attempts.length,
      activeStudents: attempts.filter((attempt) => attempt.status === "active").length,
      completedAttempts: completed.length,
      averageScore,
      unreadFeedback: feedback.filter((item) => item.status === "new").length,
      watchlist: completed.filter((attempt) => attempt.percent < 50),
    };
  }
}
