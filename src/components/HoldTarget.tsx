import type { CSSProperties, ReactNode } from "react";
import { useHold } from "../hooks/useHold";

/**
 * HoldTarget
 *
 * Shared press-and-hold surface: renders the pointer/keyboard bindings, the
 * is-holding state class, and the thin progress hairline. Every hold action
 * in the app (center text, slide 5, letter paper) uses this, so feedback
 * and timing stay consistent.
 */

export interface HoldTargetProps {
  onHoldComplete: () => void;
  /** Hold threshold in ms (spec default ~800) */
  duration?: number;
  className?: string;
  ariaLabel?: string;
  /** Hairline insets within the target, e.g. { left: "20%", bottom: 10 } */
  progressStyle?: CSSProperties;
  children?: ReactNode;
}

export function HoldTarget({
  onHoldComplete,
  duration = 800,
  className = "",
  ariaLabel,
  progressStyle,
  children,
}: HoldTargetProps) {
  const { holding, progress, bind } = useHold({ duration, onComplete: onHoldComplete });

  return (
    // A div with button semantics because hold targets wrap flow content
    // (the paper sheet, overlay blocks) that buttons may not contain.
    <div
      role="button"
      tabIndex={0}
      className={`hold-target ${holding ? "is-holding " : ""}${className}`.trim()}
      aria-label={ariaLabel}
      {...bind}
    >
      {children}
      <span
        className="hold-progress"
        style={progressStyle}
        aria-hidden="true"
      >
        <i style={{ width: `${Math.round(progress * 100)}%` }} />
      </span>
    </div>
  );
}
