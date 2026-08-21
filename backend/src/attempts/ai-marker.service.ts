import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { QuestionDocument } from "../questions/question.schema";

export type AnswerReview = {
  awarded: number;
  correct: boolean;
  aiFeedback: string;
};

export type TestReviewInput = {
  score: number;
  totalMarks: number;
  percent: number;
  answers: Array<{
    topic: string;
    prompt: string;
    modelAnswer: string;
    explanation: string;
    difficulty?: string;
    learningObjective?: string;
    rubricPoints?: string[];
    commonMistakes?: string[];
    studentAnswer: string;
    awarded: number;
    marks: number;
    correct: boolean;
  }>;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
};

@Injectable()
export class AiMarkerService {
  constructor(private readonly config: ConfigService) {}

  async reviewTheoryAnswer(question: QuestionDocument, response: string, fallback: AnswerReview): Promise<AnswerReview> {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!apiKey) return this.fallbackOrThrow(fallback, "OpenAI API key is not configured.");

    try {
      const result = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.get<string>("OPENAI_MODEL") ?? "gpt-5.6-luna",
          input: [
            {
              role: "system",
              content:
                "You are a fair JUPEB Physics examiner. Mark only against the supplied question, model answer, explanation, keywords, and marks. Award an integer score. Give concise feedback that helps the student improve.",
            },
            {
              role: "user",
              content: JSON.stringify({
                question: question.prompt,
                topic: question.topic,
                modelAnswer: question.answer,
                explanation: question.explanation,
                keywords: question.keywords ?? [],
                rubricPoints: question.rubricPoints ?? [],
                commonMistakes: question.commonMistakes ?? [],
                difficulty: question.difficulty,
                learningObjective: question.learningObjective,
                maxMarks: question.marks,
                studentAnswer: response,
              }),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "answer_review",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  awarded: {
                    type: "integer",
                    minimum: 0,
                    maximum: question.marks,
                  },
                  correct: {
                    type: "boolean",
                  },
                  aiFeedback: {
                    type: "string",
                  },
                },
                required: ["awarded", "correct", "aiFeedback"],
              },
            },
          },
        }),
      });

      if (!result.ok) {
        return this.fallbackOrThrow(fallback, `OpenAI answer review failed with status ${result.status}.`);
      }

      const payload = (await result.json()) as OpenAiResponse;
      const text = this.responseText(payload);
      if (!text) return this.fallbackOrThrow(fallback, "OpenAI answer review returned an empty response.");

      const review = JSON.parse(text) as AnswerReview;
      return {
        awarded: Math.max(0, Math.min(question.marks, Math.round(Number(review.awarded) || 0))),
        correct: Boolean(review.correct),
        aiFeedback: String(review.aiFeedback || fallback.aiFeedback),
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (this.isReviewRequired()) {
        throw new ServiceUnavailableException("OpenAI answer review failed.");
      }
      return fallback;
    }
  }

  async reviewCompletedTest(input: TestReviewInput, fallback: string): Promise<string> {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!apiKey) return this.fallbackOrThrow(fallback, "OpenAI API key is not configured.");

    try {
      const result = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.get<string>("OPENAI_MODEL") ?? "gpt-5.6-luna",
          input: [
            {
              role: "system",
              content:
                "You are a supportive JUPEB Physics tutor. After a completed test, write a concise student-facing review. Explain the result, name strengths, identify weak areas, and give practical next study steps. Do not invent facts beyond the submitted answers.",
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "test_review",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  summary: { type: "string" },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                  },
                  weakAreas: {
                    type: "array",
                    items: { type: "string" },
                  },
                  nextSteps: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["summary", "strengths", "weakAreas", "nextSteps"],
              },
            },
          },
        }),
      });

      if (!result.ok) {
        return this.fallbackOrThrow(fallback, `OpenAI test review failed with status ${result.status}.`);
      }

      const payload = (await result.json()) as OpenAiResponse;
      const text = this.responseText(payload);
      if (!text) return this.fallbackOrThrow(fallback, "OpenAI test review returned an empty response.");

      const review = JSON.parse(text) as {
        summary: string;
        strengths: string[];
        weakAreas: string[];
        nextSteps: string[];
      };

      return [
        review.summary,
        this.listSection("Strengths", review.strengths),
        this.listSection("Weak areas", review.weakAreas),
        this.listSection("Next steps", review.nextSteps),
      ]
        .filter(Boolean)
        .join("\n\n");
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (this.isReviewRequired()) {
        throw new ServiceUnavailableException("OpenAI test review failed.");
      }
      return fallback;
    }
  }

  private fallbackOrThrow<T>(fallback: T, message: string): T {
    if (this.isReviewRequired()) {
      throw new ServiceUnavailableException(message);
    }

    return fallback;
  }

  private isReviewRequired() {
    return this.config.get<string>("OPENAI_REVIEW_REQUIRED") === "true";
  }

  private listSection(title: string, items: string[]) {
    const cleanItems = items.map((item) => item.trim()).filter(Boolean);
    if (cleanItems.length === 0) return "";

    return `${title}: ${cleanItems.join("; ")}`;
  }

  private responseText(payload: OpenAiResponse) {
    if (payload.output_text) return payload.output_text;

    return payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n");
  }
}
