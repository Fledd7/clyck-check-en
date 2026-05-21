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
        Sieh, was deine Zuschauer sehen — bevor sie wegscrollen.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink/75">
        Gib deinen Kanal ein und erhalte in wenigen Minuten eine erste Einschätzung,
        wie klar, einheitlich und klickstark dein YouTube-Auftritt nach außen wirkt.
      </p>
      <div className="mt-8">
        <button type="button" onClick={onStart} className="btn-primary w-full sm:w-auto">
          Clyck Check starten
        </button>
        <p className="mt-3 text-sm text-ink/55">
          5 Fragen · keine Anmeldung · keine privaten Analytics
        </p>
      </div>
    </section>
  );
}
