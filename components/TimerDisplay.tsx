export function TimerDisplay({ ms, fullscreen = false }: { ms: number; fullscreen?: boolean }) {
  const mm = Math.floor(ms / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  // In fullscreen the timer scales to the smaller viewport dimension so it
  // stays readable from across the hall on widescreen TVs. ~45vmin on a
  // 1920x1080 display ≈ 486px tall digits, legible from ~10m.
  const sizeClass = fullscreen
    ? "text-[45vmin] md:text-[40vw]"
    : "text-[18vw]";
  return (
    <div
      className={`mt-4 leading-none font-semibold tracking-tight select-none ${sizeClass}`}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {pad(mm)}:{pad(ss)}
    </div>
  );
}
