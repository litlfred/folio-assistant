#!/usr/bin/env bun
/**
 * A forge field that goes stale is never named in advice **unqualified**.
 *
 * Bean `fx5r`'s last open item, and it is the only one of its five that a test
 * could not close. The other four were fixes to particular strings; this one
 * asks for the general rule, in the bean's own words:
 *
 * > *no advice string names `mergeable_state` approvingly, anywhere*
 *
 * ## What the instance cost, twice
 *
 * `fx5r` measured it: **45 minutes after a PR merged**, `GET /pulls/N` still
 * served that PR's pre-merge `mergeable`, `mergeable_state`, `head.sha` and
 * `updated_at`. Only `merged` went stale-safe. An agent reading the field got
 * a wrong answer carrying the authority of a measurement.
 *
 * PR #1362 fixed the two advice strings in `check-head-has-run.ts`. Four days
 * later `fx5r` recorded that **`.github/workflows/pr-checks-present.yml`
 * carried a third copy**, untouched, because nothing linked them — and it was
 * still being posted to live PRs hours after the fix merged. The drift was
 * PARTIAL, which is the part worth keeping:
 *
 * | | the merge-ref probe (code) | the UNKNOWN advice (prose) |
 * |---|---|---|
 * | `check-head-has-run.ts` | correct | fixed by #1362 |
 * | `pr-checks-present.yml` | correct, line 163 | pre-`fx5r`, line 192 |
 *
 * The code was right in **both** places and the prose in only one. A reader
 * checking whether the fix had landed by grepping for `ls-remote` would have
 * found it twice and concluded the job was done. Two copies fixed by hand
 * leaves the fourth free to appear tomorrow, which is what this gate is for.
 *
 * ## "Approvingly" is not what is measured — QUALIFIED is
 *
 * Reading intent out of prose is what a regex is worst at, and a gate that
 * tried would be wrong in both directions. So the rule is structural and
 * inverts the burden: a mention passes when its neighbourhood **says something
 * about the field's reliability**, and fails when it is bare.
 *
 * That is deliberately wider than "approving". It admits the two shapes that
 * are both legitimate and that a caution-only rule would have to choose
 * between:
 *
 * - a **caution** — *"`unknown` means GitHub has not finished computing it,
 *   not that the PR is fine"*;
 * - a **measured licence** — *"when it is `dirty`, merge the base in"*, which
 *   `yv4z` established and which is sound because `dirty` is the one value
 *   whose falsity costs nothing.
 *
 * What it refuses is the third shape, the one that actually shipped:
 * `mergeable_state` in a list of fields to read, with nothing said. A reader
 * cannot tell from that whether the author knew.
 *
 * ## Default-deny, because an allowlist of SITES rots on every edit
 *
 * A qualifier must be present at the mention. There is no per-line exemption
 * table: a line number is invalidated by the next paragraph inserted above it,
 * and an exemption keyed on a line number that has moved is an exemption
 * protecting the wrong text. Whole PATHS can be declined — see
 * {@link skipPath} — and each declension carries its reason and is COUNTED in
 * the summary, per `check-command-paths`: what a check declines to judge has
 * to stay visible, or its coverage is a guess.
 *
 * ## Why `beans/` is out of scope and that is not a hole
 *
 * A bean is a `state` graph — the record of a measurement, in the past tense,
 * frequently quoting the very string the fix removed. `fx5r` itself names the
 * field eight times, and every one is evidence. Requiring a qualifier there
 * would either rewrite history or teach authors to sprinkle the marker, and a
 * marker sprinkled to satisfy a gate stops meaning anything.
 *
 * Exit: 0 every mention qualified, 1 one is bare, 2 could not check.
 *
 * @module folio-assistant/scripts/check-stale-field-advice
 * @covers skills, docs, processes — it walks every advice-bearing file, and the
 *   three kinds that hold one are the skills, the guides and the workflows.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/** The repository root — this file lives at `<root>/cat-harness/scripts/`. */
export const ROOT = resolve(import.meta.dir, "..", "..");

/** A marker that makes a nearby mention qualified, and why it counts as one. */
export interface Qualifier {
  /** Matched case-insensitively as a substring. */
  readonly marker: string;
  /** What a reader learns from it about the field's reliability. */
  readonly because: string;
}

/** A forge field whose served value can be behind the truth. */
export interface StaleField {
  /** The token as it appears in prose. */
  readonly token: string;
  /** The bean that measured the staleness. */
  readonly bean: string;
  /** One line on what it serves wrongly, printed in every finding. */
  readonly why: string;
  /** Markers that qualify a mention of it. */
  readonly qualifiers: readonly Qualifier[];
}

/**
 * The fields. One today, and the shape is a table because the next one costs a
 * row rather than a second script.
 *
 * `mergeable` and `head.sha` went stale in the SAME measurement and are
 * deliberately absent: both are ordinary words in this corpus — `head.sha` is
 * read correctly dozens of times from a check-run payload, where it is not
 * served by the PR endpoint and not stale. A gate that cried wolf on those
 * would be deleted, and would take the one true rule with it.
 */
export const STALE_FIELDS: readonly StaleField[] = [
  {
    token: "mergeable_state",
    bean: "fx5r",
    why:
      "45 minutes after a PR merged, `GET /pulls/N` still served its PRE-MERGE " +
      "value. Only `merged` went stale-safe.",
    qualifiers: [
      { marker: "fx5r", because: "the bean that measured the 45-minute staleness" },
      { marker: "h2s9", because: "the bean that established `unknown` means NOT COMPUTED YET" },
      { marker: "yv4z", because: "the bean that measured what a `dirty` reading licenses" },
      { marker: "not `mergeable_state`", because: "the field is named only to warn against it" },
      { marker: "not that the pr", because: "states what the value does NOT mean" },
      { marker: "has not finished computing", because: "states the `unknown` semantics outright" },
      { marker: "not computed yet", because: "the same, in `h2s9`'s phrasing" },
      { marker: "serving", because: "as in `kept serving the pre-merge view` — names the staleness" },
      { marker: "pre-merge", because: "names WHICH view the field is stuck on" },
      { marker: "goes stale", because: "an explicit reliability claim" },
      { marker: "stale", because: "an explicit reliability claim" },
      { marker: "does not buy you", because: "denies the field answers the question asked of it" },
      { marker: "is not the way", because: "denies the field is the instrument for this" },
      { marker: "only `dirty`", because: "restricts trust to the one value whose falsity is free" },
      { marker: "when it is `dirty`", because: "the same restriction, as a condition" },
    ],
  },
];

/**
 * Directory names never descended into.
 *
 * `beans` is the substantive one and the docblock says why; the rest are
 * checkouts, caches and build output that this repository does not author.
 */
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "beans",
  "vendor",
  "__pycache__",
]);

/** File extensions that can carry advice a person or an agent reads. */
const ADVICE_EXT = /\.(md|ts|tsx|js|mjs|cjs|sh|yml|yaml)$/;

/**
 * A path this check declines to judge, with its reason.
 *
 * Kept to the two classes that are structurally not advice. Each is counted in
 * the report rather than dropped, so a reader can see what the coverage
 * excludes instead of inferring it from a clean verdict.
 */
export function skipPath(rel: string): string | undefined {
  // Generated from the skills themselves. Editing it is forbidden, so a
  // finding here is unactionable and would sit red until somebody deleted the
  // gate — and the source it is generated FROM is checked.
  if (rel.startsWith("cat-harness/docs/reference/")) return "generated — the source it comes from is checked";
  // This file declares the token in a table; every occurrence below is the
  // subject rather than advice. Self-reference, stated rather than assumed.
  if (rel === "cat-harness/scripts/check-stale-field-advice.ts") return "the checker's own declaration";
  if (rel === "cat-harness/scripts/tests/stale-field-advice.test.ts") return "the checker's own fixtures";
  // Its fixtures are VERBATIM turns from the session that earned the detector,
  // quoted so the guard is tested on the real defect rather than on the
  // author's idea of it. One of them happens to name this field, and inserting
  // a qualifier into it would make it not verbatim — which is the whole
  // property the fixture has.
  if (rel === "cat-harness/scripts/tests/decisions-named-not-asked.test.ts") {
    return "verbatim transcript fixtures — a qualifier inserted here would stop them being verbatim";
  }
  return undefined;
}

/** One place a field is named, with the verdict on it. */
export interface Mention {
  readonly path: string;
  /** 1-indexed. */
  readonly line: number;
  readonly token: string;
  readonly text: string;
  /** The marker that qualified it, or `undefined` when it is bare. */
  readonly qualifier?: string;
}

/**
 * How far from the mention a qualifier still counts, in lines either way.
 *
 * Three, measured rather than chosen: it is the smallest window that reaches
 * every qualified site in this corpus at the time of writing, and the largest
 * that does not span a paragraph break in any of them. A line window rather
 * than a paragraph because a paragraph inside a `/** *\/` docblock is
 * delimited by ` *`, not by a blank line, so blank-line splitting silently
 * treats a 60-line docblock as one paragraph and passes everything in it.
 */
export const WINDOW = 3;

/** Every mention of `field` in `text`, each judged against the window around it. */
export function scanText(path: string, text: string, field: StaleField): Mention[] {
  const lines = text.split("\n");
  const out: Mention[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]!.includes(field.token)) continue;
    const window = lines
      .slice(Math.max(0, i - WINDOW), Math.min(lines.length, i + WINDOW + 1))
      .join("\n")
      .toLowerCase();
    const q = field.qualifiers.find((x) => window.includes(x.marker.toLowerCase()));
    out.push({
      path,
      line: i + 1,
      token: field.token,
      text: lines[i]!.trim(),
      ...(q === undefined ? {} : { qualifier: q.marker }),
    });
  }
  return out;
}

/** Walk the tree, returning advice-bearing files relative to {@link ROOT}. */
export function adviceFiles(root = ROOT): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") && e.name !== ".github" && e.name !== ".claude") continue;
      const abs = join(dir, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(abs);
      } else if (e.isFile() && ADVICE_EXT.test(e.name) && statSync(abs).size < 2_000_000) {
        out.push(relative(root, abs));
      }
    }
  };
  walk(root);
  return out.sort();
}

export interface Report {
  readonly bare: readonly Mention[];
  readonly qualified: readonly Mention[];
  /** Paths declined, with the reason — counted so the coverage is visible. */
  readonly declined: ReadonlyArray<{ path: string; because: string }>;
  readonly filesScanned: number;
}

export function check(root = ROOT): Report {
  const bare: Mention[] = [];
  const qualified: Mention[] = [];
  const declined: Array<{ path: string; because: string }> = [];
  let filesScanned = 0;

  for (const rel of adviceFiles(root)) {
    const why = skipPath(rel);
    let text: string;
    try {
      text = readFileSync(join(root, rel), "utf8");
    } catch {
      continue;
    }
    // Declined paths are only reported when they would otherwise have had
    // something to say — a list of every generated file says nothing.
    if (why !== undefined) {
      if (STALE_FIELDS.some((f) => text.includes(f.token))) declined.push({ path: rel, because: why });
      continue;
    }
    filesScanned++;
    for (const f of STALE_FIELDS) {
      for (const m of scanText(rel, text, f)) (m.qualifier === undefined ? bare : qualified).push(m);
    }
  }
  return { bare, qualified, declined, filesScanned };
}

function main(): number {
  // The vacuity guard. A checker over an empty field table exits 0 and reads
  // as a clean sweep — `gates.ts`'s own argument, and `1xhc` in one line: a
  // gate that does not fire is indistinguishable from one that passed.
  if (STALE_FIELDS.length === 0) {
    console.error("check-stale-field-advice: the field table is empty — a bug here, not a clean tree.");
    return 2;
  }

  const r = check();
  if (r.filesScanned === 0) {
    console.error("check-stale-field-advice: scanned no files. Could not check.");
    return 2;
  }

  console.log(
    `check-stale-field-advice: ${r.filesScanned} file(s), ` +
      `${STALE_FIELDS.length} field(s), ` +
      `${r.qualified.length} qualified mention(s), ${r.bare.length} bare, ` +
      `${r.declined.length} path(s) declined.`,
  );
  for (const d of r.declined) console.log(`  · declined ${d.path} — ${d.because}`);

  if (r.bare.length === 0) {
    console.log("✓ every mention says something about the field's reliability.");
    return 0;
  }

  const byToken = new Map<string, StaleField>(STALE_FIELDS.map((f) => [f.token, f]));
  console.error(`\n${r.bare.length} unqualified mention(s):\n`);
  for (const m of r.bare) {
    const f = byToken.get(m.token)!;
    console.error(`  ${m.path}:${m.line}`);
    console.error(`    ${m.text}`);
    console.error(`    \`${m.token}\` — bean \`${f.bean}\`: ${f.why}`);
    console.error("");
  }
  console.error(
    `Say something about the field's reliability within ${WINDOW} line(s) of the\n` +
      `mention — a caution, or a measured licence naming the values you trust and\n` +
      `why. Naming the bean counts. This is not a style rule: the string this gate\n` +
      `exists for was posted to live PRs for four days after its fix merged,\n` +
      `because nothing linked the two copies.\n\n` +
      `If the file is not advice, decline the PATH in \`skipPath\` with a reason —\n` +
      `never a line number, which the next inserted paragraph invalidates.\n`,
  );
  return 1;
}

if (import.meta.main) process.exit(main());
