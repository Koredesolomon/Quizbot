import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { QuestionsModule } from "../questions/questions.module";
import { ContentModule } from "../content/content.module";
import { Attempt, AttemptSchema } from "./attempt.schema";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";
import { AiMarkerService } from "./ai-marker.service";

@Module({
  imports: [
    QuestionsModule,
    ContentModule,
    MongooseModule.forFeature([
      { name: Attempt.name, schema: AttemptSchema },
    ]),
  ],
  controllers: [AttemptsController],
  providers: [AttemptsService, AiMarkerService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
