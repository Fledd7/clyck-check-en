type Props = {
  onStart: () => void;
};

export default function StartScreen({ onStart }: Props) {
  return (
    <section className="fade-in mx-auto flex min-h-full max-w-[480px] flex-col items-start justify-center px-5 py-16 sm:py-24">
      <img
        src="https://onecdn.io/media/f8241618-a8a5-490d-a3e2-0ccce4a0fb88/md2x"
        alt="Clyck"
        width={40}
        height={40}
        className="mb-6 rounded-lg"
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
        Clyck Check
      </p>
      <h1 className="mt-4 text-[32px] font-bold leading-[1.15] sm:text-[38px]">
        Was hält deine Videos davon ab, mehr geklickt zu werden?
      </h1>
      <p className="mt-4 max-w-[380px] text-base text-gray1">
        Beantworte 5 kurze Fragen und erhalte eine erste Einschätzung
        zu Thumbnails, Titeln und der visuellen Klarheit deines Kanals.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="btn-primary mt-8 w-full sm:w-auto"
      >
        Clyck Check starten
      </button>
    </section>
  );
}
