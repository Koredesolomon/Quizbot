import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminModule } from "./admin/admin.module";
import { AttemptsModule } from "./attempts/attempts.module";
import { AuthModule } from "./auth/auth.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { QuestionsModule } from "./questions/questions.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/quiz-bot"),
    UsersModule,
    AuthModule,
    QuestionsModule,
    AttemptsModule,
    FeedbackModule,
    AdminModule,
  ],
})
export class AppModule {}
