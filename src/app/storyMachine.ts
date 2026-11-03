import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useStoryMachine
 *
 * Central navigation: splash -> floating -> slideshow -> letter -> splash.
 * Every screen change runs through a coordinated dolly transition (see
 * .stage is-covering / is-revealing in global.css): the outgoing scene
 * recedes under a veil, then the incoming scene settles. Inputs are locked
 * while a transition runs so double-fires never skip screens.
 *
 * The screen change happens mid-transition, so screens remount cleanly:
 * physics engines, videos, timers, and listeners tied to a screen die with
 * it instead of leaking between scenes.
 */

export type ScreenId = "splash" | "floating" | "slideshow" | "letter";
export type DollyPhase = "covering" | "revealing";

export interface DollyTransition {
  phase: DollyPhase;
  target: ScreenId;
}

/** Cover and reveal durations mirror --dur-cover / --dur-reveal in tokens
 *  (with a small buffer so the CSS transition commits first). */
const COVER_MS = 420;
const BUFFER_MS = 70;
const REVEAL_MS = 720;

export function useStoryMachine(initial: ScreenId) {
  const [screen, setScreen] = useState<ScreenId>(initial);
  const [dolly, setDolly] = useState<DollyTransition | null>(null);

  const screenRef = useRef(initial);
  const busyRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const goTo = useCallback((next: ScreenId) => {
    if (busyRef.current || next === screenRef.current) return;
    busyRef.current = true;

    setDolly({ phase: "covering", target: next });

    timersRef.current.push(
      window.setTimeout(() => {
        screenRef.current = next;
        setScreen(next);
        setDolly({ phase: "revealing", target: next });
      }, COVER_MS + BUFFER_MS),
    );
    timersRef.current.push(
      window.setTimeout(() => {
        setDolly(null);
        busyRef.current = false;
      }, COVER_MS + BUFFER_MS + REVEAL_MS),
    );
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  return { screen, dolly, goTo, transitioning: dolly !== null };
}
