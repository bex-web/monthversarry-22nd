import { useCallback, useEffect, useRef } from "react";

/**
 * usePointerSwipe
 *
 * Vertical swipe detection for the slideshow. A gesture counts when the
 * vertical displacement beats the horizontal displacement by a margin and
 * crosses a minimum distance, so tiny finger meanders and diagonal scrolls
 * never navigate. Two tolerance rules keep touch sane where browsers
 * interfere:
 *   - when a pointercancel arrives (gesture takeover), the finger's last
 *     reported position decides; a drag that already qualifies still counts
 *   - a short fast flick at least 42px inside 220ms counts even though it
 *     never reached the full threshold
 * Reports the live drag offset while the pointer is down so the deck can
 * follow the finger, and clears it on release.
 *
 * Navigation stays purely pointer-driven here; keyboard users move through
 * the slideshow with ArrowUp/ArrowDown (handled in the component plus
 * HoldTarget/Enter wiring).
 */

export type SwipeDirection = "up" | "down";

export interface UsePointerSwipeOptions {
  /** Minimum vertical displacement, px */
  thresholdPx?: number;
  /** Vertical must beat horizontal displacement by this ratio */
  dominanceRatio?: number;
  /** Fast-flick floor: below thresholdPx this much vertical still navigates */
  flickPx?: number;
  /** ...but only when the whole gesture lasted no longer than this, ms */
  flickMs?: number;
  onSwipe: (direction: SwipeDirection) => void;
  /** Live drag offset in px while pointing; 0 when the gesture ends */
  onDrag: (dy: number) => void;
}

export interface UsePointerSwipeResult {
  bind: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerCancel: (event: React.PointerEvent) => void;
  };
}

export function usePointerSwipe({
  thresholdPx = 64,
  dominanceRatio = 1.35,
  flickPx = 42,
  flickMs = 220,
  onSwipe,
  onDrag,
}: UsePointerSwipeOptions): UsePointerSwipeResult {
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const onDragRef = useRef(onDrag);
  onDragRef.current = onDrag;

  const gestureRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startT: 0,
    lastX: 0,
    lastY: 0,
    dy: 0,
    pressing: false,
  });

  const endGesture = useCallback(() => {
    const gesture = gestureRef.current;
    if (!gesture.pressing) return;
    gesture.pressing = false;
    gesture.pointerId = -1;
    onDragRef.current(0);
  }, []);

  const commitIfQualified = useCallback(
    (dx: number, dy: number, durationMs: number) => {
      if (Math.abs(dy) <= Math.abs(dx) * dominanceRatio) return;
      const qualified =
        Math.abs(dy) >= thresholdPx ||
        (durationMs <= flickMs && Math.abs(dy) >= flickPx);
      if (qualified) onSwipeRef.current(dy < 0 ? "up" : "down");
    },
    [dominanceRatio, thresholdPx, flickPx, flickMs],
  );

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (gesture.pressing) return;
    gesture.pressing = true;
    gesture.pointerId = event.pointerId;
    gesture.startX = event.clientX;
    gesture.startY = event.clientY;
    gesture.startT = event.timeStamp;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    gesture.dy = 0;
    onDragRef.current(0);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (!gesture.pressing || gesture.pointerId !== event.pointerId) return;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    gesture.dy = event.clientY - gesture.startY;
    onDragRef.current(gesture.dy);
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture.pressing || gesture.pointerId !== event.pointerId) return;
      commitIfQualified(
        event.clientX - gesture.startX,
        event.clientY - gesture.startY,
        event.timeStamp - gesture.startT,
      );
      endGesture();
    },
    [commitIfQualified, endGesture],
  );

  /** The browser took the pointer away (call dismissal, scroll claim):
   *  judge the finger's intent from its last known position instead of
   *  swallowing the whole gesture. */
  const onPointerCancel = useCallback(
    (event: React.PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture.pressing || gesture.pointerId !== event.pointerId) return;
      commitIfQualified(
        gesture.lastX - gesture.startX,
        gesture.lastY - gesture.startY,
        event.timeStamp - gesture.startT,
      );
      endGesture();
    },
    [commitIfQualified, endGesture],
  );

  useEffect(() => endGesture, [endGesture]);

  return {
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
