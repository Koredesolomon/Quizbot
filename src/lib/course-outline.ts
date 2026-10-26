import type { CourseSubtopic, CourseTopic } from "@/lib/api";

/**
 * Quizzes added straight to a topic (not inside a subtopic) arrive from the API as an extra
 * subtopic that shares the topic's id. To add one, create a quiz with the topic's id as its subtopic id.
 */
export function isTopicQuizGroup(topic: Pick<CourseTopic, "id">, subtopic: Pick<CourseSubtopic, "id">) {
  return subtopic.id === topic.id;
}

/** The topic's real subtopics, without the group holding its topic-level quizzes. */
export function realSubtopics(topic: CourseTopic) {
  return (topic.subtopics ?? []).filter((subtopic) => !isTopicQuizGroup(topic, subtopic));
}

/** The topic's topic-level quizzes, as a subtopic-shaped group, if it has any. */
export function topicQuizGroup(topic: CourseTopic) {
  return (topic.subtopics ?? []).find((subtopic) => isTopicQuizGroup(topic, subtopic));
}
