import type { Phase } from "../lib/timer";

export function PhasePill({ phase }: { phase: Phase }) {
  const map: Record<Phase, { label: string; cls: string }> = {
    idle: { label: "READY", cls: "bg-slate-800 text-slate-200" },
    "running-climb": { label: "CLIMB", cls: "bg-teal-600 text-teal-50" },
    "paused-climb": { label: "PAUSED (CLIMB)", cls: "bg-teal-800 text-teal-50" },
    "running-transition": { label: "TRANSITION", cls: "bg-amber-600 text-amber-50" },
    "paused-transition": { label: "PAUSED (TRANSITION)", cls: "bg-amber-800 text-amber-50" },
  };
  const { label, cls } = map[phase];
  return <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${cls}`}>{label}</div>;
}
