import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import type { JwtUser } from "../common/jwt-user.type";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateQuestionDto, ImportQuestionsDto } from "./dto";
import { QuestionsService } from "./questions.service";

@Controller("questions")
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list() {
    return this.questions.list();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  create(@Body() body: CreateQuestionDto, @CurrentUser() user: JwtUser) {
    return this.questions.create(body, user.sub);
  }

  @Post("import")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  import(@Body() body: ImportQuestionsDto, @CurrentUser() user: JwtUser) {
    return this.questions.import(body.questions, user.sub);
  }
}
