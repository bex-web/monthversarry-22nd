import { useEffect, useRef, useState } from "react";
import { storyContent } from "../content/storyContent";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { HoldTarget } from "./HoldTarget";
import { InteractiveFlowers } from "./InteractiveFlowers";

/**
 * LetterPaper
 *
 * A sheet of lined stationery with one handwritten paragraph, revealed
 * character by character with a blinking caret under it. Holding the paper
 * (not a tap) returns to the splash screen through the shared hold utility.
 * Flowers along the bottom react to the finger via InteractiveFlowers; the
 * two depth layers sit before and behind the paper for a soft parallax.
 */

const BASE_MS_PER_CHAR = 30;
const PUNCTUATION_PAUSE = 240;

export function LetterPaper({ onReturn }: { onReturn: () => void }) {
  const letter = storyContent.letter;
  const text = letter.paragraph;
  const reduced = usePrefersReducedMotion();

  const sceneRef = useRef<HTMLElement | null>(null);
  const [chars, setChars] = useState(0);
  const typing = chars < text.length;

  useEffect(() => {
    if (reduced) {
      // Typewriter is nonessential movement: place the full text at once.
      setChars(text.length);
      return;
    }
    let cancelled = false;
    let raf = 0;
    let index = 0;
    let credit = 0;
    let last = performance.now();

    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = Math.min(now - last, 120);
      last = now;
      credit += elapsed;
      let changed = false;

      while (index < text.length) {
        const previous = text[index - 1];
        const cost =
          previous && ".!?".includes(previous)
            ? BASE_MS_PER_CHAR + PUNCTUATION_PAUSE
            : BASE_MS_PER_CHAR;
        if (credit < cost) break;
        credit -= cost;
        index += 1;
        changed = true;
      }

      if (changed) setChars(index);
      if (index < text.length) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [reduced, text]);

  return (
    <section ref={sceneRef} className="scene letter-scene grain vignette" aria-label="The letter">
      <InteractiveFlowers layer="back" regionRef={sceneRef} reducedMotion={reduced} />

      <HoldTarget
        className="paper-hold"
        ariaLabel={letter.paperAriaLabel}
        onHoldComplete={onReturn}
        progressStyle={{
          left: "12%",
          right: "12%",
          bottom: 8,
        }}
      >
        <article className="paper" lang="en">
          <div className="paper-rules" aria-hidden="true" />
          <div className="paper-fold" aria-hidden="true" />
          <div className="paper-content">
            <p className="paper-text">
              {text.slice(0, chars)}
              {typing && <span className="caret" aria-hidden="true" />}
            </p>
          </div>
        </article>
      </HoldTarget>

      <InteractiveFlowers layer="front" regionRef={sceneRef} reducedMotion={reduced} />

      <p className="letter-return-hint">{letter.returnHint}</p>
    </section>
  );
}
