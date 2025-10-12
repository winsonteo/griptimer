"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PhasePill } from "../components/PhasePill";
import { Controls } from "../components/Controls";
import { TimerDisplay } from "../components/TimerDisplay";
import { createAudio } from "../lib/audio";
import { TimerEngine, type Mode, type Phase, formatMMSS, clamp } from "../lib/timer";

export default function Home() {
  // Safe defaults (no localStorage access on server)
  const [mode, setMode] = useState<Mode>("session");
  const [xMin, setXMin] = useState<number>(20);
  const [ySec, setYSec] = useState<number>(15);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [flashOn, setFlashOn] = useState<boolean>(true);

  // Load from localStorage only after mount (client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setMode((localStorage.getItem("gt.mode") as Mode) || "session");
    setXMin(Number(localStorage.getItem("gt.x") ?? 20));
    setYSec(Number(localStorage.getItem("gt.y") ?? 15));
    setSoundOn(localStorage.getItem("gt.sound") !== "false");
    setFlashOn(localStorage.getItem("gt.flash") !== "false");
  }, []);

  // Engine + audio
  const engineRef = useRef<TimerEngine | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);

  // UI state
  const [phase, setPhase] = useState<Phase>("idle");
  const [remainingMs, setRemainingMs] = useState<number>(xMin * 60_000);
  const [round, setRound] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Persist settings
  useEffect(() => localStorage.setItem("gt.mode", mode), [mode]);
  useEffect(() => localStorage.setItem("gt.x", String(xMin)), [xMin]);
  useEffect(() => localStorage.setItem("gt.y", String(ySec)), [ySec]);
  useEffect(() => localStorage.setItem("gt.sound", String(soundOn)), [soundOn]);
  useEffect(() => localStorage.setItem("gt.flash", String(flashOn)), [flashOn]);

  // Ensure engine exists
  const ensureEngine = () => {
    if (!engineRef.current) {
      if (!audioRef.current) audioRef.current = createAudio();
      engineRef.current = new TimerEngine({
        onTick: (ms) => setRemainingMs(ms),
        onPhase: (p) => setPhase(p),
        onRound: (r) => setRound(r),
        playBeep: () => soundOn && audioRef.current?.beep(),
        playBuzz: () => soundOn && audioRef.current?.buzz(),
      });
    }
    return engineRef.current;
  };

  // Reflect presets while idle
  useEffect(() => {
    if (phase === "idle") {
      setRemainingMs(xMin * 60_000);
      setRound(0);
    }
  }, [xMin, mode, phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === "Space") {
        e.preventDefault();
        isRunning ? handlePauseResume() : handleStart();
      } else if (e.key.toLowerCase() === "s") {
        handleStop();
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, phase]); // eslint-disable-line

  const handleStart = () => {
    const eng = ensureEngine();
    eng.start(mode, xMin, ySec);
    setIsRunning(true);
  };

  const handlePauseResume = () => {
    const eng = ensureEngine();
    if (eng.isPaused()) {
      eng.resume();
      setIsRunning(true);
    } else {
      eng.pause();
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    engineRef.current?.stop();
    engineRef.current = null;
    setIsRunning(false);
    setPhase("idle");
    setRemainingMs(xMin * 60_000);
    setRound(0);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Rotation hint
  const nextHint = useMemo(() => {
    if (mode !== "rotation") return "";
    if (phase === "running-climb" || phase === "paused-climb" || phase === "idle") {
      return `Next: Transition ${formatMMSS(ySec * 1000)}`;
    }
    if (phase === "running-transition" || phase === "paused-transition") {
      return `Next: Climb ${formatMMSS(xMin * 60_000)}`;
    }
    return "";
  }, [mode, phase, xMin, ySec]);

  // Flash during last 5 seconds
  const flashing =
    flashOn && remainingMs <= 5000 && (phase.includes("climb") || phase.includes("transition"));

  return (
    <main className="min-h-screen flex flex-col">
      <header className="p-4 md:p-6 flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        {/* Left: Mode & Inputs */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">Mode</label>
            <select
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
              value={mode}
              onChange={(e) => {
                const m = e.target.value as Mode;
                setMode(m);
                handleStop(); // reset when switching mode
              }}
            >
              <option value="session">Session</option>
              <option value="rotation">Rotation</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">X (min)</label>
            <input
              type="number"
              min={1}
              max={180}
              step={1}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
              value={xMin}
              onChange={(e) => setXMin(clamp(parseInt(e.target.value || "0", 10), 1, 180))}
              disabled={isRunning && !phase.startsWith("paused")}
            />
          </div>

          {mode === "rotation" && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Y (sec)</label>
              <input
                type="number"
                min={5}
                max={600}
                step={5}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"
                value={ySec}
                onChange={(e) => setYSec(clamp(parseInt(e.target.value || "0", 10), 5, 600))}
                disabled={isRunning && !phase.startsWith("paused")}
              />
            </div>
          )}
        </div>

        {/* Right: Toggles */}
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
            Sound
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={flashOn} onChange={(e) => setFlashOn(e.target.checked)} />
            Flash
          </label>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 border border-slate-700 rounded-lg hover:bg-slate-900"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </header>

      {/* Center */}
      <section
        className={`flex-1 grid place-items-center px-4 transition-colors duration-200 ${
          phase.includes("transition")
            ? "bg-amber-900/10"
            : phase.includes("climb")
            ? "bg-teal-900/10"
            : ""
        }`}
      >
        <div className={`w-full max-w-5xl text-center ${flashing ? "animate-pulse" : ""}`}>
          <PhasePill phase={phase} />
          <TimerDisplay ms={remainingMs} />
          {mode === "rotation" && <p className="mt-2 text-slate-400">{nextHint}</p>}
          {mode === "rotation" && <p className="mt-1 text-slate-500 text-sm">Round: {round}</p>}
        </div>
      </section>

      {/* Controls */}
      <footer className="p-4 md:p-6 flex justify-center">
        <Controls
  isRunning={isRunning}
  phase={phase}
  onStart={handleStart}
  onPauseResume={handlePauseResume}
  onStop={handleStop}
  onTestSound={() => {
    const audio = audioRef.current || createAudio();
    audioRef.current = audio;
    audio.beep();
  }}
/>

      </footer>
    </main>
  );
}
