import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Course, CourseDocument } from "./course.schema";
import { CreateCourseDto, CreateLessonDto, CreateQuizDto } from "./dto";

@Injectable()
export class ContentService {
  constructor(@InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>) {}

  async listCourses() {
    const courses = await this.courseModel.find().sort({ createdAt: -1 }).exec();
    return courses.map((course) => this.publicCourse(course));
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

  async addLesson(courseId: string, input: CreateLessonDto) {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    course.lessons.push({
      _id: new Types.ObjectId(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      videoUrl: input.videoUrl?.trim() || undefined,
      materialUrl: input.materialUrl?.trim() || undefined,
    });
    await course.save();

    return this.publicCourse(course);
  }

  async addQuiz(courseId: string, input: CreateQuizDto) {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    course.quizzes.push({
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
      lessons: course.lessons.map((lesson) => ({
        id: lesson._id.toString(),
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        materialUrl: lesson.materialUrl,
      })),
      quizzes: course.quizzes.map((quiz) => ({
        id: quiz._id.toString(),
        title: quiz.title,
        description: quiz.description,
        timeLimitMinutes: quiz.timeLimitMinutes,
        attemptsAllowed: quiz.attemptsAllowed,
        passingPercent: quiz.passingPercent,
      })),
      createdBy: course.createdBy.toString(),
      createdAt: course.createdAt.toISOString(),
    };
  }
}
