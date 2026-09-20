#!/usr/bin/env bun
/**
 * Three store defects `beans check` cannot see, because none of them is a link.
 *
 * Bean `sfhr`, measured 2026-09-20 with `beans check` reporting *"No link
 * issues found"* over the same store:
 *
 * 1. **`70c7`** — `in-progress` with an **empty body**. Front matter only. A
 *    claimed item that says nothing about what it is, which is the one thing a
 *    sibling reading the store needs.
 * 2. **`52dz`** — `title: |-` continued into the body and swallowed the first
 *    ~10 lines, including a `## Done when` with three unchecked boxes. It read
 *    as a bean with no acceptance criteria; it had three.
 * 3. **`nvbr`** — *"blocked on bean `fsch`"* in prose. `fsch` is `scrapped`.
 *    The block can never lift, and nothing said so.
 *
 * ## Why prose, when front-matter links are already checked
 *
 * Because that is where blockers are actually written. `beans` has no blocker
 * field, so [`bean-blocking.md`](../skills/folio-core/bean-blocking.md) puts
 * them in the body — and the CLI's link check covers front matter. The one
 * place the convention puts the fact is the one place nothing read.
 *
 * ## What it does NOT do
 *
 * **It does not repair anything.** `sfhr`'s own Done-when says the three beans
 * above are repaired *by their owners* and that the bean does not edit them.
 * Same rule as `bun run health`: four of its five checks are about artefacts
 * accumulating and every finding names something a person does.
 *
 * **It ignores closed beans**, like `check:bean-parents` and for the same
 * reason: a finished bean is history, and back-filling it changes no plan.
 * A `## Done when` is not required either — plenty of good beans are a
 * paragraph — the requirement is that the body EXISTS.
 *
 * Exit: 0 clean (or no store), 1 a real defect, 2 could not check.
 *
 * @module folio-assistant/scripts/check-bean-bodies
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRootFor } from "../schemas/cat-harness.js";

import {
  CLOSED_STATUSES,
  OPEN_STATUSES,
  isFoldedTitle,
  readBeanFiles,
  type BeanFile,
} from "./bean-store-read.ts";

/**
 * A blocker written the way the corpus actually writes one:
 * **`Blocked on bean \`fsch\``**, **`Blocked on \`folio-assistant-68dt\``**.
 *
 * Two constraints, and both were added after MEASURING the looser form against
 * the store. A bare word is not a reference — permitting one matched *"not
 * blocked on anything but the question"*, *"blocked on there being a
 * dataset"*, *"blocked on effort"* and four more, none of them a bean. So the
 * id must be **in a code span** and must be **id-shaped**: the store's
 * `id_length` is 4, with the instance prefix optional.
 */
const BLOCKER = /(not\s+)?blocked\s+on\s+(?:bean\s+)?`((?:[a-z0-9-]+-)?[a-z0-9]{4})`/gi;

/**
 * Is the match inside a quotation on its own line?
 *
 * **A quotation is not an assertion**, and the distinction is not academic:
 * `sfhr` — the bean this check was written for — contains the sentence
 * *"`nvbr` is \"blocked on bean `fsch`\", which is `scrapped`"*. Reporting
 * that as `sfhr`'s own dead blocker would make the check's first finding a
 * misreading of its own specification.
 *
 * Counted rather than pattern-matched: an odd number of unescaped `"` before
 * the match on that line means the match sits inside one.
 */
function insideQuotation(line: string, at: number): boolean {
  let quotes = 0;
  for (let i = 0; i < at && i < line.length; i++) {
    if (line[i] === '"' && line[i - 1] !== "\\") quotes++;
  }
  return quotes % 2 === 1;
}

export interface BeanBodyProblem {
  id: string;
  kind: "empty-body" | "folded-title" | "dead-blocker";
  detail: string;
}

export interface BeanBodyReport {
  store: boolean;
  examined: number;
  /** Defects NOT in the baseline. These fail. */
  problems: BeanBodyProblem[];
  /** Defects the baseline already records. Listed, never failed. */
  outstanding: BeanBodyProblem[];
  /** Baseline entries nothing matched — repaired, and the baseline can shrink. */
  stale: string[];
}

/**
 * The defects this store had when the check was written.
 *
 * Same move `check:bean-parents` documents: *"it locks in a property the corpus
 * HAS rather than demanding work to reach one"*. Here the corpus does NOT have
 * the property — eight open beans carry one of the three defects — and `sfhr`
 * is explicit that they are **repaired by their owners**, not by whoever runs
 * this. Failing on them would make the check unrunnable and someone would
 * delete it; hiding them would report a clean sweep over the very beans it was
 * written for.
 *
 * So they are listed, by `<id>:<kind>`, and a **new** one fails. An entry that
 * stops matching is reported as stale so the baseline shrinks as the backlog
 * is worked, rather than fossilising.
 */
export const BASELINE_FILE = "cat-harness/scripts/bean-bodies-baseline.json";

function loadBaseline(root: string): Set<string> {
  const f = resolve(root, BASELINE_FILE);
  if (!existsSync(f)) return new Set();
  const raw = JSON.parse(readFileSync(f, "utf-8")) as { known?: string[] };
  return new Set(raw.known ?? []);
}

/** Resolve a loosely-written id against the store, archive included. */
function lookup(all: BeanFile[], ref: string): BeanFile | undefined {
  return all.find((b) => b.id === ref) ?? all.find((b) => b.id.endsWith(`-${ref}`));
}

export function checkBeanBodies(root: string): BeanBodyReport {
  const all = readBeanFiles(root);
  if (all === null) return { store: false, examined: 0, problems: [], outstanding: [], stale: [] };
  const open = all.filter((b) => !b.archived && OPEN_STATUSES.has(b.status));
  const found: BeanBodyProblem[] = [];
  const problems = found;

  for (const b of open) {
    if (b.body.trim() === "") {
      problems.push({
        id: b.id,
        kind: "empty-body",
        detail: `\`${b.status}\` with front matter and nothing else — a sibling reading the store learns nothing about it`,
      });
    }
    if (isFoldedTitle(b.frontMatter)) {
      problems.push({
        id: b.id,
        kind: "folded-title",
        detail: "`title:` is a YAML block scalar, so it continues into the body and takes whatever followed it (this is how `52dz` lost three Done-when boxes)",
      });
    }
    for (const line of b.body.split("\n")) {
      for (const m of line.matchAll(BLOCKER)) {
      // "NOT blocked on x" asserts the opposite; `1lfx` says exactly that.
      if (m[1]) continue;
      if (insideQuotation(line, m.index ?? 0)) continue;
      const ref = m[2]!;
      const target = lookup(all, ref);
      if (!target) {
        problems.push({ id: b.id, kind: "dead-blocker", detail: `"blocked on \`${ref}\`" — no such bean in the store or its archive` });
      } else if (CLOSED_STATUSES.has(target.status)) {
        problems.push({
          id: b.id,
          kind: "dead-blocker",
          detail: `"blocked on \`${ref}\`" — that bean is \`${target.status}\`, so the block can never lift on its own`,
        });
      }
      }
    }
  }
  const baseline = loadBaseline(root);
  const key = (p: BeanBodyProblem) => `${p.id}:${p.kind}`;
  const matched = new Set(found.map(key).filter((k) => baseline.has(k)));
  return {
    store: true,
    examined: open.length,
    problems: found.filter((p) => !baseline.has(key(p))),
    outstanding: found.filter((p) => baseline.has(key(p))),
    stale: [...baseline].filter((k) => !matched.has(k)).sort(),
  };
}

function formatReport(r: BeanBodyReport): string {
  if (!r.store) return "Bean bodies\n  · no bean store — nothing to check";
  const out = [`Bean bodies (${r.examined} open, ${r.outstanding.length} baselined)`];
  if (r.problems.length === 0) {
    out.push("  ✓ no NEW defect — every open bean has a body, a one-line title, and no blocker on a closed bean");
  }
  for (const p of r.problems) out.push(`  ✗ ${p.id} [${p.kind}]: ${p.detail}`);
  for (const p of r.outstanding) out.push(`  · outstanding ${p.id} [${p.kind}]: ${p.detail}`);
  for (const k of r.stale) out.push(`  · baseline entry ${k} no longer matches — repaired; remove it from ${BASELINE_FILE}`);
  out.push("");
  out.push("  Outstanding defects are repaired by the bean's OWNER, not by this check and not by whoever ran it.");
  out.push("  A blocker that can never lift is withdrawn with its reason — see skills/folio-core/bean-blocking.md.");
  return out.join("\n");
}

if (import.meta.main) {
  let report: BeanBodyReport;
  try {
    // The REPOSITORY root, not the cwd: `beans/` is repository-scoped, and a
    // run from anywhere else reads "no store" — a clean-looking answer to a
    // question asked in the wrong place.
    report = checkBeanBodies(repoRootFor(resolve(import.meta.dir, "..")));
  } catch (e) {
    console.error(`Could not check bean bodies: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.problems.length ? 1 : 0);
}
