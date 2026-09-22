#!/usr/bin/env bun
/**
 * The handler namespace's own index — `<site>/<handler>/index.html`.
 *
 * @module scripts/gen-handler-index
 * @graphNode none — a generator over the tiles model, not a schema itself
 *
 * ## Why this page exists, and what it replaced
 *
 * `/<handler>/` is where this instance publishes every graph it renders, as
 * `<base>/<handler>/<kind>/[<subject>/]`. Four generators write into it and
 * **none of them owned its root**, so the root held one AUTHORED page: prose
 * about the platform, sitting in a namespace that otherwise means "renderings
 * by this handler".
 *
 * Two path rules meet there. `<base>/<handler>/<kind>/` is the machinery
 * rendering something; `<base>/<instance>/` is an instance presenting itself,
 * which is how who-iris mocks the IRIS website. This instance is both, so the
 * rules collided at exactly one path, and the owner settled it on 2026-09-21:
 * **the handler wins**. The authored page moved to `docs/platform.md` and
 * this generated index took the route. Bean `8h42`.
 *
 * ## It is not cosmetic — a navbar tile points here
 *
 * `siteLinks` publishes the `kg` tile as `{ path: "/<stub>/", target:
 * "<stub>/index.html" }`, so the authored page was also the KG viewer's
 * landing. Moving it without writing this would have left that tile dead for
 * every reader, and **nothing local would have said so**: `verifySiteLinks`
 * reports `unknown` rather than `dead` when the site is not built, which is
 * correct (this repository is cloned far more often than it is built) and
 * means the breakage surfaces only in production.
 *
 * ## Derived from the tiles model, not from the filesystem
 *
 * `harnessTiles` already computes, per instance, which declared kinds have a
 * published path — it is what the navbar and the board read. Rendering the
 * same model here means the page and the navbar **cannot disagree**, and the
 * generator is order-independent: it does not need the other four to have run
 * first, because a `coverage.visualiser` declaration is what makes a kind
 * appear, not a file landing on disk.
 *
 * A kind whose declaration names no published path is shown as **declared,
 * not published** rather than omitted. That is the `dh4f` distinction: a
 * reader who cannot tell "nothing renders this" from "this does not exist"
 * learns nothing from the gap.
 *
 * Usage:
 *   bun run handler:index          # write
 *   bun run handler:index:check    # fail if stale
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { harnessTiles, type HarnessTile } from "./harness-tiles.ts";
import { readDeclaration, repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";

const ROOT = join(import.meta.dir, "..");
const check = process.argv.includes("--check");

/**
 * The page's FILENAME, which is deliberately not `index.md`.
 *
 * Its route is `/<handler>/` and Jekyll gets that from the `permalink` in the
 * front matter, so the file may be called anything — and it must be, because
 * `docs/index.md` and `docs/<handler>/index.md` sharing the stem `index` is
 * the collision bean `8h42` asks to be **gone rather than contained**.
 *
 * It was contained, and the containment was paid for: `resolvePoSources`
 * finds a block-level PO by bare stem, so the second `index` resolved to the
 * first one's catalogue and the first run of the page sweep wrote five locales
 * of "translation-coverage: fail, 2%" about a page nobody had ever translated
 * (PR #691). The fix then was to make a PO claim its subject through its own
 * gettext `#:` references. Replacing the authored `index.md` with a GENERATED
 * one at the same path would have rebuilt the collision under the repair.
 */
const PAGE_FILE = "published-graphs.md";

/** One row of the page: an instance, and one kind this handler renders for it. */
export interface HandlerRow {
  instance: string;
  label: string;
  kind: string;
  /** Site-root-relative; absent when the kind is declared and nothing publishes it. */
  path?: string;
}

/**
 * Every (instance, kind) this handler renders, sorted by kind then instance.
 *
 * By KIND first, because the question a reader arrives with is "where are the
 * schemas" far more often than "what does who-iris have" — and the navbar
 * already answers the second, one tile per instance.
 */
export function handlerRows(tiles: readonly HarnessTile[]): HandlerRow[] {
  const out: HandlerRow[] = [];
  for (const t of tiles) {
    for (const v of t.visualisations) {
      out.push({ instance: t.name, label: t.label, kind: v.kind, path: v.path });
    }
  }
  return out.sort((a, b) => a.kind.localeCompare(b.kind) || a.instance.localeCompare(b.instance));
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The page.
 *
 * A Jekyll page with front matter rather than a standalone HTML document, so
 * it inherits the site's theme, navbar and locale chrome — unlike the four
 * viewers, which are zero-dependency apps fetching a projection. This one
 * renders a list that is already computed; it needs no client at all.
 */
export function handlerIndexPage(handler: string, rows: readonly HandlerRow[]): string {
  const byKind = new Map<string, HandlerRow[]>();
  for (const r of rows) {
    const list = byKind.get(r.kind) ?? byKind.set(r.kind, []).get(r.kind)!;
    list.push(r);
  }

  // MARKDOWN, not raw HTML blocks — and that distinction was measured rather
  // than assumed. An earlier draft emitted `<h3><code>kind</code></h3>`, which
  // kramdown passes through untouched and therefore assigns NO heading id. The
  // just-the-docs anchor-heading include then fell back to the page's own id,
  // so all 22 kind headings rendered `href="#published-graphs"` — one anchor
  // for every section, and an `aria-labelledby` pointing at a heading that is
  // not the one being labelled. A local Jekyll build is the only thing that
  // shows it; the generator's own output looks right. Bean `gjli` is the
  // standing rule ("ALL UI must follow accessibility guidelines").
  const sections = [...byKind.entries()].map(([kind, list]) => {
    const items = list
      .map((r) =>
        r.path === undefined
          ? `- ${esc(r.label)} — *declared, not published*`
          : `- [${esc(r.label)}]({{ '${esc(r.path)}' | relative_url }})`,
      )
      .join("\n");
    const published = list.filter((r) => r.path !== undefined).length;
    return `### \`${esc(kind)}\`\n\n${published} of ${list.length} published.\n{: .fa-hx-dim }\n\n${items}`;
  });

  return `---
layout: default
title: Published graphs
lang: en
description: "Every graph this handler renders, by kind and by the instance whose material it shows."
nav_exclude: true
permalink: /${handler}/
---

<!--
  GENERATED by scripts/gen-handler-index.ts. Do not edit.

  This route is the HANDLER NAMESPACE: \`<base>/<handler>/<kind>/[<subject>/]\`,
  where the handler segment is read from this instance's declared \`name\`. The
  authored page that used to sit here moved to \`docs/platform.md\` on
  2026-09-21, when the owner settled that the handler owns the path. Bean \`8h42\`.

  The rows come from \`harnessTiles\`, the same model the navbar reads, so this
  page and the navbar cannot disagree about what is published.
-->

# Published graphs
{: .no_toc }

Every graph this handler renders, by kind and by the instance whose material it
shows. The handler segment of each route is this instance's declared name; the
subject segment, where there is one, is the instance the material belongs to.

A kind listed as **declared, not published** is one an instance declared and
nothing renders yet. It is shown rather than omitted: "nothing renders this" and
"this does not exist" are different answers, and a gap says neither.

${sections.join("\n\n")}

---

Looking for what the platform *is* rather than what it publishes?
[The platform]({{ '/platform.html' | relative_url }}) carries the actor, role,
process and skill model.
`;
}

let stale = 0;
function emit(path: string, content: string): void {
  if (check) {
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current === content) return;
    console.error(`  ✗ ${path} ${existsSync(path) ? "is stale" : "is missing"}`);
    stale++;
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`  ✓ ${path}`);
}

if (import.meta.main) {
  const repoRoot = repoRootFor(ROOT);
  const decl = readDeclaration(ROOT);
  if (!decl?.name) {
    // Not a pass. An instance with no declared name has no handler segment, so
    // there is no namespace to index — and saying so is different from saying
    // the index is fine.
    console.log("  · this instance declares no name — no handler namespace to index");
    process.exit(0);
  }
  const names = readdirSync(repoRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "node_modules")
    .map((d) => d.name)
    .sort();
  const rows = handlerRows(harnessTiles(repoRoot, ROOT, names));
  const site = join(ROOT, siteDirFor(ROOT));
  const out = join(site, decl.name, PAGE_FILE);
  emit(out, handlerIndexPage(decl.name, rows));

  if (!check) {
    const published = rows.filter((r) => r.path !== undefined).length;
    console.log(
      `  ${rows.length} (instance, kind) pair(s), ${published} published, ` +
        `${new Set(rows.map((r) => r.kind)).size} kind(s) — ` +
        `at /${decl.name}/ (${relative(repoRoot, out)})`,
    );
  }
  if (stale > 0) {
    console.error(`\n${stale} artefact(s) stale — run \`bun run handler:index\``);
    process.exit(1);
  }
}
