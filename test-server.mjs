#!/usr/bin/env node
/**
 * Static file server for Playwright end-to-end tests.
 *
 * `playwright.config.ts` has always declared a `webServer` command pointing at
 * a `test-server` module, and that file was never committed — not deleted,
 * never written. So `bunx playwright test`, a documented command in
 * AGENTS.md, died with MODULE_NOT_FOUND before collecting a single test, and
 * no end-to-end test in this repository has ever been runnable. Bean `dzl3`.
 *
 * ## What it serves, and why the repo root
 *
 * The root, so a spec can reach `/ui/index.html`, `/viewer/index.html` or a
 * built `/​_site/...` without this file having to guess which one matters.
 * Picking a single subtree would have made exactly one kind of spec possible
 * and quietly ruled out the rest. Override with `TEST_SERVER_ROOT`.
 *
 * Port 8080 matches `playwright.config.ts`'s `baseURL` and the viewer port in
 * `folio.config.example.json`. Override with `PORT`.
 *
 * ## It is a server, so it refuses to serve outside its root
 *
 * A request path is resolved and then checked to still sit under the root
 * before anything is read. Without that, `GET /../../etc/passwd` reads
 * whatever the test runner can read. It is only ever bound to loopback and
 * only started by the test runner, but a traversal bug in a test fixture is
 * still a traversal bug, and this costs three lines.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ESM, not CommonJS, and the extension is `.mjs` for the same reason: the
// repo's eslint forbids `require()` (@typescript-eslint/no-require-imports),
// and a `.cjs` file cannot avoid it. Weakening that rule for a whole extension
// to admit one file is a worse trade than writing the file in the module
// system everything else here already uses.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.TEST_SERVER_ROOT || HERE);
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "127.0.0.1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jsonld": "application/ld+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ "Cache-Control": "no-store" }, headers || {}));
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${HOST}:${PORT}`).pathname);
  } catch {
    // A malformed percent-escape is a bad request, not a crash.
    return send(res, 400, "Bad Request", { "Content-Type": "text/plain" });
  }

  // Resolve first, then confirm it is still inside ROOT. Checking the raw
  // string for ".." is not enough — encodings and symlinks get past that.
  let filePath = path.resolve(ROOT, "." + pathname);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, "Forbidden", { "Content-Type": "text/plain" });
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return send(res, 404, `Not found: ${pathname}`, { "Content-Type": "text/plain" });
  }

  if (stat.isDirectory()) {
    const index = path.join(filePath, "index.html");
    if (!fs.existsSync(index)) {
      return send(res, 404, `No index.html in ${pathname}`, { "Content-Type": "text/plain" });
    }
    filePath = index;
    stat = fs.statSync(filePath);
  }

  const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type, "Content-Length": stat.size, "Cache-Control": "no-store" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`test-server: serving ${ROOT} at http://${HOST}:${PORT}`);
});

// Playwright sends SIGTERM when the run ends; exit promptly so a test run does
// not hang on a lingering handle.
for (const sig of ["SIGTERM", "SIGINT"]) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
