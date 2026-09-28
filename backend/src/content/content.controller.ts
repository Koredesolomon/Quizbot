import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import type { JwtUser } from "../common/jwt-user.type";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { ContentService } from "./content.service";
import { CreateCourseDto, CreateModuleDto, CreateQuizDto, CreateTopicDto } from "./dto";

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

  @Post("courses/:id/modules")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  addModule(@Param("id") id: string, @Body() body: CreateModuleDto) {
    return this.content.addModule(id, body);
  }

  @Post("courses/:id/modules/:moduleId/topics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  addTopic(@Param("id") id: string, @Param("moduleId") moduleId: string, @Body() body: CreateTopicDto) {
    return this.content.addTopic(id, moduleId, body);
  }

  @Post("courses/:id/modules/:moduleId/topics/:topicId/quizzes")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  addQuiz(
    @Param("id") id: string,
    @Param("moduleId") moduleId: string,
    @Param("topicId") topicId: string,
    @Body() body: CreateQuizDto
  ) {
    return this.content.addQuiz(id, moduleId, topicId, body);
  }
}
