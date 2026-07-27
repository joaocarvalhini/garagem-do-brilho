#!/usr/bin/env node
/**
 * Transcodes the client's Reels (portrait phone videos pulled from their Google
 * Photos album) into web-ready loops for the Trabalhos section.
 *
 * Sources live in src/assets/video/source/ and are committed. For each entry we emit:
 *   <name>.mp4     — H.264, 720px wide, ~30fps, silent, faststart, capped duration
 *   <name>.webp    — poster frame, same crop, for the <video poster> attribute
 *
 * The videos are decorative loops (autoplay muted in a card), so they are stripped
 * of audio and capped short — nobody needs a 60-second 1080p Reel with sound to
 * understand that a wheel got clean. Bandwidth is the whole game here: three loops
 * must not cost more than the rest of the page combined.
 *
 * Usage: node scripts/make-video.js [--force]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const SRC = path.resolve(__dirname, '..', 'src', 'assets', 'video', 'source');
const OUT = path.resolve(__dirname, '..', 'src', 'assets', 'video');
const FORCE = process.argv.includes('--force');

/** name -> { src, maxSeconds, posterAt, note } */
const VIDEOS = {
  'reel-espuma': {
    src: 'reel-espuma.mp4',
    maxSeconds: 14,
    posterAt: 2,
    note: 'Snow foam going on — the process shot.',
  },
  'reel-macan': {
    src: 'reel-macan.mp4',
    maxSeconds: 14,
    posterAt: 1,
    note: 'Porsche Macan front end after detail — gloss on brand-blue paint.',
  },
  'reel-jante': {
    src: 'reel-jante.mp4',
    maxSeconds: 14,
    posterAt: 1,
    note: 'Wheel and red caliper, cleaned — the pormenor argument.',
  },
};

function run(args) {
  execFileSync(ffmpeg, args, { stdio: ['ignore', 'ignore', 'pipe'] });
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.log('No video sources yet — skipping.');
    return;
  }
  fs.mkdirSync(OUT, { recursive: true });

  const missing = [];
  for (const [name, spec] of Object.entries(VIDEOS)) {
    const input = path.join(SRC, spec.src);
    if (!fs.existsSync(input)) {
      missing.push(spec.src);
      continue;
    }

    const mp4 = path.join(OUT, `${name}.mp4`);
    if (!fs.existsSync(mp4) || FORCE) {
      // 720 wide (portrait → 720x1280-ish), CRF 27 is visually fine for motion in a
      // small card; -an strips audio; +faststart moves the moov atom so playback can
      // begin before the file finishes downloading.
      run([
        '-y', '-i', input,
        '-t', String(spec.maxSeconds),
        '-vf', "scale='min(720,iw)':-2:flags=lanczos,fps=30",
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '27',
        '-profile:v', 'main', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-an',
        mp4,
      ]);
    }

    const poster = path.join(OUT, `${name}.webp`);
    if (!fs.existsSync(poster) || FORCE) {
      run([
        '-y', '-ss', String(spec.posterAt), '-i', input,
        '-frames:v', '1',
        '-vf', "scale='min(720,iw)':-2:flags=lanczos",
        '-c:v', 'libwebp', '-quality', '70',
        poster,
      ]);
    }

    const mb = (fs.statSync(mp4).size / 1024 / 1024).toFixed(1);
    const kb = (fs.statSync(poster).size / 1024).toFixed(0);
    console.log(`  ${name}.mp4  ${mb} MB   poster ${kb} KB   — ${spec.note}`);
  }

  if (missing.length) {
    console.log(`\n  missing source(s): ${missing.join(', ')}`);
  }
}

main();
