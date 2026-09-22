#!/usr/bin/env bun
/**
 * A Liquid interpolation feeding a URL attribute resolves, or says it cannot
 * be told. Bean `blv9`.
 *
 * ## The defect class
 *
 * `docs/_config.yml` sets `baseurl: "/folio-assistant"` — a PROJECT Pages
 * site — and `sync-docs-harness.ts`'s `siteRelative()` DELIBERATELY writes a
 * site-root-absolute path into `docs/_data/harness.json`, because that data
 * file has to stay baseurl-agnostic for a downstream instance at a different
 * baseurl. A template that interpolates such a path without `| relative_url`
 * emits `/assets/x.webp` where the site serves
 * `/folio-assistant/assets/x.webp`, and the asset 404s.
 *
 * That is the FIFTH shape of one class in this repository — a link-shaped
 * value that does not dereference — and every previous instance was found by
 * a person asking whether a URL resolved, never by a test. `readme-links.ts`
 * does this for README links against a real `git ls-tree`; nothing did it for
 * the templates.
 *
 * ## Three states, because only one of them is decidable
 *
 * The bean specified *"flag any that resolve to a site-root-absolute path
 * without a filter"*. **Only a LITERAL can be judged that way.** A variable
 * (`st.art.card.src`, `t.href`) holds a value the template cannot see, and
 * the corpus contains both kinds at once:
 *
 * | | |
 * |---|---|
 * | `'/assets/js/docs-ui.js'` | literal, site-root-absolute — the filter is REQUIRED |
 * | `st.art.card.src` | variable, site-root-absolute in practice — cannot be seen here |
 * | `st.viewHref` | variable holding `https://…/blob/…` — the filter would BREAK it |
 *
 * Measured 2026-09-22, and the last row is why a naive rule is wrong rather
 * than merely imprecise: `viewHref`/`editHref` come from
 * `schemas/cat-harness.ts` as `${repoUrl}/blob/${branch}/${path}`. A check
 * that demanded a filter everywhere would report two working links as
 * defects, and the obvious "fix" would 404 them both.
 *
 * So: a literal is **judged**, a variable is **declined**, and the declined
 * ones are COUNTED and listed rather than passed over in silence — the same
 * third state `check:partition` names in its own output, and the same reason:
 * an unexaminable case and an examined-clean case must not look alike.
 *
 * @module cat-harness/scripts/check-docs-templates
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../..");

/** `src=`, `srcset=` and `href=` whose value is a single interpolation. */
const URL_ATTR = /(src|srcset|href)\s*=\s*"(\{\{[^"]*\}\})"/g;

/** The filters that convert a site-root path into a served one. */
const RESOLVING = /\|\s*(relative_url|absolute_url)\b/;

/** A quoted literal at the head of the interpolation: `{{ '/assets/x' | … }}`. */
const LITERAL_HEAD = /^\{\{-?\s*(['"])(.*?)\1/;

export type Verdict = "ok" | "unresolved-literal" | "declined";

export interface Finding {
  file: string;
  line: number;
  attr: string;
  expr: string;
  verdict: Verdict;
}

/**
 * Judge one interpolation.
 *
 * A literal that does NOT start with `/` is already relative and needs no
 * filter — `href="{{ 'mailto:…' }}"` and a bare `#anchor` are both fine.
 */
export function judge(expr: string): Verdict {
  if (RESOLVING.test(expr)) return "ok";
  const lit = LITERAL_HEAD.exec(expr);
  if (lit === null) return "declined";
  return lit[2]!.startsWith("/") ? "unresolved-literal" : "ok";
}

function templates(root: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e === "node_modules" || e === ".git") continue;
      const p = join(d, e);
      if (statSync(p).isDirectory()) {
        if (e === "_includes" || e === "_layouts") {
          for (const f of readdirSync(p)) if (f.endsWith(".html")) out.push(join(p, f));
        } else {
          walk(p);
        }
      }
    }
  };
  walk(root);
  return out.sort();
}

export function checkDocsTemplates(root = REPO_ROOT): { files: number; findings: Finding[] } {
  const files = templates(root);
  const findings: Finding[] = [];
  for (const abs of files) {
    const rel = relative(root, abs).split("\\").join("/");
    readFileSync(abs, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const m of line.matchAll(URL_ATTR)) {
          const expr = m[2]!;
          findings.push({ file: rel, line: i + 1, attr: m[1]!, expr, verdict: judge(expr) });
        }
      });
  }
  return { files: files.length, findings };
}

/** The verdicts that FAIL — a helper so the report and the exit code agree. */
export function unresolved(f: Finding[]): Finding[] {
  return f.filter((x) => x.verdict === "unresolved-literal");
}

if (import.meta.main) {
  const { files, findings } = checkDocsTemplates();
  const bad = unresolved(findings);
  const declined = findings.filter((f) => f.verdict === "declined");

  // EXAMINED NOTHING is not a pass. No templates at all means the walk broke
  // or the layout moved, and either way nothing was checked.
  if (files === 0) {
    console.error("Docs templates: ? EXAMINED NOTHING — no _includes/_layouts found. Not a pass.");
    process.exit(2);
  }

  console.log(`Docs templates (${files} file(s), ${findings.length} URL interpolation(s))`);
  if (bad.length === 0) {
    console.log(`  ✓ every LITERAL site-root path carries \`| relative_url\``);
  }
  for (const f of bad) {
    console.log(`  ✗ ${f.file}:${f.line}  ${f.attr}=${f.expr}`);
    console.log(`      a site-root-absolute literal without \`| relative_url\` — under`);
    console.log(`      baseurl "${"/folio-assistant"}" this emits a path the site does not serve.`);
  }
  if (declined.length > 0) {
    console.log(`\n  ~ ${declined.length} DECLINED TO JUDGE — a variable, whose value is not visible here:`);
    for (const f of declined) console.log(`      ${f.file}:${f.line}  ${f.attr}=${f.expr}`);
    console.log(`    Listed rather than passed over: an unexaminable case and an`);
    console.log(`    examined-clean one must not look alike. Some of these MUST NOT`);
    console.log(`    carry the filter — \`viewHref\`/\`editHref\` hold absolute forge URLs.`);
  }
  process.exit(bad.length > 0 ? 1 : 0);
}
