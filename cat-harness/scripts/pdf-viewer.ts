/**
 * The inline PDF viewer: Mozilla's pdf.js generic viewer, pinned, installed
 * into a built site, and a fragment that embeds it on a page. Bean
 * `folio-assistant-5ea6`.
 *
 * Owner, 2026-10-04: *"is there a lightweight inline viewer that could be
 * used for viewing PDF on CDN … basic functionality (search, scroll, jump to
 * page, print, d/l)"* — then option 2 of four, *"copied PDF.js"*, and *"add as
 * skill and tool"*. The skill is `ui-core/pdf-inline-viewer`; the Tool node is
 * `pdf_viewer_embed`.
 *
 * ## Why the generic viewer and not the browser's own
 *
 * An `<iframe src="x.pdf">` is zero code and gives all five features on
 * desktop Chromium and Firefox. On iOS Safari it shows page one as an image
 * and on Android Chrome it downloads the file, so "inline" holds on the
 * devices where it was least needed. The generic viewer is the same five
 * features on every engine, from one set of bytes.
 *
 * ## Why it is installed at BUILD time and never committed
 *
 * The pruned viewer is ~12 MB (404 files at v6.4.299, measured). Committed, it is clone weight every checkout
 * pays forever and a vendored tree nobody reviews. Installed by
 * {@link install} into `_site/` from a release whose SHA-256 is written
 * below, it costs the site and nothing else, and the pin is one line that
 * `upstream-pins.json` reads (`pdfjs` entry) rather than a copy of it.
 *
 * ## The cross-origin open, and why it carries an allowlist
 *
 * The PDFs these pages show are served from a CDN, not from Pages. The
 * generic viewer refuses a cross-origin `?file=` with *"file origin does not
 * match viewer's"* — measured in `web/viewer.mjs` at v6.4.299,
 * `validateFileURL`. That refusal exists so a hosted viewer cannot be pointed
 * at an arbitrary document and lend it the host's address. So the shim
 * {@link openShim} opens `?src=` ONLY when it starts with a prefix the BUILD
 * named (`--allow`), plus the viewer's own origin. Every other value is
 * refused on screen, never opened. The prefixes are a caller's fact — the
 * workflow passes its own repository owner — so no folio's host is written
 * into the platform.
 *
 * ## Why the site root is derived in the browser
 *
 * The same reason as `folio-mount.ts`, which this reuses rather than restates:
 * one generated page is served at several depths (`/who-iris/`,
 * `/folio-assistant/who-iris/`, `/STAGING/<branch>/who-iris/`), so a relative
 * or absolute viewer URL is right on at most one of them. The caller passes
 * the route pattern; `siteRootOf` and the inlined client apply the same one.
 */

import { createHash } from "crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawnSync } from "child_process";

/** The pinned pdf.js release. `upstream-pins.json` reads this line by pattern. */
export const PDFJS_VERSION = "6.4.299";

/**
 * SHA-256 of `pdfjs-<version>-legacy-dist.zip`, measured 2026-10-04. A
 * mismatch refuses the install.
 *
 * **The LEGACY build, on purpose.** The modern build calls
 * `Map.prototype.getOrInsertComputed`, which Chromium 140 does not have:
 * measured here, the viewer threw `getOrInsertComputed is not a function`
 * during startup and never opened the document. The legacy build carries its
 * polyfills, so a reader one browser release behind still gets a viewer.
 */
export const PDFJS_SHA256 = "c894bce53b2f4c3e13141e088c89cc051a1f7118ba4a2c02ec058798ae1303d1";

export const PDFJS_ZIP_URL = `https://github.com/mozilla/pdf.js/releases/download/v${PDFJS_VERSION}/pdfjs-${PDFJS_VERSION}-legacy-dist.zip`;

/** Where the viewer lands, relative to the SITE ROOT. */
export const VIEWER_DIR = "assets/vendor/pdfjs";
export const VIEWER_PATH = `${VIEWER_DIR}/web/viewer.html`;

/**
 * Whether a site-relative path is inside the installed viewer — Mozilla's
 * bytes, which the site's own post-build passes (minify, id uniqueness) leave
 * alone rather than rewrite or judge.
 */
export function isVendoredViewer(siteRelative: string): boolean {
  return siteRelative.split(/[\\/]/).join("/").startsWith(`${VIEWER_DIR}/`);
}

/** The shim's filename, beside `viewer.html`. */
export const SHIM_FILE = "folio-open.js";

/** The marker an embed carries, so a gate can ask for it rather than for its text. */
export const MARKER = "data-fa-pdf-viewer";

/**
 * What of the release the site needs. Everything else — source maps (8.8 MB),
 * the sample PDF, the debugger — is a cost nothing reads.
 *
 * `locale/` stays whole (3.3 MB): the viewer picks a language from the
 * reader's browser, and a pruned list is a reader whose language silently
 * fell back to English.
 */
export const KEEP: readonly string[] = [
  "LICENSE",
  "build/pdf.mjs",
  "build/pdf.worker.mjs",
  "build/pdf.sandbox.mjs",
  "web/viewer.html",
  "web/viewer.mjs",
  "web/viewer.css",
  "web/images",
  "web/locale",
  "web/cmaps",
  "web/standard_fonts",
  "web/wasm",
  "web/iccs",
];

/**
 * The opening shim, as a classic script that runs before the viewer's module
 * scripts (modules are deferred). Exported as a builder so the test runs the
 * shipped bytes against the allowlist rather than a copy of the rule.
 */
export function openShim(allow: readonly string[]): string {
  return `/* GENERATED by cat-harness/scripts/pdf-viewer.ts — opens ?src= when it matches a build-time allowlist. */
(function () {
  "use strict";
  var ALLOW = ${JSON.stringify([...allow])};
  var src = new URLSearchParams(location.search).get("src");
  function allowed(href) {
    var u;
    try { u = new URL(href, location.href); } catch (e) { return null; }
    if (u.protocol !== "https:" && u.origin !== location.origin) return null;
    if (u.origin === location.origin) return u.href;
    for (var i = 0; i < ALLOW.length; i++) if (u.href.indexOf(ALLOW[i]) === 0) return u.href;
    return null;
  }
  function refuse(msg) {
    var c = document.getElementById("viewerContainer");
    var p = document.createElement("p");
    p.id = "folio-open-refused";
    p.setAttribute("role", "alert");
    p.style.cssText = "margin:2rem;font:1rem/1.5 system-ui,sans-serif;color:CanvasText;background:Canvas;padding:1rem;border:1px solid";
    p.textContent = msg;
    (c || document.body).prepend(p);
  }
  // pdf.js dispatches this on PARENT.document when the frame is same-origin
  // with its host page, and on its own document otherwise — measured at
  // v6.4.299, \`webViewerLoad\`. An embed on this site is exactly the
  // same-origin case, so listening on \`document\` alone never fires.
  var done = false;
  function onLoaded(e) {
    if (done || (e.detail && e.detail.source && e.detail.source !== window)) return;
    done = true;
    var opts = window.PDFViewerApplicationOptions;
    // No sample document: an empty viewer is honest, the tracemonkey paper is not.
    opts.set("defaultUrl", "");
    var app = window.PDFViewerApplication;
    app.initializedPromise.then(function () {
      if (!src) return;
      var href = allowed(src);
      if (!href) { refuse("This viewer opens only documents this site publishes. Refused: " + src); return; }
      app.open({ url: href });
    });
  }
  document.addEventListener("webviewerloaded", onLoaded);
  try { if (parent !== window) parent.document.addEventListener("webviewerloaded", onLoaded); } catch (e) { /* cross-origin host: the event comes to this document */ }
})();
`;
}

/** The viewer page, with the shim loaded ahead of the viewer's own modules. */
export function patchViewerHtml(html: string): string {
  const anchor = `<script src="../build/pdf.mjs" type="module"></script>`;
  if (!html.includes(anchor)) {
    throw new Error(
      `pdf-viewer: viewer.html no longer carries \`${anchor}\`. The release layout moved — ` +
        `re-measure the integration before bumping PDFJS_VERSION rather than shipping a viewer that ignores ?src=.`,
    );
  }
  return html.replace(anchor, `<script src="${SHIM_FILE}"></script>\n${anchor}`);
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Install the viewer into `<site>/assets/vendor/pdfjs/`.
 *
 * `zip` is a local copy of the release when the caller has one (tests,
 * offline runs); otherwise it is fetched. Either way the hash is checked
 * before a byte is extracted.
 */
export async function install(opts: { site: string; allow: readonly string[]; zip?: string }): Promise<string> {
  const bytes = opts.zip
    ? new Uint8Array(readFileSync(opts.zip))
    : new Uint8Array(await (await fetchOrThrow(PDFJS_ZIP_URL)).arrayBuffer());
  const got = sha256(bytes);
  if (got !== PDFJS_SHA256) {
    throw new Error(`pdf-viewer: ${PDFJS_ZIP_URL} hashed ${got}, pinned ${PDFJS_SHA256}. Refusing to install.`);
  }
  const work = mkdtempSync(join(tmpdir(), "pdfjs-"));
  try {
    const zipPath = join(work, "pdfjs.zip");
    writeFileSync(zipPath, bytes);
    const unzip = spawnSync("unzip", ["-q", zipPath, "-d", join(work, "x")], { stdio: "inherit" });
    if (unzip.status !== 0) throw new Error("pdf-viewer: unzip failed");
    const out = join(opts.site, VIEWER_DIR);
    rmSync(out, { recursive: true, force: true });
    for (const rel of KEEP) {
      const from = join(work, "x", rel);
      if (!existsSync(from)) throw new Error(`pdf-viewer: release has no ${rel}. Re-measure KEEP before bumping the pin.`);
      cpSync(from, join(out, rel), { recursive: true });
    }
    const viewer = join(out, "web/viewer.html");
    writeFileSync(viewer, patchViewerHtml(readFileSync(viewer, "utf8")));
    writeFileSync(join(out, "web", SHIM_FILE), openShim(opts.allow));
    return out;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

async function fetchOrThrow(url: string): Promise<Response> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`pdf-viewer: GET ${url} → ${r.status}`);
  return r;
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type EmbedOptions = {
  /** The PDF's URL. Must fall under an allowlisted prefix at install time, or the viewer refuses it. */
  src: string;
  /** What the document is — the iframe's accessible name. */
  title: string;
  /** The route pattern whose group 1 is the site root — `folio-mount.ts`'s convention. */
  route: RegExp;
  /** Open at this page (1-based). */
  page?: number;
  /** CSS height of the frame. */
  height?: string;
};

/**
 * The embed: a frame the inlined client points at `<root>/assets/vendor/pdfjs/web/viewer.html?src=…`,
 * and beneath it the two plain links that work without it.
 *
 * The links are not a fallback that appears on failure — they are always
 * there. A frame that 404s because the route did not match, or because the
 * build did not install the viewer, is otherwise an empty box; the reader
 * still has the document one click away, and the frame says why it is empty.
 */
export function embed(o: EmbedOptions): string {
  const hash = o.page && o.page > 1 ? `#page=${Math.floor(o.page)}` : "";
  const height = o.height ?? "80vh";
  return `<figure class="pdf-viewer" ${MARKER} style="margin:1rem 0">
<iframe title="${esc(o.title)} (PDF viewer)" data-src="${esc(o.src)}" data-hash="${esc(hash)}"
  style="width:100%;height:${esc(height)};border:1px solid #ccc" loading="lazy"
  allow="fullscreen" src="about:blank"></iframe>
<figcaption style="font-size:.9em">Search, page jump, print and download are in the viewer's toolbar.
  <a href="${esc(o.src)}" target="_blank" rel="noopener">Open the PDF on its own</a>
  &middot; <a href="${esc(o.src)}" download>Download</a></figcaption>
<script>${client(o.route.source)}</script>
</figure>`;
}

/**
 * The browser half of {@link embed}: derive the root, then point the frame at
 * the viewer when it comes within 200px of the viewport — not before.
 *
 * Lazy by an observer rather than by `loading="lazy"` alone, because the
 * attribute's behaviour on a script-assigned `src` differs across engines,
 * and the viewer plus its worker is ~3 MB a reader who never scrolls that far
 * should not pay. Owner, 2026-10-04: *"lazyload"*.
 */
function client(patternSource: string): string {
  return `(function(){
var f=document.currentScript.parentNode.querySelector("iframe[data-src]");
var m=location.pathname.match(new RegExp(${JSON.stringify(patternSource)}));
if(!f)return;
if(!m||m[1]==null){f.srcdoc="<p style=\\"font:1rem system-ui\\">The viewer could not find this site's root from the page address. Use the links below.</p>";return;}
var url=m[1]+${JSON.stringify(VIEWER_PATH)}+"?src="+encodeURIComponent(f.getAttribute("data-src"))+f.getAttribute("data-hash");
if(!("IntersectionObserver" in window)){f.src=url;return;}
var io=new IntersectionObserver(function(es){if(es.some(function(e){return e.isIntersecting;})){io.disconnect();f.src=url;}},{rootMargin:"200px"});
io.observe(f);
})();`;
}

function arg(argv: string[], flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

function all(argv: string[], flag: string): string[] {
  const out: string[] = [];
  argv.forEach((a, i) => {
    if (a === flag && argv[i + 1]) out.push(argv[i + 1]!);
  });
  return out;
}

/**
 * `bun run cat-harness/scripts/pdf-viewer.ts --site ./_site --allow <prefix> [--allow …] [--zip <file>]`
 *
 * Exit 2 on a usage error. An empty allowlist is a usage error, not a
 * default: a viewer that may open only same-origin files is a legitimate
 * build, but it has to be asked for (`--allow same-origin-only`), because
 * forgetting `--allow` would otherwise ship a viewer that refuses every
 * CDN document on every page while the build reports success.
 */
async function main(argv: string[]): Promise<number> {
  const site = arg(argv, "--site");
  const allow = all(argv, "--allow");
  if (!site || allow.length === 0) {
    console.error("usage: pdf-viewer.ts --site <dir> --allow <url-prefix>|same-origin-only [--allow …] [--zip <file>]");
    return 2;
  }
  if (!existsSync(site)) {
    console.error(`pdf-viewer: --site ${site} does not exist`);
    return 2;
  }
  const prefixes = allow.filter((a) => a !== "same-origin-only");
  for (const p of prefixes) {
    if (!/^https:\/\/[^/]+\/.+\/$/.test(p)) {
      console.error(`pdf-viewer: --allow ${p} must be an https URL prefix with a path, ending in "/"`);
      return 2;
    }
  }
  const out = await install({ site, allow: prefixes, zip: arg(argv, "--zip") });
  const files = countFiles(out);
  console.log(`pdf-viewer: pdf.js ${PDFJS_VERSION} → ${out} (${files} files); opens same-origin${prefixes.length ? ` + ${prefixes.join(", ")}` : " only"}`);
  return 0;
}

function countFiles(dir: string): number {
  let n = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) n += e.isDirectory() ? countFiles(join(dir, e.name)) : 1;
  return n;
}

if (import.meta.main) {
  process.exit(await main(process.argv.slice(2)));
}
