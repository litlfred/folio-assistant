/**
 * edit-links — the ONE recipe for "edit this on GitHub" and "give feedback on
 * this" links, for every page the platform publishes (owner, 2026-10-06:
 * "make sure feedback/edit links are changed across all harness/visualizers
 * to be dynamic"). Moved here from `folio-assistant-core/scripts/
 * block-actions.ts` so the harness's own generators can use it: the harness
 * may not import core, and core re-exports this.
 *
 * Originally block-actions: every rendered block links back to where it can be changed:
 * **[edit]** opens the block's Markdown source in GitHub's editor, and
 * **[feedback]** opens a new GitHub issue about that block, from the folio's
 * own issue form when it has one. Bean `uphx`, REQ-17 of the round 2
 * public-comment CRD (owner, 2026-10-06: *"each block should also have an
 * [edit] and [feedback] icons … back to edit source on github or create an
 * issue to change block contents"*, and *"make this common folio-asst-core
 * functionality … create an issue w/ optional parameterized template"*).
 *
 * The IG builder already does this per heading (`fhir-harness/scripts/
 * build-ig-site.ts`: "Edit this page on GitHub" and a 📣 feedback icon); this
 * is the same reader affordance for a document folio, per BLOCK, because a
 * block is what a comment, a change-set and an edit are about.
 *
 * ## The template is the folio's, and optional
 *
 * A folio that wants structured feedback adds a GitHub issue form,
 * `.github/ISSUE_TEMPLATE/block-feedback.yml` by default. The link then names
 * that template and prefills ONLY the fields the form declares, by id, from
 * {@link BlockContext}: `block`, `section`, `source`, `page`, `url`. A field
 * the form does not declare is not sent, so a form can ask for as little as
 * it likes. With no form the link opens a blank issue whose body carries the
 * same facts, so the link works on day one.
 *
 * Nothing here decides anything or writes to GitHub: it builds URLs.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** What a block's links are built from. */
export interface BlockContext {
  /** The block's label: its anchor id on the page. */
  label: string;
  /** The block's source, relative to the repository root (`folio/<doc>/<ch>/<root>.md`). */
  source: string;
  /** The section the block is in, as its heading reads. */
  section?: string;
  /** The page the block renders on, relative to the site root (`<doc>/index.html`). */
  page?: string;
  /** The line the thing starts on in its source, when known: the source link points at it. */
  line?: number;
  /** A repository other than the config's, for a source in a submodule (`sourceLinks` resolves it). */
  repo?: string;
  /** The block's address as the reader sees it, when the site's URL is not configured (the browser knows it). */
  pageUrl?: string;
}

export interface BlockActionsConfig {
  /** `owner/repo`. Without it there is nothing to link to, and no links are drawn. */
  repo?: string;
  /** The branch [edit] opens. Default `main`: an edit proposes a change to the published text. */
  branch?: string;
  /** The issue form, a file name under `.github/ISSUE_TEMPLATE/`. Absent: a blank issue. */
  template?: string;
  /** The form's field ids, so only declared fields are prefilled. Read by {@link readIssueForm}. */
  templateFields?: string[];
  /** Labels to put on the new issue. */
  labels?: string[];
  /** The published site's base URL, so an issue can link back to the block. */
  siteUrl?: string;
}

export const DEFAULT_TEMPLATE = "block-feedback.yml";

const enc = encodeURIComponent;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** GitHub's editor on the block's source. Proposing the edit makes a branch and a PR. */
export function editUrl(cfg: BlockActionsConfig, source: string, repo?: string): string | undefined {
  const r = repo ?? cfg.repo;
  if (!r) return undefined;
  return `https://github.com/${r}/edit/${cfg.branch ?? "main"}/${source.split("/").map(enc).join("/")}`;
}

/** The block's source as GitHub shows it. */
export function sourceUrl(cfg: BlockActionsConfig, source: string, line?: number, repo?: string): string | undefined {
  const r = repo ?? cfg.repo;
  if (!r) return undefined;
  return `https://github.com/${r}/blob/${cfg.branch ?? "main"}/${source.split("/").map(enc).join("/")}${line ? `#L${line}` : ""}`;
}

/** The block's address on the published site, when the site's URL is known. */
export function blockPageUrl(cfg: BlockActionsConfig, b: BlockContext): string | undefined {
  if (!cfg.siteUrl || !b.page) return b.pageUrl;
  return `${cfg.siteUrl.replace(/\/$/, "")}/${b.page}#${enc(b.label)}`;
}

/**
 * A new issue about the block. With a template, only the fields the form
 * declares are prefilled; without one, the facts go in the body.
 */
export function feedbackUrl(cfg: BlockActionsConfig, b: BlockContext): string | undefined {
  if (!cfg.repo) return undefined;
  const values: Record<string, string> = {
    block: b.label,
    section: b.section ?? "",
    source: b.source,
    page: b.page ?? "",
    url: blockPageUrl(cfg, b) ?? "",
  };
  const q = new URLSearchParams();
  q.set("title", `Feedback: ${b.section ? `${b.section} — ` : ""}${b.label}`);
  if (cfg.labels?.length) q.set("labels", cfg.labels.join(","));
  if (cfg.template) {
    q.set("template", cfg.template);
    for (const f of cfg.templateFields ?? []) if (values[f]) q.set(f, values[f]);
  } else {
    const facts = [
      `**Block:** \`${b.label}\``,
      ...(b.section ? [`**Section:** ${b.section}`] : []),
      `**Source:** ${sourceUrl(cfg, b.source, b.line, b.repo)}`,
      ...(values.url ? [`**On the site:** ${values.url}`] : []),
    ];
    // The comment matrix's columns, so public-comment intake reads the issue
    // like a returned row (the folio site's format, now everyone's).
    q.set("body", [...facts, "", "**Type:** general | technical | editorial", "", "**Comment:**", "", "", "**Proposed change:**", ""].join("\n"));
  }
  return `https://github.com/${cfg.repo}/issues/new?${q}`;
}

/**
 * The field ids an issue form declares (`id:` under `body:`), or `undefined`
 * when the folio has no such form. A plain line scan, as the forms are flat
 * YAML and this needs only the ids.
 */
export function readIssueForm(repoRoot: string, template = DEFAULT_TEMPLATE): string[] | undefined {
  const p = join(repoRoot, ".github", "ISSUE_TEMPLATE", template);
  if (!existsSync(p)) return undefined;
  return [...readFileSync(p, "utf-8").matchAll(/^\s+id:\s*["']?([A-Za-z0-9_-]+)["']?\s*$/gm)].map((m) => m[1]!);
}

/** The links for one block, as HTML. Empty when no repository is known. */
export function blockActionsHtml(cfg: BlockActionsConfig, b: BlockContext): string {
  const edit = editUrl(cfg, b.source);
  const fb = feedbackUrl(cfg, b);
  if (!edit || !fb) return "";
  return (
    `<span class="block-actions" data-block="${esc(b.label)}">` +
    `<a class="ba-edit" href="${esc(edit)}" title="Edit this block's source on GitHub (${esc(b.source)})">✎ edit</a>` +
    `<a class="ba-feedback" href="${esc(fb)}" title="Give feedback on this block (opens a GitHub issue)">📣 feedback</a>` +
    `</span>`
  );
}

/**
 * The same URLs, built in the browser. A lazy document page (bean v433) has
 * hundreds of blocks, and a feedback URL carries its prefilled issue, so
 * writing every href into the page cost 864 KB on the DPI-H document. The
 * compact form writes each block's facts as data attributes and this builds
 * the hrefs when a pointer or focus reaches them. `block-actions.test.ts`
 * evaluates it and holds it equal to {@link editUrl} and {@link feedbackUrl}.
 */
export const BLOCK_URLS_JS = `function faBlockUrls(c, b) {
  var enc = encodeURIComponent;
  var path = b.source.split("/").map(enc).join("/");
  var branch = c.branch || "main";
  var repo = b.repo || c.repo;
  var src = "https://github.com/" + repo + "/blob/" + branch + "/" + path + (b.line ? "#L" + b.line : "");
  var url = c.siteUrl && b.page ? c.siteUrl.replace(/\\/$/, "") + "/" + b.page + "#" + enc(b.label) : (b.pageUrl || "");
  var values = { block: b.label, section: b.section || "", source: b.source, page: b.page || "", url: url };
  var q = new URLSearchParams();
  q.set("title", "Feedback: " + (b.section ? b.section + " \u2014 " : "") + b.label);
  if (c.labels && c.labels.length) q.set("labels", c.labels.join(","));
  if (c.template) {
    q.set("template", c.template);
    (c.templateFields || []).forEach(function (f) { if (values[f]) q.set(f, values[f]); });
  } else {
    var facts = ["**Block:** \\u0060" + b.label + "\\u0060"];
    if (b.section) facts.push("**Section:** " + b.section);
    facts.push("**Source:** " + src);
    if (url) facts.push("**On the site:** " + url);
    q.set("body", facts.concat(["", "**Type:** general | technical | editorial", "", "**Comment:**", "", "", "**Proposed change:**", ""]).join("\\n"));
  }
  return { edit: "https://github.com/" + repo + "/edit/" + branch + "/" + path, source: src, feedback: "https://github.com/" + c.repo + "/issues/new?" + q };
}`;

/**
 * The browser half, one script for every page: fills each `a[data-fa-link]`
 * (`edit`, `source` or `feedback`) from the facts on its nearest
 * `[data-src]` host the first time a pointer, focus or touch reaches it, so a
 * page carries facts, not hundreds of URLs, and every page builds the same
 * URL from one recipe. Configuration is a `#fa-edit-cfg` JSON block, else
 * `<meta name="fa-repo">` / `<meta name="fa-branch">` (the docs site's head).
 * `window.faEditLinks.fill(root)` fills eagerly for a page that wants to.
 */
export const EDIT_LINKS_RUNTIME = `(() => {
  if (window.faEditLinks) return;
  ${BLOCK_URLS_JS}
  let cfg = null;
  const config = () => {
    if (cfg) return cfg;
    const el = document.getElementById("fa-edit-cfg");
    if (el) cfg = JSON.parse(el.textContent);
    else {
      const meta = (n) => { const m = document.querySelector('meta[name="' + n + '"]'); return m ? m.content : undefined; };
      cfg = { repo: meta("fa-repo"), branch: meta("fa-branch") || "main" };
    }
    return cfg;
  };
  // A link that names a GitHub file but carries no facts (a generator wrote
  // its href from data, e.g. sourceLinks) gives them up from its own URL.
  const GH = /^https:\\/\\/github\\.com\\/([^/]+\\/[^/]+)\\/(?:blob|edit)\\/([^/]+)\\/([^#?]+)(?:#L(\\d+))?$/;
  const adopt = (a) => {
    const m = GH.exec(a.getAttribute("href") || "");
    if (!m) return false;
    a.dataset.repo = m[1]; a.dataset.branch = m[2];
    a.dataset.src = m[3].split("/").map(decodeURIComponent).join("/");
    if (m[4]) a.dataset.line = m[4];
    return true;
  };
  const ready = (host) => {
    if (host.dataset.ready) return;
    if (!host.dataset.src && !(host.matches("a[data-fa-link]") && adopt(host))) return;
    const c0 = config();
    const c = host.dataset.branch ? Object.assign({}, c0, { branch: host.dataset.branch }) : c0;
    if (!c.repo && !host.dataset.repo) return;
    host.dataset.ready = "1";
    const label = host.dataset.block || host.dataset.src;
    const u = faBlockUrls(c, { label: label, source: host.dataset.src, section: host.dataset.sec,
      line: host.dataset.line ? Number(host.dataset.line) : undefined, repo: host.dataset.repo, page: host.dataset.page || c.page,
      pageUrl: location.href.split("#")[0] + "#" + encodeURIComponent(label) });
    const links = host.matches("a[data-fa-link]") ? [host] : host.querySelectorAll("a[data-fa-link]");
    // Only this host's own links: a nested host (a Lean link inside a block's row) fills itself.
    for (const a of links) if ((a === host || a.closest("[data-src]") === host) && u[a.dataset.faLink]) a.href = u[a.dataset.faLink];
  };
  const fill = (root) => { for (const h of (root || document).querySelectorAll("[data-src], a[data-fa-link]")) ready(h); };
  // A page that learns its repository later (the folio site reads it from its outline) says so here.
  const configure = (c) => { cfg = c; };
  window.faEditLinks = { urls: faBlockUrls, fill: fill, configure: configure };
  for (const ev of ["pointerover", "focusin", "touchstart"])
    document.addEventListener(ev, (e) => { const h = e.target.closest && e.target.closest("[data-src], a[data-fa-link]"); if (h) ready(h); }, { passive: true });
})();`;

/** The published asset, `cat-harness/docs/assets/js/edit-links.js`: the runtime, as a file. A test holds them equal. */
export function editLinksAsset(): string {
  return `/*
 * edit-links.js: the "edit on GitHub" and "feedback" links of every page,
 * built in the browser from one recipe. GENERATED from
 * cat-harness/src/core/edit-links.ts (EDIT_LINKS_RUNTIME); do not edit here.
 * cat-harness/src/core/tests/edit-links.test.ts fails if the two differ.
 */
${EDIT_LINKS_RUNTIME}
`;
}

/** One block's links in the compact form: facts as data, hrefs filled by the runtime. */
export function compactActionsHtml(b: BlockContext): string {
  return (
    `<span class="block-actions" data-block="${esc(b.label)}" data-src="${esc(b.source)}"${b.section ? ` data-sec="${esc(b.section)}"` : ""}${b.repo ? ` data-repo="${esc(b.repo)}"` : ""}>` +
    `<a class="ba-edit" data-fa-link="edit" title="Edit this block's source on GitHub">✎ edit</a>` +
    `<a class="ba-feedback" data-fa-link="feedback" title="Give feedback on this block (opens a GitHub issue)">📣 feedback</a>` +
    `</span>`
  );
}

/**
 * One link, for a generator that shows a single "✎ Edit" (or source, or
 * feedback) beside an item. Edit and source keep a plain href as the
 * no-JavaScript fallback; the runtime replaces it from the shared recipe.
 */
export function editLinkHtml(
  cfg: BlockActionsConfig,
  o: { source: string; kind?: "edit" | "source" | "feedback"; text?: string; label?: string; line?: number; repo?: string; className?: string },
): string {
  const kind = o.kind ?? "edit";
  const fallback = kind === "edit" ? editUrl(cfg, o.source, o.repo) : kind === "source" ? sourceUrl(cfg, o.source, o.line, o.repo) : undefined;
  const text = o.text ?? (kind === "edit" ? "✎ Edit" : kind === "source" ? "Source" : "📣 Feedback");
  return (
    `<a class="${o.className ?? "fa-edit-link"}" data-fa-link="${kind}" data-src="${esc(o.source)}"` +
    `${o.label ? ` data-block="${esc(o.label)}"` : ""}${o.line ? ` data-line="${o.line}"` : ""}${o.repo ? ` data-repo="${esc(o.repo)}"` : ""}` +
    `${fallback ? ` href="${esc(fallback)}"` : ""}>${esc(text)}</a>`
  );
}

/** The runtime and its configuration, inline, for a page outside the docs site. */
export function compactActionsScript(cfg: BlockActionsConfig, page?: string): string {
  const c = JSON.stringify({ ...cfg, ...(page ? { page } : {}) }).replace(/</g, "\\u003c");
  return `<script type="application/json" id="fa-edit-cfg">${c}</script>
<script>
${EDIT_LINKS_RUNTIME}
</script>`;
}

export const BLOCK_ACTIONS_CSS = `
.block-actions { float:right; font-size:.75rem; margin-left:.6rem; opacity:.55; white-space:nowrap; }
.block-actions:hover, .block-actions:focus-within { opacity:1; }
.block-actions a { text-decoration:none; margin-left:.5rem; }
.block-actions .ba-existing { margin-left:.5rem; }
`;

/**
 * Insert each block's links right after its anchor (`<a id="<label>"></a>`,
 * which the document build emits before every labelled block). A label with
 * no anchor on the page is skipped; the count of inserted blocks is returned
 * so a build can report it.
 */
export function injectBlockActions(
  html: string,
  blocks: Iterable<BlockContext>,
  cfg: BlockActionsConfig,
  opts: { compact?: boolean } = {},
): { html: string; inserted: number } {
  if (!cfg.repo) return { html, inserted: 0 };
  let out = html;
  let inserted = 0;
  let page: string | undefined;
  for (const b of blocks) {
    const anchor = new RegExp(`(<a id="${b.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*>\\s*</a>)`);
    if (!anchor.test(out)) continue;
    out = out.replace(anchor, `$1${opts.compact ? compactActionsHtml(b) : blockActionsHtml(cfg, b)}`);
    if (page === undefined) page = b.page;
    inserted++;
  }
  if (inserted) out = out.replace("</head>", `<style>${BLOCK_ACTIONS_CSS}</style></head>`);
  if (inserted && opts.compact) out = out.replace("</body>", `${compactActionsScript(cfg, page)}</body>`);
  return { html: out, inserted };
}

/** `bun run cat-harness/src/core/edit-links.ts --write-asset` regenerates the published runtime. */
if (import.meta.main && process.argv.includes("--write-asset")) {
  const { writeFileSync } = await import("node:fs");
  const out = join(import.meta.dir, "..", "..", "docs", "assets", "js", "edit-links.js");
  writeFileSync(out, editLinksAsset());
  console.error(`✓ wrote ${out}`);
}

/**
 * The single-link form as Markdown, for a generator that writes kramdown:
 * `[text](plain href){: .class data-fa-link=… data-src=… }`. The plain href is
 * the no-JS fallback; edit-links.js replaces it from the shared recipe.
 */
export function markdownEditLink(
  cfg: BlockActionsConfig,
  o: { source: string; kind?: "edit" | "source"; text?: string; className?: string; title?: string; line?: number; repo?: string },
): string {
  const kind = o.kind ?? "edit";
  const href = kind === "edit" ? editUrl(cfg, o.source, o.repo) : sourceUrl(cfg, o.source, o.line, o.repo);
  const text = o.text ?? (kind === "edit" ? "✎ Edit" : "Source");
  if (!href) return text;
  const repo = o.repo ?? cfg.repo;
  const attrs = [
    o.className ? `.${o.className}` : "",
    o.title ? `title="${o.title.replace(/"/g, "&quot;")}"` : "",
    `data-fa-link="${kind}"`,
    `data-src="${esc(o.source)}"`,
    repo ? `data-repo="${esc(repo)}"` : "",
    o.line ? `data-line="${o.line}"` : "",
  ].filter(Boolean);
  return `[${text}](${href}){: ${attrs.join(" ")} }`;
}

/** `owner/repo` for this checkout's GitHub origin, else the given fallback: what a generator's links name. */
export function repoOf(repoWebUrl: string | undefined, fallback = "litlfred/folio-assistant"): string {
  return repoWebUrl?.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/)?.[1] ?? fallback;
}
