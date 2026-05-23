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
    <section className="fade-in mx-auto w-full max-w-[540px] px-5 py-8">
      <div className="rounded-[20px] bg-white p-8 shadow-card">
        {multi && (
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray1">
            Wähle bis zu {max}
          </p>
        )}
        <h2 className="text-[22px] font-bold leading-snug mb-6">
          {question.question}
        </h2>
        <div className="grid gap-3">
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
              className="text-[13px] text-gray1 underline-offset-4 hover:underline"
            >
              Zurück
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
