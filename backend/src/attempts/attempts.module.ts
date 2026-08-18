import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { QuestionsModule } from "../questions/questions.module";
import { Answer, AnswerSchema } from "./answer.schema";
import { Attempt, AttemptSchema } from "./attempt.schema";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";

@Module({
  imports: [
    QuestionsModule,
    MongooseModule.forFeature([
      { name: Attempt.name, schema: AttemptSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
