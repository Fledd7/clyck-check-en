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
  buildInsights,
  buildLevers,
  channelDataNote,
  getCategoryContent,
  saveCheckHistory,
  selectCategory,
} from "./lib/results";
import { calculateClyckScore, getChannelMaturity, leadClassFromScore } from "./lib/scoring";
import type { Answers, ChannelData, QuestionId, TitleAnalysisResult, UploadAnalysisResult } from "./lib/types";

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
  const [titleAnalysis, setTitleAnalysis] = useState<TitleAnalysisResult[]>([]);
  const [titleAnalysisLoading, setTitleAnalysisLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadAnalysisResult | null>(null);

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
  const category = useMemo(
    () => getCategoryContent(categoryId, maturity),
    [categoryId, maturity]
  );
  const clyckScore = useMemo(
    () => calculateClyckScore(channelData, titleAnalysis),
    [channelData, titleAnalysis]
  );
  const clarity = useMemo(() => {
    if (!clyckScore.hasEnoughData || !clyckScore.clarityLevel) {
      return { label: "", level: "Low" as const };
    }
    return { label: `Clyck Score: ${clyckScore.clarityLevel}`, level: clyckScore.clarityLevel };
  }, [clyckScore]);
  const insights = useMemo(
    () => buildInsights(categoryId, answers, channelData, maturity, titleAnalysis),
    [categoryId, answers, channelData, maturity, titleAnalysis]
  );
  const levers = useMemo(() => buildLevers(categoryId), [categoryId]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return buildShareUrl({ cat: categoryId, score: clyckScore.score, cl: clarity.level });
  }, [categoryId, clyckScore.score, clarity.level]);

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
    setTitleAnalysis([]);
    setTitleAnalysisLoading(false);
    setUploadResult(null);
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
      setTitleAnalysis([]);
      try {
        const taRes = await fetch("/api/title-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videos: videos.slice(0, 8).map((v) => ({
              id: v.id,
              title: v.title,
              thumbnail: v.thumbnail,
            })),
          }),
        });
        const taData = await taRes.json();
        if (taData?.ok && Array.isArray(taData.results)) {
          const enriched = (taData.results as TitleAnalysisResult[]).map((r) => {
            const v = videos.find((x) => x.id === r.id);
            if (!v) return r;
            return { ...r, views: v.views, publishedAt: v.publishedAt };
          });
          setTitleAnalysis(enriched);
        }
      } catch {
        // Silent fallback — section is just hidden
      } finally {
        setTitleAnalysisLoading(false);
      }
    }
  }

  function handleUploadComplete(result: UploadAnalysisResult) {
    setUploadResult(result);
    setChannelData(null);
    setChannelUrl("");
    setTitleAnalysis([]);
    setStep({ kind: "result" });
  }

  function skipChannel() {
    setChannelData(null);
    setChannelUrl("");
    setUploadResult(null);
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
    const score = clyckScore.score;
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
        titleAnalysis: titleAnalysis.length > 0 ? titleAnalysis : undefined,
        result: {
          categoryId,
          categoryHeadline: category.headline,
          categoryText: category.explanation,
          score,
          leadClass,
          scoreBreakdown: clyckScore.breakdown,
          insights,
          levers,
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
        "The request could not be sent right now. Please try again."
      );
    }
    const avgFitScore = titleAnalysis.length > 0
      ? titleAnalysis.reduce((s, r) => s + r.score, 0) / titleAnalysis.length
      : 0;
    saveCheckHistory({
      date: new Date().toISOString(),
      avgFitScore,
      category: categoryId,
      categoryHeadline: category.headline,
      clarityLevel: clarity.level,
    });

    clearProgress();
    setStep({ kind: "done" });
  }

  function goToChannelFromResult() {
    setStep({ kind: "channel" });
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
            <p className="text-sm text-ink/80">You've already started the check.</p>
            <div className="flex gap-3">
              <button type="button" onClick={resumeProgress} className="btn-primary text-sm py-2">
                Continue
              </button>
              <button type="button" onClick={discardProgress} className="btn-secondary text-sm py-2">
                Start over
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
          onUploadComplete={handleUploadComplete}
          onSkip={skipChannel}
          onBack={backFromChannel}
        />
      )}

      {step.kind === "loading" && (
        <section className="container-narrow fade-in py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">One moment</p>
          <h1 className="mt-3 text-[22px] font-bold sm:text-[28px]">
            Loading public channel data …
          </h1>
          <div className="mt-6 h-[3px] w-full overflow-hidden rounded-full bg-line">
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
          hasEnoughData={clyckScore.hasEnoughData}
          insights={insights}
          levers={levers}
          titleAnalysis={titleAnalysis}
          titleAnalysisLoading={titleAnalysisLoading}
          uploadResult={uploadResult}
          shareUrl={shareUrl}
          onAddChannelLink={goToChannelFromResult}
          onContinue={goToLead}
        />
      )}

      {step.kind === "shared" && (
        <section className="container-narrow fade-in py-8">
          <p className="text-sm font-medium uppercase tracking-wide text-ink/60">
            Shared Assessment
          </p>
          <h1 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
            {getCategoryContent(step.payload.cat, null).headline}
          </h1>
          <p className="mt-2">
            <span className="inline-flex items-center rounded-full border border-line px-3 py-1 text-xs font-medium text-ink/70">
              {step.payload.cl}
            </span>
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/80">
            {getCategoryContent(step.payload.cat, null).explanation}
          </p>
          <p className="mt-6 text-sm text-ink/60">
            This is a shared assessment. Do your own check:
          </p>
          <button
            type="button"
            onClick={() => {
              window.history.replaceState(null, "", window.location.pathname);
              setStep({ kind: "start" });
            }}
            className="btn-primary mt-4"
          >
            Start Clyck Check
          </button>
        </section>
      )}

      {step.kind === "lead" && (
        <LeadCaptureForm onSubmit={submitLead} onBack={backFromLead} />
      )}

      {step.kind === "done" && <ConfirmationScreen />}

      <footer className="container-narrow mt-12 text-xs text-ink/50">
        <p>© {new Date().getFullYear()} · Clyck Check</p>
      </footer>
    </main>
  );
}
