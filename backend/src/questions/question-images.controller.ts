import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";

type UploadedQuestionImage = { buffer: Buffer; mimetype: string; size: number };

export const maxQuestionImageBytes = 5 * 1024 * 1024;

/** Detects the real image format from its first bytes; SVG is excluded because it can carry scripts. */
export function questionImageExtension(buffer: Buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return ".jpg";
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") return ".gif";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return ".webp";
  if (buffer.subarray(0, 2).toString("ascii") === "BM") return ".bmp";
  return undefined;
}

@Controller("questions/images")
export class QuestionImagesController {
  constructor(private readonly config: ConfigService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @UseInterceptors(FileInterceptor("image", { limits: { fileSize: maxQuestionImageBytes } }))
  async upload(@UploadedFile() file: UploadedQuestionImage | undefined) {
    if (!file?.buffer?.length) throw new BadRequestException("Choose an image to upload.");
    const extension = questionImageExtension(file.buffer);
    if (!extension) throw new BadRequestException("Upload a PNG, JPG, GIF, WEBP or BMP image.");

    const directory = join(process.cwd(), "uploads", "question-images");
    await mkdir(directory, { recursive: true });
    const fileName = `${randomUUID()}${extension}`;
    await writeFile(join(directory, fileName), file.buffer);

    return { url: `${this.publicApiBaseUrl()}/uploads/question-images/${fileName}` };
  }

  private publicApiBaseUrl() {
    return (
      this.config.get<string>("API_PUBLIC_URL") ??
      this.config.get<string>("API_BASE_URL") ??
      `http://localhost:${this.config.get<number>("PORT") ?? 4000}`
    ).replace(/\/$/, "");
  }
}
