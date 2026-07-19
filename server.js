// Production static server for the Vite SPA build (Railway).
//
// Deliberately ZERO-dependency: it runs with `node server.js`, using only Node
// built-ins. A bare bin like `serve` lives in node_modules/.bin, which is NOT
// on PATH in the Nixpacks runtime shell -> "executable serve could not be
// found". `node` is always on PATH and needs nothing installed or pruned, so
// this cannot hit that class of failure.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const PORT = Number(process.env.PORT) || 4173;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, headers);
  res.end(body);
};

const server = createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return send(res, 405, 'Method Not Allowed');
    }

    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    // Resolve within DIST and block path traversal.
    const rel = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(DIST, rel);
    if (!filePath.startsWith(DIST)) filePath = join(DIST, 'index.html');

    let info = null;
    try {
      info = await stat(filePath);
    } catch {
      info = null;
    }
    if (info && info.isDirectory()) {
      filePath = join(filePath, 'index.html');
      try {
        info = await stat(filePath);
      } catch {
        info = null;
      }
    }

    if (info && info.isFile()) {
      const ext = extname(filePath).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      // Hashed asset filenames are immutable; index.html must never be cached.
      const cache = ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable';
      const body = req.method === 'HEAD' ? undefined : await readFile(filePath);
      return send(res, 200, body, { 'Content-Type': type, 'Cache-Control': cache });
    }

    // SPA fallback: unknown route -> index.html so client-side routing works
    // on deep links and hard refreshes.
    const html = await readFile(join(DIST, 'index.html'));
    return send(res, 200, req.method === 'HEAD' ? undefined : html, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
  } catch {
    return send(res, 500, 'Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CareerBridge frontend on http://0.0.0.0:${PORT} (dist: ${DIST})`);
});
