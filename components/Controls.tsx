import type { Phase } from "../lib/timer";

export function Controls({
  isRunning,
  phase,
  onStart,
  onPauseResume,
  onStop,
  onTestSound,
}: {
  isRunning: boolean;
  phase: Phase;
  onStart: () => void;
  onPauseResume: () => void;
  onStop: () => void;
  onTestSound: () => void;
}) {
  const canStart = phase === "idle";
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <button
        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700"
        onClick={onStart}
        disabled={!canStart}
      >
        Start
      </button>

      <button
        className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800"
        onClick={onPauseResume}
        disabled={phase === "idle"}
      >
        {isRunning ? "Pause" : "Resume"}
      </button>

      <button
        className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-800"
        onClick={onStop}
        disabled={phase === "idle"}
      >
        Stop
      </button>

      <button
        className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700"
        onClick={onTestSound}
      >
        🔊 Test Beep
      </button>
    </div>
  );
}
