import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { QuestionRecord, StoreService } from "../store.service";
import { CreateQuestionDto } from "./dto";

@Injectable()
export class QuestionsService {
  constructor(private readonly store: StoreService) {}

  list() {
    return this.store.questions;
  }

  create(input: CreateQuestionDto, adminId: string) {
    this.validateQuestion(input);

    const question: QuestionRecord = {
      id: crypto.randomUUID(),
      ...input,
      createdBy: adminId,
      createdAt: new Date().toISOString(),
    };

    this.store.questions.push(question);
    return question;
  }

  import(questions: CreateQuestionDto[], adminId: string) {
    return questions.map((question) => this.create(question, adminId));
  }

  findById(id: string) {
    const question = this.store.questions.find((item) => item.id === id);
    if (!question) throw new NotFoundException("Question not found.");
    return question;
  }

  totalMarks() {
    return this.store.questions.reduce((sum, question) => sum + question.marks, 0);
  }

  private validateQuestion(input: CreateQuestionDto) {
    if (input.type === "objective" && (!input.options || input.options.length < 2)) {
      throw new BadRequestException("Objective questions need at least two options.");
    }
  }
}
