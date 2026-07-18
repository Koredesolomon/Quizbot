import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import type { JwtUser } from "../common/jwt-user.type";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { CreateFeedbackDto } from "./dto";
import { FeedbackService } from "./feedback.service";

@Controller("feedback")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  @Roles("student", "admin")
  create(@CurrentUser() user: JwtUser, @Body() body: CreateFeedbackDto) {
    return this.feedback.create(user.sub, body);
  }
}
