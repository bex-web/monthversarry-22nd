import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useHold
 *
 * Pointer-Events based press-and-hold with a rAF-driven progress value.
 * Used by the floating scene (hold the center text), slideshow slide 5
 * (hold to continue), and the letter screen (hold the paper). Keyboards
 * get the same behavior via Enter/Space (press and hold the key).
 *
 * Cancels when the pointer is released early, moves beyond a small
 * tolerance, leaves the target, or receives pointercancel. Fires at most
 * once per press.
 */

export interface UseHoldOptions {
  /** Hold threshold in ms */
  duration?: number;
  /** Pointer drift tolerated while holding, px */
  moveTolerancePx?: number;
  onComplete: () => void;
}

export interface UseHoldResult {
  holding: boolean;
  progress: number; // 0..1
  bind: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerLeave: (event: React.PointerEvent) => void;
    onPointerCancel: (event: React.PointerEvent) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onKeyUp: (event: React.KeyboardEvent) => void;
    onContextMenu: (event: React.MouseEvent) => void;
  };
}

const KEY_HOLD_KEYS = new Set(["Enter", " "]);

export function useHold({
  duration = 800,
  moveTolerancePx = 14,
  onComplete,
}: UseHoldOptions): UseHoldResult {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const holdRef = useRef({
    raf: 0,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startAt: 0,
    completed: false,
    keyHeld: false,
  });

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(holdRef.current.raf);
    holdRef.current.raf = 0;
  }, []);

  const tick = useCallback(() => {
    const hold = holdRef.current;
    const progressValue = Math.min(1, (performance.now() - hold.startAt) / duration);
    setProgress(progressValue);

    if (progressValue >= 1) {
      if (!hold.completed) {
        hold.completed = true;
        setHolding(false);
        onCompleteRef.current();
      }
      stopLoop();
      return;
    }
    hold.raf = requestAnimationFrame(tick);
  }, [duration, stopLoop]);

  const cancelHold = useCallback((resetVisual: boolean) => {
    const hold = holdRef.current;
    stopLoop();
    hold.raf = 0;
    if (!hold.completed && resetVisual) {
      setHolding(false);
      setProgress(0);
    }
    hold.pointerId = -1;
    hold.keyHeld = false;
  }, [stopLoop]);

  const beginHold = useCallback((x: number, y: number) => {
    const hold = holdRef.current;
    hold.startX = x;
    hold.startY = y;
    hold.startAt = performance.now();
    hold.completed = false;
    setHolding(true);
    setProgress(0);
    hold.raf = requestAnimationFrame(tick);
  }, [tick]);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    const hold = holdRef.current;
    if (hold.pointerId !== -1 || hold.keyHeld) return;
    // Prevent the compatibility mouse/click fallbacks and text selection;
    // our own handlers drive the interaction.
    event.preventDefault();
    hold.pointerId = event.pointerId;
    beginHold(event.clientX, event.clientY);
  }, [beginHold]);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const hold = holdRef.current;
    if (hold.pointerId !== event.pointerId || hold.completed) return;
    const dx = event.clientX - hold.startX;
    const dy = event.clientY - hold.startY;
    if (Math.hypot(dx, dy) > moveTolerancePx) {
      cancelHold(true);
    }
  }, [cancelHold, moveTolerancePx]);

  const onPointerUp = useCallback(() => {
    if (holdRef.current.pointerId !== -1) cancelHold(true);
  }, [cancelHold]);

  const onPointerLeave = useCallback(() => {
    if (holdRef.current.pointerId !== -1) cancelHold(true);
  }, [cancelHold]);

  const onPointerCancel = useCallback(() => {
    if (holdRef.current.pointerId !== -1) cancelHold(true);
  }, [cancelHold]);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    const hold = holdRef.current;
    if (!KEY_HOLD_KEYS.has(event.key) || event.repeat || hold.keyHeld || hold.pointerId !== -1) return;
    event.preventDefault();
    hold.keyHeld = true;
    beginHold(0, 0);
  }, [beginHold]);

  const onKeyUp = useCallback(
    (event: React.KeyboardEvent) => {
      if (KEY_HOLD_KEYS.has(event.key) && holdRef.current.keyHeld) cancelHold(true);
    },
    [cancelHold],
  );

  const onContextMenu = useCallback((event: React.MouseEvent) => {
    // Long-pressing a hold target should not open the context menu.
    event.preventDefault();
  }, []);

  // Stop the rAF loop if the component unmounts mid-hold.
  useEffect(() => stopLoop, [stopLoop]);

  return {
    holding,
    progress,
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave,
      onPointerCancel,
      onKeyDown,
      onKeyUp,
      onContextMenu,
    },
  };
}
