#!/usr/bin/env node
/**
 * Zero-dependency static server for local preview.
 * Serves ROOT (default: dist/) with clean-URL fallback to index.html.
 *   node scripts/serve.js [--root dist] [--port 4321]
 *
 * Port resolution order: --port flag, then $PORT, then 4321. The $PORT fallback is
 * what lets a harness assign a free port (see .claude/launch.json autoPort) — this
 * is a static site with no OAuth callback, webhook or CORS origin pinned to a
 * specific port, so any port will do.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const ROOT = path.resolve(process.cwd(), getArg('root', 'dist'));
const PORT = Number(getArg('port', process.env.PORT || 4321));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(ROOT, urlPath);

  // Prevent path traversal outside ROOT.
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    const withHtml = `${filePath}.html`;
    if (fs.existsSync(withHtml)) {
      filePath = withHtml;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1>');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const size = fs.statSync(filePath).size;

  // Range support. Without it a <video> is not seekable: the browser gets a plain 200
  // with no Accept-Ranges and refuses to scrub, which made the presentation video look
  // broken in local preview even though it played. Real hosts do this for us; a dev
  // server that doesn't is just lying about production.
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    let [, startStr, endStr] = m;
    let start;
    let end;
    if (startStr === '') {
      // Suffix form: "bytes=-500" means the LAST 500 bytes.
      const suffix = Number(endStr);
      start = Math.max(0, size - suffix);
      end = size - 1;
    } else {
      start = Number(startStr);
      end = endStr === '' ? size - 1 : Math.min(Number(endStr), size - 1);
    }
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Cache-Control': 'no-store',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}`);
});
