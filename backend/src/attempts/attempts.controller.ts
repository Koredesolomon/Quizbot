import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import type { JwtUser } from "../common/jwt-user.type";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { AttemptsService } from "./attempts.service";
import { SubmitAttemptDto } from "./dto";

@Controller("attempts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Post("start")
  @Roles("student", "admin")
  start(@CurrentUser() user: JwtUser) {
    return this.attempts.start(user.sub);
  }

  @Post(":id/submit")
  @Roles("student", "admin")
  submit(@Param("id") id: string, @Body() body: SubmitAttemptDto, @CurrentUser() user: JwtUser) {
    return this.attempts.submit(id, user.sub, body.answers);
  }

  @Get("me")
  @Roles("student", "admin")
  mine(@CurrentUser() user: JwtUser) {
    return this.attempts.myAttempts(user.sub);
  }
}
