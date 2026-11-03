# Happy 22-nd Monthversarrie, Mon Cherie!

A personal, phone-first anniversary journey: splash, floating photo cards you
can flick around, a five-slide memory reel, and a handwritten letter on lined
paper, with flowers that lean toward the finger.

The stack is Vite + React + TypeScript, frontend-only, with Matter.js driving
the floating-cards physics.

## Run it

```bash
npm install
npm run dev        # local dev server (shows network URLs, test on your phone)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
npm run assets     # re-generate public/assets from media/
npm run verify-browser  # drives the whole journey in a real browser (Playwright)
```

`verify-browser.mjs` needs the Playwright browser binary, installed once with
`npx playwright install firefox`. It launches its own browser, checks all the
interactions (taps, holds, swipes, drag-and-flick collisions), and prints a
PASS/FAIL list. The dev server or `npm run preview` must be running first.

## Story flow

```text
SPLASH (click to start journey)
   └─ FLOATING SCENE (drag the cards; hold the center text)
        └─ SLIDESHOW (swipe up/down through 5 slides; hold on slide 5)
             └─ LETTER (hold the paper to return and start over)
```

Every screen transition is one coordinated dolly move (`src/app/storyMachine.ts`),
and every screen resets its timers, videos, physics, and listeners when it
changes.

## Where things live

| Path | What it is |
|---|---|
| `src/content/storyContent.ts` | every piece of copy + every media path (edit this first) |
| `src/app/storyMachine.ts` | screen navigation + dolly transition state |
| `src/hooks/useHold.ts` | shared press-and-hold detection (pointer + keyboard) |
| `src/hooks/usePointerSwipe.ts` | vertical swipe detection for the slideshow |
| `src/components/FloatingScene.tsx` | Matter.js physics + card dragging |
| `src/components/VerticalSlideshow.tsx` | five full-screen slides, swipe + dots |
| `src/components/LetterPaper.tsx` | lined paper, typewriter reveal |
| `src/components/InteractiveFlowers.tsx` | touch-reactive botanical layers |
| `src/styles/tokens.css` | palette, fonts, motion + safe-area tokens |
| `public/assets/` | images, video, flower SVGs (see `ASSETS.md`) |
| `scripts/prepare-assets.mjs` | resizes/transcodes `media/` into `public/assets/` |

## Replacing placeholders

All copy (greeting, floating-scene text, slide texts, letter paragraph) and
all media paths are edited in `src/content/storyContent.ts`.
`ASSETS.md` has the exact file names the app expects and how to regenerate
them from the originals in `media/`.

Design notes and the reason behind each visual decision are recorded in the
header of `src/styles/global.css` and in `src/styles/tokens.css`.
