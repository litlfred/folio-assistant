#!/usr/bin/env bun
/**
 * ig-qa-page.ts — an IG site's QA report, `qa.html`: the FHIR QA and the
 * knowledge graph's QA on one page, the page the footer's "QA Report" links.
 *
 * Owner, 2026-11-06: *"QA report should link to harness QA reports = FHIR QA
 * reports + KG QA"*. Earlier (2026-10-12): *"where are qa reports
 * visible?"* — a finding a check wrote and nobody can read is the same as no
 * finding.
 *
 * ## The FHIR QA, from what the build holds
 *
 * The site is built from the IG's cached AST, never a Publisher run
 * (`ig-build-pipeline` rule 1), so the Publisher's `qa.html` is not
 * published. What the build holds is said, and what it does not hold is said
 * too:
 *
 * - the **Publisher's QA summary**, `qa.json`, which the AST build carries
 *   beside the AST (`ig-ast-build.sh`, `ig-cache.sh seed`): its errors,
 *   warnings and hints, and the run they came from. An AST cached before it
 *   carried one has none, and the page says so rather than showing zeros;
 * - the **AST's own record**: when its Publisher run generated it, with which
 *   toolchain, and which of its parts are provisional until a full run;
 * - the **AST's validity** for this checkout (`ig-repo-site ast` writes it
 *   under the work directory): valid, stale, or cannot tell, with why.
 *
 * ## The KG QA, from the harness
 *
 * cat-harness-tools `kg-qa-report.ts`: each layer's `qa-results/v1`
 * records and the harness's own view of the `qa` graph on this site. This
 * page lays it out and knows nothing of what any record is about.
 *
 *   bun run fhir-harness/scripts/ig-qa-page.ts --instance-root <dir> --docs <jekyll source> [--ast <dir>] [--work <dir>]
 *
 * @module fhir-harness/scripts/ig-qa-page
 * @covers none — it publishes QA records other checks wrote, and judges nothing
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { copyKgQaRecords, kgQaMarkdown, kgQaReport, type KgQaReport } from "../../cat-harness-tools/scripts/kg-qa-report.ts";
import { readDeclaration } from "../../cat-harness-tools/schemas/kg/cat-harness.ts";
import { execFileSync } from "node:child_process";
import { QA_MESSAGES_FILE, QA_MESSAGES_SCHEMA } from "./ig-qa-messages.ts";

/** Where the KG records are published under the site root. */
export const KG_QA_ASSETS = "assets/kg-qa";
/** Where the Publisher's QA summary is published under the site root. */
export const FHIR_QA_ASSETS = "assets/fhir-qa";
/** The Publisher's QA summary, as its run writes it to `output/` and the AST build carries it. */
export const PUBLISHER_QA_FILE = "qa.json";
/** Where the site's artifact pages are: `ARTIFACT_DIR` of `ig-artifact-jsonld.ts`, named here so this page does not load that module's schemas. */
const ARTIFACT_DIR = "artifact";
/** The page script that draws the Publisher's messages in its own layout, published beside them. */
export const QA_MESSAGES_SCRIPT = "qa-messages.js";

type Json = Record<string, unknown>;

/** The FHIR half: everything optional, because each is something the build may not hold. */
export interface FhirQa {
  /** The Publisher's `qa.json`, as the AST carries it. */
  publisher?: Json;
  /** The Publisher's full message list (`ig-qa-messages.ts`), as the AST carries it. */
  messages?: Json;
  /** Where the IG's tracked files are, at the commit this site is built from (`https://github.com/<o>/<r>/blob/<sha>/`), for the messages' file links. */
  sourceBase?: string;
  /** The AST's `manifest.json`. */
  manifest?: Json;
  /** `ig-ast-validity.json`, as `ig-repo-site ast` wrote it. */
  validity?: { verdict?: string; detail?: Json; recorded?: Json; current?: Json };
}

function readJson(file: string | undefined): Json | undefined {
  if (!file || !existsSync(file)) return undefined;
  try {
    const v = JSON.parse(readFileSync(file, "utf-8"));
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : undefined;
  } catch {
    return undefined;
  }
}

/** The FHIR QA the build holds: the AST directory, and the work directory the `ast` step wrote its verdict to. */
export function readFhirQa(ast: string | undefined, validityFile?: string): FhirQa {
  const publisher = ast ? readJson(join(ast, PUBLISHER_QA_FILE)) : undefined;
  const manifest = ast ? readJson(join(ast, "manifest.json")) : undefined;
  const validity = readJson(validityFile) as FhirQa["validity"];
  const read = ast ? readJson(join(ast, QA_MESSAGES_FILE)) : undefined;
  const messages = read && read.$schema === QA_MESSAGES_SCHEMA && Array.isArray(read.groups) && read.groups.length > 0 ? read : undefined;
  return { ...(publisher ? { publisher } : {}), ...(messages ? { messages } : {}), ...(manifest ? { manifest } : {}), ...(validity ? { validity } : {}) };
}

const code = (v: unknown): string => `\`${String(v).replace(/`/g, "'")}\``;
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** The FHIR half as Markdown lines. */
export function fhirQaMarkdown(q: FhirQa, o: { up?: string } = {}): string[] {
  const up = o.up ?? "";
  const lines: string[] = [];
  lines.push("### IG Publisher", "");
  const p = q.publisher;
  if (p) {
    const rows: [string, number | undefined][] = [
      ["errors", num(p.errs)],
      ["warnings", num(p.warnings)],
      ["hints", num(p.hints)],
      ["suppressed warnings", num(p["suppressed-warnings"])],
      ["suppressed hints", num(p["suppressed-hints"])],
    ];
    const run = [p.tool ? `IG Publisher ${String(p.tool)}` : undefined, p.version ? `FHIR ${String(p.version)}` : undefined, p.date ?? p.dateISO8601 ? `on ${String(p.date ?? p.dateISO8601)}` : undefined].filter(Boolean);
    lines.push(`The Publisher's own QA summary for the run this AST came from${run.length ? ` (${run.join(", ")})` : ""}. [Summary (JSON)](${up}${FHIR_QA_ASSETS}/${PUBLISHER_QA_FILE})`, "");
    const held = rows.filter(([, n]) => n !== undefined);
    if (q.messages) {
      lines.push(
        `Every message the Publisher reported, laid out as its own \`qa.html\` lays them out. [Messages (JSON)](${up}${FHIR_QA_ASSETS}/${QA_MESSAGES_FILE})`,
        "",
        `<div class="ig-qa-publisher" markdown="0" data-summary="${up}${FHIR_QA_ASSETS}/${PUBLISHER_QA_FILE}" data-messages="${up}${FHIR_QA_ASSETS}/${QA_MESSAGES_FILE}" data-pages="${up}assets/ast-pages.json" data-artifacts="${up}${ARTIFACT_DIR}/"${q.sourceBase ? ` data-source="${q.sourceBase}"` : ""}><p>Loading the Publisher's messages…</p><noscript><p>The messages are drawn in the browser; without JavaScript, read the JSON above.</p></noscript></div>`,
        `<script src="${up}${FHIR_QA_ASSETS}/${QA_MESSAGES_SCRIPT}"></script>`,
        "",
      );
    } else if (held.length) {
      lines.push("| messages | count |", "|---|---|");
      for (const [k, n] of held) lines.push(`| ${k} | ${n} |`);
      lines.push("");
    }
  } else {
    lines.push(
      "This build holds no Publisher QA summary (`qa.json`): the AST it was built from was cached without one. The Publisher's message list is not published here; an AST cached from a newer build carries its summary.",
      "",
    );
  }
  lines.push("### The IG's AST", "");
  const m = q.manifest;
  if (m) {
    const tc = (m.toolchain ?? {}) as Json;
    const prov = Array.isArray(m.provisional) ? (m.provisional as unknown[]).map(String) : [];
    lines.push("| field | value |", "|---|---|");
    if (m.generatedAt) lines.push(`| generated | ${code(m.generatedAt)} |`);
    if (m.authority) lines.push(`| authority | ${code(m.authority)} |`);
    for (const k of ["publisher", "core", "sushi", "java"]) if (tc[k]) lines.push(`| ${k} | ${code(tc[k])} |`);
    if (Array.isArray(m.resources)) lines.push(`| resources | ${m.resources.length} |`);
    if (prov.length) lines.push(`| provisional | ${prov.map(code).join(", ")}${m.provisionalUntil ? `, until ${String(m.provisionalUntil)}` : ""} |`);
    lines.push("");
  } else lines.push("This build holds no AST manifest.", "");
  const v = q.validity;
  if (v?.verdict) {
    const why = typeof v.detail?.why === "string" ? ` ${v.detail.why}` : "";
    lines.push(`**Validity for this checkout:** ${code(v.verdict)}.${why}`, "");
    const rec = (v.recorded ?? {}) as Json;
    const cur = (v.current ?? {}) as Json;
    const keys = ["toolchain", "sourceRevision", "inputDigest"].filter((k) => rec[k] !== undefined || cur[k] !== undefined);
    if (keys.length) {
      lines.push("| | recorded in the AST | this checkout |", "|---|---|---|");
      for (const k of keys) lines.push(`| ${k} | ${rec[k] !== undefined ? code(rec[k]) : "—"} | ${cur[k] !== undefined ? code(cur[k]) : "—"} |`);
      lines.push("");
    }
  } else lines.push("This build recorded no validity verdict for the AST.", "");
  return lines;
}

/** The whole page: front matter, then both halves inside `{% raw %}` (entries are data, not Liquid). */
export function renderQaPage(o: { title: string; fhir: FhirQa; kg: KgQaReport; up?: string }): string {
  return [
    "---",
    `title: ${JSON.stringify(o.title)}`,
    "nav_exclude: true",
    "rendered-by: ig-qa-page",
    "---",
    "",
    "{% raw %}",
    `# ${o.title}`,
    "",
    "Two halves: the FHIR QA of this implementation guide, and the knowledge graph's QA, the harness's checks over the instances this site is built from. A finding is a gap a check reports, not a failure of the build.",
    "",
    "## FHIR QA",
    "",
    ...fhirQaMarkdown(o.fhir, { up: o.up }),
    "## Knowledge-graph QA",
    "",
    ...kgQaMarkdown(o.kg, { assets: KG_QA_ASSETS, up: o.up, level: 3 }),
    "{% endraw %}",
    "",
  ].join("\n");
}

/** `https://github.com/<o>/<r>/blob/<sha>/` for a GitHub checkout, so a message's tracked file links to its source; undefined otherwise. */
export function githubBlobBase(root: string): string | undefined {
  try {
    const git = (...a: string[]) => execFileSync("git", ["-C", root, ...a], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const remote = /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(git("remote", "get-url", "origin"));
    const sha = git("rev-parse", "HEAD");
    return remote && /^[0-9a-f]{40}$/.test(sha) ? `https://github.com/${remote[1]}/${remote[2]}/blob/${sha}/` : undefined;
  } catch {
    return undefined;
  }
}

/** The page for the checkout at `root`: its text, and what it links that must be published beside it ({@link publishQaAssets}). */
export function buildQaPage(o: { root: string; ast?: string; validity?: string; title?: string }): { page: string; fhir: FhirQa; kg: KgQaReport } {
  const root = resolve(o.root);
  const fhir = readFhirQa(o.ast, o.validity);
  const sourceBase = githubBlobBase(root);
  if (sourceBase) fhir.sourceBase = sourceBase;
  const kg = kgQaReport(root, readDeclaration(root)?.name);
  return { page: renderQaPage({ title: o.title ?? "QA Report", fhir, kg }), fhir, kg };
}

/** Publish what the page links under `site`: the Publisher's summary and the KG records. Returns how many KG records were copied. */
export function publishQaAssets(r: { fhir: FhirQa; kg: KgQaReport }, site: string): number {
  if (r.fhir.publisher) {
    mkdirSync(join(site, FHIR_QA_ASSETS), { recursive: true });
    writeFileSync(join(site, FHIR_QA_ASSETS, PUBLISHER_QA_FILE), `${JSON.stringify(r.fhir.publisher, null, 2)}\n`);
  }
  if (r.fhir.publisher && r.fhir.messages) {
    writeFileSync(join(site, FHIR_QA_ASSETS, QA_MESSAGES_FILE), `${JSON.stringify(r.fhir.messages)}\n`);
    writeFileSync(join(site, FHIR_QA_ASSETS, QA_MESSAGES_SCRIPT), QA_MESSAGES_JS);
  }
  return copyKgQaRecords(r.kg, site, KG_QA_ASSETS);
}

function main(): number {
  const arg = (k: string) => {
    const i = process.argv.indexOf(`--${k}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const root = arg("instance-root");
  const docs = arg("docs");
  if (!root || !docs) {
    console.error("usage: ig-qa-page.ts --instance-root <dir> --docs <jekyll source> [--ast <dir>] [--work <dir>] [--title <title>]");
    return 2;
  }
  const work = arg("work");
  const r = buildQaPage({ root, ast: arg("ast") ?? join(root, "output-ast"), ...(work ? { validity: join(work, "ig-ast-validity.json") } : {}), ...(arg("title") ? { title: arg("title")! } : {}) });
  writeFileSync(join(resolve(docs), "qa.md"), r.page);
  const records = publishQaAssets(r, resolve(docs));
  console.log(`qa.md: FHIR QA ${r.fhir.publisher ? "with" : "without"} the Publisher's summary; KG QA over ${r.kg.instances.length} instance(s), ${records} record(s)`);
  return 0;
}

if (import.meta.main) process.exit(main());

/**
 * The page script: the Publisher's `qa.html` layout, drawn from `qa.json` and
 * `qa-messages.json` (ValidationPresenter: the header, the "Quality Checks"
 * table, the file table, then each file's Path / Severity / Message table,
 * in the Publisher's colours). Plain ES5, every value written as text.
 */
export const QA_MESSAGES_JS = String.raw`(function () {
  "use strict";
  var COLOR = { fatal: "#ff9999", error: "#ffdddd", warning: "#ffebcc", information: "#ffffe6" };
  var boxes = document.querySelectorAll(".ig-qa-publisher");
  if (boxes.length && !document.getElementById("ig-qa-publisher-css")) {
    var css = document.createElement("style");
    css.id = "ig-qa-publisher-css";
    css.textContent =
      ".ig-qa-publisher table.grid{border-collapse:collapse;margin:0 0 1em;font-size:.85em;width:auto}" +
      ".ig-qa-publisher table.grid td{border:1px solid #888;padding:3px 6px;vertical-align:top;color:#000}" +
      ".ig-qa-publisher table.grid td.plain{color:inherit}" +
      ".ig-qa-publisher .mid{font-size:8px;color:navy;display:none}" +
      ".ig-qa-publisher.show-ids .mid{display:inline}" +
      ".ig-qa-publisher .grid-wrap{overflow-x:auto}";
    document.head.appendChild(css);
  }
  for (var i = 0; i < boxes.length; i++) run(boxes[i]);

  function el(tag, text, attrs) {
    var e = document.createElement(tag);
    if (text != null) e.textContent = String(text);
    for (var k in attrs || {}) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function getJson(u) {
    return fetch(u).then(function (r) {
      if (!r.ok) throw new Error(u + " answered HTTP " + r.status);
      return r.json();
    });
  }
  function row(cells, color, bold) {
    var tr = el("tr", null, color ? { style: "background-color: " + color } : null);
    cells.forEach(function (c) {
      var td = el("td", null, color ? null : { "class": "plain" });
      if (c && c.nodeType) td.appendChild(c);
      else if (bold) td.appendChild(el("b", c));
      else td.textContent = c == null ? "" : String(c);
      tr.appendChild(td);
    });
    return tr;
  }
  function wrap(table) {
    var d = el("div", null, { "class": "grid-wrap" });
    d.appendChild(table);
    return d;
  }
  function counts(g) {
    var c = { err: 0, warn: 0, info: 0 };
    g.messages.forEach(function (m) {
      if (m.severity === "error" || m.severity === "fatal") c.err++;
      else if (m.severity === "warning") c.warn++;
      else c.info++;
    });
    return c;
  }

  function run(box) {
    var pagesUrl = box.getAttribute("data-pages");
    Promise.all([
      getJson(box.getAttribute("data-summary")).catch(function () { return {}; }),
      getJson(box.getAttribute("data-messages")),
      pagesUrl ? getJson(pagesUrl).catch(function () { return []; }) : Promise.resolve([]),
    ])
      .then(function (r) {
        var pages = {};
        (Array.isArray(r[2]) ? r[2] : []).forEach(function (p) { pages[p] = true; });
        var q = r[0] || {};
        var canon = typeof q.url === "string" ? q.url.replace(/\/ImplementationGuide\/[^\/]+$/, "") : "";
        draw(box, q, r[1] || {}, {
          pages: pages,
          artifacts: box.getAttribute("data-artifacts") || "artifact/",
          source: box.getAttribute("data-source") || "",
          canon: canon,
        });
      })
      .catch(function (e) {
        box.textContent = "";
        box.appendChild(el("p", "Could not load the Publisher's messages (" + e.message + ")."));
      });
  }

  /** The site's page for a resource named Type-id, when the site has one. */
  function pageFor(L, name) {
    return L.pages[name + ".html"] ? L.artifacts + name + ".html" : null;
  }
  /** A message file: its artifact page on this site, and its source at the built commit when it is tracked (input/...). */
  function fileCell(L, file, label) {
    var span = el("span");
    var base = file ? file.replace(/^.*\//, "").replace(/\.(json|xml|fsh)$/, "") : "";
    var page = base && pageFor(L, base);
    span.appendChild(page ? el("a", label, { href: page }) : document.createTextNode(label));
    if (file && L.source && /^input\//.test(file)) {
      span.appendChild(document.createTextNode(" "));
      span.appendChild(el("a", "(source)", { href: L.source + file.split("/").map(encodeURIComponent).join("/") }));
    }
    return span;
  }
  /** Message text with each URL linked: one of this IG's canonicals to its page here, any other to itself. */
  function linkText(L, text) {
    var out = el("b");
    var re = /https?:\/\/[^\s'"<>()|]+[^\s'"<>()|.,;:]/g;
    var last = 0;
    var m;
    while ((m = re.exec(text))) {
      out.appendChild(document.createTextNode(text.slice(last, m.index)));
      var u = m[0].replace(/\|.*$/, "");
      var href = u;
      if (L.canon && u.indexOf(L.canon + "/") === 0) {
        var rest = u.slice(L.canon.length + 1).split("/");
        if (rest.length === 2) href = pageFor(L, rest[0] + "-" + rest[1]) || u;
      }
      out.appendChild(el("a", m[0], { href: href }));
      last = m.index + m[0].length;
    }
    out.appendChild(document.createTextNode(text.slice(last)));
    return out;
  }

  function draw(box, q, m, L) {
    box.textContent = "";
    var groups = Array.isArray(m.groups) ? m.groups : [];
    box.appendChild(el("h4", "Validation Results for " + (q.title || q.name || "this IG")));
    var p = el("p");
    p.appendChild(document.createTextNode("Generated " + (q.date || q.dateISO8601 || "?") + ", FHIR version " + (q.version || "?") + " for "));
    var igName = (q["package-id"] || "?") + "#" + (q["ig-ver"] || "?");
    var igPage = q["package-id"] && pageFor(L, "ImplementationGuide-" + q["package-id"]);
    p.appendChild(igPage ? el("a", igName, { href: igPage }) : document.createTextNode(igName));
    if (q.url) {
      p.appendChild(document.createTextNode(" (canonical = "));
      var a = el("a", q.url, { href: q.url });
      p.appendChild(a);
      p.appendChild(document.createTextNode(")"));
    }
    p.appendChild(document.createTextNode("."));
    box.appendChild(p);

    var qc = el("table", null, { "class": "grid" });
    var head = el("tr");
    var th = el("td", null, { colspan: "2", "class": "plain" });
    th.appendChild(el("b", "Quality Checks"));
    head.appendChild(th);
    qc.appendChild(head);
    qc.appendChild(row(["Publisher Version:", q.tool || "?"]));
    var btn = el("button", "Show Message Ids", { type: "button" });
    btn.addEventListener("click", function () {
      var on = box.className.indexOf("show-ids") < 0;
      box.className = on ? box.className + " show-ids" : box.className.replace(/ ?show-ids/, "");
      btn.textContent = on ? "Hide Message Ids" : "Show Message Ids";
    });
    var sum = el("span");
    sum.appendChild(document.createTextNode(" errors = " + (q.errs != null ? q.errs : "?") + ", warn = " + (q.warnings != null ? q.warnings : "?") + ", info = " + (q.hints != null ? q.hints : "?") + ", broken links = " + (q["broken-links"] != null ? q["broken-links"] : "?") + ".  "));
    sum.appendChild(btn);
    qc.appendChild(row(["Summary:", sum]));
    box.appendChild(wrap(qc));

    var files = el("table", null, { "class": "grid", id: "qa-files" });
    files.appendChild(row(["Filename", "Errors", "Warnings", "Hints"], null, true));
    groups.forEach(function (g, i) {
      var c = counts(g);
      var b = el("b");
      b.appendChild(el("a", g.file || "Build Errors", { href: "#qa-f" + i }));
      var base = g.file ? g.file.replace(/^.*\//, "").replace(/\.(json|xml|fsh)$/, "") : "";
      var page = base && pageFor(L, base);
      if (page) {
        b.appendChild(document.createTextNode(" "));
        b.appendChild(el("a", "(page)", { href: page }));
      }
      files.appendChild(row([b, String(c.err), String(c.warn), String(c.info)], c.err ? COLOR.error : "#EFFFEF"));
    });
    box.appendChild(wrap(files));
    if (!groups.length) box.appendChild(el("p", m.absent ? "No messages: " + m.absent + "." : "The Publisher reported no messages."));

    groups.forEach(function (g, i) {
      box.appendChild(el("hr"));
      var c = counts(g);
      var h = el("h5", null, { id: "qa-f" + i });
      h.appendChild(fileCell(L, g.file, g.file || "Build Errors"));
      h.appendChild(document.createTextNode("  (" + c.err + " errors, " + c.warn + " warnings, " + c.info + " hints) "));
      h.appendChild(el("a", "\u2191 files", { href: "#qa-files" }));
      box.appendChild(h);
      var t = el("table", null, { "class": "grid" });
      t.appendChild(row(["Path", "Severity", "Message"], null, true));
      g.messages.forEach(function (msg) {
        var where = (msg.path || "") + (msg.line > 0 ? " (l" + msg.line + "/c" + msg.col + ")" : "");
        var text = el("span");
        text.appendChild(linkText(L, msg.text));
        if (msg.messageId) {
          text.appendChild(document.createTextNode(" "));
          text.appendChild(el("span", msg.messageId, { "class": "mid" }));
        }
        var pw = el("b", where);
        var sv = el("b", msg.severity);
        t.appendChild(row([pw, sv, text], COLOR[msg.severity] || COLOR.information));
      });
      box.appendChild(wrap(t));
    });
  }
})();
`;
