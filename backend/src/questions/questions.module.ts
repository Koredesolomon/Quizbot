import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Question, QuestionSchema } from "./question.schema";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }])],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
