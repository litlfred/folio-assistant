#!/usr/bin/env bun
/**
 * Every page an instance publishes as a standalone replica carries the folio
 * mount. Bean `jpjt`, F8/F9 on issue #796.
 *
 * ## What it is for
 *
 * The owner's requirement is **consistency**, not quality:
 *
 * > who-iris, smart-* etc are content libraries a user is browsing and their
 * > "folio" from the cat-harness is consistent across them.
 *
 * `board-windows` states the test that follows from it — *"the test is not
 * 'is this folio good' but 'is this the same folio'"*. A reader moving
 * between libraries must find the same surface, so **a page missing the mount
 * is a reader who silently loses their folio when they click a link.** That is
 * exactly the failure nothing reports: the page renders, the library works,
 * and the only symptom is an absence.
 *
 * `folio-mount.ts` makes the mount one line for a generator to emit. This is
 * what makes emitting it not optional.
 *
 * ## WHY THE SCOPE IS DECLARED AND NOT INFERRED
 *
 * The obvious gate — *every standalone HTML document in the repository* —
 * was measured before being rejected: **67 HTML files, 60 of them standalone,
 * spread over `cat-harness/docs` (38), `who-iris` (11+1), `cat-harness/ui`
 * (4), `_kg` fixtures (5), `cat-harness/viewer` (1)**. Most have no business
 * carrying a folio: a fixture, the viewer shell, and the generated
 * visualisation pages whose folio is a separate piece of work. A gate whose
 * subject is wrong fails honest pages and gets exemptions bolted on until it
 * asserts nothing.
 *
 * So an instance **opts in**, in its own `<instance>.json`:
 *
 * ```json
 * "folioMount": {
 *   "roots": ["library/", "docs/"],
 *   "exempt": [{ "path": "uploads/", "reason": "captured source, not ours to rewrite" }]
 * }
 * ```
 *
 * An instance with no `folioMount` block is **not configured**, which is a
 * third state and not a pass — it is reported by name on every run, so an
 * instance that grows replica pages and never opts in is visible rather than
 * silently clean. This is `check-harness-dirs`'s shape and `check-ci-health`'s
 * rule: *could not determine is never rendered as clean.*
 *
 * The roots are relative to the instance, and the instance owns them, because
 * a route is a fact about that instance. A list of library directories in a
 * platform gate would be the platform knowing about one library — the
 * boundary this repository exists to keep.
 *
 * ## EXEMPTIONS CARRY REASONS, AND A STALE ONE FAILS
 *
 * `who-iris/uploads/` holds one captured IRIS page — the ingested source the
 * replica is generated *from*. Injecting into it would corrupt the capture,
 * which is the artefact ingestion exists to preserve. So it is exempt **with
 * that reason printed on every clean run**, the shape `check-invocation-parity`
 * and `check-avatar-instances` use.
 *
 * An exemption naming a path that holds no standalone pages is itself a
 * finding: an exemption outliving its subject is how a gate quietly stops
 * asserting the thing it was written for.
 *
 * ## What counts as a page
 *
 * A file ending `.html` that contains a doctype. A fragment included into
 * another document is not a page and cannot carry a mount, so counting it
 * would make the gate fail on files that are correct.
 *
 * Usage:
 *   bun run check:folio-mount
 *   bun run check:folio-mount -- --json
 *
 * Exit: 0 every declared page is mounted, 1 a page is missing it or an
 * exemption is stale, 2 could not check.
 *
 * @module scripts/check-folio-mount
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { hasMount } from "./folio-mount.ts";
import { repoRootFor } from "../schemas/cat-harness.js";

/**
 * Resolved from this file rather than from `process.cwd()`.
 *
 * `check-avatar-instances` shipped with `repoRootFor(process.cwd())` and, run
 * from the repository root, walked UP to the parent, found no instances, and
 * reported a clean run over nothing. That is `dh4f` and it is avoided here by
 * construction rather than by remembering.
 */
const REPO = repoRootFor(resolve(import.meta.dir, ".."));

export interface MountExemption {
  path: string;
  reason: string;
}

export interface FolioMountDecl {
  roots: string[];
  exempt?: MountExemption[];
}

export interface InstanceReport {
  instance: string;
  /** `null` when the instance declares no `folioMount` block — NOT a pass. */
  decl: FolioMountDecl | null;
  mounted: string[];
  missing: string[];
  exemptUsed: MountExemption[];
  staleExemptions: MountExemption[];
}

/** Every `*.html` under `dir`, repo-relative, or `[]` when it is absent. */
function htmlUnder(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) htmlUnder(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

/** A standalone document, as opposed to an include. */
function isPage(file: string): boolean {
  return /<!doctype\s+html/i.test(readFileSync(file, "utf-8"));
}

/**
 * The instances this repository holds, by the `*.config.json` at its root —
 * the same key space `check-avatar-instances` reads, so the two checks cannot
 * disagree about what an instance is.
 */
export function instanceNames(repo: string = REPO): string[] {
  return readdirSync(repo)
    .filter((f) => f.endsWith(".config.json"))
    .map((f) => f.slice(0, -".config.json".length))
    .sort();
}

function declarationFor(repo: string, instance: string): FolioMountDecl | null {
  const file = join(repo, instance, `${instance}.json`);
  if (!existsSync(file)) return null;
  const raw = JSON.parse(readFileSync(file, "utf-8")) as { folioMount?: FolioMountDecl };
  return raw.folioMount ?? null;
}

export function reportFor(repo: string, instance: string): InstanceReport {
  const decl = declarationFor(repo, instance);
  const base: InstanceReport = {
    instance,
    decl,
    mounted: [],
    missing: [],
    exemptUsed: [],
    staleExemptions: [],
  };
  if (!decl) return base;

  for (const root of decl.roots) {
    for (const file of htmlUnder(join(repo, instance, root))) {
      if (!isPage(file)) continue;
      const rel = relative(repo, file);
      if (hasMount(readFileSync(file, "utf-8"))) base.mounted.push(rel);
      else base.missing.push(rel);
    }
  }

  for (const ex of decl.exempt ?? []) {
    const pages = htmlUnder(join(repo, instance, ex.path)).filter(isPage);
    if (pages.length > 0) base.exemptUsed.push(ex);
    else base.staleExemptions.push(ex);
  }

  base.mounted.sort();
  base.missing.sort();
  return base;
}

export function report(repo: string = REPO): InstanceReport[] {
  return instanceNames(repo).map((i) => reportFor(repo, i));
}

function main(): void {
  const json = process.argv.includes("--json");
  let reports: InstanceReport[];
  try {
    reports = report();
  } catch (err) {
    console.error(`could not check: ${(err as Error).message}`);
    process.exit(2);
  }

  if (json) {
    console.log(JSON.stringify(reports, null, 2));
  }

  const configured = reports.filter((r) => r.decl);
  const unconfigured = reports.filter((r) => !r.decl);
  const missing = configured.flatMap((r) => r.missing.map((p) => ({ i: r.instance, p })));
  const stale = configured.flatMap((r) => r.staleExemptions.map((e) => ({ i: r.instance, e })));
  const pages = configured.reduce((n, r) => n + r.mounted.length + r.missing.length, 0);

  if (!json) {
    console.log(`Folio mount (${configured.length} instance(s) opted in, ${pages} page(s))`);

    for (const r of configured) {
      if (r.missing.length === 0) {
        console.log(`  ✓ ${r.instance}: ${r.mounted.length} page(s) carry the folio mount`);
      } else {
        console.log(`  ✗ ${r.instance}: ${r.missing.length} of ${r.mounted.length + r.missing.length} page(s) carry NO folio mount`);
        for (const p of r.missing) console.log(`      ${p}`);
      }
      for (const e of r.exemptUsed) {
        console.log(`  · ${r.instance} exempt ${e.path} — ${e.reason}`);
      }
      for (const e of r.staleExemptions) {
        console.log(`  ✗ ${r.instance} exempt ${e.path} — STALE: it holds no pages. ${e.reason}`);
      }
    }

    // NOT a pass. An instance that grows replica pages and never opts in is
    // exactly the reader who loses their folio, so it is named every run.
    for (const r of unconfigured) {
      console.log(`  · ${r.instance}: no \`folioMount\` block — not configured, not checked`);
    }

    if (missing.length === 0 && stale.length === 0) {
      console.log("\n  A reader carries the same folio across every declared page.");
    } else {
      console.log(
        "\n  A page with no mount is a reader whose folio disappears when they follow a link.\n" +
          "  Emit it with `fragment()` from `cat-harness/scripts/folio-mount.ts`.",
      );
    }
  }

  process.exit(missing.length + stale.length > 0 ? 1 : 0);
}

if (import.meta.main) main();
