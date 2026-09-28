import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Course, CourseDocument } from "./course.schema";
import { CreateCourseDto, CreateModuleDto, CreateQuizDto, CreateTopicDto } from "./dto";

@Injectable()
export class ContentService {
  constructor(@InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>) {}

  async listCourses() {
    const courses = await this.courseModel.find().sort({ createdAt: -1 }).exec();
    return courses.map((course) => this.publicCourse(course));
  }

  async findByCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return null;

    const course = await this.courseModel.findOne({ code: normalizedCode }).exec();
    return course ? this.publicCourse(course) : null;
  }

  async createCourse(input: CreateCourseDto, adminId: string) {
    const course = await this.courseModel.create({
      title: input.title.trim(),
      code: input.code.trim().toUpperCase(),
      subject: input.subject.trim(),
      description: input.description?.trim() || undefined,
      status: input.status ?? "draft",
      createdBy: new Types.ObjectId(adminId),
    });

    return this.publicCourse(course);
  }

  async addModule(courseId: string, input: CreateModuleDto) {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    course.modules.push({
      _id: new Types.ObjectId(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      topics: [],
    });
    await course.save();

    return this.publicCourse(course);
  }

  async addTopic(courseId: string, moduleId: string, input: CreateTopicDto) {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    const module = course.modules.find((item) => item._id.toString() === moduleId);
    if (!module) throw new NotFoundException("Module was not found.");

    module.topics.push({
      _id: new Types.ObjectId(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      quizzes: [],
    });
    await course.save();

    return this.publicCourse(course);
  }

  async addQuiz(courseId: string, moduleId: string, topicId: string, input: CreateQuizDto) {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    const module = course.modules.find((item) => item._id.toString() === moduleId);
    if (!module) throw new NotFoundException("Module was not found.");

    const topic = module.topics.find((item) => item._id.toString() === topicId);
    if (!topic) throw new NotFoundException("Topic was not found.");

    topic.quizzes.push({
      _id: new Types.ObjectId(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      timeLimitMinutes: input.timeLimitMinutes,
      attemptsAllowed: input.attemptsAllowed,
      passingPercent: input.passingPercent,
    });
    await course.save();

    return this.publicCourse(course);
  }

  private publicCourse(course: CourseDocument) {
    return {
      id: course.id,
      title: course.title,
      code: course.code,
      subject: course.subject,
      description: course.description,
      status: course.status,
      modules: course.modules.map((module) => ({
        id: module._id.toString(),
        title: module.title,
        description: module.description,
        topics: module.topics.map((topic) => ({
          id: topic._id.toString(),
          title: topic.title,
          description: topic.description,
          quizzes: topic.quizzes.map((quiz) => ({
            id: quiz._id.toString(),
            title: quiz.title,
            description: quiz.description,
            timeLimitMinutes: quiz.timeLimitMinutes,
            attemptsAllowed: quiz.attemptsAllowed,
            passingPercent: quiz.passingPercent,
          })),
        })),
      })),
      createdBy: course.createdBy.toString(),
      createdAt: course.createdAt.toISOString(),
    };
  }
}
