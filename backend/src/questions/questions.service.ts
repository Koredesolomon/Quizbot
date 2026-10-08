import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateQuestionDto, UpdateQuestionDto } from "./dto";
import { Question, QuestionDocument } from "./question.schema";

@Injectable()
export class QuestionsService {
  constructor(@InjectModel(Question.name) private readonly questionModel: Model<QuestionDocument>) {}

  async list() {
    const questions = await this.questionModel.find().sort({ createdAt: 1, _id: 1 }).exec();
    return questions.map((question) => this.publicPrompt(question));
  }

  async listForAdmin() {
    const questions = await this.questionModel.find().sort({ createdAt: 1, _id: 1 }).exec();
    return questions.map((question) => this.publicQuestion(question));
  }

  async forQuiz(quizId: string) {
    return this.questionModel.find({ quizId }).sort({ createdAt: 1, _id: 1 }).exec();
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
    const savedQuestions = [];

    // Validate the whole upload before persisting any of its questions.
    questions.forEach((question) => this.validateQuestion(question));

    for (const question of questions) {
      savedQuestions.push(await this.create(question, adminId));
    }

    return savedQuestions;
  }

  async update(id: string, input: UpdateQuestionDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException("Invalid question ID.");
    const question = await this.findById(id);
    const updated = { ...question.toObject(), ...input };
    this.validateQuestion(updated);

    question.set(input);
    if (updated.type === "theory") question.options = undefined;
    if (updated.type === "objective") question.keywords = undefined;
    await question.save();
    return this.publicQuestion(question);
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
    if (input.type !== "objective" && input.type !== "theory") {
      throw new BadRequestException("Select a valid question type.");
    }
    for (const field of ["topic", "prompt", "answer", "explanation"] as const) {
      if (typeof input[field] !== "string" || !input[field].trim()) {
        throw new BadRequestException(`Enter a valid ${field}.`);
      }
    }
    if (!Number.isInteger(input.marks) || input.marks < 1) {
      throw new BadRequestException("Marks must be a positive whole number.");
    }
    if (input.type === "objective") {
      if (!input.options || input.options.length < 2 || input.options.some((option) => !option.trim())) {
        throw new BadRequestException("Objective questions need at least two non-empty options.");
      }
      const answer = input.answer.trim();
      const letter = answer.match(/^(?:option\s*)?([A-E])[).:-]?$/i);
      const isOption = input.options.some((option) => option.trim().toLowerCase() === answer.toLowerCase());
      if (!isOption && !(letter && input.options[letter[1].toUpperCase().charCodeAt(0) - 65])) {
        throw new BadRequestException("Select a correct answer from the question options.");
      }
    }
  }

  publicPrompt(question: QuestionDocument) {
    return {
      id: question.id,
      type: question.type,
      subject: question.subject ?? "Physics",
      courseId: question.courseId,
      moduleId: question.moduleId,
      subtopicId: question.subtopicId,
      quizId: question.quizId,
      topic: question.topic,
      prompt: question.prompt,
      imageUrl: question.imageUrl,
      options: question.options,
      marks: question.marks,
      difficulty: question.difficulty,
      learningObjective: question.learningObjective,
    };
  }

  publicQuestion(question: QuestionDocument) {
    return {
      ...this.publicPrompt(question),
      answer: question.answer,
      explanation: question.explanation,
      rubricPoints: question.rubricPoints,
      commonMistakes: question.commonMistakes,
      keywords: question.keywords,
      createdBy: question.createdBy.toString(),
      createdAt: question.createdAt.toISOString(),
    };
  }
}
