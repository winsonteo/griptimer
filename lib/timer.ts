export type Mode = "session" | "rotation";
export type Phase =
  | "idle"
  | "running-climb"
  | "paused-climb"
  | "running-transition"
  | "paused-transition";

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const formatMMSS = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

type Callbacks = {
  onTick: (remainingMs: number) => void;
  onPhase: (p: Phase) => void;
  onRound: (r: number) => void;
  playBeep: (freq?: number, durMs?: number, type?: OscillatorType) => void;
  playBuzz: () => void;
};


export class TimerEngine {
  private cb: Callbacks;
  private phase: Phase = "idle";
  private rafId: number | null = null;
  private deadline = 0;
  private remainingOnPause = 0;
  private climbMs = 20 * 60_000;
  private transMs = 15 * 1000;
  private mode: Mode = "session";
  private round = 0;
  private cuesFired = new Set<number>();
  private lastRemaining = 0;

  constructor(cb: Callbacks) {
    this.cb = cb;
  }

  start(mode: Mode, climbDurationMs: number, ySec: number) {
    this.stop();
    this.mode = mode;
    this.climbMs = Math.max(1_000, climbDurationMs);
    this.transMs = ySec * 1000;
    this.round = 0;
    this.enterClimb(this.climbMs);
  }

  pause() {
    if (!this.phase.startsWith("running")) return;
    this.remainingOnPause = Math.max(0, this.deadline - performance.now());
    this.setPhase(this.phase.replace("running", "paused") as Phase);
    this.stopRAF();
  }

  resume() {
    if (!this.phase.startsWith("paused")) return;
    this.deadline = performance.now() + this.remainingOnPause;
    this.setPhase(this.phase.replace("paused", "running") as Phase);
    this.tick();
  }

  stop() {
    this.stopRAF();
    this.setPhase("idle");
    this.cuesFired.clear();
    this.lastRemaining = 0;
  }

  isPaused() {
    return this.phase.startsWith("paused");
  }

  // ---- phases
  private enterClimb(ms: number) {
    this.round += 1; // increment when climb begins
    this.cb.onRound(this.round);
    this.deadline = performance.now() + ms;
    this.cuesFired.clear();
    this.lastRemaining = ms;
    this.setPhase("running-climb");
    this.tick();
  }

  private enterTransition(ms: number) {
    this.deadline = performance.now() + ms;
    this.cuesFired.clear();
    this.lastRemaining = ms;
    this.setPhase("running-transition");
    this.tick();
  }

  private endPhase() {
    if (!this.cuesFired.has(0)) {
      this.cb.playBuzz();
      this.cuesFired.add(0);
    }
    if (this.mode === "session") {
      this.stop();
      return;
    }
    // Rotation: toggle between climb and transition
    if (this.phase.includes("climb")) {
      this.enterTransition(this.transMs);
    } else {
      this.enterClimb(this.climbMs);
    }
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.cb.onPhase(p);
  }

  // ---- loop
  private tick = () => {
    const now = performance.now();
    const remaining = Math.max(0, Math.round(this.deadline - now));
    const prevRemaining = this.lastRemaining;

    // cue schedule
    if (this.phase.includes("climb")) this.fireClimbCues(prevRemaining, remaining);
    else if (this.phase.includes("transition")) this.fireTransitionCues(prevRemaining, remaining);

    this.lastRemaining = remaining;
    this.cb.onTick(remaining);

    if (remaining <= 0) {
      this.stopRAF();
      this.endPhase();
      return;
    }
    this.rafId = requestAnimationFrame(this.tick);
  };

  private stopRAF() {
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  // ---- cues
  private fireClimbCues(prev: number, current: number) {
    const marks = [60_000, 5_000, 4_000, 3_000, 2_000, 1_000, 0];
    for (const m of marks) {
      if (m > this.climbMs) continue;
      const leadWindow = 1_000;
      const withinLead = prev > m && prev <= m + leadWindow;
      const crossedThreshold = current <= m;
      const shouldTrigger = withinLead || crossedThreshold;
      if (shouldTrigger && !this.cuesFired.has(m)) {
        this.cuesFired.add(m);
        if (m === 0) this.cb.playBuzz();
        else if (m === 60_000) this.cb.playBuzz();
        else this.cb.playBeep();
      }
    }
  }

  private fireTransitionCues(prev: number, current: number) {
    const marks = [5_000, 4_000, 3_000, 2_000, 1_000, 0];
    for (const m of marks) {
      if (m > this.transMs) continue;
      const leadWindow = 1_000;
      const withinLead = prev > m && prev <= m + leadWindow;
      const crossedThreshold = current <= m;
      const shouldTrigger = withinLead || crossedThreshold;
      if (shouldTrigger && !this.cuesFired.has(m)) {
        this.cuesFired.add(m);
        if (m === 0) this.cb.playBuzz();
        else this.cb.playBeep(900, 150);
      }
    }
  }
}
