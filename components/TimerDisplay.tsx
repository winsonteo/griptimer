export function TimerDisplay({ ms }: { ms: number }) {
  const mm = Math.floor(ms / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return <div className="mt-4 text-[18vw] leading-none font-semibold tracking-tight select-none">{pad(mm)}:{pad(ss)}</div>;
}
