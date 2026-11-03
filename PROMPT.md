# PROMPT.md — Nana 22nd Monthversary Experience

## Role

You are the coding agent responsible for implementing a polished, production-ready, mobile-first interactive web experience. Work directly in the current repository. Do not stop at a design proposal or static mockup: inspect the project, implement the experience, run the available checks, and leave the code in a usable state.

The experience is a personal 22-month anniversary journey for Nana. It should feel intimate, calm, tactile, and carefully composed rather than like a generic greeting-card template.

## 1. Start by inspecting the repository

Before changing anything:

1. Inspect the current directory, project structure, `package.json` (or equivalent), framework, scripts, and existing conventions.
2. Identify the current entry point, routing/state approach, styling system, and asset locations.
3. Preserve the existing stack and working architecture. Do not replace functioning code or introduce a new framework just for convenience.
4. If the repository is genuinely empty, scaffold a lightweight **Vite + React + TypeScript** application.
5. Keep the project frontend-only. Do not add a backend, database, authentication, analytics, or external API calls.
6. Prefer existing dependencies. Add a dependency only when it materially improves the implementation. **Matter.js** is the preferred option for reliable 2D collision and drag interaction in the floating scene, provided it fits the existing stack. If adding it is impractical, implement a small, isolated physics layer rather than pulling in a large rendering engine.

Do not ask for media assets or final letter copy. Use clearly named placeholders and make replacement straightforward.

## 2. Experience flow

Implement the following state flow. Keep the screens as distinct, maintainable components and manage navigation through one clear state machine or equivalent centralized flow.

```text
SPLASH
  └─ click/tap "click to start journey"
       ↓
FLOATING SCENE
  └─ press and hold the central text area
       ↓  dolly-in / zoom transition
SLIDESHOW
  ├─ swipe up → next slide
  ├─ swipe down → previous slide (optional but recommended)
  └─ on slide 5, press and hold "Hold to continue"
       ↓  dolly-in / zoom transition
LETTER
  └─ press and hold the paper area
       ↓
SPLASH
```

The return to the splash screen must reset the journey cleanly. Do not leave stale timers, active video playback, animation loops, pointer constraints, or event listeners behind when changing screens.

## 3. Art direction

### Overall mood

- **Theme:** Boho earthy tones, warm, organic, intimate, understated.
- **Primary palette:** beige, clay, terracotta, muted sage, olive, and deep forest green.
- **Avoid:** neon colors, glossy UI, cyberpunk styling, excessive gradients, loud glow effects, glitter overload, water/ripple simulations, and generic template-like decorations.
- Use texture sparingly: subtle paper grain, a faint warm vignette, soft shadows, and restrained botanical details.
- Motion should feel soft and physical, not chaotic or hyperactive.

### Reference palette

Use these sampled colors from the supplied **Boho Earthy Tones** reference as the starting design tokens:

| Token | Name | HEX |
|---|---|---|
| `clay-100` | Sunbaked Clay | `#F4C8A0` |
| `clay-200` | Dusty Apricot | `#E8A97C` |
| `clay-300` | Terracotta Glow | `#D5875F` |
| `clay-400` | Warm Adobe | `#BD7142` |
| `clay-500` | Rustic Canyon | `#A45B32` |
| `clay-600` | Desert Clay | `#8D4824` |
| `sage-100` | Sage Whisper | `#C3BFA0` |
| `olive-200` | Dried Olive | `#A8A07C` |
| `moss-300` | Weathered Moss | `#8D8B61` |
| `olive-400` | Vintage Olive | `#6F754C` |
| `forest-500` | Deep Forest | `#515C32` |
| `forest-600` | Earthbound Green | `#394420` |

Suggested supporting neutrals:

- Warm page background: `#F5F0E7`
- Paper: `#FFFDF7`
- Main text: `#29271F`
- Muted text: `#716D5D`
- Fine line / paper ruling: `#D8D1C3`

Use CSS variables/design tokens. Do not scatter raw color values throughout component styles.

### Typography

Use a deliberate serif + sans-serif pairing:

- **Display/headings:** an expressive editorial serif such as `Cormorant Garamond`, `Playfair Display`, or a suitable existing serif.
- **UI labels/body:** a clean sans-serif such as `DM Sans`, `Manrope`, or a suitable existing sans-serif.
- **Letter handwriting:** a readable handwritten font such as `Caveat` or `Patrick Hand`, with a cursive fallback.

The handwritten font is only for the letter paragraph and possibly a tiny personal detail. Do not use it for every UI label. Load web fonts only if the project already supports them or the implementation can provide sensible local/system fallbacks. The page must remain readable when external fonts fail to load.

## 4. Screen specifications

### Screen A — Splash

Full-screen opening screen, designed for a portrait smartphone viewport.

Exact copy (preserve spelling, punctuation, and capitalization):

**`Happy 22-nd Monthversarrie, Mon Cherie!`**

`click to start journey`

Design direction:

- Warm beige background with restrained earthy accents.
- The main greeting is the visual focus, using the display serif.
- The CTA should look like a quiet invitation, not a large conventional app button.
- Add only subtle ambient motion (for example, a slow opacity shift or small botanical movement).
- The whole CTA region must be easy to tap with one thumb.
- Tapping/clicking the CTA transitions into the floating scene.

### Screen B — Floating image scene

This screen contains several image cards that appear to float freely in a calm, weightless space.

**Important interpretation:** “floating on water” refers only to the gentle floating motion. Do **not** render water, waves, water reflections, ripples, or liquid distortion. The objects should simply drift in open space.

Visual composition:

- Use approximately 5–7 floating image cards, depending on the available viewport and supplied assets.
- Cards should have varied but balanced dimensions, rounded corners, a subtle border/shadow, and image cropping that still feels photographic.
- Arrange them across the viewport with enough breathing room. Avoid covering the central text area.
- The background should remain quiet and earthy, with subtle depth rather than a busy collage.
- Place a central text placeholder above the floating objects. Use a clearly identifiable content token such as `FLOATING_SCENE_TEXT` so it is easy to replace.
- Near the bottom, show the instruction **`(hold text to continue)`**.

Physics and touch interaction:

- Floating cards must drift slowly and independently. Their motion should feel buoyant and organic, with gentle changes in direction and rotation.
- Cards must physically collide with one another and respond to collisions with believable rebound. They must not pass through each other.
- Cards should remain within the visible scene boundaries. Resize/recalculate the physics bounds on viewport changes and orientation changes.
- A user must be able to touch/drag a card and flick it with a finger. The card should receive momentum from the swipe and collide with nearby cards.
- Use a low-gravity or zero-gravity simulation with gentle ambient forces. If using Matter.js, configure low air friction, modest restitution, and no downward gravity.
- Avoid fast uncontrolled bouncing. Clamp extreme velocities and use conservative force values.
- Use `requestAnimationFrame` for rendering and clean it up when leaving the screen. Avoid unnecessary React re-renders on every physics tick; keep high-frequency positions in refs or an isolated renderer.
- If DOM elements are used for cards, synchronize their transform from the physics engine efficiently. If Canvas is used, preserve image quality and touch hit-testing.
- Ensure the central text remains readable and receives hold input. Floating cards must not intercept pointer events intended for the central hold target.

Hold interaction:

- The user must **press and hold the central text area** to continue.
- Use a configurable hold duration around **700–900 ms**.
- Show restrained feedback while holding, such as a thin progress indicator, subtle scale change, or soft opacity change.
- Cancel the hold when the pointer is released early, leaves the target, or receives `pointercancel`.
- Trigger the transition only once after the threshold is reached.

### Screen C — Full-screen vertical slideshow

The slideshow contains exactly five full-screen slides in this order:

| Index | Media | Overlay text |
|---|---|---|
| 1 | `image-1` | A greeting placeholder positioned in the lower third |
| 2 | `video-1` | A placeholder positioned around the center |
| 3 | `image-2` | No text |
| 4 | `image-3` | No text |
| 5 | `image-4` | `Hold to continue` |

Requirements:

- Each image/video fills the complete available viewport (`object-fit: cover` by default).
- Account for portrait crops. Keep the media focal point configurable per slide so the user can adjust `object-position` without editing component logic.
- The slides are navigated primarily with **vertical swipe gestures**. Swipe up moves forward; swipe down may move backward.
- Add a polished transition between slides: a short combination of vertical movement, scale, and opacity. Keep it smooth and restrained; do not use a generic horizontal carousel transition.
- Prevent accidental navigation from tiny finger movement. Use a minimum swipe distance and distinguish vertical gestures from horizontal gestures.
- Do not allow the page itself to scroll or rubber-band during the slideshow.
- Show a minimal progress indicator (for example, five small dots or a slim vertical progress mark) without competing with the media.
- Do not show captions or UI controls on slides 3 and 4.
- On slide 5, render **`Hold to continue`** in a clear, thumb-accessible overlay region. Holding it triggers the letter transition.

Video behavior:

- Use `autoplay`, `muted`, and `playsInline` when the video slide becomes active, because mobile browsers commonly block unmuted autoplay.
- Pause the video when the user leaves slide 2 or exits the slideshow.
- Handle autoplay rejection gracefully. The screen must still work if autoplay is blocked.
- Keep video controls hidden for the intended cinematic presentation, but do not rely on audio autoplay.

Dolly transition:

- Entering the slideshow from the floating scene should feel like moving into the central text/image space: scale up slightly, add restrained depth/blur, then reveal slide 1.
- Do not abruptly replace the entire DOM without a transition. Use a transition layer or coordinated state/class transition.

### Screen D — Final letter page

This is a calm, mostly static closing screen.

Layout:

- Use a warm background consistent with the earlier screens.
- Place a large white/off-white paper sheet in the central area. It should resemble a real sheet of lined stationery, with subtle paper texture, a faint edge/shadow, and fine horizontal ruling.
- The paper should fit the smartphone screen with safe margins. Its text must remain readable without requiring page scrolling on common phone sizes. If the paragraph is longer, allow the paper content area to scroll internally without moving the flower area.
- The letter contains **one paragraph placeholder**, not multiple fabricated paragraphs. Use a clearly named token such as `LETTER_PARAGRAPH` in the central content configuration.
- Render the paragraph in a dark, handwritten-style font. Animate it with a **typewriter effect**, revealing characters progressively.
- The cursor may be a thin blinking caret. Remove it when typing finishes.
- Keep line height generous and ensure the text wraps naturally on narrow screens.

Interactive flowers:

- Place a small floral/botanical arrangement along the bottom of the screen. The flowers should be visible but must not obscure the paper or letter text.
- The flower group must react to finger movement horizontally. When the user touches/drags toward the left or right side of the lower screen, flowers should sway/lean and shift in the corresponding direction.
- Use smooth interpolation/spring easing so the flowers follow the finger with a little lag and settle naturally when the touch ends.
- Pointer/touch movement should work across the flower interaction region. Support mouse movement for desktop preview as well.
- Separate flower layers by depth so foreground and background flowers move at slightly different amplitudes (subtle parallax).
- Do not make the flowers permanently drift on their own; user input should be the main driver of this interaction.
- Prefer replaceable local SVG/PNG assets. If no flower assets exist yet, create tasteful temporary botanical SVG placeholders that can later be replaced without rewriting interaction logic.

Return interaction:

- The user must **press and hold the paper area** to return to the splash screen.
- Use the same hold interaction utility as the other screens, with subtle progress feedback.
- Do not trigger the return from a normal tap or a short accidental press.
- When returning, stop the typewriter animation and reset the experience state cleanly.

## 5. Transition and interaction system

Build reusable utilities/hooks for hold detection, swipe detection, and screen transitions instead of duplicating fragile pointer logic in every screen.

### Hold behavior

- Implement with Pointer Events so touch, stylus, and mouse share the same code path.
- Support `pointerdown`, `pointerup`, `pointerleave`/`pointerout` as appropriate, and `pointercancel`.
- Use a configurable threshold (default around 800 ms).
- Cancel when the pointer moves beyond a small tolerance, unless the interaction explicitly allows movement.
- Prevent duplicate activation from both touch and click compatibility events.
- Provide keyboard accessibility: Enter/Space should activate the equivalent action, and visible controls must have useful labels.
- Prevent text selection/context menus on the hold targets where appropriate without globally disabling normal accessibility behavior.

### Touch and viewport behavior

- Add a proper mobile viewport meta tag, including `viewport-fit=cover`.
- Use `100dvh`/`100svh` with a fallback to `100vh` to account for mobile browser chrome.
- Respect `env(safe-area-inset-top)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)`, and `env(safe-area-inset-left)`.
- Use `overscroll-behavior: none` on the immersive experience container.
- Apply `touch-action` narrowly to gesture surfaces. Do not disable touch behavior globally in ways that break accessibility or normal controls.
- Test portrait layouts first. Landscape should degrade gracefully rather than overflow or crash.

### Screen transitions

- Use a shared transition duration and easing curve, approximately 550–850 ms depending on the transition.
- The dolly effect should combine a controlled scale-up, opacity/blur change, and slight perspective where useful.
- Avoid excessive motion. Honor `prefers-reduced-motion` by reducing or removing nonessential movement while keeping navigation fully functional.
- Prevent input from activating multiple transitions while one is in progress.

## 6. Content and asset organization

Make all replaceable content easy to find. Prefer one configuration module for copy and media paths, for example:

```ts
export const storyContent = {
  splash: {
    title: "Happy 22-nd Monthversarrie, Mon Cherie!",
    cta: "click to start journey",
  },
  floatingScene: {
    centerText: "FLOATING_SCENE_TEXT",
    holdLabel: "(hold text to continue)",
    images: [
      "/assets/floating/floating-01.jpg",
      "/assets/floating/floating-02.jpg",
      "/assets/floating/floating-03.jpg",
      "/assets/floating/floating-04.jpg",
      "/assets/floating/floating-05.jpg",
      "/assets/floating/floating-06.jpg",
    ],
  },
  slideshow: [
    { type: "image", src: "/assets/slideshow/image-1.jpg", text: "SLIDE_1_TEXT", textPosition: "lower-third" },
    { type: "video", src: "/assets/slideshow/video-1.mp4", text: "VIDEO_1_TEXT", textPosition: "center" },
    { type: "image", src: "/assets/slideshow/image-2.jpg" },
    { type: "image", src: "/assets/slideshow/image-3.jpg" },
    { type: "image", src: "/assets/slideshow/image-4.jpg", holdLabel: "Hold to continue" },
  ],
  letter: {
    paragraph: "LETTER_PARAGRAPH",
  },
};
```

Adapt this shape to the existing project's conventions. The example is a content contract, not a requirement to create this exact filename.

Suggested asset folders (adapt to the repository):

```text
public/
└── assets/
    ├── floating/
    │   ├── floating-01.jpg
    │   ├── floating-02.jpg
    │   └── ...
    ├── slideshow/
    │   ├── image-1.jpg
    │   ├── video-1.mp4
    │   ├── image-2.jpg
    │   ├── image-3.jpg
    │   └── image-4.jpg
    └── flowers/
        ├── flower-left.svg
        ├── flower-center.svg
        └── flower-right.svg
```

Implementation requirements:

- Centralize asset paths and text in one content/config file.
- Do not scatter media paths or copy strings across UI components.
- Add graceful fallbacks for missing media so the page remains navigable before the user inserts their photos/videos.
- Make each slideshow slide's `object-position` configurable.
- Document the exact filenames and replacement locations in the project's README (or a concise `ASSETS.md`).
- Do not fabricate personal photos, video content, or final letter text. Use placeholders.

## 7. Suggested component structure

Adapt this to the existing codebase rather than forcing a rigid folder layout:

```text
src/
├── app/
│   ├── App.tsx
│   └── storyMachine.ts
├── components/
│   ├── HoldTarget.tsx
│   ├── DollyTransition.tsx
│   ├── FloatingCard.tsx
│   ├── FloatingScene.tsx
│   ├── VerticalSlideshow.tsx
│   ├── LetterPaper.tsx
│   └── InteractiveFlowers.tsx
├── hooks/
│   ├── useHold.ts
│   └── usePointerSwipe.ts
├── content/
│   └── storyContent.ts
├── styles/
│   ├── tokens.css
│   └── global.css
└── main.tsx
```

Do not create components that add no meaningful separation. The goal is maintainable implementation, not folder-count optimization theater.

## 8. Responsive design and performance

Primary target: modern smartphone browsers in portrait orientation.

- Design around a 360–430 CSS-pixel wide viewport, while supporting smaller devices down to approximately 320 px.
- The experience should occupy the full visible screen without accidental document scrolling.
- Use `clamp()` and viewport-relative sizing for typography and card dimensions.
- Avoid tiny hit targets. Hold zones and primary tap targets should be comfortably thumb-accessible.
- Keep media at appropriate dimensions and use lazy loading where it does not interfere with transitions.
- Avoid layout thrashing and excessive state updates during animation.
- Use `requestAnimationFrame` for continuous movement and cancel it on unmount/state exit.
- Pause or reduce nonessential animation when the tab is hidden.
- Ensure the app remains usable on mid-range phones; avoid heavy 3D engines or large decorative libraries.
- Do not make the entire experience depend on hover. All interactions must work with touch.

## 9. Accessibility and reliability

- Use semantic buttons/interactive elements where practical.
- Provide accessible names for controls and meaningful alt text for images where the images convey content. Decorative flowers should have empty alt text or be hidden from assistive technology.
- Maintain readable contrast against the earthy backgrounds.
- Support keyboard navigation for desktop testing.
- Respect `prefers-reduced-motion`.
- Handle image/video load failures with graceful placeholders.
- Handle browser autoplay restrictions without breaking navigation.
- Ensure all timers, event listeners, observers, animation frames, and physics engine resources are cleaned up.
- Avoid accidental navigation from a quick tap when a hold is required.

## 10. Acceptance criteria

The implementation is complete only when all of the following are true:

- [ ] The app launches using the repository's documented development command.
- [ ] Splash screen shows the exact greeting and CTA copy.
- [ ] Tapping the splash CTA enters the floating scene.
- [ ] Floating images drift smoothly without any water/ripple visual effect.
- [ ] Floating images collide with each other and remain inside scene bounds.
- [ ] Touch dragging/flicking an image moves it and affects nearby cards through collisions.
- [ ] The central placeholder text stays readable and can be held to continue.
- [ ] A short press does not trigger hold actions; a completed hold triggers exactly once.
- [ ] The floating scene transitions into the slideshow with a dolly/zoom effect.
- [ ] The slideshow contains exactly five slides in the specified order.
- [ ] Images and video fill the viewport, with configurable focal positions.
- [ ] Swiping up advances the slideshow with a vertical transition.
- [ ] Slide 1 text appears in the lower third; slide 2 text appears in the center; slides 3 and 4 have no text; slide 5 shows `Hold to continue`.
- [ ] Video playback is muted/inline, starts when appropriate, and pauses when inactive.
- [ ] Holding the slide 5 CTA enters the final letter screen with a dolly/zoom effect.
- [ ] The final letter appears on a lined white/off-white paper sheet.
- [ ] The letter paragraph is shown in a handwritten-style font with a typewriter reveal.
- [ ] Flowers at the bottom sway/shift in response to horizontal touch movement.
- [ ] Holding the paper returns to the splash screen and resets the experience.
- [ ] Layout respects mobile safe areas and works at 320 px, 360 px, 390 px, and 430 px widths.
- [ ] Reduced-motion settings are respected.
- [ ] No console errors, runaway animation loops, or broken asset references remain.
- [ ] README or `ASSETS.md` explains how to replace every placeholder image, video, flower asset, and text value.

## 11. Execution order

Implement in this order to keep the work testable:

1. Inspect the repository and report the existing stack briefly in your working notes.
2. Establish design tokens, global mobile viewport behavior, and the central content configuration.
3. Implement the screen state flow and splash screen.
4. Implement the floating scene, physics, card collisions, and drag/flick behavior.
5. Implement reusable hold detection and dolly transitions.
6. Implement the five-slide vertical slideshow and video lifecycle.
7. Implement the lined letter page, typewriter text, and touch-reactive flowers.
8. Add asset fallbacks and replacement documentation.
9. Run the build, lint, type checks, and any existing tests. Fix errors rather than merely reporting them.
10. Review the experience at mobile viewport sizes and verify every transition and gesture.

At completion, summarize:

- What was implemented.
- Which files were added or changed.
- How to run the project.
- Where to replace the placeholder copy and media assets.
- Any genuine limitations that remain.

**Do not claim an interaction works unless it has been implemented and verified.** Prioritize a complete, reliable mobile experience over decorative complexity.
