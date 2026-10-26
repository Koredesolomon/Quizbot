import type { CourseContent } from "@/lib/api";
import { isTopicQuizGroup } from "@/lib/course-outline";
import type { Question } from "@/types/platform";

export type QuestionInput = Omit<Question, "id">;
export type QuizQuestionContext = Pick<Question, "courseId" | "moduleId" | "subtopicId" | "quizId"> & {
  subject: string;
  topic: string;
  label: string;
};

export function quizQuestionContexts(courses: CourseContent[]): QuizQuestionContext[] {
  return courses.flatMap((course) => course.modules.flatMap((module) => module.topics.flatMap((topic) =>
    topic.subtopics.flatMap((subtopic) => subtopic.quizzes.map((quiz) => ({
      courseId: course.id,
      moduleId: module.id,
      subtopicId: subtopic.id,
      quizId: quiz.id,
      subject: course.subject,
      topic: subtopic.title,
      label: [course.title, module.title, topic.title, ...(isTopicQuizGroup(topic, subtopic) ? [] : [subtopic.title]), quiz.title].join(" / "),
    })))
  )));
}

export function questionInput(question: QuestionInput): QuestionInput {
  return {
    type: question.type,
    subject: question.subject,
    courseId: question.courseId,
    moduleId: question.moduleId,
    subtopicId: question.subtopicId,
    quizId: question.quizId,
    topic: question.topic,
    prompt: question.prompt,
    imageUrl: question.imageUrl,
    options: question.options,
    answerBox: question.answerBox,
    answer: question.answer,
    explanation: question.explanation,
    marks: question.marks,
    difficulty: question.difficulty,
    learningObjective: question.learningObjective,
    rubricPoints: question.rubricPoints,
    commonMistakes: question.commonMistakes,
    keywords: question.keywords,
  };
}

/** Questions not linked to any existing course (never assigned, or their course was deleted). */
export function unassignedQuestions<T extends Pick<Question, "courseId">>(questions: T[], courses: CourseContent[]) {
  const courseIds = new Set(courses.map((course) => course.id));
  return questions.filter((question) => !question.courseId || !courseIds.has(question.courseId));
}
