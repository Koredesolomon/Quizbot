import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import type { JwtUser } from "../common/jwt-user.type";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { ContentService } from "./content.service";
import { EditStructureDto, ReorderModulesDto, CreateCourseDto, CreateModuleDto, CreateQuizDto, CreateSubtopicDto, CreateTopicDto, UpdateCourseDto } from "./dto";

@Controller("content")
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("courses")
  listCourses() {
    return this.content.listCourses({ publishedOnly: true });
  }

  @Get("admin/courses")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  listAdminCourses() {
    return this.content.listCourses();
  }

  @Post("courses")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  createCourse(@Body() body: CreateCourseDto, @CurrentUser() user: JwtUser) {
    return this.content.createCourse(body, user.sub);
  }

  @Patch("courses/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  updateCourse(@Param("id") id: string, @Body() body: UpdateCourseDto) {
    return this.content.updateCourse(id, body);
  }

  @Post("courses/:id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  publishCourse(@Param("id") id: string) {
    return this.content.updateCourse(id, { status: "published" });
  }

  @Delete("courses/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  deleteCourse(@Param("id") id: string) {
    return this.content.deleteCourse(id);
  }

  @Post("courses/:id/delete")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  deleteCourseWithPost(@Param("id") id: string) {
    return this.content.deleteCourse(id);
  }

  @Patch("courses/:id/structure")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  editStructure(@Param("id") id: string, @Body() body: EditStructureDto) {
    return this.content.editStructure(id, body);
  }

  @Patch("courses/:id/modules/order")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  reorderModules(@Param("id") id: string, @Body() body: ReorderModulesDto) {
    return this.content.reorderModules(id, body.moduleIds);
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

  @Post("courses/:id/modules/:moduleId/topics/:topicId/subtopics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  addSubtopic(
    @Param("id") id: string,
    @Param("moduleId") moduleId: string,
    @Param("topicId") topicId: string,
    @Body() body: CreateSubtopicDto
  ) {
    return this.content.addSubtopic(id, moduleId, topicId, body);
  }

  @Post("courses/:id/modules/:moduleId/topics/:topicId/subtopics/:subtopicId/quizzes")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  addQuiz(
    @Param("id") id: string,
    @Param("moduleId") moduleId: string,
    @Param("topicId") topicId: string,
    @Param("subtopicId") subtopicId: string,
    @Body() body: CreateQuizDto
  ) {
    return this.content.addQuiz(id, moduleId, topicId, subtopicId, body);
  }
}
