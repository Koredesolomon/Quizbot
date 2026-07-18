import type { Question } from "@/types/platform";

export const comingSoonSubjects = ["Mathematics", "Chemistry", "Biology"];

export const physicsCourses = ["PHS 001", "PHS 002", "PHS 003"];

export const phs001Topics = ["Topic 1", "Topic 2", "Topic 3"];

export const workflowSteps = [
  "Access",
  "Select",
  "Take Test",
  "Submit",
  "AI Marking",
  "Results",
  "Advice",
];

export const questions: Question[] = [
  {
    id: 1,
    type: "objective",
    topic: "Physical quantities and units",
    prompt: "Which of the following is a base physical quantity?",
    options: ["Force", "Length", "Speed", "Acceleration"],
    answer: "Length",
    explanation:
      "Length is one of the SI base quantities. Force, speed, and acceleration are derived from base quantities.",
    marks: 2,
  },
  {
    id: 2,
    type: "objective",
    topic: "Measurement and errors",
    prompt: "The SI unit of mass is the:",
    options: ["Newton", "Gram", "Kilogram", "Joule"],
    answer: "Kilogram",
    explanation:
      "The kilogram is the SI base unit of mass. The gram is a submultiple, while newton and joule are derived units.",
    marks: 2,
  },
  {
    id: 3,
    type: "objective",
    topic: "Dimensional analysis",
    prompt: "Which dimension represents velocity?",
    options: ["$LT^{-1}$", "$L^2T$", "$MLT^{-2}$", "$MT^{-1}$"],
    answer: "$LT^{-1}$",
    explanation:
      "Velocity is displacement divided by time, so its dimension is length per time: $LT^{-1}$.",
    marks: 2,
  },
  {
    id: 4,
    type: "objective",
    topic: "Physical quantities and units",
    prompt: "Which instrument is most suitable for measuring the diameter of a thin wire?",
    options: ["Meter rule", "Measuring cylinder", "Micrometer screw gauge", "Stopwatch"],
    answer: "Micrometer screw gauge",
    explanation:
      "A micrometer screw gauge measures very small lengths such as wire diameter with higher precision.",
    marks: 2,
  },
  {
    id: 5,
    type: "objective",
    topic: "Measurement and errors",
    prompt: "A repeated measurement that gives values close to one another is said to be:",
    options: ["Accurate", "Precise", "Random", "Scalar"],
    answer: "Precise",
    explanation:
      "Precision describes how close repeated readings are to each other. Accuracy describes closeness to the true value.",
    marks: 2,
  },
  {
    id: 6,
    type: "theory",
    topic: "Physical quantities and units",
    prompt:
      "Explain the difference between fundamental quantities and derived quantities. Give one example of each.",
    answer:
      "Fundamental quantities are independent base quantities, while derived quantities are obtained by combining base quantities. Length is fundamental, and speed is derived from length divided by time.",
    explanation:
      "A strong answer separates independent base quantities from quantities formed through mathematical combinations and includes valid examples.",
    marks: 5,
    keywords: ["fundamental", "base", "derived", "combining", "length", "speed", "time"],
  },
  {
    id: 7,
    type: "theory",
    topic: "Dimensional analysis",
    prompt: "State two uses of dimensional analysis in Physics.",
    answer:
      "Dimensional analysis is used to check the correctness of physical equations and to derive relationships between physical quantities.",
    explanation:
      "Dimensional analysis compares dimensions on both sides of an equation and helps infer possible relationships between quantities.",
    marks: 5,
    keywords: ["check", "correctness", "equations", "derive", "relationships", "quantities"],
  },
  {
    id: 8,
    type: "objective",
    topic: "Measurement and errors",
    prompt: "Zero error is associated with:",
    options: ["Poor lighting only", "A faulty initial reading", "High temperature only", "Correct calibration"],
    answer: "A faulty initial reading",
    explanation:
      "Zero error occurs when an instrument does not read zero before measurement begins.",
    marks: 2,
  },
  {
    id: 9,
    type: "objective",
    topic: "Physical quantities and units",
    prompt: "Which of these is a scalar quantity?",
    options: ["Velocity", "Displacement", "Mass", "Force"],
    answer: "Mass",
    explanation:
      "Mass has magnitude only. Velocity, displacement, and force require both magnitude and direction.",
    marks: 2,
  },
  {
    id: 10,
    type: "objective",
    topic: "Dimensional analysis",
    prompt: "The dimension of force is:",
    options: ["$MLT^{-2}$", "$ML^2T^{-2}$", "$LT^{-2}$", "$MT^{-1}$"],
    answer: "$MLT^{-2}$",
    explanation:
      "Force equals mass times acceleration. Mass is $M$ and acceleration is $LT^{-2}$, giving $MLT^{-2}$.",
    marks: 2,
  },
];

export const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
