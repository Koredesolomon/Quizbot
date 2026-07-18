import { Module } from "@nestjs/common";
import { QuestionsModule } from "../questions/questions.module";
import { StoreModule } from "../store.module";
import { AttemptsController } from "./attempts.controller";
import { AttemptsService } from "./attempts.service";

@Module({
  imports: [QuestionsModule, StoreModule],
  controllers: [AttemptsController],
  providers: [AttemptsService],
  exports: [AttemptsService],
})
export class AttemptsModule {}
