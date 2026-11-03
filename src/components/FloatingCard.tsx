import { useState } from "react";
import type { FloatingImage } from "../content/storyContent";

/**
 * FloatingCard
 *
 * Visual half of a floating memory: a small paper-framed print. Position is
 * owned entirely by the physics layer (the parent paints transforms onto
 * this element); size also comes from the physics setup, so this component
 * only renders the frame, handles load/error states, and forwards pointer
 * events for dragging.
 */

export interface FloatingCardProps {
  image: FloatingImage;
  refEl: (element: HTMLDivElement | null) => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export function FloatingCard({
  image,
  refEl,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: FloatingCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className="float-card"
      ref={refEl}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="float-card-inner">
        {failed ? (
          <div className="media-fallback" role="img" aria-label={image.alt}>
            a photo goes here
          </div>
        ) : (
          <img
            src={image.src}
            alt={image.alt}
            draggable={false}
            loading="eager"
            className={loaded ? "is-loaded" : ""}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
