import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AttemptsService } from "../attempts/attempts.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { FeedbackService } from "../feedback/feedback.service";
import { QuestionsService } from "../questions/questions.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  constructor(
    private readonly attempts: AttemptsService,
    private readonly feedback: FeedbackService,
    private readonly questions: QuestionsService
  ) {}

  @Get("attempts")
  attemptsList() {
    return this.attempts.allAttempts();
  }

  @Get("feedback")
  feedbackList() {
    return this.feedback.list();
  }

  @Patch("feedback/:id/reviewed")
  markFeedbackReviewed(@Param("id") id: string) {
    return this.feedback.markReviewed(id);
  }

  @Get("analytics")
  analytics() {
    const attempts = this.attempts.allAttempts();
    const completed = attempts.filter((attempt) => attempt.status === "completed");
    const averageScore = completed.length
      ? Math.round(completed.reduce((sum, attempt) => sum + attempt.percent, 0) / completed.length)
      : 0;

    return {
      questions: this.questions.list().length,
      totalMarks: this.questions.totalMarks(),
      attempts: attempts.length,
      activeStudents: attempts.filter((attempt) => attempt.status === "active").length,
      completedAttempts: completed.length,
      averageScore,
      unreadFeedback: this.feedback.list().filter((item) => item.status === "new").length,
      watchlist: completed.filter((attempt) => attempt.percent < 50),
    };
  }
}
