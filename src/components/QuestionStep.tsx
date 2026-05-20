import OptionCard from "./OptionCard";
import type { Question } from "../lib/types";

type Props = {
  question: Question;
  value: string | undefined;
  onSelect: (value: string) => void;
  onBack?: () => void;
  isFirst?: boolean;
};

export default function QuestionStep({ question, value, onSelect, onBack, isFirst }: Props) {
  return (
    <section className="container-narrow fade-in py-8">
      <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">
        {question.question}
      </h1>
      <div className="mt-6 grid gap-3">
        {question.options.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            selected={value === opt.value}
            onSelect={() => onSelect(opt.value)}
          />
        ))}
      </div>
      {!isFirst && onBack && (
        <div className="mt-6">
          <button type="button" onClick={onBack} className="text-sm text-ink/60 underline-offset-4 hover:underline">
            Zurück
          </button>
        </div>
      )}
    </section>
  );
}
