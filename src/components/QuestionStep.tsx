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
    if (!multi) return [];
    return Array.isArray(value) ? value : value ? [value] : [];
  });

  // Reset / sync local selection when the question itself changes (e.g. next/back)
  // or when the stored value for that question changes (e.g. resumed progress).
  useEffect(() => {
    if (!multi) {
      setSelected([]);
      return;
    }
    setSelected(Array.isArray(value) ? value : value ? [value] : []);
    // We deliberately key on question.id so each question starts with its own
    // stored value, not the previous question's selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, multi]);

  function toggleOption(v: string) {
    setSelected((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v);
      if (prev.length >= max) return prev;
      return [...prev, v];
    });
  }

  const singleValue = multi ? undefined : (Array.isArray(value) ? undefined : value);

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
          const isSelected = multi ? selected.includes(opt.value) : singleValue === opt.value;
          const isDisabled = multi && !isSelected && selected.length >= max;
          return (
            <OptionCard
              key={opt.value}
              label={opt.label}
              selected={isSelected}
              disabled={isDisabled}
              multi={multi}
              onSelect={() => {
                if (multi) {
                  toggleOption(opt.value);
                } else {
                  onAnswer(opt.value);
                }
              }}
            />
          );
        })}
      </div>

      {multi && (
        <div className="mt-6">
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onAnswer(selected)}
            className="btn-primary"
          >
            Weiter
          </button>
        </div>
      )}

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
