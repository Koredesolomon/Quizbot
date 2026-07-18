import { QuestionRecord, StoreService } from "../store.service";
import { CreateQuestionDto } from "./dto";
export declare class QuestionsService {
    private readonly store;
    constructor(store: StoreService);
    list(): QuestionRecord[];
    create(input: CreateQuestionDto, adminId: string): QuestionRecord;
    import(questions: CreateQuestionDto[], adminId: string): QuestionRecord[];
    findById(id: string): QuestionRecord;
    totalMarks(): number;
    private validateQuestion;
}
