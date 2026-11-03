import { useEffect, useRef, useState } from "react";
import type { SlideshowSlide } from "../content/storyContent";

/**
 * SlideMedia
 *
 * One slide's media + text overlay. Images keep their per-slide focal point
 * (object-position config). The video slide is muted/inline/looped autoplay;
 * if the browser refuses, a small tap-to-play chip appears instead of
 * letting the slide die silently. Media load failures fall back to an
 * honest earthen placeholder block.
 */

export interface SlideMediaProps {
  slide: SlideshowSlide;
  isActive: boolean;
  eager: boolean;
}

function FocalImage({ slide, eager }: { slide: SlideshowSlide; eager: boolean }) {
  const [failed, setFailed] = useState(false);
  const focal = slide.focal ?? { x: "50%", y: "50%" };

  if (failed) {
    return (
      <div className="media-fallback" role="img" aria-label={slide.alt}>
        a full-screen photo goes here
      </div>
    );
  }

  return (
    <img
      src={slide.src}
      alt={slide.alt}
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      style={{ objectPosition: `${focal.x} ${focal.y}` }}
      onError={() => setFailed(true)}
    />
  );
}

function VideoSlide({ slide, isActive }: { slide: SlideshowSlide; isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      const attempt = video.play();
      if (attempt) {
        attempt
          .then(() => setBlocked(false))
          .catch(() => setBlocked(true)); // autoplay refused: offer the chip
      }
    } else {
      video.pause();
    }
  }, [isActive]);

  const tryPlayManually = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
  };

  if (failed) {
    return slide.poster ? (
      <img src={slide.poster} alt={slide.alt} draggable={false} />
    ) : (
      <div className="media-fallback" role="img" aria-label={slide.alt}>
        a memory video goes here
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        src={slide.src}
        poster={slide.poster}
        muted
        loop
        playsInline
        preload="auto"
        aria-label={slide.alt}
        tabIndex={-1}
        onError={() => setFailed(true)}
      />
      {blocked && (
        <button type="button" className="video-retry" onClick={tryPlayManually}>
          tap to play the memory
        </button>
      )}
    </>
  );
}

export function SlideMedia({ slide, isActive, eager }: SlideMediaProps) {
  return (
    <>
      <div className="slide-media-static">
        {slide.type === "video" ? (
          <VideoSlide slide={slide} isActive={isActive} />
        ) : (
          <FocalImage slide={slide} eager={eager} />
        )}
      </div>

      {slide.text && slide.textPosition && (
        <>
          <div className={`slide-scrim ${slide.textPosition}`} aria-hidden="true" />
          <p className={`slide-text ${slide.textPosition}`}>{slide.text}</p>
        </>
      )}
    </>
  );
}
