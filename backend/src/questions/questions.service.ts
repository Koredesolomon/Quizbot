import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateQuestionDto } from "./dto";
import { Question, QuestionDocument } from "./question.schema";

@Injectable()
export class QuestionsService {
  constructor(@InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>) {}

  async list() {
    const questions = await this.questionModel.find().sort({ createdAt: -1 }).exec();
    return questions.map((question) => this.publicQuestion(question));
  }

  async create(input: CreateQuestionDto, adminId: string) {
    this.validateQuestion(input);

    const question = await this.questionModel.create({
      ...input,
      createdBy: new Types.ObjectId(adminId),
    });

    return this.publicQuestion(question);
  }

  async import(questions: CreateQuestionDto[], adminId: string) {
    return Promise.all(questions.map((question) => this.create(question, adminId)));
  }

  async findById(id: string) {
    const question = await this.questionModel.findById(id).exec();
    if (!question) throw new NotFoundException("Question not found.");
    return question;
  }

  async totalMarks() {
    const result = await this.questionModel.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$marks" } } },
    ]);
    return result[0]?.total ?? 0;
  }

  private validateQuestion(input: CreateQuestionDto) {
    if (input.type === "objective" && (!input.options || input.options.length < 2)) {
      throw new BadRequestException("Objective questions need at least two options.");
    }
  }

  publicQuestion(question: QuestionDocument) {
    return {
      id: question.id,
      type: question.type,
      topic: question.topic,
      prompt: question.prompt,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      marks: question.marks,
      difficulty: question.difficulty,
      learningObjective: question.learningObjective,
      rubricPoints: question.rubricPoints,
      commonMistakes: question.commonMistakes,
      keywords: question.keywords,
      createdBy: question.createdBy.toString(),
      createdAt: question.createdAt.toISOString(),
    };
  }
}
