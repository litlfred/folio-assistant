/**
 * block-actions — every rendered block links back to where it can be changed:
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
export function editUrl(cfg: BlockActionsConfig, source: string): string | undefined {
  if (!cfg.repo) return undefined;
  return `https://github.com/${cfg.repo}/edit/${cfg.branch ?? "main"}/${source.split("/").map(enc).join("/")}`;
}

/** The block's source as GitHub shows it. */
export function sourceUrl(cfg: BlockActionsConfig, source: string): string | undefined {
  if (!cfg.repo) return undefined;
  return `https://github.com/${cfg.repo}/blob/${cfg.branch ?? "main"}/${source.split("/").map(enc).join("/")}`;
}

/** The block's address on the published site, when the site's URL is known. */
export function blockPageUrl(cfg: BlockActionsConfig, b: BlockContext): string | undefined {
  if (!cfg.siteUrl || !b.page) return undefined;
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
      `**Source:** ${sourceUrl(cfg, b.source)}`,
      ...(values.url ? [`**On the site:** ${values.url}`] : []),
    ];
    q.set("body", [...facts, "", "**Feedback:**", ""].join("\n"));
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
): { html: string; inserted: number } {
  if (!cfg.repo) return { html, inserted: 0 };
  let out = html;
  let inserted = 0;
  for (const b of blocks) {
    const anchor = new RegExp(`(<a id="${b.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*>\\s*</a>)`);
    if (!anchor.test(out)) continue;
    out = out.replace(anchor, `$1${blockActionsHtml(cfg, b)}`);
    inserted++;
  }
  if (inserted) out = out.replace("</head>", `<style>${BLOCK_ACTIONS_CSS}</style></head>`);
  return { html: out, inserted };
}

/**
 * `bun run folio-assistant-core/scripts/block-actions.ts --repo <folio root> [--block <label>]`
 * prints each block's links as JSON: `{ label, source, section, edit, feedback }`.
 * The `block-actions` Tool invokes this, so an agent can hand a reader the
 * right edit or feedback link for the block under discussion.
 */
if (import.meta.main) {
  const { resolve } = await import("node:path");
  const { defaultBlockActions, documentBlocks, documentManifests } = await import("./build-document-site.js");
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes("--help")) {
    console.log(
      "usage: bun run folio-assistant-core/scripts/block-actions.ts [--repo <folio root>] [--block <label>]\n" +
        "         [--github <owner/repo>] [--edit-branch main] [--issue-template block-feedback.yml] [--site-url <url>]",
    );
    process.exit(0);
  }
  const root = resolve(opt("repo") ?? process.cwd());
  const cfg = defaultBlockActions(root, {
    ...(opt("github") ? { repo: opt("github") } : {}),
    ...(opt("edit-branch") ? { branch: opt("edit-branch") } : {}),
    ...(opt("issue-template") ? { template: opt("issue-template") } : {}),
    ...(opt("site-url") ? { siteUrl: opt("site-url") } : {}),
  });
  if (!cfg.repo) {
    console.error("✗ no GitHub repository: pass --github <owner/repo>, set GITHUB_REPOSITORY, or run in a checkout whose origin is on GitHub");
    process.exit(2);
  }
  const want = opt("block");
  const out = [];
  for (const d of documentManifests(root)) {
    for (const b of await documentBlocks(d.path, root, d.slug)) {
      if (want && b.label !== want) continue;
      out.push({ label: b.label, source: b.source, section: b.section, edit: editUrl(cfg, b.source), feedback: feedbackUrl(cfg, b) });
    }
  }
  if (want && out.length === 0) {
    console.error(`✗ no block labelled ${want}`);
    process.exit(1);
  }
  console.log(JSON.stringify(out, null, 1));
  console.error(`✓ ${out.length} block(s), ${cfg.template ? `issue form ${cfg.template}` : "no issue form: plain issues"}`);
}
