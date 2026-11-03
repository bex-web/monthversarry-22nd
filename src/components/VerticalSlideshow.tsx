import { useCallback, useEffect, useRef, useState } from "react";
import { storyContent } from "../content/storyContent";
import { usePointerSwipe } from "../hooks/usePointerSwipe";
import { HoldTarget } from "./HoldTarget";
import { SlideMedia } from "./SlideMedia";

/**
 * VerticalSlideshow
 *
 * Exactly five full-bleed slides, navigated with vertical swipes (up =
 * forward, down = back) or ArrowUp/ArrowDown on a keyboard. Slides stack
 * above/below the viewport; transitions combine movement, scale of the
 * incoming text, and opacity through a single calm curve. The whole deck
 * follows the finger gently while a swipe is in progress, then either
 * commits (past threshold) or springs back (below it).
 *
 * The final slide's hold target bridges to the letter screen and goes
 * through the shared hold utility, so a tap can never skip ahead.
 */

export function VerticalSlideshow({ onComplete }: { onComplete: () => void }) {
  const slides = storyContent.slideshow;
  const slidesRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [moved, setMoved] = useState(false);

  const applyDrag = useCallback((dy: number) => {
    const deck = slidesRef.current;
    if (!deck) return;
    if (dy === 0) {
      deck.classList.remove("is-dragging");
      deck.style.removeProperty("--drag");
      return;
    }
    deck.classList.add("is-dragging");
    deck.style.setProperty("--drag", `${Math.max(-140, Math.min(140, dy))}px`);
  }, []);

  const move = useCallback((direction: "up" | "down") => {
    setMoved(true);
    setIndex((current) => {
      if (direction === "up") return Math.min(current + 1, slides.length - 1);
      return Math.max(current - 1, 0);
    });
  }, [slides.length]);

  const swipe = usePointerSwipe({ onSwipe: move, onDrag: applyDrag });

  /* Safety net for the same takeover: a few mobile engines still route
     bare vertical touchmoves into page scroll even under touch-action:none.
     Cancelling them keeps the whole gesture inside the deck; the scoring
     (which pointer events won) is unaffected. */
  useEffect(() => {
    const deck = slidesRef.current;
    if (!deck) return;
    const keepForDeck = (event: TouchEvent) => {
      event.preventDefault();
    };
    deck.addEventListener("touchmove", keepForDeck, { passive: false });
    return () => deck.removeEventListener("touchmove", keepForDeck);
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        move("up");
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        move("down");
      }
    },
    [move],
  );

  return (
    <section className="scene slideshow" aria-label="Photo journey">
      <div
        className="slides enter-first"
        ref={slidesRef}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${slides.length} vertical slides. Swipe up to move forward, down to go back, or use the arrow keys.`}
        onKeyDown={onKeyDown}
        {...swipe.bind}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={
              i === index ? "slide is-active" : i < index ? "slide is-above" : "slide is-below"
            }
          >
            <SlideMedia slide={slide} isActive={i === index} eager={i <= 1} />
            {slide.hold && (
              <HoldTarget
                className="slide-hold"
                ariaLabel={`${slide.hold.holdLabel} to finish the journey`}
                onHoldComplete={onComplete}
                progressStyle={{ left: "14%", right: "14%", bottom: -8 }}
              >
                <span className="slide-hold-label">{slide.hold.holdLabel}</span>
              </HoldTarget>
            )}
          </div>
        ))}

        <div className="slide-dots" aria-hidden="true">
          {slides.map((_, i) => (
            <i key={i} className={i === index ? "is-on" : undefined} />
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          Slide {index + 1} of {slides.length}
        </p>
      </div>

      {!moved && <p className="swipe-hint">swipe up to move through the memories</p>}
    </section>
  );
}
