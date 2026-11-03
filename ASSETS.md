# ASSETS.md

Everything the app loads lives under `public/assets/`. Copy and media paths
are centralized in `src/content/storyContent.ts`; components never hardcode
them.

## How the placeholders were made

The files below were generated from the originals in `media/` with:

```bash
npm run assets
```

`scripts/prepare-assets.mjs` picks files, resizes photos (mozjpeg, quality
80), and transcodes the video to a 720x1280 portrait H.264 clip plus a poster
frame. To rebuild after adding new originals, either replace the file names
in the `SELECTION` object of that script or name your files the same way and
drop them into `media/`.

## File map

```text
public/assets/
├── floating/
│   ├── floating-01.jpg ... floating-10.jpg    (~1000px long edge)
├── slideshow/
│   ├── image-1.jpg ... image-4.jpg           (~2000px long edge)
│   ├── video-1.mp4                           (portrait 720x1280, faststart)
│   └── video-1-poster.jpg                    (first frame, also the error fallback)
└── flowers/
    ├── flower-left.svg
    ├── flower-center.svg
    └── flower-right.svg
```

## Replacing media

1. Put your originals in `media/`.
2. Edit `SELECTION` in `scripts/prepare-assets.mjs` if the names differ,
   then `npm run assets`.
   (Or simply overwrite the jpg/mp4 files in `public/assets` with your own
   renders and keep the same names.)
3. Photos: any aspect ratio works; `object-fit: cover` crops them. Use
   tall/portrait shots for the four slideshow images; the floating cards
   like a mix of wide and tall.
4. Video: H.264 MP4, portrait (taller than wide), muted-friendly. Keep it
   short; it autoplays muted and `object-fit`-covers the slide.

## Replacing copy

Open `src/content/storyContent.ts` and fill in:

| Token on screen | Edit this field |
|---|---|
| `Happy 22-nd Monthversarrie, Mon Cherie!` | `splash.title` (line breaks are computed automatically) |
| `04th November 2026` | `splash.date` |
| `click to start journey` | `splash.cta` |
| `FLOATING_SCENE_TEXT` | `floatingScene.centerText` |
| `(hold text to continue)` | `floatingScene.holdLabel` |
| `SLIDE_1_TEXT` | `slideshow[0].text` |
| `VIDEO_1_TEXT` | `slideshow[1].text` |
| `Hold to continue` (slide 5) | `slideshow[4].hold.holdLabel` |
| `LETTER_PARAGRAPH` | `letter.paragraph` |
| `(hold the paper to return)` | `letter.returnHint` |

## Tuning the crops

Each slideshow slide accepts `focal: { x, y }`, passed straight to
`object-position`. If a photo gets cropped awkwardly on a phone, adjust
those two percentages, for example `{ x: "35%", y: "30%" }`. No component
changes needed.

## Flowers

`public/assets/flowers/*.svg` are simple hand-drawn sprigs using the palette
in `src/styles/tokens.css`. Swap any of the three files with your own SVGs (tall-ish, stems rooted at the bottom of the viewBox) and the swaying
interaction picks them up unchanged.

## Accessibility notes on media

Keep alt text meaningful when you add real photos: the `alt` fields live next
to each media entry in `storyContent.ts` (currently honest placeholders,
saying a memory goes here until you swap the files).
