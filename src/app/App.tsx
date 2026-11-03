import { useEffect, useRef } from "react";
import { FloatingScene } from "../components/FloatingScene";
import { LetterPaper } from "../components/LetterPaper";
import { SplashScreen } from "../components/SplashScreen";
import { VerticalSlideshow } from "../components/VerticalSlideshow";
import { storyContent } from "../content/storyContent";
import { useStoryMachine, type ScreenId } from "./storyMachine";

/** Dev-only deep link (?screen=slideshow) so each screen can be checked
 *  without tapping through the flow. Compiled out for production. */
function shouldStartAt(): ScreenId | undefined {
  if (!import.meta.env.DEV) return undefined;
  const fromQuery = new URLSearchParams(window.location.search).get("screen");
  const targets = ["splash", "floating", "slideshow", "letter"];
  if (fromQuery && (targets as string[]).includes(fromQuery)) {
    return fromQuery as ScreenId;
  }
  return undefined;
}

/**
 * App
 *
 * Pure screen composition. Everything about navigation lives in
 * useStoryMachine; every piece of copy and media lives in storyContent.
 *
 * Background music starts as soon as the page is rendered: it begins
 * muted to satisfy the browsers' autoplay policy, and unmutes/promotes
 * playback on the first gesture; retries on later gestures in case the
 * first attempt was blocked.
 */
export function App() {
  const { screen, dolly, goTo } = useStoryMachine(shouldStartAt() ?? "splash");
  const stageClass = `stage${dolly ? ` is-${dolly.phase}` : ""}`;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.volume = storyContent.soundtrack.volume;
    audio.muted = true;
    audio.preload = "auto";

    const unmuteAndPlay = () => {
      if (!startedRef.current) startedRef.current = true;
      audio.muted = false;
      audio.volume = storyContent.soundtrack.volume;
      void audio.play().catch(() => {
        startedRef.current = false;
      });
    };
    const retryPlay = () => {
      if (startedRef.current || !audio.paused) return;
      startedRef.current = true;
      void audio.play()
        .then(() => {
          audio.muted = false;
          audio.volume = storyContent.soundtrack.volume;
        })
        .catch(() => { startedRef.current = false; });
    };

    const timer = window.setTimeout(() => {
      void audio.play().catch(() => {
        // blocked until a gesture; retry later
      });
    }, 0);
    window.addEventListener("pointerdown", unmuteAndPlay, { once: true });
    window.addEventListener("keydown", unmuteAndPlay, { once: true });
    window.addEventListener("pointerdown", retryPlay);
    window.addEventListener("keydown", retryPlay);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", unmuteAndPlay);
      window.removeEventListener("keydown", unmuteAndPlay);
      window.removeEventListener("pointerdown", retryPlay);
      window.removeEventListener("keydown", retryPlay);
    };
  }, []);

  return (
    <div className={stageClass}>
      <audio
        ref={audioRef}
        src={storyContent.soundtrack.src}
        preload="auto"
        autoPlay
        muted
        aria-hidden="true"
      />
      <div className="stage-content" key={screen}>
        {screen === "splash" && <SplashScreen onStart={() => goTo("floating")} />}
        {screen === "floating" && <FloatingScene onHoldComplete={() => goTo("slideshow")} />}
        {screen === "slideshow" && <VerticalSlideshow onComplete={() => goTo("letter")} />}
        {screen === "letter" && <LetterPaper onReturn={() => goTo("splash")} />}
      </div>
      <div className="dolly-veil" aria-hidden="true" />
    </div>
  );
}