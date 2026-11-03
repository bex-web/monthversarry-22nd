/**
 * prepare-assets.mjs
 *
 * Builds the site's media assets from the originals in `media/`:
 *   - resizes/re-encodes photos into public/assets/floating and public/assets/slideshow
 *   - transcodes the anniversary video into public/assets/slideshow/video-1.mp4
 *     (portrait 720x1280 cover crop, H.264, faststart) and grabs a poster frame
 *
 * To swap assets later: replace files in `media/` (or edit SELECTION below),
 * then run `npm run assets` again.
 */
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const MEDIA_DIR = "media";
const OUT_DIR = "public/assets";

/** Which originals become which placeholder slots. Add / rename entries freely. */
const SELECTION = {
  floating: [
    "photo_2026-10-25_21-34-26.jpg",
    "photo_2026-10-25_21-34-47.jpg",
    "photo_2026-10-25_21-34-28.jpg",
    "photo_2026-10-25_21-34-54.jpg",
    "photo_2026-10-25_21-34-33.jpg",
    "photo_2026-10-25_21-34-55.jpg",
    "photo_2026-10-25_21-34-18.jpg",
    "photo_2026-10-25_21-34-20.jpg",
    "photo_2026-10-25_21-34-36.jpg",
    "photo_2026-10-25_21-34-44.jpg",
  ],
  slideshow: [
    "slideshow/image-1.png",
    "slideshow/image-2.png",
    "slideshow/image-3.png",
    "slideshow/image-4.png",
  ],
  video: "slideshow/video-1.mp4",
};

const FLOATING_LONG_EDGE = 1000; // floating cards render small (<= ~45vw)
const SLIDESHOW_LONG_EDGE = 1600; // slideshow fills the screen
const JPEG = { quality: 75, mozjpeg: true, progressive: true };

async function listMedia(dir) {
  const files = await fs.promises.readdir(dir);
  const images = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  if (SELECTION.floating.length + SELECTION.slideshow.length > images.length) {
    throw new Error("Not enough photos in media/ for the slots in SELECTION");
  }
  for (const name of [...SELECTION.floating, ...SELECTION.slideshow, SELECTION.video]) {
    if (!fs.existsSync(path.join(dir, name))) throw new Error(`Missing media file: ${name}`);
  }
}

function ffmpeg(args, label) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args]);
    proc.on("error", reject);
    const stderr = [];
    proc.stderr.on("data", (d) => stderr.push(d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed:\n${stderr.join("")}`));
    });
  });
}

/** Runs `-v error` decodes; clean output means silence. Returns null or the errors. */
function ffmpegDecodeErrors(file) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ["-v", "error", "-i", file, "-f", "null", "-"]);
    const stderr = [];
    proc.stderr.on("data", (d) => stderr.push(d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      resolve(code === 0 && stderr.join("").trim() === "" ? null : stderr.join("").trim() || `ffmpeg exit ${code}`);
    });
  });
}

function ffmpegProbe(file) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ["-hide_banner", "-i", file]);
    proc.on("error", reject);
    const stderr = [];
    proc.stderr.on("data", (d) => stderr.push(d.toString()));
    proc.on("close", () => {
      const out = stderr.join("");
      const video = out.match(/Stream #\d+:\d+.*Video: (\w+)[^,]*, .*, (\d+)x(\d+)/);
      resolve({
        codec: video ? video[1] : "?",
        width: video ? Number(video[2]) : 0,
        height: video ? Number(video[3]) : 0,
        duration: Number((out.match(/Duration: (\d+):(\d+):(\d+)/) || []).slice(1).reduce((a, v, i) => a + Number(v) * [3600, 60, 1][i], 0)) || 0,
      });
    });
  });
}

async function imageTo(file, out, longEdge) {
  await sharp(path.join(MEDIA_DIR, file))
    .rotate() // honor EXIF orientation
    .resize({ width: longEdge, height: longEdge, fit: "inside", withoutEnlargement: true })
    .jpeg(JPEG)
    .toFile(out);
}

async function main() {
  await listMedia(MEDIA_DIR);
  await mkdir(`${OUT_DIR}/floating`, { recursive: true });
  await mkdir(`${OUT_DIR}/slideshow`, { recursive: true });
  const report = [];

  for (const [i, file] of SELECTION.floating.entries()) {
    const name = `floating-${String(i + 1).padStart(2, "0")}.jpg`;
    await imageTo(file, `${OUT_DIR}/floating/${name}`, FLOATING_LONG_EDGE);
    report.push({ out: `${OUT_DIR}/floating/${name}`, kb: kb(`${OUT_DIR}/floating/${name}`) });
  }

  for (const [i, file] of SELECTION.slideshow.entries()) {
    const name = `image-${i + 1}.jpg`;
    await imageTo(file, `${OUT_DIR}/slideshow/${name}`, SLIDESHOW_LONG_EDGE);
    report.push({ out: `${OUT_DIR}/slideshow/${name}`, kb: kb(`${OUT_DIR}/slideshow/${name}`) });
  }

  const videoIn = path.join(MEDIA_DIR, SELECTION.video);
  const meta = await ffmpegProbe(videoIn);
  const posterAt = Math.min(2, Math.max(0.5, (meta.duration || 4) * 0.25));
  await ffmpeg(
    [
      // -threads 1 on both sides: this ffmpeg-static x264 build corrupts
      // threaded output on this machine; the decode check below rejects it
      "-threads", "1",
      "-i", videoIn,
      "-vf", "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-c:a", "copy", "-threads", "1",
      `${OUT_DIR}/slideshow/video-1.mp4`,
    ],
    "video transcode",
  );
  await ffmpeg(
    ["-ss", posterAt.toFixed(2), "-i", videoIn, "-frames:v", "1", "-q:v", "4",
      `${OUT_DIR}/slideshow/video-1-poster.jpg`],
    "poster frame",
  );
  /* Verify what we just wrote: a broken encode must fail loudly here, not
     surface later as a media error inside the slideshow. Clean decodes print
     nothing at `-v error`; faststart means moov sits before mdat. */
  const transcodeErrors = await ffmpegDecodeErrors(`${OUT_DIR}/slideshow/video-1.mp4`);
  if (transcodeErrors) {
    throw new Error(`video-1.mp4 does not decode cleanly: ${transcodeErrors}`);
  }
  const bytes = fs.readFileSync(`${OUT_DIR}/slideshow/video-1.mp4`);
  const moovAt = bytes.indexOf(Buffer.from("moov"));
  const mdatAt = bytes.indexOf(Buffer.from("mdat"));
  if (moovAt === -1 || mdatAt === -1 || moovAt > mdatAt) {
    throw new Error("video-1.mp4 is not a valid faststart MP4 (moov must precede mdat)");
  }
  report.push({ out: `${OUT_DIR}/slideshow/video-1.mp4`, kb: kb(`${OUT_DIR}/slideshow/video-1.mp4`) });
  report.push({ out: `${OUT_DIR}/slideshow/video-1-poster.jpg`, kb: kb(`${OUT_DIR}/slideshow/video-1-poster.jpg`) });

  /* Transcode the background music down so it buffers quickly and starts
     without streaming delay on mobile networks. */
  const musicSrc = `${OUT_DIR}/music1.mp3`;
  if (fs.existsSync(musicSrc)) {
    await ffmpeg(
      ["-i", musicSrc, "-c:a", "libmp3lame", "-b:a", "96k", "-ac", "2", "-ar", "44100",
        `${OUT_DIR}/music1-opt.mp3`],
      "music transcode",
    );
    if (fs.existsSync(`${OUT_DIR}/music1-opt.mp3`)) {
      fs.renameSync(`${OUT_DIR}/music1-opt.mp3`, musicSrc);
    }
  }

  console.log(`source video: ${meta.codec} ${meta.width}x${meta.height}, ${meta.duration.toFixed(1)}s`);
  console.log(`music: ${kb(musicSrc).toFixed(0)} KB (96k)`);
  for (const r of report) console.log(`${r.out.padEnd(48)} ${String(Math.round(r.kb)).padStart(5)} KB`);
}

main().catch((err) => { console.error(err); process.exit(1); });

function kb(file) {
  if (!fs.existsSync(file)) return 0;
  return fs.statSync(file).size / 1024;
}

