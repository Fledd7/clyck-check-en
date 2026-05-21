import { useEffect, useMemo, useState } from "react";
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
import type { Answers, ChannelData, QuestionId, TitleAnalysisResult } from "./lib/types";

// ── localStorage ──────────────────────────────────────────────────────────────
const LS_KEY = "klarheitscheck_progress";
const LS_MAX_AGE = 24 * 60 * 60 * 1000;

type SavedProgress = {
  stepIndex: number;
  answers: Answers;
  channelUrl: string;
  savedAt: number;
};

function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SavedProgress;
    if (Date.now() - p.savedAt > LS_MAX_AGE) return null;
    return p;
  } catch {
    return null;
  }
}

function saveProgress(index: number, answers: Answers, channelUrl: string) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ stepIndex: index, answers, channelUrl, savedAt: Date.now() })
    );
  } catch {
    // Private mode – ignore
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    // ignore
  }
}

// ── Share URL ─────────────────────────────────────────────────────────────────
type SharePayload = {
  cat: "A" | "B" | "C" | "D";
  score: number;
  cl: string;
};

function encodeShare(payload: SharePayload): string {
  return btoa(JSON.stringify(payload));
}

function decodeShare(encoded: string): SharePayload | null {
  try {
    return JSON.parse(atob(encoded)) as SharePayload;
  } catch {
    return null;
  }
}

function buildShareUrl(payload: SharePayload): string {
  return `${window.location.origin}${window.location.pathname}?d=${encodeShare(payload)}`;
}

// ── Step type ─────────────────────────────────────────────────────────────────
type Step =
  | { kind: "start" }
  | { kind: "question"; index: number }
  | { kind: "channel" }
  | { kind: "loading" }
  | { kind: "result" }
  | { kind: "lead" }
  | { kind: "done" }
  | { kind: "shared"; payload: SharePayload };

export default function App() {
  const savedProgress = useMemo(() => loadProgress(), []);

  const [showResume, setShowResume] = useState<boolean>(!!savedProgress);
  const [step, setStep] = useState<Step>(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (d) {
      const payload = decodeShare(d);
      if (payload) return { kind: "shared", payload };
    }
    return { kind: "start" };
  });

  const [answers, setAnswers] = useState<Answers>({});
  const [channelUrl, setChannelUrl] = useState<string>("");
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [titleAnalysis, setTitleAnalysis] = useState<TitleAnalysisResult | null>(null);
  const [titleAnalysisLoading, setTitleAnalysisLoading] = useState(false);
  const [titleAnalysisError, setTitleAnalysisError] = useState(false);

  const totalQuestions = questions.length;

  // Save progress on step changes during quiz
  useEffect(() => {
    if (step.kind === "question") {
      saveProgress(step.index, answers, channelUrl);
    } else if (step.kind === "channel") {
      saveProgress(totalQuestions, answers, channelUrl);
    }
  }, [step, answers, channelUrl, totalQuestions]);

  // Derived state
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

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return buildShareUrl({ cat: categoryId, score: previewScore, cl: clarity.level });
  }, [categoryId, previewScore, clarity.level]);

  // Push share URL when entering result step
  useEffect(() => {
    if (step.kind === "result") {
      window.history.replaceState(null, "", shareUrl);
    }
  }, [step.kind, shareUrl]);

  function resumeProgress() {
    if (!savedProgress) return;
    setAnswers(savedProgress.answers);
    setChannelUrl(savedProgress.channelUrl);
    const idx = savedProgress.stepIndex;
    if (idx >= totalQuestions) {
      setStep({ kind: "channel" });
    } else {
      setStep({ kind: "question", index: idx });
    }
    setShowResume(false);
  }

  function discardProgress() {
    clearProgress();
    setShowResume(false);
  }

  function goToStart() {
    setStep({ kind: "start" });
    setAnswers({});
    setTitleAnalysis(null);
    setTitleAnalysisLoading(false);
    setTitleAnalysisError(false);
    window.history.replaceState(null, "", window.location.pathname);
  }

  function startQuestions() {
    setStep({ kind: "question", index: 0 });
  }

  function answerQuestion(qid: QuestionId, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [qid]: value as never }));
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
    let resolvedChannelData: ChannelData | null = null;
    try {
      const res = await fetch("/api/channel-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: url }),
      });
      const data = await res.json();
      if (data && data.ok && data.data) {
        resolvedChannelData = { ...data.data, channelUrl: url };
        setChannelData(resolvedChannelData);
      } else {
        setChannelData(null);
      }
    } catch {
      setChannelData(null);
    }
    setStep({ kind: "result" });

    // Trigger title analysis if we have enough videos
    const videos = resolvedChannelData?.videos ?? [];
    if (videos.length >= 3) {
      setTitleAnalysisLoading(true);
      setTitleAnalysisError(false);
      setTitleAnalysis(null);
      try {
        const taRes = await fetch("/api/title-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videos: videos.slice(0, 8).map((v) => ({ id: v.id, title: v.title })) }),
        });
        const taData = await taRes.json();
        if (taData?.ok && taData.data) {
          setTitleAnalysis(taData.data);
        } else {
          setTitleAnalysisError(true);
        }
      } catch {
        setTitleAnalysisError(true);
      } finally {
        setTitleAnalysisLoading(false);
      }
    }
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
        titleAnalysis: titleAnalysis || undefined,
        result: {
          categoryId,
          categoryHeadline: category.headline,
          categoryText: category.text,
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
    clearProgress();
    setStep({ kind: "done" });
  }

  const showProgress = step.kind === "question" || step.kind === "channel";
  const progressCurrent =
    step.kind === "question" ? step.index + 1 : step.kind === "channel" ? totalQuestions + 1 : 0;
  const progressTotal = totalQuestions + 1;

  return (
    <main className="min-h-full pb-16">
      {showProgress && <ProgressBar current={progressCurrent} total={progressTotal} />}

      {/* Resume banner */}
      {showResume && step.kind === "start" && (
        <div className="container-narrow pt-6">
          <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink/80">Du hast den Check bereits begonnen.</p>
            <div className="flex gap-3">
              <button type="button" onClick={resumeProgress} className="btn-primary text-sm py-2">
                Weitermachen
              </button>
              <button type="button" onClick={discardProgress} className="btn-secondary text-sm py-2">
                Neu starten
              </button>
            </div>
          </div>
        </div>
      )}

      {step.kind === "start" && <StartScreen onStart={startQuestions} />}

      {step.kind === "question" &&
        (() => {
          const q = questions[step.index];
          const val = answers[q.id as keyof Answers];
          return (
            <QuestionStep
              key={q.id}
              question={q}
              value={val as string | string[] | undefined}
              onAnswer={(v) => answerQuestion(q.id, v)}
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
          <p className="text-sm font-medium uppercase tracking-wide text-ink/60">Einen Moment</p>
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
          titleAnalysis={titleAnalysis}
          titleAnalysisLoading={titleAnalysisLoading}
          titleAnalysisError={titleAnalysisError}
          shareUrl={shareUrl}
          onContinue={goToLead}
        />
      )}

      {step.kind === "shared" && (
        <section className="container-narrow fade-in py-8">
          <p className="text-sm font-medium uppercase tracking-wide text-ink/60">
            Geteilte Einschätzung
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
            {categories[step.payload.cat].headline}
          </h1>
          <p className="mt-2">
            <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs font-medium text-ink/70">
              {step.payload.cl}
            </span>
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/80">
            {categories[step.payload.cat].text}
          </p>
          <p className="mt-6 text-sm text-ink/60">
            Das ist eine geteilte Einschätzung. Mach deinen eigenen Check:
          </p>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState(null, "", window.location.pathname);
              setStep({ kind: "start" });
            }}
            className="btn-primary mt-4"
          >
            Klarheitscheck starten
          </button>
        </section>
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
