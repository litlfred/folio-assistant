/**
 * Inject the staging banner as a CONSTANT fragment, and put the per-preview
 * facts in one `staging.json` the browser reads. Bean `g196`.
 *
 * ## The problem this exists to fix
 *
 * The banner used to be composed in `feature-staging.yml` as a bash string and
 * `sed`-ed into every page with the commit SHA and a `date -u` build timestamp
 * baked in. Measured on `origin/gh-pages`, 2026-09-19: 9 previews, **346.1 MB**,
 * of which **27.5 MB of each 37.5 MB preview is HTML** — and **zero HTML blobs
 * are shared between any two previews** (git `ls-tree` blob-hash intersection:
 * 0 of ~390 HTML objects, against 185 of ~780 overall, the shared ones being
 * images, fonts and vendor JS).
 *
 * The timestamp is the sharp end. Because it is `date -u +%Y-%m-%dT%H:%M:%SZ`,
 * **every page is unique even across two builds of ONE branch**, so each
 * re-push adds ~27.5 MB of permanently new objects and the history grows even
 * when the preview count does not. Run 597's log: *"Injected staging banner
 * into 530 HTML files"*.
 *
 * ## The shape
 *
 * Emit the facts once, to `<site>/staging.json`, and inject a fragment that is
 * **byte-identical on every page and across every rebuild**. The browser
 * derives its preview root from `location.pathname`, fetches the JSON and
 * fills the banner in.
 *
 * This is not a new idea here — `head_custom.html` already records the sidebar
 * QR as *"generated in the browser from `window.location.href` rather than
 * baked per page at build time"*, for the neighbouring reason.
 *
 * ## Why the compare link did not defeat it
 *
 * Exactly one fragment of the old banner was genuinely per-page: the link
 * putting this page beside its counterpart on `main`, which has three states
 * (present on main → deep link; absent → site root, and SAY the page is new;
 * publish ref unread → site root, worded neutrally). That looked like
 * build-time per-page data.
 *
 * It is not. The client knows its own path, and the only thing it cannot
 * compute is *which pages main has* — so `staging.json` carries `newPages`,
 * the pages with **no** counterpart, which is the short list rather than the
 * long one. Membership is then a client-side check and the fragment stays
 * constant. Had this not worked the whole approach would have collapsed to a
 * much smaller saving, so it was the first thing checked.
 *
 * ## What is deliberately NOT fixed here
 *
 * Causes 2 and 3 in `g196`: Jekyll's `relative_url` prepends `baseurl` to
 * ~235 hrefs per page, and the `fa-translation-index` island publishes
 * `site.baseurl` to JavaScript. Pages therefore still differ **between**
 * previews by slug. They no longer differ **across rebuilds of one preview**,
 * which is the unbounded half. The two are coupled to the language switcher
 * (`navKey()` strips the baseurl; the switcher rebuilds hrefs from it), so
 * they are one change and not this one.
 *
 * ## The footer carries the same stamp, and it is filled the same way
 *
 * `docs/_includes/footer_custom.html` renders `short_sha`, `built_at` and
 * `run_url` from `docs/_data/build.yml` into the footer of EVERY page. A fresh
 * `date -u` there made every page unique on every run — the same defect as the
 * banner, one include away — and it SURVIVED the banner fix. Measured on two
 * deploys of one branch three minutes apart, both already shipping the
 * constant banner: **1466 insertions, 1465 deletions across 613 files, every
 * page changed by exactly one line**.
 *
 * So the staging build no longer writes those three keys; Jekyll renders the
 * footer identically every time, and {@link CLIENT}'s `stamp()` fills the real
 * values from the same `staging.json` the banner already fetches. The reader
 * loses nothing — only the moment the value is bound moves from build time to
 * load time. `docs-site.yml` still stamps the MAIN site, where there is one
 * copy and nothing to deduplicate.
 *
 * That this was missed until the deployed artefact was measured is the point
 * worth keeping: the unit test proved the FRAGMENT constant and was right,
 * and the page still was not. A test of the part is not a measurement of the
 * whole.
 *
 * ## Two rules the client script must not break
 *
 * **A failed fetch must still say PREVIEW.** The banner exists so a reviewer
 * cannot mistake staged content for the published site; if `staging.json`
 * cannot be read, the page must still announce itself. *"Could not determine"
 * is never rendered as "this is the real site"* — the same third-state rule
 * the rest of this repository runs on, and here the failure mode is a
 * reviewer approving the wrong artefact. So the static markup carries
 * "FEATURE BRANCH" and the fetch only ever ADDS detail.
 *
 * **Every value from the JSON goes in as `textContent`, never as markup.**
 * Git ref names may contain `<`, `>` and `"` — they are not in git's
 * forbidden set, which stops at space, `~`, `^`, `:`, `?`, `*`, `[`, `\` and
 * the control characters. A branch name is therefore attacker-influenced
 * markup if it is ever concatenated into HTML. The old bash banner
 * interpolated `$BRANCH` into a string; this one builds nodes.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";

import { commentGuard } from "./html-comments.ts";

/** The per-preview facts. One file per build, read by the banner at load time. */
export interface StagingFacts {
  /** Raw branch name — the slug is sanitised, this is not. */
  branch: string;
  /** Short commit SHA of the build. */
  sha: string;
  /** `date -u +%Y-%m-%dT%H:%M:%SZ`. The reason the old banner defeated dedup. */
  built: string;
  /** PR number, or `"n/a"` when the build has no PR. */
  pr: string;
  prUrl: string;
  branchUrl: string;
  /** The issue the branch is FOR, or `null` — absent is a normal state. */
  issue: string | null;
  issueUrl: string | null;
  runUrl: string;
  /**
   * Root of the PUBLISHED site this preview is compared with: `main`'s, or for
   * a stacked PR its base branch's preview (bean `5uuf`).
   */
  mainSite: string;
  /**
   * Which branch `mainSite` is the published site of, so a page can say which
   * "before" it used. `null` when the caller did not say: read as `main`, the
   * only before side there was until `5uuf`.
   */
  beforeRef?: string | null;
  /**
   * Whether the publish ref could be read at all. `false` collapses the
   * compare link to the site root, worded neutrally — "could not tell" must
   * never render as "this page is new", which would label every page new on
   * any run where the fetch failed.
   */
  mainPagesKnown: boolean;
  /**
   * Site-relative paths that exist in this build and NOT on main. The short
   * list; membership is checked in the browser. Empty and meaningless when
   * `mainPagesKnown` is false.
   */
  newPages: string[];
}

const CHIP =
  "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:rgba(0,0,0,.22);color:#fff;padding:1px 6px;border-radius:3px";

/**
 * The banner's own colours, kept from the bash version with their reasons.
 *
 * Muted sage (#4F6F52) with white text — 5.63:1, comfortably past the 4.5:1
 * WCAG AA threshold for normal text. It replaced #d946ef, which measured
 * 3.46:1 against its own white text and so FAILED AA: the banner was not
 * merely glaring, it was the least readable element on every staged page. Any
 * replacement must be checked the same way; the pale decorator sages
 * (#9CAF88, #87A96B) all land near 2.5:1.
 *
 * Every monospace chip is a `<span>`, deliberately NOT a `<code>`. The branch
 * name used to be `<code>`, which picks up the theme's own `code` rule — a
 * near-white background in LIGHT mode — while inheriting the banner's white
 * text. White on white: the one piece of information the banner exists to
 * convey was invisible to exactly the readers using the default theme.
 */
const BANNER_STYLE =
  "background:#4F6F52;color:#fff;padding:8px 16px;font-size:14px;text-align:center;position:sticky;top:0;z-index:9999;font-family:system-ui";

/**
 * The banner must PUSH THE FIXED SIDEBAR DOWN, not sit on top of it.
 *
 * just-the-docs makes `.side-bar` `position: fixed; top: 0`. A `position:
 * sticky` banner is in normal flow and moves nothing that is out of it, so the
 * banner covered the top of the sidebar: the site title, and part of the
 * toolbar row holding the theme, reading preferences, language and QR
 * controls. A reader reported the language selector "still not visible" — it
 * was under the banner.
 *
 * A fixed offset would be wrong: the banner wraps to two or three lines on a
 * narrow viewport, and its height is not knowable here. So measure it and
 * publish the value as a custom property, on load and on resize — and now
 * also after the fetch fills it in, which is a THIRD moment the height
 * changes and the bash version never had.
 */
export const OFFSET_STYLE =
  "<style>:root{--fa-staging-offset:0px}.side-bar{top:var(--fa-staging-offset,0px)!important}</style>";

/** Where the preview root is, given a page's pathname. Exported to be tested. */
export function previewRootOf(pathname: string): string | null {
  const m = pathname.match(/^(.*\/STAGING\/[^/]+\/)/);
  return m ? m[1]! : null;
}

/**
 * The client half, inlined verbatim into every page.
 *
 * Inlined rather than referenced as an asset for one reason: a `<script src>`
 * would have to be document-relative, so its href would vary with the page's
 * DEPTH — reintroducing per-page variation to remove per-page variation. The
 * cost is ~2 KB repeated 530 times inside pages that are now identical to each
 * other's next rebuild, which git stores once.
 *
 * `previewRootOf` above is the same expression; `staging-banner.test.ts`
 * asserts they agree, so the tested function cannot drift from the shipped
 * string.
 */
const CLIENT = `(function(){
function el(t,a,x){var e=document.createElement(t);if(a)for(var k in a)e.setAttribute(k,a[k]);if(x!=null)e.textContent=x;return e;}
function link(href,text,extra){var a=el('a',{href:href,style:'color:#fff;text-decoration:underline'},text);if(extra)a.setAttribute('style',a.getAttribute('style')+';'+extra);return a;}
function chip(text){return el('span',{style:${JSON.stringify(CHIP)}},text);}
function sep(){return document.createTextNode(' \\u00b7 ');}
function root(){var m=location.pathname.match(/^(.*\\/STAGING\\/[^/]+\\/)/);return m?m[1]:null;}
function measure(){var b=document.querySelector('[data-fa-staging-banner]');if(!b)return;document.documentElement.style.setProperty('--fa-staging-offset',b.getBoundingClientRect().height+'px');}
function fill(d,f,r){
  while(d.firstChild)d.removeChild(d.firstChild);
  d.appendChild(document.createTextNode('\\u2014 '));
  var b=link(f.branchUrl,'');b.appendChild(chip(f.branch));d.appendChild(b);
  d.appendChild(sep());d.appendChild(document.createTextNode('commit '));d.appendChild(chip(f.sha));
  d.appendChild(sep());d.appendChild(document.createTextNode('built '+f.built));
  d.appendChild(sep());d.appendChild(link(f.prUrl,'PR #'+f.pr));
  if(f.issue){d.appendChild(sep());d.appendChild(link(f.issueUrl,'issue #'+f.issue));}
  d.appendChild(sep());
  var rel=location.pathname.slice(r.length);
  if(rel===''||rel.charAt(rel.length-1)==='/')rel+='index.html';
  if(!f.mainPagesKnown){
    d.appendChild(link(f.mainSite+'/','compare with '+(f.beforeRef||'main')+' \\u2197'));
  }else if(f.newPages.indexOf(rel)>=0){
    d.appendChild(link(f.mainSite+'/',(f.beforeRef||'main')+' \\u2197'));
    d.appendChild(document.createTextNode(' '));
    d.appendChild(el('span',{style:'opacity:.85'},'(new page)'));
  }else{
    d.appendChild(link(f.mainSite+'/'+rel,'compare with '+(f.beforeRef||'main')+' \\u2197'));
  }
  d.appendChild(sep());d.appendChild(link(f.runUrl,'build log'));
  stamp(f);
  measure();
}
function stamp(f){
  var p=document.querySelector('.fa-build-stamp');if(!p)return;
  while(p.firstChild)p.removeChild(p.firstChild);
  p.appendChild(document.createTextNode('deployed '));
  var a=link(f.runUrl,'');a.appendChild(el('code',null,f.sha));p.appendChild(a);
  p.appendChild(document.createTextNode(' \u00b7 '+f.built));
}
function go(){
  measure();
  var d=document.querySelector('[data-fa-staging-detail]');if(!d)return;
  var r=root();
  if(!r){d.textContent='\\u2014 build details unavailable (not served from a preview path)';return;}
  fetch(r+'staging.json',{cache:'no-store'}).then(function(x){if(!x.ok)throw 0;return x.json();})
    .then(function(f){fill(d,f,r);})
    .catch(function(){d.textContent='\\u2014 build details unavailable';measure();});
}
if(document.readyState!=='loading')go();else document.addEventListener('DOMContentLoaded',go);
window.addEventListener('resize',measure);window.addEventListener('load',measure);
})();`;

/**
 * The fragment injected after the opening `<body>` tag. **Constant** — it
 * takes no argument, which is the whole property this change buys and is why
 * it is a `const` rather than a function.
 *
 * The static text says FEATURE BRANCH before any fetch happens, so a page
 * served with a broken or missing `staging.json` still announces itself.
 */
export const FRAGMENT =
  `<div data-fa-staging-banner style="${BANNER_STYLE}">\u{1F500} <b>FEATURE BRANCH</b> ` +
  `<span data-fa-staging-detail>— loading build details…</span></div>` +
  OFFSET_STYLE +
  `<script>${CLIENT}</script>`;

/** Every `*.html` under `dir`, as absolute paths. */
function htmlFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

/**
 * The first `<body …>` that is REAL — i.e. not inside an HTML comment.
 *
 * ## Why this is not `html.search(/<body/i)`
 *
 * It was, and it put the banner inside a comment on 323 of 670 staged pages —
 * 48 % of a preview, measured on the deployed tree, 2026-09-21. The prose
 * comment in `docs/_includes/head_custom.html` that explains why a `<meta>`
 * is used rather than a `<div>` contains the words `<body>` as an EXAMPLE:
 *
 *     A browser hoists a stray `<div>` into `<body>` and the code still works
 *
 * `head_custom.html` is in the `<head>` of every just-the-docs page, so that
 * sentence is the first `<body>` in the file and the non-global `replace`
 * spent its one substitution on it. The real tag, hundreds of lines later,
 * got nothing. The `who-iris` pages were fine because they are generated
 * without that include — which is why the failure looked like a `who-iris`
 * feature rather than a bug.
 *
 * **A comment about the banner broke the banner**, and nothing said so: the
 * page still contained `data-fa-staging-banner`, so every check that asked
 * "did the string land" answered yes.
 *
 * Returns the index just past the opening tag, or `-1` when the document has
 * no real `<body>` at all.
 */
export function bodyInsertionPoint(html: string): number {
  const inComment = commentGuard(html);
  for (const m of html.matchAll(/<body[^>]*>/gi)) {
    if (!inComment(m.index!)) return m.index! + m[0].length;
  }
  return -1;
}

/**
 * What happened to one page. THREE states, not two, and the third is the one
 * that was being reported as success: a page the injector could not place the
 * banner in looked exactly like a page it had just placed it in, because the
 * only question asked was "did the bytes change".
 */
export type Injection = "injected" | "already" | "no-body";

/**
 * Inject after the WHOLE opening tag, not the literal `<body`.
 *
 * Matching `<body` alone re-emitted `<body>` and left the original tag's own
 * `>` behind, so every staged page carried a stray `>` after the banner — and
 * any `<body>` carrying attributes came out as `<body>BANNER class="…"">`:
 * attributes orphaned as visible text, and the real tag stripped of them.
 *
 * Idempotent: a page that already carries the banner is left alone, so a
 * second pass over a tree is a no-op rather than a doubled banner.
 */
export function injectInto(html: string): { html: string; outcome: Injection } {
  if (html.includes("data-fa-staging-banner")) return { html, outcome: "already" };
  const at = bodyInsertionPoint(html);
  if (at < 0) return { html, outcome: "no-body" };
  return { html: html.slice(0, at) + FRAGMENT + html.slice(at), outcome: "injected" };
}

export function run(
  site: string,
  facts: StagingFacts,
): { injected: number; skipped: number; noBody: string[] } {
  writeFileSync(join(site, "staging.json"), JSON.stringify(facts, null, 2) + "\n");
  let injected = 0;
  let skipped = 0;
  const noBody: string[] = [];
  for (const f of htmlFiles(site)) {
    const before = readFileSync(f, "utf-8");
    const { html: after, outcome } = injectInto(before);
    if (outcome === "no-body") noBody.push(relative(site, f));
    else if (outcome === "already") skipped++;
    else {
      writeFileSync(f, after);
      injected++;
    }
  }
  return { injected, skipped, noBody };
}

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function required(name: string): string {
  const v = flag(name);
  if (v === undefined || v === "") {
    console.error(`staging-banner: --${name} is required`);
    process.exit(2);
  }
  return v;
}

if (import.meta.main) {
  const site = required("site");
  const mainSite = required("main-site").replace(/\/+$/, "");
  const issue = flag("issue") || null;

  // The publish ref's page list, one path per line, or absent. An EMPTY file
  // is not the same as no file: absent means the fetch failed and we do not
  // know, which is the third state `mainPagesKnown` carries.
  const mainPagesFile = flag("main-pages");
  let mainPagesKnown = false;
  let newPages: string[] = [];
  if (mainPagesFile) {
    const listed = new Set(
      readFileSync(mainPagesFile, "utf-8").split("\n").map((l) => l.trim()).filter(Boolean),
    );
    if (listed.size > 0) {
      mainPagesKnown = true;
      newPages = htmlFiles(site)
        .map((f) => relative(site, f))
        .filter((rel) => !listed.has(rel))
        .sort();
    }
  }

  const facts: StagingFacts = {
    branch: required("branch"),
    sha: required("sha"),
    built: required("built"),
    pr: required("pr"),
    prUrl: required("pr-url"),
    branchUrl: required("branch-url"),
    issue,
    issueUrl: issue ? `${required("issues-url").replace(/\/+$/, "")}/${issue}` : null,
    runUrl: required("run-url"),
    mainSite,
    beforeRef: flag("before-ref") || null,
    mainPagesKnown,
    newPages,
  };

  const { injected, skipped, noBody } = run(site, facts);
  console.log(
    mainPagesKnown
      ? `Read the publish ref; ${newPages.length} page(s) have no counterpart on main`
      : "Could not read the publish ref — compare links fall back to the site root",
  );
  console.log(
    `Injected the constant staging banner into ${injected} HTML file(s)` +
      (skipped ? ` (${skipped} already carried it)` : "") +
      ` and wrote staging.json`,
  );

  // A PAGE WITH NO BANNER IS INDISTINGUISHABLE FROM THE LIVE SITE, which is
  // the whole reason the banner exists — so this fails the build rather than
  // printing a warning nobody reads in a green job. Measured before making it
  // fatal: of 670 pages on the deployed preview, 0 had no `<body>`, so this
  // branch costs nothing today and catches the day a generator emits a
  // fragment as a page.
  if (noBody.length > 0) {
    console.error(
      `\n${noBody.length} page(s) have no <body> tag outside a comment, so they carry NO banner:`,
    );
    for (const f of noBody.slice(0, 20)) console.error(`  · ${f}`);
    if (noBody.length > 20) console.error(`  … and ${noBody.length - 20} more`);
    process.exit(1);
  }
}
