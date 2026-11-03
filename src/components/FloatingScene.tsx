import { useLayoutEffect, useRef } from "react";
import Matter from "matter-js";
import { storyContent } from "../content/storyContent";
import { FloatingCard } from "./FloatingCard";
import { HoldTarget } from "./HoldTarget";

/**
 * FloatingScene
 *
 * Ten paper-framed photos drifting in a calm zero-gravity field. Matter.js
 * runs a low-friction engine whose positions are applied directly to DOM
 * transforms each physics step: no React re-renders at 60fps, the engine
 * lives in refs and dies with the screen.
 *
 * Physics feel (targets, tuned by constants below):
 *   - no downward gravity, slow shared "wind" + per-card impulses keep the
 *     scene buoyant without chaos
 *   - speed is hard-clamped; restitution ~0.85 gives soft believable rebounds
 *   - cards never pass through each other (Matter resolver)
 *   - touch a card and flick it: pointer velocity becomes body momentum
 *
 * No water, ripples, or liquid distortion: this is open-air drift.
 */

const STEP_MS = 1000 / 60;
const WALL_THICKNESS = 260;
const FRICTION_AIR = 0.016;
const RESTITUTION = 0.85;
const MAX_VELOCITY = 9; // px per physics step; clamps flicks and windups
const MAX_ANGULAR = 0.05; // rad per step
const IMPULSE_MIN = 0.0005 * 100; // per-mass impulse scale (Matter-wise force)
const IMPULSE_RND = 0.0011;
const WIND_X = 0.3;
const WIND_Y = 0.22;
const DRAG_FOLLOW = 0.3; // pointer-follow damping while dragging
const DRAG_RELEASE = 0.6; // flick strength on release
const REDUCED_MOTION_SCALE = 0.35;

interface CardRuntime {
  body: Matter.Body;
  el: HTMLDivElement | null;
  w: number;
  h: number;
  nextImpulseAt: number;
}

interface DragState {
  index: number;
  pointerId: number;
  lastX: number;
  lastY: number;
  lastT: number;
  vx: number;
  vy: number;
}

function clampVector(x: number, y: number, max: number): { x: number; y: number } {
  const speed = Math.hypot(x, y);
  if (speed <= max || speed === 0) return { x, y };
  return { x: (x * max) / speed, y: (y * max) / speed };
}

function cardSize(field: { width: number; height: number }, wFrac: number, hFrac: number) {
  const w = Math.min(Math.max(wFrac * field.width, 72), Math.min(240, field.width * 0.52));
  const h = Math.min(Math.max(hFrac * field.width, 56), 260);
  return { w, h };
}

export function FloatingScene({ onHoldComplete }: { onHoldComplete: () => void }) {
  const content = storyContent.floatingScene;
  const layout = storyContent.floatingLayout;

  const fieldRef = useRef<HTMLDivElement | null>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const runtimes = useRef<CardRuntime[]>([]);
  const dragRef = useRef<DragState | null>(null);
  const fieldOffset = useRef({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const rect = field.getBoundingClientRect();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionScale = reduced ? REDUCED_MOTION_SCALE : 1;

    const engine = Matter.Engine.create({
      enableSleeping: false,
      positionIterations: 8,
      velocityIterations: 6,
    });
    engine.gravity.x = 0;
    engine.gravity.y = 0;

    let bounds = { width: rect.width, height: rect.height };
    let walls: Matter.Body[] = [];

    const buildWalls = () => {
      if (walls.length) Matter.Composite.remove(engine.world, walls, true);
      const { width, height } = bounds;
      const wallShape = (x: number, y: number) =>
        Matter.Bodies.rectangle(x, y, width + WALL_THICKNESS * 2, WALL_THICKNESS, {
          isStatic: true,
          restitution: 0.55,
          friction: 0,
          frictionAir: 0,
        });
      const vertical = (x: number, y: number) =>
        Matter.Bodies.rectangle(x, y, WALL_THICKNESS, height * 2 + WALL_THICKNESS * 2, {
          isStatic: true,
          restitution: 0.55,
          friction: 0,
          frictionAir: 0,
        });
      walls = [
        wallShape(width / 2, -WALL_THICKNESS / 2),
        wallShape(width / 2, height + WALL_THICKNESS / 2),
        vertical(-WALL_THICKNESS / 2, height / 2),
        vertical(width + WALL_THICKNESS / 2, height / 2),
      ];
      Matter.Composite.add(engine.world, walls);
    };

    runtimes.current = content.images.map((_, i) => {
      const shape = layout[i] ?? layout[layout.length - 1];
      const { w, h } = cardSize(bounds, shape.wFrac, shape.hFrac);
      const el = cardEls.current[i];
      if (el) {
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
      }
      const x = Math.min(Math.max(shape.xFrac * bounds.width, w / 2 + 8), bounds.width - w / 2 - 8);
      const y = Math.min(Math.max(shape.yFrac * bounds.height, h / 2 + 8), bounds.height - h / 2 - 8);
      const body = Matter.Bodies.rectangle(x, y, w, h, {
        restitution: RESTITUTION,
        frictionAir: FRICTION_AIR,
        friction: 0.02,
        slop: 0.02 * Math.min(w, h) * 0.06,
        angle: (i * 2.1) % (Math.PI / 4) - Math.PI / 8,
      });
      return {
        body,
        el,
        w,
        h,
        nextImpulseAt: (i + 1) * 2600 + 1200,
      };
    });

    Matter.Composite.add(
      engine.world,
      runtimes.current.map((rt) => rt.body),
    );
    buildWalls();

    let physicsTime = 0;
    let accumulator = 0;
    let lastFrame = performance.now();
    let raf = 0;
    let running = true;

    const syncTransforms = () => {
      for (const rt of runtimes.current) {
        if (!rt.el) continue;
        const { x, y } = rt.body.position;
        rt.el.style.transform =
          `translate3d(${(x - rt.w / 2).toFixed(2)}px, ${(y - rt.h / 2).toFixed(2)}px, 0) ` +
          `rotate(${rt.body.angle.toFixed(4)}rad)`;
      }
    };

    const frame = (now: number) => {
      raf = window.requestAnimationFrame(frame);
      const elapsed = Math.min(now - lastFrame, 100);
      lastFrame = now;
      accumulator = Math.min(accumulator + elapsed, 100);

      let stepped = false;
      while (accumulator >= STEP_MS) {
        accumulator -= STEP_MS;
        physicsTime += STEP_MS;

        engine.gravity.x = Math.sin(physicsTime * 0.00046) * WIND_X * motionScale;
        engine.gravity.y = Math.cos(physicsTime * 0.00031) * WIND_Y * motionScale;

        const drag = dragRef.current;
        runtimes.current.forEach((rt, index) => {
          if (drag && drag.index === index) return;
          if (physicsTime >= rt.nextImpulseAt) {
            rt.nextImpulseAt = physicsTime + 3400 + Math.random() * 3000;
            const angle = Math.random() * Math.PI * 2;
            const magnitude = rt.body.mass * ((IMPULSE_MIN + Math.random() * IMPULSE_RND) * motionScale);
            Matter.Body.applyForce(rt.body, rt.body.position, {
              x: Math.cos(angle) * magnitude,
              y: Math.sin(angle) * magnitude,
            });
          }
        });

        Matter.Engine.update(engine, STEP_MS);

        for (const rt of runtimes.current) {
          const clamped = clampVector(rt.body.velocity.x, rt.body.velocity.y, MAX_VELOCITY);
          if (clamped.x !== rt.body.velocity.x || clamped.y !== rt.body.velocity.y) {
            Matter.Body.setVelocity(rt.body, clamped);
          }
          const spin = rt.body.angularVelocity;
          if (Math.abs(spin) > MAX_ANGULAR) {
            Matter.Body.setAngularVelocity(rt.body, Math.sign(spin) * MAX_ANGULAR);
          }
        }
        stepped = true;
      }

      if (stepped) syncTransforms();
    };

    syncTransforms();
    raf = window.requestAnimationFrame(frame);

    const handleResize = () => {
      const fresh = field.getBoundingClientRect();
      const widthChanged = Math.abs(fresh.width - bounds.width) > 16;
      bounds = { width: fresh.width, height: fresh.height };
      buildWalls();

      if (widthChanged) {
        runtimes.current.forEach((rt, i) => {
          const shape = layout[i] ?? layout[layout.length - 1];
          const { w, h } = cardSize(bounds, shape.wFrac, shape.hFrac);
          if (rt.w > 0) Matter.Body.scale(rt.body, w / rt.w, h / rt.h);
          rt.w = w;
          rt.h = h;
          if (rt.el) {
            rt.el.style.width = `${w}px`;
            rt.el.style.height = `${h}px`;
          }
        });
      }

      for (const rt of runtimes.current) {
        const x = Math.min(Math.max(rt.body.position.x, rt.w / 2 + 8), bounds.width - rt.w / 2 - 8);
        const y = Math.min(Math.max(rt.body.position.y, rt.h / 2 + 8), bounds.height - rt.h / 2 - 8);
        if (x !== rt.body.position.x || y !== rt.body.position.y) {
          Matter.Body.setPosition(rt.body, { x, y });
        }
        Matter.Body.setVelocity(rt.body, { x: 0, y: 0 });
      }
      syncTransforms();
    };

    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 160);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        lastFrame = performance.now();
        accumulator = 0;
        raf = window.requestAnimationFrame(frame);
      }
    };

    // "Pointercancel" lands on the captured card element itself, so the
    // field-level listener is unnecessary. Nothing extra to wire here.

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      dragRef.current = null;
      Matter.Composite.clear(engine.world, false, true);
      Matter.Engine.clear(engine);
    };
  }, [content.images, layout]);

  const worldFromClient = (event: { clientX: number; clientY: number }) => {
    const field = fieldRef.current;
    const rect = field?.getBoundingClientRect();
    if (rect) fieldOffset.current = { left: rect.left, top: rect.top };
    if (!field || !rect) {
      return { x: event.clientX, y: event.clientY, rect: null };
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
  };

  const handleCardDown = (index: number, event: React.PointerEvent<HTMLDivElement>) => {
    const rt = runtimes.current[index];
    if (!rt || !rt.el || dragRef.current) return;
    event.preventDefault();
    worldFromClient(event);
    rt.el.classList.add("is-dragging");
    try {
      rt.el.setPointerCapture(event.pointerId);
    } catch {
      // mouse-only browsers without capture simply track in-element
    }
    dragRef.current = {
      index,
      pointerId: event.pointerId,
      lastX: event.clientX,
      lastY: event.clientY,
      lastT: event.timeStamp,
      vx: 0,
      vy: 0,
    };
    Matter.Body.setVelocity(rt.body, { x: 0, y: 0 });
  };

  const handleCardMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rt = runtimes.current[drag.index];
    if (!rt) return;

    const dt = event.timeStamp - drag.lastT;
    if (dt > 0) {
      drag.vx = (event.clientX - drag.lastX) / dt;
      drag.vy = (event.clientY - drag.lastY) / dt;
    }
    const pointer = worldFromClient(event);
    // Pointers can lie (edge-of-viewport events, capture artifacts report
    // coords outside the field). Clamping here matters twice over: the body
    // never teleports through a wall, and the follow velocity below is
    // integrated by the next physics step *before* the per-step clamp, so
    // an unclamped value could fling a card clean out of the field.
    const within = pointer.rect
      ? {
          x: Math.min(Math.max(pointer.x, rt.w / 2), Math.max(pointer.rect.width - rt.w / 2, rt.w / 2)),
          y: Math.min(Math.max(pointer.y, rt.h / 2), Math.max(pointer.rect.height - rt.h / 2, rt.h / 2)),
        }
      : pointer;
    Matter.Body.setPosition(rt.body, within);
    Matter.Body.setVelocity(rt.body, clampVector(
      drag.vx * STEP_MS * DRAG_FOLLOW,
      drag.vy * STEP_MS * DRAG_FOLLOW,
      MAX_VELOCITY,
    ));
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastT = event.timeStamp;
  };

  const handleCardUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rt = runtimes.current[drag.index];
    dragRef.current = null;
    rt?.el?.classList.remove("is-dragging");
    if (!rt) return;
    Matter.Body.setVelocity(
      rt.body,
      clampVector(drag.vx * STEP_MS * DRAG_RELEASE, drag.vy * STEP_MS * DRAG_RELEASE, MAX_VELOCITY),
    );
  };

  /** Browser canceled the pointer (call dismissal, gesture takeover):
   *  stop the drag and let the card rest instead of flicking it. */
  const handleCardCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rt = runtimes.current[drag.index];
    dragRef.current = null;
    rt?.el?.classList.remove("is-dragging");
    if (rt) Matter.Body.setVelocity(rt.body, { x: 0, y: 0 });
  };

  return (
    <section className="scene floating-scene" aria-label="Floating memory cards">
      <div className="float-field" ref={fieldRef}>
        {content.images.map((image, i) => (
          <FloatingCard
            key={i}
            image={image}
            refEl={(el) => {
              cardEls.current[i] = el;
            }}
            onPointerDown={(event) => handleCardDown(i, event)}
            onPointerMove={handleCardMove}
            onPointerUp={handleCardUp}
            onPointerCancel={handleCardCancel}
          />
        ))}
      </div>

      <div className="floating-center">
        <HoldTarget
          className="floating-center-hold"
          ariaLabel="Hold the center text to continue to the memories"
          duration={850}
          progressStyle={{ left: "20%", right: "20%", bottom: 6 }}
          onHoldComplete={onHoldComplete}
        >
          <p className="floating-token">{content.centerText}</p>
          <p className="floating-hint">{content.holdLabel}</p>
        </HoldTarget>
      </div>
    </section>
  );
}
