/**
 * `:val[…]` backfill codemod — rewrites known numeric literals inside
 * math contexts to `:val[name]{…}` directives so the rendered LaTeX
 * stays in sync with the canonical witness JSON.
 *
 * Walks every block's `.md` file, parses to mdast, and replaces
 * occurrences of literal decimal numbers inside `inlineMath` / `math`
 * node values with the canonical witness reference.  The match table
 * is built from `verifiedNames()` — entries flagged `needsReview` are
 * never auto-applied.
 *
 * Behaviour:
 *
 *   - **Math-only.**  Replacements happen only inside `inlineMath` /
 *     `math` node `value` strings.  Prose text is never touched.
 *   - **Idempotent.**  A literal already adjacent to a `:val[` token
 *     is skipped, and the rendered numeric form does not match the
 *     literal patterns again.
 *   - **Conservative match.**  Literal must match the witness value
 *     to *at least* the configured number of leading significant
 *     digits (default 4) — looser matches are skipped.  Word-boundary
 *     enforcement: digits adjacent to other digits or letters are
 *     never matched.
 *   - **Skip rules.**
 *       * Fenced ``` ```tex ``` blocks are skipped (they typically
 *         contain derivations where the literal is computed inline).
 *       * Tables are skipped (review manually first).
 *   - **Dry-run by default.**  Without `--write`, prints a per-file
 *     diff summary.
 *
 * Usage:
 *
 *   bun run pipeline/codemod-val.ts <paper-or-chapter-dir>            # dry-run
 *   bun run pipeline/codemod-val.ts <paper-or-chapter-dir> --write    # apply
 *
 * Mdast-based; no regex over raw markdown source.
 *
 * @module content/pipeline/codemod-val
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { basename, join, resolve, extname } from "path";
import { remark } from "remark";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { gfmTable } from "micromark-extension-gfm-table";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmStrikethroughFromMarkdown, gfmStrikethroughToMarkdown } from "mdast-util-gfm-strikethrough";
import {
  WITNESSED_VALUES,
  verifiedNames,
  type WitnessedValueEntry,
} from "../values/registry";
import { resolvePath } from "./render-value";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

// Round-trip parser/serializer with directive support — mirrors the
// renderer's configuration so round-tripping preserves all formatting.
const proc = remark()
  .data("micromarkExtensions", [gfmTable(), gfmStrikethrough()])
  .data("fromMarkdownExtensions", [gfmTableFromMarkdown(), gfmStrikethroughFromMarkdown()])
  .data("toMarkdownExtensions", [gfmTableToMarkdown(), gfmStrikethroughToMarkdown()])
  .use(remarkDirective)
  .use(remarkMath);

// ── Literal index construction ───────────────────────────────────

interface LiteralEntry {
  /** Registry name. */
  name: string;
  /** Full canonical decimal-string value. */
  canonical: string;
  /** Sig-digit string (digits-only, leading zeros stripped from the
   *  whole concatenated number).  Used for prefix agreement. */
  sigDigits: string;
}

/**
 * Number of leading significant digits required for a literal-to-name
 * match.  Set conservatively so common short literals (e.g. `1.109`)
 * cannot accidentally match unrelated values that happen to share a
 * prefix.  At 6 digits, `q_0` requires the literal `1.10997` and
 * `B_4He_AME_MeV` requires `28.2956` — both specific enough to avoid
 * cross-contamination with other physics constants.
 *
 * Literals **shorter** than this threshold (e.g. `0.09908`, only 4 sig
 * digits) cannot be auto-migrated and must be hand-edited; the
 * codemod will not guess.
 */
const MATCH_PRECISION = 6;

/**
 * Extract the leading-zero-stripped digit sequence of a decimal
 * literal (e.g. `"206.7682830"` → `"2067682830"`,
 * `"0.0990817"` → `"990817"`).  Returns `null` for unparseable input.
 */
function sigDigitString(str: string): string | null {
  const m = str.match(/^-?(\d+)(?:\.(\d+))?$/);
  if (!m) return null;
  const intPart = m[1];
  const fracPart = m[2] || "";
  let digits = intPart + fracPart;
  // Strip leading zeros (preserve at least one digit so "0" → "0").
  let i = 0;
  while (i < digits.length - 1 && digits[i] === "0") i++;
  return digits.slice(i);
}

function loadWitnessOnce(file: string, cache: Map<string, unknown | null>): unknown | null {
  if (cache.has(file)) return cache.get(file) ?? null;
  const abs = resolve(REPO_ROOT, file);
  if (!existsSync(abs)) {
    cache.set(file, null);
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(abs, "utf-8"));
    cache.set(file, parsed);
    return parsed;
  } catch {
    cache.set(file, null);
    return null;
  }
}

/**
 * Build the literal-match table from verified registry entries only.
 * Entries flagged `needsReview` are skipped — the codemod refuses to
 * auto-apply unverified mappings.
 */
export function buildLiteralIndex(): LiteralEntry[] {
  const out: LiteralEntry[] = [];
  const cache = new Map<string, unknown | null>();
  for (const name of verifiedNames()) {
    const entry = WITNESSED_VALUES[name];
    if (!entry) continue;
    const witness = loadWitnessOnce(entry.witnessFile, cache);
    if (witness == null) continue;
    const raw = resolvePath(witness, entry.witnessPath);
    let canonical: string | null = null;
    if (typeof raw === "string") canonical = raw;
    else if (typeof raw === "number" && Number.isFinite(raw)) canonical = raw.toString();
    else if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      if (typeof o.value === "string") canonical = o.value;
    }
    if (!canonical) continue;
    const sig = sigDigitString(canonical);
    if (!sig || sig.length < MATCH_PRECISION) continue;
    out.push({ name, canonical, sigDigits: sig });
  }
  return out;
}

/**
 * Decimal literal matcher used to scan math-node bytes for migration
 * candidates.  Excludes neighbouring digits via lookbehind/lookahead
 * but allows surrounding non-digits (operators, braces, whitespace).
 * Trailing `.` is also disallowed before the literal so `2.5` inside
 * `1.2.5` (unlikely but safe) cannot be misread.
 */
const DECIMAL_LITERAL = /(?<![\d.])(\d+(?:\.\d+)?)(?![\d])/g;

// ── Per-math-node rewriting ──────────────────────────────────────

interface NodeRewrite {
  changed: boolean;
  newValue: string;
  hits: Map<string, number>;
}

/**
 * Rewrite a single math-node value string.  Skips any region already
 * inside an existing `:val[…]` directive (idempotency).
 *
 * Match policy: each decimal literal in the source is compared to
 * every verified registry canonical by leading significant-digit
 * agreement.  An entry matches iff the literal's sig digits are a
 * prefix of the canonical's sig digits (or vice-versa) and the
 * agreement is ≥ `MATCH_PRECISION` digits.  Among matching entries
 * the one with the longest canonical agreement wins, breaking ties
 * by registry-insertion order.
 *
 * This handles literals at any precision ≥ MATCH_PRECISION:
 * `206.768` (6), `206.7683` (7), and `206.7682830` (10) all migrate
 * to `m_mu_over_e`.  Literals with fewer than MATCH_PRECISION sig
 * digits (e.g. `0.09908` — 4 digits) are left untouched and must be
 * migrated by hand.
 */
export function rewriteMathString(value: string, index: LiteralEntry[]): NodeRewrite {
  const hits = new Map<string, number>();
  let changed = false;

  // Carve out existing `:val[…]` regions so we never rewrite inside one.
  const guarded: { kind: "text" | "skip"; s: string }[] = [];
  const valPat = /:val\[[A-Za-z_][A-Za-z0-9_]*\](?:\{[^}]*\})?/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = valPat.exec(value)) !== null) {
    if (m.index > last) guarded.push({ kind: "text", s: value.slice(last, m.index) });
    guarded.push({ kind: "skip", s: m[0] });
    last = m.index + m[0].length;
  }
  if (last < value.length) guarded.push({ kind: "text", s: value.slice(last) });

  // Replace decimal literals in text segments.
  const out: string[] = [];
  for (const seg of guarded) {
    if (seg.kind === "skip") {
      out.push(seg.s);
      continue;
    }
    DECIMAL_LITERAL.lastIndex = 0;
    const replaced = seg.s.replace(DECIMAL_LITERAL, (lit) => {
      const litSig = sigDigitString(lit);
      if (!litSig || litSig.length < MATCH_PRECISION) return lit;
      let bestName: string | null = null;
      let bestAgree = MATCH_PRECISION - 1;
      for (const entry of index) {
        // Prefix agreement of the shorter against the longer.
        const min = Math.min(litSig.length, entry.sigDigits.length);
        let agree = 0;
        while (agree < min && litSig[agree] === entry.sigDigits[agree]) agree++;
        // Only accept when the shorter side is fully consumed by the
        // agreement — otherwise the literal disagrees with the
        // canonical at a digit within the literal's own precision.
        if (agree < min) continue;
        if (agree > bestAgree) {
          bestAgree = agree;
          bestName = entry.name;
        }
      }
      if (bestName == null) return lit;
      hits.set(bestName, (hits.get(bestName) ?? 0) + 1);
      changed = true;
      return `:val[${bestName}]{precision=${MATCH_PRECISION}}`;
    });
    out.push(replaced);
  }

  return { changed, newValue: out.join(""), hits };
}

// ── Per-file rewriting ───────────────────────────────────────────

export interface FileRewrite {
  /** Path relative to repo root. */
  file: string;
  /** Whether any replacements were made. */
  changed: boolean;
  /** Rewritten markdown source (only set when changed). */
  newSource?: string;
  /** Per-name hit counts. */
  hits: Map<string, number>;
}

export function rewriteMarkdownFile(file: string, index: LiteralEntry[]): FileRewrite {
  const md = readFileSync(file, "utf-8");
  const tree = proc.parse(md);
  const totalHits = new Map<string, number>();

  interface Patch { start: number; end: number; replacement: string; }
  const patches: Patch[] = [];

  visit(tree as any, (node: any) => {
    // Skip subtree if we're inside a fenced ```tex block or a table.
    if (node.type === "code" && node.lang === "tex") return "skip" as any;
    if (node.type === "table") return "skip" as any;
    if (node.type !== "inlineMath" && node.type !== "math") return;
    if (!node.position?.start || !node.position?.end) return;

    // Patch the inner span of the math node, leaving the surrounding
    // `$` / `$$` delimiters and every byte outside untouched.  This
    // avoids any round-trip through `remark-stringify`, which would
    // otherwise re-escape `:` in link URLs, leading `---`, normalise
    // bullet markers, reformat tables, etc.
    //
    // We run the regex pass on the *raw source slice* between the
    // delimiters rather than on `node.value`, because mdast trims
    // surrounding whitespace from `value` for display math but the
    // source bytes (including the leading/trailing newlines around a
    // `$$ … $$` block) must be preserved verbatim.
    const startOff = node.position.start.offset as number;
    const endOff = node.position.end.offset as number;
    const fullSpan = md.slice(startOff, endOff);

    let leftDelim = 0;
    while (leftDelim < fullSpan.length && fullSpan[leftDelim] === "$") leftDelim++;
    let rightDelim = 0;
    while (rightDelim < fullSpan.length && fullSpan[fullSpan.length - 1 - rightDelim] === "$") rightDelim++;
    if (leftDelim === 0 || rightDelim === 0) return;

    const innerStart = startOff + leftDelim;
    const innerEnd = endOff - rightDelim;
    const rawInner = md.slice(innerStart, innerEnd);
    const rawRewrite = rewriteMathString(rawInner, index);
    if (!rawRewrite.changed) return;

    patches.push({
      start: innerStart,
      end: innerEnd,
      replacement: rawRewrite.newValue,
    });
    for (const [k, v] of rawRewrite.hits) totalHits.set(k, (totalHits.get(k) ?? 0) + v);
  });

  if (patches.length === 0) {
    return { file, changed: false, hits: totalHits };
  }

  // Apply patches end-to-start so earlier offsets remain valid.
  patches.sort((a, b) => b.start - a.start);
  let out = md;
  for (const p of patches) {
    out = out.slice(0, p.start) + p.replacement + out.slice(p.end);
  }

  return { file, changed: true, newSource: out, hits: totalHits };
}

// ── Discovery ────────────────────────────────────────────────────

/** Recursively find every .md file under `dir`. */
function findMarkdownFiles(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(cur);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const full = join(cur, name);
      let st;
      try { st = statSync(full); } catch { continue; }
      if (st.isDirectory()) stack.push(full);
      else if (extname(name) === ".md") out.push(full);
    }
  }
  return out.sort();
}

// ── CLI ──────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const positional = args.filter(a => !a.startsWith("--"));
  const target = resolve(positional[0] || ".");

  if (!existsSync(target)) {
    console.error(`Target not found: ${target}`);
    process.exit(2);
  }

  const index = buildLiteralIndex();
  if (index.length === 0) {
    console.error("No verified registry entries with resolvable witnesses — nothing to do.");
    process.exit(0);
  }
  console.log(`Loaded ${index.length} literal patterns from registry:`);
  for (const lit of index) {
    console.log(`  ${lit.name.padEnd(20)} → ${lit.canonical.slice(0, 24)}`);
  }
  console.log("");

  const files = findMarkdownFiles(target);
  console.log(`Scanning ${files.length} .md file(s) under ${target}\n`);

  const totalHits = new Map<string, number>();
  let filesChanged = 0;

  for (const file of files) {
    const r = rewriteMarkdownFile(file, index);
    if (!r.changed) continue;
    filesChanged++;
    const rel = file.startsWith(REPO_ROOT) ? file.slice(REPO_ROOT.length + 1) : file;
    const summary = Array.from(r.hits.entries())
      .map(([k, v]) => `${k}×${v}`)
      .join(", ");
    console.log(`  ${write ? "WRITE" : "DRY  "} ${rel}  [${summary}]`);
    if (write && r.newSource) {
      writeFileSync(file, r.newSource, "utf-8");
    }
    for (const [k, v] of r.hits) totalHits.set(k, (totalHits.get(k) ?? 0) + v);
  }

  console.log("");
  console.log(`Files ${write ? "modified" : "would be modified"}: ${filesChanged}`);
  console.log("Per-name hits:");
  const sorted = Array.from(totalHits.entries()).sort((a, b) => b[1] - a[1]);
  for (const [k, v] of sorted) console.log(`  ${k.padEnd(20)} ${v}`);
  if (!write && filesChanged > 0) {
    console.log("\nRe-run with --write to apply.");
  }
}
