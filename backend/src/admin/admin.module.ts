import { Module } from "@nestjs/common";
import { AttemptsModule } from "../attempts/attempts.module";
import { FeedbackModule } from "../feedback/feedback.module";
import { QuestionsModule } from "../questions/questions.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [AttemptsModule, FeedbackModule, QuestionsModule],
  controllers: [AdminController],
})
export class AdminModule {}
