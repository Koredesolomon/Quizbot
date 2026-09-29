import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Course, CourseDocument } from "./course.schema";
import { CreateCourseDto, CreateModuleDto, CreateQuizDto, CreateSubtopicDto, CreateTopicDto, UpdateCourseDto } from "./dto";

@Injectable()
export class ContentService {
  constructor(@InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>) {}

  async listCourses(options: { publishedOnly?: boolean } = {}) {
    const query: { status?: "published" } = options.publishedOnly ? { status: "published" } : {};
    const courses = await this.courseModel.find(query).sort({ createdAt: -1 }).exec();
    return courses.map((course) => this.publicCourse(course));
  }

  async findByCode(code: string) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return null;

    const course = await this.courseModel.findOne({ code: normalizedCode, status: "published" }).exec();
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

  async updateCourse(courseId: string, input: UpdateCourseDto) {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    if (input.title !== undefined) course.title = input.title.trim();
    if (input.code !== undefined) course.code = input.code.trim().toUpperCase();
    if (input.subject !== undefined) course.subject = input.subject.trim();
    if (input.description !== undefined) course.description = input.description.trim() || undefined;
    if (input.status !== undefined) course.status = input.status;

    await course.save();

    return this.publicCourse(course);
  }

  async deleteCourse(courseId: string) {
    const course = await this.courseModel.findByIdAndDelete(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    return {
      id: course.id,
      message: "Course deleted.",
    };
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
      subtopics: [],
    });
    await course.save();

    return this.publicCourse(course);
  }

  async addSubtopic(courseId: string, moduleId: string, topicId: string, input: CreateSubtopicDto) {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    const module = course.modules.find((item) => item._id.toString() === moduleId);
    if (!module) throw new NotFoundException("Module was not found.");

    const topic = module.topics.find((item) => item._id.toString() === topicId);
    if (!topic) throw new NotFoundException("Topic was not found.");

    topic.subtopics = topic.subtopics ?? [];
    topic.subtopics.push({
      _id: new Types.ObjectId(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      quizzes: [],
    });
    await course.save();

    return this.publicCourse(course);
  }

  async addQuiz(courseId: string, moduleId: string, topicId: string, subtopicId: string, input: CreateQuizDto) {
    const course = await this.courseModel.findById(courseId).exec();
    if (!course) throw new NotFoundException("Course was not found.");

    const module = course.modules.find((item) => item._id.toString() === moduleId);
    if (!module) throw new NotFoundException("Module was not found.");

    const topic = module.topics.find((item) => item._id.toString() === topicId);
    if (!topic) throw new NotFoundException("Topic was not found.");

    topic.subtopics = topic.subtopics ?? [];
    const quiz = {
      _id: new Types.ObjectId(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      timeLimitMinutes: input.timeLimitMinutes,
      attemptsAllowed: input.attemptsAllowed,
      passingPercent: input.passingPercent,
    };

    const subtopic = topic.subtopics.find((item) => item._id.toString() === subtopicId);
    if (subtopic) {
      subtopic.quizzes.push(quiz);
    } else if (topic._id.toString() === subtopicId) {
      topic.quizzes = [...(topic.quizzes ?? []), quiz];
    } else {
      throw new NotFoundException("Subtopic was not found.");
    }

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
          subtopics: [
            ...(topic.subtopics ?? []).map((subtopic) => ({
              id: subtopic._id.toString(),
              title: subtopic.title,
              description: subtopic.description,
              quizzes: subtopic.quizzes.map((quiz) => ({
                id: quiz._id.toString(),
                title: quiz.title,
                description: quiz.description,
                timeLimitMinutes: quiz.timeLimitMinutes,
                attemptsAllowed: quiz.attemptsAllowed,
                passingPercent: quiz.passingPercent,
              })),
            })),
            ...((topic.quizzes ?? []).length
              ? [
                  {
                    id: topic._id.toString(),
                    title: topic.title,
                    description: topic.description,
                    quizzes: (topic.quizzes ?? []).map((quiz) => ({
                      id: quiz._id.toString(),
                      title: quiz.title,
                      description: quiz.description,
                      timeLimitMinutes: quiz.timeLimitMinutes,
                      attemptsAllowed: quiz.attemptsAllowed,
                      passingPercent: quiz.passingPercent,
                    })),
                  },
                ]
              : []),
          ],
        })),
      })),
      createdBy: course.createdBy.toString(),
      createdAt: course.createdAt.toISOString(),
    };
  }
}
