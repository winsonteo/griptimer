type AudioContextConstructor = typeof AudioContext;
type AudioWindow = Window & {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
};

// Sample-accurate competition beeps/buzzes
export function createAudio() {
  const audioWindow = window as AudioWindow;
  const Ctx = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  if (!Ctx) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  const ctx = new Ctx();
  // allow audio on first click / key
  const resume = () => { if (ctx.state === "suspended") ctx.resume(); };
  ["click","keydown","touchstart"].forEach(ev =>
    window.addEventListener(ev, resume, { once: true })
  );

  // schedule a tone exactly at ctx.currentTime + offset (in ms)
  const scheduleTone = (
    freq: number,
    durMs: number,
    offsetMs: number,
    type: OscillatorType = "square",
    gainLevel = 0.8
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + offsetMs / 1000;
    const dur = durMs / 1000;

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainLevel, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  return {
    /** play immediately */
    beep: (freq = 1000, durMs = 180, type: OscillatorType = "square") =>
      scheduleTone(freq, durMs, 0, type, 0.9),
    buzz: () => scheduleTone(400, 1200, 0, "sawtooth", 0.9),

    /** schedule relative to performance.now() (for frame-perfect cues) */
    scheduleBeep: (freq = 1000, durMs = 180, whenMs = 0) =>
      scheduleTone(freq, durMs, whenMs - (performance.now() - ctx.baseLatency * 1000)),
  };
}
