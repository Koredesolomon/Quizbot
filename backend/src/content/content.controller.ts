import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import type { JwtUser } from "../common/jwt-user.type";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { ContentService } from "./content.service";
import { CreateCourseDto, CreateLessonDto, CreateQuizDto } from "./dto";

@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("courses")
  listCourses() {
    return this.content.listCourses();
  }

  @Post("courses")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  createCourse(@Body() body: CreateCourseDto, @CurrentUser() user: JwtUser) {
    return this.content.createCourse(body, user.sub);
  }

  @Post("courses/:id/lessons")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  addLesson(@Param("id") id: string, @Body() body: CreateLessonDto) {
    return this.content.addLesson(id, body);
  }

  @Post("courses/:id/quizzes")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  addQuiz(@Param("id") id: string, @Body() body: CreateQuizDto) {
    return this.content.addQuiz(id, body);
  }
}
