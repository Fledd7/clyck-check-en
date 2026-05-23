type Props = {
  onStart: () => void;
};

export default function StartScreen({ onStart }: Props) {
  return (
    <section className="container-narrow fade-in py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-ink/60">
        Clyck Check
      </p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
        Was hält deine Videos davon ab, mehr geklickt zu werden?
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink/75">
        Beantworte 5 kurze Fragen und erhalte eine erste Einschätzung
        zu Thumbnails, Titeln und der visuellen Klarheit deines Kanals.
      </p>
      <div className="mt-8">
        <button type="button" onClick={onStart} className="btn-primary w-full sm:w-auto">
          Clyck Check starten
        </button>
      </div>
    </section>
  );
}
