import { Module } from "@nestjs/common";
import { AttemptsModule } from "../attempts/attempts.module";
import { FeedbackModule } from "../feedback/feedback.module";
import { QuestionsModule } from "../questions/questions.module";
import { UsersModule } from "../users/users.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [AttemptsModule, FeedbackModule, QuestionsModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
