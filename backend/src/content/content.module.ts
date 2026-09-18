import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { Course, CourseSchema } from "./course.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: Course.name, schema: CourseSchema }])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
