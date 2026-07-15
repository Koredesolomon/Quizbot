"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/header";
import { Landing } from "@/components/landing";
import {
  Courses,
  Overview,
  Programme,
  Subjects,
  Topics,
} from "@/components/selection-screens";
import { ComingSoon, Details, Marking, Results } from "@/components/results-screens";
import { TestInterface } from "@/components/test-interface";
import { Workflow } from "@/components/workflow";
import { totalMarks } from "@/data/platform";
import { getTopicBreakdown, markResponses } from "@/lib/marker";
import type { MarkedQuestion, Screen } from "@/types/platform";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [marked, setMarked] = useState<MarkedQuestion[]>([]);
  const [selectedDetail, setSelectedDetail] = useState(0);

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const score = marked.reduce((sum, question) => sum + question.awarded, 0);
  const percent = totalMarks ? Math.round((score / totalMarks) * 100) : 0;
  const topicBreakdown = useMemo(() => getTopicBreakdown(marked), [marked]);

  const startMarking = () => {
    setScreen("marking");
    window.setTimeout(() => {
      setMarked(markResponses(answers));
      setSelectedDetail(0);
      setScreen("results");
    }, 1100);
  };

  const resetTest = () => {
    setAnswers({});
    setMarked([]);
    setCurrentQuestion(0);
    setSelectedDetail(0);
    setScreen("overview");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Header onNavigate={setScreen} />

      {screen === "landing" && (
        <Landing
          onStart={() => setScreen("programme")}
          onHowItWorks={() => document.getElementById("workflow")?.scrollIntoView({ behavior: "smooth" })}
        />
      )}

      {screen === "programme" && <Programme onNext={() => setScreen("subjects")} />}
      {screen === "subjects" && (
        <Subjects onPhysics={() => setScreen("courses")} onComingSoon={() => setScreen("comingSoon")} />
      )}
      {screen === "courses" && (
        <Courses onPHS001={() => setScreen("topics")} onComingSoon={() => setScreen("comingSoon")} />
      )}
      {screen === "topics" && (
        <Topics onTopicOne={() => setScreen("overview")} onComingSoon={() => setScreen("comingSoon")} />
      )}
      {screen === "overview" && (
        <Overview
          onStart={() => {
            setCurrentQuestion(0);
            setScreen("test");
          }}
        />
      )}
      {screen === "test" && (
        <TestInterface
          answers={answers}
          currentQuestion={currentQuestion}
          onAnswer={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))}
          onCurrentQuestion={setCurrentQuestion}
          onSubmit={startMarking}
        />
      )}
      {screen === "marking" && <Marking />}
      {screen === "results" && (
        <Results
          marked={marked}
          percent={percent}
          score={score}
          answeredCount={answeredCount}
          onDetails={() => setScreen("details")}
          onRetry={resetTest}
        />
      )}
      {screen === "details" && (
        <Details
          marked={marked}
          selectedDetail={selectedDetail}
          topicBreakdown={topicBreakdown}
          onSelectDetail={setSelectedDetail}
          onBack={() => setScreen("results")}
        />
      )}
      {screen === "comingSoon" && <ComingSoon onAvailable={() => setScreen("overview")} />}

      <Workflow />
    </main>
  );
}
