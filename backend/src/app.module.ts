import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminModule } from "./admin/admin.module";
import { AttemptsModule } from "./attempts/attempts.module";
import { AuthModule } from "./auth/auth.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { QuestionsModule } from "./questions/questions.module";
import { StoreModule } from "./store.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    StoreModule,
    UsersModule,
    AuthModule,
    QuestionsModule,
    AttemptsModule,
    FeedbackModule,
    AdminModule,
  ],
})
export class AppModule {}
