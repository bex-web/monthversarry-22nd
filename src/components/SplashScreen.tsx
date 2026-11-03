import { useEffect } from "react";
import { storyContent } from "../content/storyContent";

/**
 * SplashScreen
 *
 * The opening beat: one greeting, one quiet invitation, one botanical
 * sprig. Warm beige field, paper grain, and a faint warm vignette; the only
 * motion is the sprig's slow sway and the CTA's line breathing. While this
 * screen waits, the next screen's photos pre-warm so the first transition
 * lands without a gray flash.
 */

const GREETING_LINES = (() => {
  const title = storyContent.splash.title;
  // Exact copy, broken for display: "Happy 22-nd" / "Monthversarrie," / "Mon Cherie!"
  const seen = title.match(/^(Happy \d+-\w+) (Monthversarrie,) (Mon Cherie!)$/);
  return seen ? seen.slice(1) : [title];
})();

function SprigIcon() {
  return (
    <svg className="splash-sprig" viewBox="0 0 60 120" fill="none" aria-hidden="true">
      <path
        d="M30 116 C 28 78 26 46 22 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 86 C 17 80 11 68 11 53 C 23 61 30 72 28 86 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M26 58 C 37 52 43 40 43 28 C 31 38 25 46 26 58 Z"
        fill="currentColor"
        opacity="0.55"
      />
      <circle cx="21.5" cy="10" r="4" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function SplashScreen({ onStart }: { onStart: () => void }) {
  // Pre-warm the floating scene's images so the first dolly-in is immediate.
  useEffect(() => {
    for (const image of storyContent.floatingScene.images) {
      const img = new Image();
      img.src = image.src;
    }
  }, []);

  const [line1, line2, line3] = GREETING_LINES;

  return (
    <section
      className="scene splash-scene grain vignette"
      aria-label="Start of the anniversary journey"
    >
      <SprigIcon />
      <h1 className="splash-title">
        {line1} <span className="l2">{line2}</span> <span className="l3">{line3}</span>
      </h1>
      <p className="splash-date">{storyContent.splash.date}</p>
      <button type="button" className="splash-cta" onClick={onStart}>
        <span>{storyContent.splash.cta}</span>
      </button>
      <svg className="splash-corner" viewBox="0 0 80 120" fill="none" aria-hidden="true">
        <path
          d="M40 116 C 44 84 48 60 56 34"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M46 88 C 56 84 62 74 64 62 C 52 68 46 76 46 88 Z"
          fill="currentColor"
          opacity="0.8"
        />
        <path
          d="M50 52 C 42 48 38 38 37 27 C 47 34 51 43 50 52 Z"
          fill="currentColor"
          opacity="0.6"
        />
        <circle cx="57" cy="33" r="4" fill="currentColor" opacity="0.75" />
      </svg>
    </section>
  );
}
