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
 */
export function App() {
  const { screen, dolly, goTo } = useStoryMachine(shouldStartAt() ?? "splash");
  const stageClass = `stage${dolly ? ` is-${dolly.phase}` : ""}`;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      audio.volume = storyContent.soundtrack.volume;
      audio.loop = true;
      void audio.play().catch(() => { startedRef.current = false; });
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, []);

  return (
    <div className={stageClass}>
      <audio
        ref={audioRef}
        src={storyContent.soundtrack.src}
        preload="auto"
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