#!/usr/bin/env node
/**
 * Builds the site's responsive imagery from the company's own photographs.
 *
 * Sources go in src/assets/img/source/. For each entry we emit AVIF + WebP at several
 * widths, plus a 16px LQIP that the build inlines as a base64 blur-up placeholder.
 *
 * IMPORTANT — this step is optional by design. At the time of writing the client had
 * sent no photographs, so every entry below is a declaration of what is wanted, not a
 * file that exists. Missing sources are skipped with a note rather than throwing: the
 * site builds, and each slot falls back to a CSS treatment until the real photo lands.
 * That is deliberate. A detailing site lives or dies on its photography, and the worst
 * outcome is a build that can't run until someone finds a stock photo of a car.
 *
 * To add a photo: drop it in source/ under the filename below and re-run. Nothing else
 * changes.
 *
 * Usage: node scripts/process-images.js [--force]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.resolve(__dirname, '..', 'src', 'assets', 'img', 'source');
const OUT = path.resolve(__dirname, '..', 'src', 'assets', 'img');
const LQIP_FILE = path.resolve(__dirname, '..', 'src', 'content', 'img-lqip.json');
const FORCE = process.argv.includes('--force');

// `pair` is portrait on purpose. The comparison sources are phone photos shot in
// portrait, and a landscape crop of a portrait shot of a whole car keeps only a
// horizontal band — which is what made the first attempt look like two unrelated
// pictures sliding over each other. 4:5 keeps the car intact in both halves.
const AR = { hero: 16 / 9, band: 21 / 9, card: 4 / 3, pair: 4 / 5, square: 1 };

/**
 * name -> { src, ar, widths, focal, note }
 *
 * `focal` is the vertical centre of the crop as a 0..1 fraction. Car photography is
 * usually shot low and wide, so the subject sits below centre — 0.5 is a decent
 * default here, unlike the tall-subject case where it decapitates things.
 */
const IMAGES = {
  // The photographs below came out of the client's own Google Photos album
  // (the "Coches" share, July 2026) — real cars, real driveway, nothing staged.
  'hero-car': {
    src: 'hero.jpg',
    ar: AR.hero,
    widths: [768, 1280, 1920],
    focal: 0.42,
    note: 'Hero — BMW 4 GC rear three-quarter after detail, gloss against blue sky.',
  },
  'band-garage': {
    src: 'garagem.jpg',
    ar: AR.band,
    widths: [1024, 1600, 2400],
    focal: 0.45,
    note: 'CTA band — the same BMW mid-treatment, covered in snow foam.',
  },
  // The source is a square close-up. Cropping it to the 4:3 card shape threw away the
  // top and bottom of the frame, which blew the head up to fill the card and pushed the
  // chin down behind the "Quem trata do seu carro" caption. Keeping the native 1:1 frame
  // crops nothing: the head sits naturally around a third from the top and the bottom of
  // the frame is background, which is exactly where the caption chip needs to land.
  'about-owner': {
    src: 'danycad1.jpg',
    ar: AR.square,
    widths: [480, 960],
    focal: 0.5,
    note: 'About — Daniel. Faces outperform machines on this kind of page.',
  },
  'pack-simples': {
    src: 'pack-simples.jpg',
    ar: AR.card,
    widths: [480, 960],
    focal: 0.45,
    note: 'Pack card — snow foam on the BMW, side view.',
  },
  'pack-completa-texteis': {
    src: 'pack-texteis.jpg',
    ar: AR.card,
    widths: [480, 960],
    focal: 0.45,
    note: 'Pack card — fabric seat after steam cleaning, close up.',
  },
  'pack-completa-peles': {
    src: 'pack-peles.jpg',
    ar: AR.card,
    widths: [480, 960],
    focal: 0.45,
    note: 'Pack card — BMW leather cockpit after treatment.',
  },
  'pack-detalhada': {
    src: 'pack-detalhada.jpg',
    ar: AR.card,
    widths: [480, 960],
    focal: 0.45,
    note: 'Pack card — side panel gloss with sun flare after detail.',
  },
  // The comparison pair: same BMW, same driveway, same angle, same light — snow foam
  // on, then finished. Matched framing is the whole point; an earlier attempt paired a
  // tight close-up with a wide shot and the slider just looked broken.
  //
  // Labelled "em lavagem", not "antes": the car is covered in foam here, not dirt, and
  // calling that "before" would imply it arrived that way. A true dirty→clean pair
  // needs two shots from one tripod position — see CREDITS.md.
  'ba-01-durante': {
    src: 'ba-01-durante.jpg',
    ar: AR.pair,
    widths: [640, 1280],
    focal: 0.5,
    note: 'Comparison — DURING. The BMW under snow foam.',
  },
  'ba-01-depois': {
    src: 'ba-01-depois.jpg',
    ar: AR.pair,
    widths: [640, 1280],
    focal: 0.5,
    note: 'Comparison — AFTER. Same car, same spot, same angle, finished.',
  },
};

// Quality scales down as width goes up — big renditions are viewed at lower angular
// resolution and tolerate more compression.
function qualityFor(width) {
  if (width >= 1600) return 52;
  if (width >= 1100) return 58;
  return 68;
}

/**
 * Crop to the target aspect ratio around a vertical focal point, then resize.
 * Sharp's own `cover` fit would centre the crop, which is not always what we want.
 */
async function cropResize(input, meta, ar, width, focal) {
  let cw = meta.width;
  let ch = Math.round(cw / ar);
  if (ch > meta.height) {
    ch = meta.height;
    cw = Math.round(ch * ar);
  }
  const left = Math.round((meta.width - cw) / 2);
  const top = Math.max(0, Math.min(meta.height - ch, Math.round((meta.height - ch) * focal)));
  return sharp(input)
    .extract({ left, top, width: cw, height: ch })
    .resize({ width, withoutEnlargement: true });
}

async function main() {
  fs.mkdirSync(SRC, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const lqip = {};
  const missing = [];
  let count = 0;
  let bytes = 0;

  for (const [name, spec] of Object.entries(IMAGES)) {
    const input = path.join(SRC, spec.src);
    if (!fs.existsSync(input)) {
      missing.push({ name, ...spec });
      continue;
    }
    const meta = await sharp(input).metadata();

    for (const w of spec.widths) {
      for (const fmt of ['avif', 'webp']) {
        const file = path.join(OUT, `${name}-${w}.${fmt}`);
        if (fs.existsSync(file) && !FORCE) {
          bytes += fs.statSync(file).size;
          continue;
        }
        const pipe = await cropResize(input, meta, spec.ar, w, spec.focal);
        const buf = await (fmt === 'avif'
          ? pipe.avif({ quality: qualityFor(w), effort: 6 })
          : pipe.webp({ quality: qualityFor(w) })
        ).toBuffer();
        fs.writeFileSync(file, buf);
        count++;
        bytes += buf.length;
        console.log(`  ${name}-${w}.${fmt}  ${(buf.length / 1024).toFixed(0)} KB`);
      }
    }

    const tiny = await (await cropResize(input, meta, spec.ar, 16, spec.focal))
      .webp({ quality: 30 })
      .toBuffer();
    lqip[name] = `data:image/webp;base64,${tiny.toString('base64')}`;
  }

  fs.writeFileSync(LQIP_FILE, `${JSON.stringify(lqip, null, 2)}\n`);

  /* A shot list the client can act on, written from the same table that drives the build. */
  const credits = [
    '# Fotografia',
    '',
    'Todas as fotografias deste site devem ser **da própria empresa**. Nada aqui é banco de',
    'imagens — num site de detalhe automóvel, as fotos do trabalho real *são* o produto.',
    'Coloque os ficheiros em `src/assets/img/source/` com os nomes abaixo e corra',
    '`npm run images`.',
    '',
    '| Ficheiro | Estado | Para que serve |',
    '|---|---|---|',
    ...Object.entries(IMAGES).map(([name, s]) => {
      const have = fs.existsSync(path.join(SRC, s.src));
      return `| \`source/${s.src}\` | ${have ? 'entregue' : '**em falta**'} | ${s.note} |`;
    }),
    '',
    '## Como fotografar (vale mais do que a câmara)',
    '',
    '- **Falta um antes/depois verdadeiro (carro sujo → acabado).** O comparador do site',
    '  usa hoje "em lavagem → depois" porque é o único par com enquadramento igual que',
    '  existe. Para o substituir: **antes de tocar no carro**, marque a posição das rodas',
    '  com fita, tire a foto do carro sujo, e no fim tire a segunda **do mesmo sítio, com',
    '  o mesmo enquadramento e a mesma luz**. É a peça mais persuasiva do site — mas só',
    '  funciona se as duas fotos forem iguais em tudo menos no estado do carro. Um "antes"',
    '  à sombra e um "depois" ao sol não provam nada; provam que o sol existe.',
    '- **Vertical funciona aqui.** O comparador é 4:5, por isso fotos de telemóvel na',
    '  vertical servem bem — ao contrário do hero, que precisa de horizontal.',
    '- **Horizontal.** O site é horizontal; fotos verticais de telemóvel cortam mal no hero.',
    '  Vire o telemóvel de lado.',
    '- **Pinturas escuras ao fim da tarde**, nunca a meio-dia. O sol alto queima os reflexos',
    '  e é precisamente o reflexo que mostra o trabalho.',
    '- **Pormenor, não só carros inteiros.** O interior de uma jante, a costura de um banco,',
    '  as calhas dos vidros. É esse o argumento da marca.',
    '- **Inclua uma cara.** Uma foto do Daniel a trabalhar rende mais do que qualquer foto',
    '  de máquina.',
    '',
    '## Regenerar',
    '',
    '```bash',
    'npm run images -- --force',
    '```',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'CREDITS.md'), credits);

  if (count) {
    console.log(`\nImages: ${count} written, ${(bytes / 1024 / 1024).toFixed(1)} MB on disk.`);
  }
  if (missing.length) {
    console.log(`\n  ${missing.length} photo(s) not supplied yet — those slots fall back to CSS:`);
    for (const m of missing) console.log(`   · source/${m.src.padEnd(24)} ${m.note}`);
    console.log(`\n  Shot list -> ${path.relative(process.cwd(), path.join(OUT, 'CREDITS.md'))}`);
  }
  console.log(`\nLQIP -> ${path.relative(process.cwd(), LQIP_FILE)}\n`);
}

main().catch((e) => {
  console.error('Image processing failed:', e.message);
  process.exit(1);
});
