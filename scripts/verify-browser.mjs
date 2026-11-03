/**
 * verify-browser.mjs, real-browser acceptance run for the Monthversarrie
 * experience (PROMPT.md section 10). Drives the app over the full journey,
 * asserting each interaction, and saves screenshots for visual review.
 *
 *   node scripts/verify-browser.mjs [baseURL]
 *
 * baseURL default: http://localhost:5173 (npm run dev). Console errors and
 * page errors are collected; any error fails the run.
 */
import { firefox } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:5173";
const SHOTS = "/tmp/opencode/shots";
const results = [];
const consoleErrors = [];

function record(step, pass, detail = "") {
  results.push({ step, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${step}${detail ? `, ${detail}` : ""}`);
}

async function settle(page, ms = 1900) {
  await page.waitForTimeout(ms);
}

async function readTransform(card) {
  return card.evaluate((el) => el.style.transform);
}

const browser = await firefox.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  deviceScaleFactor: 2,
});
const page = await context.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

try {
  /* ---------------------------------------------------------- splash */
  await page.goto(BASE, { waitUntil: "networkidle" });
  const greeting = (await page.locator("h1.splash-title").innerText()).replace(/\s+/g, " ").trim();
  record("splash: greeting exact copy", greeting === "Happy 22-nd Monthversarrie, Mon Cherie!", greeting);
  record("splash: date copy", (await page.locator(".splash-date").innerText()).trim() === "04th November 2026");
  record("splash: CTA copy", (await page.locator(".splash-cta").innerText()).trim() === "click to start journey");
  await page.screenshot({ path: `${SHOTS}/01-splash.png` });

  /* short tap on data: later used for drag test */
  const card = page.locator(".float-card").first();

  // tap CTA via touch, at the element's actual center
  const cta = page.locator(".splash-cta");
  const ctaBox = (await cta.boundingBox()) ?? { x: 0, y: 0, width: 195, height: 80 };
  await page.touchscreen.tap(ctaBox.x + ctaBox.width / 2, ctaBox.y + ctaBox.height / 2);
  await settle(page);
  record("tap CTA -> floating scene", await page.locator(".floating-center").isVisible());
  await page.screenshot({ path: `${SHOTS}/02-floating.png` });

  /* ------------------------------------------------------- floating */
  record("floating: 10 cards", (await page.locator(".float-card").count()) === 10);
  record("floating: center token copy", (await page.locator(".floating-token").innerText()) === "When the story keeps incrementing and snapped by our eyes.");
  record("floating: hint copy", (await page.locator(".floating-hint").innerText()) === "(hold text to continue)");

  const cardWidths = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".float-card")).map((el) => el.offsetWidth),
  );
  record(
    "floating: photos scaled down (max width <= 130px)",
    cardWidths.length === 10 && cardWidths.every((w) => w > 0) && Math.max(...cardWidths) <= 130,
    `widths ${Math.min(...cardWidths)}..${Math.max(...cardWidths)}`,
  );
  record(
    "floating: hint lives inside the center ring",
    await page.evaluate(() =>
      Boolean(document.querySelector(".floating-center")?.contains(document.querySelector(".floating-hint"))),
    ),
  );
  record("floating: rounded rect border in font color", await page.evaluate(() => {
    const center = document.querySelector(".floating-center");
    if (!center) return false;
    const cs = getComputedStyle(center);
    const bw = parseFloat(cs.borderWidth);
    return cs.borderRadius === "24px" &&
           bw >= 1 && bw <= 2 &&
           cs.borderColor.replace(/\s/g, "") === "rgb(57,68,32)";
  }));
  record("floating: token normal font (no outline)", await page.evaluate(() => {
    const token = document.querySelector(".floating-token");
    if (!token) return false;
    const cs = getComputedStyle(token);
    const strokeWidth = cs.getPropertyValue("-webkit-text-stroke-width") || cs.webkitTextStrokeWidth || "0";
    const color = cs.color;
    return parseFloat(strokeWidth) === 0 && color !== "rgba(0, 0, 0, 0)";
  }));

  const t0 = await readTransform(page.locator(".float-card").nth(2));
  await page.waitForTimeout(1200);
  const t1 = await readTransform(page.locator(".float-card").nth(2));
  record("floating: cards drift", t0 !== t1, `${t0} -> ${t1.slice(0, 40)}`);

  // every card stays in the scene: measured as intersection with the field
  // rect (so it works at any viewport), with a small inset margin.
  const inBounds = await page.evaluate(() => {
    const field = document.querySelector(".float-field");
    if (!field) return false;
    const { width, height } = field.getBoundingClientRect();
    const inset = 20;
    return Array.from(document.querySelectorAll(".float-card")).every((el) => {
      const m = el.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
      if (!m) return false;
      const x = Number(m[1]);
      const y = Number(m[2]);
      return x + el.offsetWidth > inset && x < width - inset && y + el.offsetHeight > inset && y < height - inset;
    });
  });
  record("floating: cards remain in scene bounds", inBounds);

  // drag + flick a card, then confirm another card moved (collision ripple)
  const box = await card.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const otherBefore = await readTransform(page.locator(".float-card").nth(3));
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 0; i < 6; i++) {
    await page.mouse.move(cx + i * 18, cy + i * 6);
    await page.waitForTimeout(16);
  }
  await page.mouse.move(cx + 240, cy + 60, { steps: 3 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  const dragged = await readTransform(card);
  const otherAfter = await readTransform(page.locator(".float-card").nth(3));
  record("floating: drag+fling moves card", dragged !== otherBefore);
  record("floating: other cards react through collisions", otherBefore !== otherAfter);
  const draggedDetail = await page.evaluate(() => {
    const el = document.querySelector(".float-card");
    const m = el.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
    if (!m) return "no-transform";
    const x = Number(m[1]);
    const y = Number(m[2]);
    const ok = x + el.offsetWidth > 40 && x < 390 - 40 && y + el.offsetHeight > 40 && y < 844 - 40;
    const snap = Array.from(document.querySelectorAll(".float-card")).map((c) => {
      const cm = c.style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
      return `${c.querySelector("img")?.src.split("/").pop()}:${cm ? `${cm[1]},${cm[2]}` : "?"}`;
    }).join(" | ");
    const dims = JSON.stringify({ x, y, w: el.offsetWidth, h: el.offsetHeight });
    return `${ok ? "ok" : "out"} first(${dims}) [${snap}]`;
  });
  if (!draggedDetail.startsWith("ok")) {
    await page.screenshot({ path: `${SHOTS}/11-fling-break.png` });
  }
  record("floating: dragged card still in scene", draggedDetail.startsWith("ok"), draggedDetail);

  /* quick tap on the center must NOT advance: tap the measured hold box,
     not a guessed screen point */
  const centerBox = await page.locator(".floating-center-hold").boundingBox();
  if (!centerBox) throw new Error("floating center hold target has no box");
  const centerTap = { x: centerBox.x + centerBox.width / 2, y: centerBox.y + centerBox.height / 2 };
  await page.touchscreen.tap(centerTap.x, centerTap.y);
  await page.waitForTimeout(700);
  record("floating: quick tap does not continue", !(await page.locator(".slides").count()));

  /* hold the center text */
  await page.mouse.move(centerTap.x, centerTap.y);
  await page.mouse.down();
  await page.waitForTimeout(1150);
  const progressWidth = await page.evaluate(() => {
    const fill = document.querySelector(".floating-center-hold .hold-progress > i");
    return fill ? fill.style.width : "";
  });
  await page.mouse.up();
  await settle(page);
  record("floating: hold opens slideshow", await page.locator(".slides").count() === 1, `progress while holding: ${progressWidth}`);

  /* ------------------------------------------------------- slideshow */
  record("slideshow: 5 slides", (await page.locator(".slides .slide").count()) === 5);
  record("slideshow: 5 dots", (await page.locator(".slide-dots i").count()) === 5);
  record(
    "slideshow: deck claims vertical gestures (touch-action none)",
    await page.evaluate(
      () => getComputedStyle(document.querySelector(".slides")).touchAction === "none",
    ),
  );
  record("slideshow: slide 1 text lower third", await page.locator(".slide.is-active .slide-text.lower-third").innerText() === "There are lots of snap and affection that transcends");
  await page.screenshot({ path: `${SHOTS}/03-slide1.png` });

  // tiny jiggle: no navigation invented
  await page.mouse.move(195, 620);
  await page.mouse.down();
  await page.mouse.move(195, 600, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const jiggleIndex = await page.evaluate(() =>
    document.querySelector(".slide.is-active .slide-text")?.textContent ?? "?",
  );
  record("slideshow: small drag stays on slide 1", jiggleIndex === "There are lots of snap and affection that transcends");

  // swipe up -> slide 2 (video), driven as a real touch stream: dispatched
  // PointerEvents with pointerType "touch" hit the same handlers a phone
  // fires, and only touch crosses the browser's gesture arbitration
  await page.evaluate(async () => {
    const deck = document.querySelector(".slides");
    const send = (type, x, y) =>
      deck.dispatchEvent(new PointerEvent(type, {
        pointerId: 7,
        pointerType: "touch",
        isPrimary: true,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        composed: true,
      }));
    send("pointerdown", 195, 640);
    for (let i = 1; i <= 6; i++) {
      send("pointermove", 195, 640 - i * 36);
      await new Promise((ok) => setTimeout(ok, 14));
    }
    send("pointerup", 195, 424);
  });
  await page.waitForTimeout(1400);
  record("slideshow: touch swipe up -> slide 2", await page.locator(".slide.is-active video").count() === 1);

  const videoState = await page.evaluate(() => {
    const video = document.querySelector(".slide.is-active video");
    if (!video) return "missing";
    return { paused: video.paused, muted: video.muted, time: video.currentTime };
  });
  record("slideshow: video muted", typeof videoState === "object" && videoState.muted === true);
  record(
    "slideshow: video plays or offers chip",
    (typeof videoState === "object" && videoState.time > 0) || (await page.locator(".video-retry").count()) === 1,
    JSON.stringify(videoState),
  );
  record("slideshow: slide 2 text centered", await page.locator(".slide.is-active .slide-text.center").innerText() === "through the steps and confession.");
  await page.screenshot({ path: `${SHOTS}/04-slide2-video.png` });

  /* slide walk: every swipe must advance exactly one step */
  const readIndex = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll(".slide")).findIndex((el) =>
        el.classList.contains("is-active"),
      ),
    );

  const swipe = async (direction) => {
    const before = await readIndex();
    const y0 = direction === "up" ? 640 : 430;
    const y1 = direction === "up" ? 430 : 640;
    await page.mouse.move(195, y0);
    await page.mouse.down();
    await page.mouse.move(195, y1, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(1500);
    const after = await readIndex();
    return { before, after };
  };

  // back down to the video slide, then forward again one step at a time
  record(
    "slideshow: swipe down -> slide 1",
    (await swipe("down")).after === 0,
  );
  const stepUp = await swipe("up");
  record("slideshow: swipe up -> video slide again", stepUp.after === 1, JSON.stringify(stepUp));

  // pointercancel (browser snatches the pointer mid-gesture) must still
  // commit once the drag already qualified; touch stream again
  await page.evaluate(async () => {
    const deck = document.querySelector(".slides");
    const send = (type, x, y) =>
      deck.dispatchEvent(new PointerEvent(type, {
        pointerId: 7,
        pointerType: "touch",
        isPrimary: true,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        composed: true,
      }));
    send("pointerdown", 195, 640);
    for (let i = 1; i <= 4; i++) {
      send("pointermove", 195, 640 - i * 24);
      await new Promise((ok) => setTimeout(ok, 14));
    }
    send("pointercancel", 195, 544);
  });
  await page.waitForTimeout(1500);
  record("slideshow: touch pointercancel commits qualified drag", (await readIndex()) === 2);
  // back off so the one-step walk below resumes from the video slide
  record("slideshow: swipe down returns after cancel", (await swipe("down")).after === 1);

  const stepUp2 = await swipe("up"); // index 2: photo, no text
  record("slideshow: swipe up -> index 2", stepUp2.after === 2, JSON.stringify(stepUp2));
  record("slideshow: slide 3 has no text", (await page.locator(".slide.is-active .slide-text").count()) === 0);
  record("slideshow: video paused after leaving slide 2", await page.evaluate(() => {
    const video = document.querySelector(".slide video");
    return video ? video.paused : false;
  }));
  await page.screenshot({ path: `${SHOTS}/05-slide3-photo.png` });

  const stepUp3 = await swipe("up"); // index 3: photo, no text
  record("slideshow: swipe up -> index 3", stepUp3.after === 3, JSON.stringify(stepUp3));
  record("slideshow: slide 4 has no text", (await page.locator(".slide.is-active .slide-text").count()) === 0);

  const stepUp4 = await swipe("up"); // index 4: hold slide
  record("slideshow: swipe up -> index 4", stepUp4.after === 4, JSON.stringify(stepUp4));
  record("slideshow: slide 5 hold label", (await page.locator(".slide.is-active .slide-hold-label").innerText()) === "Hold to continue");
  await page.screenshot({ path: `${SHOTS}/06-slide5-hold.png` });

  const holdBox = await page.locator(".slide.is-active .slide-hold").boundingBox();
  if (!holdBox) throw new Error("slide 5 hold target has no box");
  await page.touchscreen.tap(holdBox.x + holdBox.width / 2, holdBox.y + holdBox.height / 2);
  await page.waitForTimeout(600);
  record("slideshow: tap on hold does not continue", (await readIndex()) === 4);

  await page.mouse.move(holdBox.x + holdBox.width / 2, holdBox.y + holdBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1150);
  await page.mouse.up();
  await settle(page);
  record("slideshow: hold -> letter", (await page.locator(".paper-hold").count()) === 1);

  /* ------------------------------------------------------------ letter */
  // Longer paragraph now; give the typewriter time to finish (reduced first).
  const letterParagraph = "04th Nov. 2026\nHappy 22-nd Monthversarry my dearest!\nTruly grateful that we have passed lot of months, including all those gross and strauss. It is kindly a toughful tale that we aim, and i hope these all will be lasting decades, more and more until the end. So glad being a person on the Earth that belong with u, schatz. And may all good things and blessings will always gather us. I love you the most, inrementing across multiverses until the end ❤️.\n\nYour annoying beloved man,\nGilang";
  await page.waitForTimeout(15000); // let the typewriter run
  record("letter: paragraph typed", await page.evaluate((p) => {
    const el = document.querySelector(".paper-text");
    return el && el.textContent === p;
  }, letterParagraph));
  record("letter: caret removed after finish", (await page.locator(".caret").count()) === 0);
  await page.screenshot({ path: `${SHOTS}/07-letter.png` });

  // flowers lean toward the finger
  await page.mouse.move(330, 780);
  await page.mouse.down();
  await page.waitForTimeout(320);
  const leanRight = await page.evaluate(() => {
    const flower = document.querySelector(".flowers-front .flower");
    return flower ? flower.style.getPropertyValue("--fr") : "(missing)";
  });
  await page.mouse.up();
  await page.waitForTimeout(1500);
  const settled = await page.evaluate(() => {
    const flower = document.querySelector(".flowers-front .flower");
    return flower ? flower.style.getPropertyValue("--fr") : "(missing)";
  });
  record("letter: flowers lean right when touched right", parseFloat(leanRight) > 1, `--fr=${leanRight}`);
  record("letter: flowers settle back", Math.abs(parseFloat(settled)) < 0.2, `--fr=${settled}`);

  // hold paper -> splash, journey resets
  const paperBox = (await page.locator(".paper-hold").boundingBox()) ?? { x: 0, y: 0, width: 0, height: 0 };
  await page.mouse.move(paperBox.x + paperBox.width / 2, paperBox.y + paperBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1150);
  await page.mouse.up();
  await settle(page);
  record("letter: hold paper -> splash", (await page.locator("h1.splash-title").count()) === 1);
  await page.screenshot({ path: `${SHOTS}/08-splash-return.png` });
} finally {
  await browser.close();
}

/* ------------------------------------------- small viewport checks */
const browser2 = await firefox.launch();
const small = await browser2.newContext({ viewport: { width: 320, height: 640 } });
const smallPage = await small.newPage();
smallPage.on("pageerror", (err) => consoleErrors.push(`pageerror(320): ${err.message}`));
try {
  await smallPage.goto(BASE, { waitUntil: "networkidle" });
  const noOverflow = await smallPage.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  record("320px: no horizontal overflow", noOverflow);
  await smallPage.screenshot({ path: `${SHOTS}/09-320-splash.png` });
} finally {
  await browser2.close();
}

/* ----------------------------------------------- reduced motion pass */
/* Walks the real journey (the ?screen= deep link exists only in dev) and
   asserts the letter lands fully typed the moment its screen appears. */
const browser3 = await firefox.launch();
const reduced = await browser3.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  reducedMotion: "reduce",
});
const reducedPage = await reduced.newPage();
reducedPage.on("pageerror", (err) => consoleErrors.push(`pageerror(reduced): ${err.message}`));
try {
  await reducedPage.goto(BASE, { waitUntil: "networkidle" });
  const rcta = await reducedPage.locator(".splash-cta").boundingBox();
  await reducedPage.touchscreen.tap(rcta.x + rcta.width / 2, rcta.y + rcta.height / 2);
  await reducedPage.waitForTimeout(1900);

  const rCenter = (await reducedPage.locator(".floating-center-hold").boundingBox());
  await reducedPage.mouse.move(rCenter.x + rCenter.width / 2, rCenter.y + rCenter.height / 2);
  await reducedPage.mouse.down();
  await reducedPage.waitForTimeout(1150);
  await reducedPage.mouse.up();
  await reducedPage.waitForTimeout(1900);

  for (let i = 0; i < 4; i++) {
    await reducedPage.mouse.move(195, 640);
    await reducedPage.mouse.down();
    await reducedPage.mouse.move(195, 430, { steps: 5 });
    await reducedPage.mouse.up();
    await reducedPage.waitForTimeout(1400);
  }

  const rHold = (await reducedPage.locator(".slide.is-active .slide-hold").boundingBox());
  await reducedPage.mouse.move(rHold.x + rHold.width / 2, rHold.y + rHold.height / 2);
  await reducedPage.mouse.down();
  await reducedPage.waitForTimeout(1150);
  await reducedPage.mouse.up();
  await reducedPage.waitForTimeout(1900);

  record("reduced motion: journey stays navigable", (await reducedPage.locator(".paper-hold").count()) === 1);
  const reducedLetterParagraph = "04th Nov. 2026\nHappy 22-nd Monthversarry my dearest!\nTruly grateful that we have passed lot of months, including all those gross and strauss. It is kindly a toughful tale that we aim, and i hope these all will be lasting decades, more and more until the end. So glad being a person on the Earth that belong with u, schatz. And may all good things and blessings will always gather us. I love you the most, inrementing across multiverses until the end ❤️.\n\nYour annoying beloved man,\nGilang";
  record("reduced motion: letter appears instantly", await reducedPage.evaluate((p) => {
    const el = document.querySelector(".paper-text");
    return el && el.textContent === p;
  }, reducedLetterParagraph));
  await reducedPage.screenshot({ path: `${SHOTS}/10-reduced-letter.png` });
} finally {
  await browser3.close();
}

console.log("\nconsole/page errors:", consoleErrors.length ? consoleErrors : "none");
record("no console or page errors", consoleErrors.length === 0);

const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log("FAILED:", failed.map((f) => f.step).join(" | "));
  process.exit(1);
}
