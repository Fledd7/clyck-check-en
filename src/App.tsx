import { useMemo, useState } from "react";
import StartScreen from "./components/StartScreen";
import ProgressBar from "./components/ProgressBar";
import QuestionStep from "./components/QuestionStep";
import ChannelLinkStep from "./components/ChannelLinkStep";
import ResultPreview from "./components/ResultPreview";
import LeadCaptureForm, { type LeadFormValues } from "./components/LeadCaptureForm";
import ConfirmationScreen from "./components/ConfirmationScreen";
import { questions } from "./lib/questions";
import {
  applyMaturityOverride,
  buildDiagnosis,
  buildInsights,
  buildLevers,
  categories,
  channelDataNote,
  clarityLevel,
  selectCategory,
} from "./lib/results";
import { computeScore, getChannelMaturity, leadClassFromScore } from "./lib/scoring";
import type { Answers, ChannelData, QuestionId } from "./lib/types";

type Step =
  | { kind: "start" }
  | { kind: "question"; index: number }
  | { kind: "channel" }
  | { kind: "loading" }
  | { kind: "result" }
  | { kind: "lead" }
  | { kind: "done" };

export default function App() {
  const [step, setStep] = useState<Step>({ kind: "start" });
  const [answers, setAnswers] = useState<Answers>({});
  const [channelUrl, setChannelUrl] = useState<string>("");
  const [channelData, setChannelData] = useState<ChannelData | null>(null);

  const totalQuestions = questions.length;

  const maturity = useMemo(() => getChannelMaturity(channelData), [channelData]);
  const quizCategoryId = useMemo(() => selectCategory(answers), [answers]);
  const categoryId = useMemo(
    () => applyMaturityOverride(quizCategoryId, maturity, answers),
    [quizCategoryId, maturity, answers]
  );
  const category = categories[categoryId];
  const previewScore = useMemo(
    () => computeScore(answers, channelData, undefined),
    [answers, channelData]
  );
  const clarity = useMemo(() => clarityLevel(previewScore), [previewScore]);
  const insights = useMemo(
    () => buildInsights(categoryId, answers, channelData, maturity),
    [categoryId, answers, channelData, maturity]
  );
  const levers = useMemo(() => buildLevers(categoryId), [categoryId]);
  const diagnosis = useMemo(
    () => buildDiagnosis(answers, channelData, maturity),
    [answers, channelData, maturity]
  );

  function goToStart() {
    setStep({ kind: "start" });
  }

  function startQuestions() {
    setStep({ kind: "question", index: 0 });
  }

  function answerQuestion(qid: QuestionId, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
    if (step.kind === "question") {
      const next = step.index + 1;
      if (next < totalQuestions) {
        setStep({ kind: "question", index: next });
      } else {
        setStep({ kind: "channel" });
      }
    }
  }

  function backFromQuestion() {
    if (step.kind !== "question") return;
    if (step.index === 0) {
      goToStart();
    } else {
      setStep({ kind: "question", index: step.index - 1 });
    }
  }

  async function submitChannel(url: string) {
    setChannelUrl(url);
    setStep({ kind: "loading" });
    try {
      const res = await fetch("/api/channel-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: url }),
      });
      const data = await res.json();
      if (data && data.ok && data.data) {
        setChannelData({ ...data.data, channelUrl: url });
      } else {
        setChannelData(null);
      }
    } catch {
      setChannelData(null);
    }
    setStep({ kind: "result" });
  }

  function skipChannel() {
    setChannelData(null);
    setChannelUrl("");
    setStep({ kind: "result" });
  }

  function backFromChannel() {
    setStep({ kind: "question", index: totalQuestions - 1 });
  }

  function goToLead() {
    setStep({ kind: "lead" });
  }

  function backFromLead() {
    setStep({ kind: "result" });
  }

  async function submitLead(values: LeadFormValues) {
    const score = computeScore(answers, channelData, values.message);
    const leadClass = leadClassFromScore(score);
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        message: values.message,
        consent: values.consent,
        answers,
        channelUrl: channelUrl || undefined,
        channelData,
        result: {
          categoryId,
          score,
          leadClass,
          insights,
          levers,
          diagnosis,
        },
      }),
    });

    let data: { ok?: boolean; reason?: string } = {};
    try {
      data = await res.json();
    } catch {
      // ignore
    }
    if (!res.ok || !data.ok) {
      throw new Error(
        "Die Anfrage konnte gerade nicht gesendet werden. Bitte noch einmal versuchen."
      );
    }
    setStep({ kind: "done" });
  }

  const showProgress = step.kind === "question" || step.kind === "channel";
  const progressCurrent =
    step.kind === "question" ? step.index + 1 : step.kind === "channel" ? totalQuestions + 1 : 0;
  const progressTotal = totalQuestions + 1;

  return (
    <main className="min-h-full pb-16">
      {showProgress && <ProgressBar current={progressCurrent} total={progressTotal} />}

      {step.kind === "start" && <StartScreen onStart={startQuestions} />}

      {step.kind === "question" &&
        (() => {
          const q = questions[step.index];
          return (
            <QuestionStep
              question={q}
              value={answers[q.id]}
              onSelect={(v) => answerQuestion(q.id, v)}
              onBack={backFromQuestion}
              isFirst={step.index === 0}
            />
          );
        })()}

      {step.kind === "channel" && (
        <ChannelLinkStep
          initialUrl={channelUrl}
          onSubmitWithUrl={submitChannel}
          onSkip={skipChannel}
          onBack={backFromChannel}
        />
      )}

      {step.kind === "loading" && (
        <section className="container-narrow fade-in py-16">
          <p className="text-sm font-medium uppercase tracking-wide text-ink/60">
            Einen Moment
          </p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
            Öffentliche Kanaldaten werden geladen …
          </h1>
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full w-1/3 animate-pulse bg-ink" />
          </div>
        </section>
      )}

      {step.kind === "result" && (
        <ResultPreview
          category={category}
          channelData={channelData}
          channelNote={channelDataNote(channelData)}
          clarityLabel={clarity.label}
          clarityLevel={clarity.level}
          insights={insights}
          levers={levers}
          diagnosis={diagnosis}
          onContinue={goToLead}
        />
      )}

      {step.kind === "lead" && (
        <LeadCaptureForm onSubmit={submitLead} onBack={backFromLead} />
      )}

      {step.kind === "done" && <ConfirmationScreen />}

      <footer className="container-narrow mt-12 text-xs text-ink/50">
        <p>© {new Date().getFullYear()} · YouTube Klarheitscheck</p>
      </footer>
    </main>
  );
}
