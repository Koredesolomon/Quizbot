"use client";

import { CopilotSidebar, useAgentContext, useConfigureSuggestions } from "@copilotkit/react-core/v2";
import type { MarkedQuestion, Question, Screen, StudentAttempt, StudentFeedback } from "@/types/platform";

type AiAssistantProps = {
  screen: Screen;
  questions: Question[];
  answers: Record<string, string>;
  marked: MarkedQuestion[];
  attempts: StudentAttempt[];
  feedback: StudentFeedback[];
  currentQuestion: number;
  studentName?: string;
  adminName?: string;
  isAdmin: boolean;
  isStudentSignedIn: boolean;
  aiSummary?: string;
};

const studyResources: Record<
  string,
  {
    focus: string;
    reading: string[];
    practice: string[];
  }
> = {
  "Physical quantities and units": {
    focus: "SI base quantities, derived quantities, scalar/vector quantities, and unit conversions.",
    reading: [
      "Review SI base quantities and their units: length, mass, time, current, temperature, amount of substance, and luminous intensity.",
      "Read examples of derived quantities such as speed, acceleration, force, work, pressure, and density.",
      "Make a two-column table separating scalar and vector quantities, then add three examples of each.",
    ],
    practice: [
      "Classify ten quantities as fundamental or derived.",
      "Write the SI unit for each quantity and explain whether it is base or derived.",
      "Convert between common prefixes such as milli, centi, kilo, and mega.",
    ],
  },
  "Measurement and errors": {
    focus: "Instrument choice, precision, accuracy, zero error, random error, and systematic error.",
    reading: [
      "Review how vernier calipers, micrometer screw gauges, meter rules, stopwatches, and measuring cylinders are used.",
      "Read the difference between accuracy and precision using repeated measurement examples.",
      "Study zero error and how to correct a reading before recording the final measurement.",
    ],
    practice: [
      "Choose the best instrument for five measurement tasks and explain why.",
      "Calculate corrected readings for positive and negative zero error.",
      "Identify whether sample measurement problems show random or systematic error.",
    ],
  },
  "Dimensional analysis": {
    focus: "Dimensions of physical quantities, checking equations, and deriving simple relationships.",
    reading: [
      "Review dimensions of velocity, acceleration, force, work, pressure, density, and power.",
      "Study how both sides of a valid physics equation must have the same dimensions.",
      "Read examples where dimensional analysis predicts the form of a relationship but not the numerical constant.",
    ],
    practice: [
      "Find the dimensions of five derived quantities from their formulas.",
      "Check whether three equations are dimensionally consistent.",
      "Use dimensions to infer a possible relationship between period, length, and gravitational acceleration.",
    ],
  },
};

function resourcesForTopics(topics: string[]) {
  return topics.map((topic) => ({
    topic,
    ...(studyResources[topic] ?? {
      focus: "Core definitions, formulas, examples, and common exam mistakes for this topic.",
      reading: [
        `Review your class notes for ${topic}, especially definitions, formulas, and worked examples.`,
        "Compare each missed question with its model answer and explanation.",
      ],
      practice: [
        `Attempt five short questions on ${topic}.`,
        "Write one correction note for every mistake you made.",
      ],
    }),
  }));
}

export function TlchubAiAssistant({
  screen,
  questions,
  answers,
  marked,
  attempts,
  feedback,
  currentQuestion,
  studentName,
  adminName,
  isAdmin,
  isStudentSignedIn,
  aiSummary,
}: AiAssistantProps) {
  const activeQuestion = questions[currentQuestion];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const completedAttempts = attempts.filter((attempt) => attempt.status === "completed");
  const latestAttempt = completedAttempts[0];
  const missedTopics = Array.from(new Set(marked.filter((question) => !question.correct).map((question) => question.topic))).slice(0, 6);
  const currentTopics = Array.from(
    new Set([activeQuestion?.topic, ...missedTopics, ...questions.slice(0, 8).map((question) => question.topic)].filter(Boolean))
  ).slice(0, 8) as string[];
  const isLiveTest = screen === "test";
  const isReviewingResults = screen === "results" || screen === "details";

  useConfigureSuggestions(
    {
      available: "always",
      suggestions: isAdmin
        ? [
            {
              title: "Improve this quiz",
              message: "Review my question set and suggest topic gaps, weak explanations, and rubric improvements.",
            },
            {
              title: "Draft rubric",
              message: "Create rubric points, keywords, and common mistakes for a theory question on the current topic.",
            },
            {
              title: "Analyze feedback",
              message: "Summarize recent student feedback and suggest what to improve first.",
            },
          ]
        : [
            {
              title: isLiveTest ? "Give me a hint" : "Explain my mistakes",
              message: isLiveTest
                ? "Give me a hint for the current question without telling me the final answer."
                : "Explain my missed questions and show how I should correct my thinking.",
            },
            {
              title: "Suggest reading",
              message: "Suggest reading material and practice tasks for the topics I need to improve.",
            },
            {
              title: "Study plan",
              message: "Make a short revision plan based on my current quiz progress and weak topics.",
            },
          ],
    },
    [isAdmin, isLiveTest]
  );

  useAgentContext({
    description: "Current TLCHub user and app state. Use this to personalize guidance.",
    value: {
      screen,
      role: isAdmin ? "admin" : isStudentSignedIn ? "student" : "visitor",
      assistantMode: {
        liveTest: isLiveTest,
        reviewingResults: isReviewingResults,
        canRevealFinalAnswer: !isLiveTest,
        preferredStyle: "interactive tutor: explain, ask a guiding question, then continue step by step",
      },
      studentName: studentName ?? null,
      adminName: adminName ?? null,
      quiz: {
        questionCount: questions.length,
        answeredCount,
        currentQuestion: activeQuestion
          ? {
              number: currentQuestion + 1,
              type: activeQuestion.type,
              topic: activeQuestion.topic,
              prompt: activeQuestion.prompt,
              marks: activeQuestion.marks,
              difficulty: activeQuestion.difficulty ?? "medium",
              learningObjective: activeQuestion.learningObjective ?? null,
              readingSuggestions: resourcesForTopics([activeQuestion.topic])[0],
              hasStudentAnswer: Boolean(answers[activeQuestion.id]?.trim()),
            }
          : null,
      },
      latestResult: latestAttempt
        ? {
            score: latestAttempt.score ?? null,
            totalMarks: latestAttempt.totalMarks,
            percent: latestAttempt.percent ?? null,
            submittedAt: latestAttempt.submittedAt ?? null,
          }
        : null,
      resultReview: {
        aiSummary: aiSummary || null,
        missedTopics,
        markedQuestions: marked.slice(0, 12).map((question, index) => ({
          number: index + 1,
          topic: question.topic,
          prompt: question.prompt,
          studentAnswer: question.userAnswer,
          awarded: question.awarded,
          marks: question.marks,
          correct: question.correct,
          aiFeedback: question.aiFeedback,
          modelAnswer: question.answer,
          explanation: question.explanation,
        })),
      },
      learningResources: resourcesForTopics(currentTopics),
      adminWorkspace: isAdmin
        ? {
            questionCount: questions.length,
            theoryQuestionCount: questions.filter((question) => question.type === "theory").length,
            objectiveQuestionCount: questions.filter((question) => question.type === "objective").length,
            attemptCount: attempts.length,
            feedbackCount: feedback.length,
            recentFeedback: feedback.slice(0, 5).map((item) => ({
              rating: item.rating,
              message: item.message,
              status: item.status,
            })),
            topics: Array.from(new Set(questions.map((question) => question.topic))).slice(0, 20),
          }
        : null,
    },
  });

  return (
    <CopilotSidebar
      defaultOpen={false}
      position="right"
      width={420}
      labels={{
        chatInputPlaceholder: isAdmin
          ? "Ask for question ideas, rubrics, or content review..."
          : "Ask for a hint, explanation, or revision plan...",
        modalHeaderTitle: "TLCHub Copilot",
        welcomeMessageText: isAdmin
          ? "I can help improve questions, explanations, rubrics, and topic coverage."
          : "I can explain quiz feedback, give hints, and help you revise smarter.",
      }}
    />
  );
}
