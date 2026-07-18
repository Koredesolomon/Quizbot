export declare class CreateQuestionDto {
    type: "objective" | "theory";
    topic: string;
    prompt: string;
    options?: string[];
    answer: string;
    explanation: string;
    marks: number;
    keywords?: string[];
}
export declare class ImportQuestionsDto {
    questions: CreateQuestionDto[];
}
