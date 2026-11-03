/**
 * storyContent.ts
 *
 * The single source of truth for every piece of copy and every media path.
 * Nothing in the components hardcodes text or asset URLs; to personalize the
 * experience, edit only this file (and drop your real photos into
 * public/assets/, see ASSETS.md for the exact file list).
 */

/** Resolves an asset path against the app's BASE_URL so the build works from
 *  any subdirectory (vite.config.ts sets base "./"). "floating/x.jpg"
 *  becomes "./assets/floating/x.jpg" in a default build. */
export function assetPath(relative: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${base.endsWith("/") ? "" : "/"}assets/${relative.replace(/^\/+/, "")}`;
}

export interface FloatingImage {
  src: string;
  alt: string;
  /** Visual shape used to place the card, roughly w:h proportions */
  tiltSeed: number;
}

export type SlideTextPosition = "lower-third" | "center";
export type SlideHold = { holdLabel: string };

export interface SlideshowSlide {
  type: "image" | "video";
  src: string;
  /** Poster shown while the video loads (and its graceful fallback frame) */
  poster?: string;
  alt: string;
  /** Optional overlay copy; leave undefined for pure photos */
  text?: string;
  /** Where overlay copy sits (slides 3/4 have none) */
  textPosition?: SlideTextPosition;
  /** Present on the final slide: pressing and advancing requires a hold */
  hold?: SlideHold;
  /** Per-slide object-position focal point, tune without touching components */
  focal?: { x: string; y: string };
}

export const storyContent = {
  soundtrack: {
    src: assetPath("music1.mp3"),
    volume: 0.35,
  },
  splash: {
    title: "Happy 22-nd Monthversarrie, Mon Cherie!",
    date: "04th November 2026",
    cta: "click to start journey",
  },

  floatingScene: {
    centerText: "When the story keeps incrementing and snapped by our eyes.",
    holdLabel: "(hold text to continue)",
    images: [
      { src: assetPath("floating/floating-01.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 1 },
      { src: assetPath("floating/floating-02.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 2 },
      { src: assetPath("floating/floating-03.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 3 },
      { src: assetPath("floating/floating-04.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 4 },
      { src: assetPath("floating/floating-05.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 5 },
      { src: assetPath("floating/floating-06.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 6 },
      { src: assetPath("floating/floating-07.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 7 },
      { src: assetPath("floating/floating-08.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 8 },
      { src: assetPath("floating/floating-09.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 9 },
      { src: assetPath("floating/floating-10.jpg"), alt: "Placeholder memory, replace with a photo of you two", tiltSeed: 10 },
    ] satisfies FloatingImage[],
  },

  /** Ten smaller cards spawn around the center token (centers are fractions
   *  of the field, sizes are fractions of its width). Left/right columns up
   *  top and mid, a lower band of three, and one tucked near the bottom
   *  keep x 0.40-0.60 / y 0.36-0.58 open so the hold target is never
   *  covered at spawn. */
  floatingLayout: [
    { wFrac: 0.28, hFrac: 0.38, xFrac: 0.16, yFrac: 0.10 },
    { wFrac: 0.30, hFrac: 0.42, xFrac: 0.84, yFrac: 0.10 },
    { wFrac: 0.26, hFrac: 0.36, xFrac: 0.16, yFrac: 0.30 },
    { wFrac: 0.28, hFrac: 0.40, xFrac: 0.84, yFrac: 0.30 },
    { wFrac: 0.25, hFrac: 0.34, xFrac: 0.16, yFrac: 0.52 },
    { wFrac: 0.27, hFrac: 0.38, xFrac: 0.84, yFrac: 0.52 },
    { wFrac: 0.28, hFrac: 0.36, xFrac: 0.16, yFrac: 0.74 },
    { wFrac: 0.26, hFrac: 0.38, xFrac: 0.50, yFrac: 0.74 },
    { wFrac: 0.27, hFrac: 0.42, xFrac: 0.84, yFrac: 0.74 },
    { wFrac: 0.24, hFrac: 0.31, xFrac: 0.50, yFrac: 0.91 },
  ],

  slideshow: [
    {
      type: "image",
      src: assetPath("slideshow/image-1.png"),
      alt: "Placeholder memory, replace with a photo of you two",
      text: "There are lots of snap and affection that transcends",
      textPosition: "lower-third",
      focal: { x: "50%", y: "45%" },
    },
    {
      type: "video",
      src: assetPath("slideshow/video-1.mp4"),
      poster: assetPath("slideshow/video-1-poster.png"),
      alt: "Placeholder memory clip, replace with your video",
      text: "through the steps and confession.",
      textPosition: "center",
      focal: { x: "50%", y: "50%" },
    },
    {
      type: "image",
      src: assetPath("slideshow/image-2.png"),
      alt: "Placeholder memory, replace with a photo of you two",
      focal: { x: "50%", y: "40%" },
    },
    {
      type: "image",
      src: assetPath("slideshow/image-3.png"),
      alt: "Placeholder memory, replace with a photo of you two",
      focal: { x: "50%", y: "40%" },
    },
    {
      type: "image",
      src: assetPath("slideshow/image-4.png"),
      alt: "Placeholder memory, replace with a photo of you two",
      hold: { holdLabel: "Hold to continue" },
      focal: { x: "50%", y: "40%" },
    },
  ] satisfies SlideshowSlide[],

  letter: {
    // One paragraph, exactly as you want Nana to read it.
    paragraph: "04th Nov. 2026\nHappy 22-nd Monthversarry my dearest!\nTruly grateful that we have passed lot of months, including all those gross and strauss. It is kindly a toughful tale that we aim, and i hope these all will be lasting decades, more and more until the end. So glad being a person on the Earth that belong with u, schatz. And may all good things and blessings will always gather us. I love you the most, inrementing across multiverses until the end ❤️.\n\nYour annoying beloved man,\nGilang",
    paperAriaLabel: "The anniversary letter. Hold the paper to go back to the start.",
    returnHint: "(hold the paper to return)",
  },
};
