import { useEffect, useRef } from "react";
import { assetPath } from "../content/storyContent";

/**
 * InteractiveFlowers
 *
 * The letter screen's botanical arrangement (one depth layer per instance:
 * "back" renders behind the paper, "front" in front of it). Pointer movement
 * across the letter scene (touch or mouse) leans and shifts the sprigs with
 * a spring that settles on release; each flower carries a depth value so
 * layers move with slightly different amplitudes.
 *
 * The sprigs never drift on their own; they only answer the finger. The rAF
 * loop parks itself after settling and wakes again on the next input, and
 * it writes transforms straight to the elements, with no re-renders.
 *
 * Replace the artwork by swapping public/assets/flowers/*.svg; this
 * component only wires the motion.
 */

const LEAN_ROT = { front: 4.5, back: 2.5 }; // degrees at full lean
const LEAN_SHIFT = { front: 15, back: 7 }; // px at full lean
const REDUCED_SCALE = 0.35;
const SETTLE_EPSILON = 0.0015;

interface FlowerSpec {
  src: string;
  className: string;
  depth: number;
}

const BACK_FLOWERS: FlowerSpec[] = [
  { src: assetPath("flowers/flower-left.svg"), className: "flower back back-left", depth: 0.7 },
  { src: assetPath("flowers/flower-right.svg"), className: "flower back back-right", depth: 0.8 },
];

const FRONT_FLOWERS: FlowerSpec[] = [
  { src: assetPath("flowers/flower-center.svg"), className: "flower front front-between", depth: 1.1 },
  { src: assetPath("flowers/flower-left.svg"), className: "flower front front-left", depth: 0.9 },
  { src: assetPath("flowers/flower-right.svg"), className: "flower front front-right", depth: 1.25 },
];

export interface InteractiveFlowersProps {
  layer: "back" | "front";
  regionRef: React.RefObject<HTMLElement | null>;
  reducedMotion: boolean;
}

export function InteractiveFlowers({ layer, regionRef, reducedMotion }: InteractiveFlowersProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const region = regionRef.current;
    if (!host || !region) return;

    const flowers = Array.from(host.querySelectorAll<HTMLElement>(".flower")).map((el) => ({
      el,
      depth: Number(el.dataset.depth ?? "1"),
    }));
    if (!flowers.length) return;

    const scale = reducedMotion ? REDUCED_SCALE : 1;
    const rot = LEAN_ROT[layer] * scale;
    const shift = LEAN_SHIFT[layer] * scale;

    let target = 0;
    let lean = 0;
    let raf = 0;
    let parked = true;

    const paint = () => {
      for (const flower of flowers) {
        flower.el.style.setProperty("--fr", `${(lean * rot * flower.depth).toFixed(2)}deg`);
        flower.el.style.setProperty("--fx", `${(lean * shift * flower.depth).toFixed(2)}px`);
      }
    };

    const frame = () => {
      lean += (target - lean) * (layer === "front" ? 0.085 : 0.06);
      if (Math.abs(lean - target) < SETTLE_EPSILON) lean = target;
      paint();
      if (lean === target) {
        raf = 0;
        parked = true;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (parked) {
        parked = false;
        raf = requestAnimationFrame(frame);
      }
    };

    const setTargetFromPointer = (clientX: number, clientY: number) => {
      const rect = region.getBoundingClientRect();
      if (clientY < rect.top + rect.height * 0.42) {
        target = 0;
      } else {
        target = Math.max(-1, Math.min(1, (clientX / rect.width - 0.5) * 2));
      }
      wake();
    };

    const onPointerMove = (event: PointerEvent) => setTargetFromPointer(event.clientX, event.clientY);
    const settle = () => {
      target = 0;
      wake();
    };

    region.addEventListener("pointermove", onPointerMove);
    region.addEventListener("pointerdown", onPointerMove);
    region.addEventListener("pointerup", settle);
    region.addEventListener("pointerleave", settle);
    region.addEventListener("pointercancel", settle);

    return () => {
      cancelAnimationFrame(raf);
      region.removeEventListener("pointermove", onPointerMove);
      region.removeEventListener("pointerdown", onPointerMove);
      region.removeEventListener("pointerup", settle);
      region.removeEventListener("pointerleave", settle);
      region.removeEventListener("pointercancel", settle);
    };
  }, [layer, reducedMotion, regionRef]);

  const flowers = layer === "back" ? BACK_FLOWERS : FRONT_FLOWERS;

  return (
    <div ref={hostRef} className={`flowers-${layer}`} aria-hidden="true">
      {flowers.map((flower) => (
        <div key={flower.className} className={flower.className} data-depth={flower.depth}>
          <img src={flower.src} alt="" draggable={false} />
        </div>
      ))}
    </div>
  );
}
