import { useEffect, useState } from "react";
import OptionCard from "./OptionCard";
import type { Question } from "../lib/types";

type Props = {
  question: Question;
  value: string | string[] | undefined;
  onAnswer: (value: string | string[]) => void;
  onBack?: () => void;
  isFirst?: boolean;
};

export default function QuestionStep({ question, value, onAnswer, onBack, isFirst }: Props) {
  const multi = question.multiSelect === true;
  const max = question.maxSelect ?? 3;

  const [selected, setSelected] = useState<string[]>(() => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  });

  // Reset / sync local selection when the question changes.
  useEffect(() => {
    if (Array.isArray(value)) {
      setSelected(value);
    } else {
      setSelected(value ? [value] : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  function handleSelect(v: string) {
    if (multi) {
      setSelected((prev) => {
        if (prev.includes(v)) return prev.filter((x) => x !== v);
        if (prev.length >= max) return prev;
        return [...prev, v];
      });
    } else {
      setSelected([v]);
    }
  }

  function handleContinue() {
    if (selected.length === 0) return;
    onAnswer(multi ? selected : selected[0]);
  }

  return (
    <section className="container-narrow fade-in py-8">
      {multi && (
        <p className="mb-3 text-xs font-medium text-ink/55 uppercase tracking-wide">
          Wähle bis zu {max}
        </p>
      )}
      <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">
        {question.question}
      </h1>
      <div className="mt-6 grid gap-3">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          const isDisabled = multi && !isSelected && selected.length >= max;
          return (
            <OptionCard
              key={opt.value}
              label={opt.label}
              selected={isSelected}
              disabled={isDisabled}
              multi={multi}
              onSelect={() => handleSelect(opt.value)}
            />
          );
        })}
      </div>

      <div className="mt-6">
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={handleContinue}
          className="btn-primary w-full sm:w-auto"
        >
          Weiter
        </button>
      </div>

      {!isFirst && onBack && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-ink/60 underline-offset-4 hover:underline"
          >
            Zurück
          </button>
        </div>
      )}
    </section>
  );
}
