/**
 * One published shape for every QA sidecar family, so a reader can open a
 * verdict and see WHO established it, WHEN, at which SHA, and whether it still
 * holds.
 *
 * The verdicts have been on the site since bean `g6yr` shipped per-block icons
 * (#274): a glyph beside each block's Edit link with the counts in its `title`.
 * What a reader could not reach was the evidence underneath — that a
 * `voice-status-leak` pass came from `qa-checkers-voice.ts` at `script_hash`
 * 5af6856733f3 on 2026-09-18, against an `.md` that has not changed since. The
 * sidecars carry all of it; nothing published it.
 *
 * ## Four families, one view
 *
 * | family | sidecar | subject |
 * |---|---|---|
 * | `block` | `<stem>.qa.json` beside `<stem>.md` | a content block |
 * | `translation` | `<stem>.<locale>.translation-qa.json` | a block's translation into one locale |
 * | `script` | `script-qa/<stem>.script-qa.json` | a pipeline / compute script |
 * | `kg` | `kg-qa/<stem>.kg-qa.json` | a BPMN process, a DMN decision, a role |
 *
 * They are NOT one schema on disk and this module does not pretend otherwise.
 * `block`, `translation` and `script` keep per-criterion ARRAYS of
 * {@link QaCriterionEntry} — many reviewers, each with its own provenance.
 * `kg` keeps ONE `auditor` for the whole report and a single entry per
 * criterion, because `kg-audit.ts` is the only thing that writes it. So a KG
 * criterion normalises to exactly one witness, synthesised from the report's
 * auditor, and that is reported as what it is rather than padded out.
 *
 * ## Freshness is computed against the working tree, never self-reported
 *
 * A sidecar's own `source_hashes` block is rewritten on every write, so
 * comparing an entry against it answers "was this entry current when the file
 * was last touched" — not "is it current now". Freshness here re-hashes the
 * subject's files on disk and compares them with what the entry recorded, the
 * same way `qa-staleness.ts` does.
 *
 * **Four states, and only one of them means fully verified.** `fresh` and
 * `stale` both mean the comparison happened. `partial` means every FILE the
 * entry recorded still matches while a DERIVED input (`graph`,
 * `lean_statement`) was not re-computed here. `unknown` means it could not be
 * established at all: the entry recorded no hash for a file that exists, or the
 * file it hashed is gone. Neither `partial` nor `unknown` is ever rendered as
 * `fresh` — a witness whose currency cannot be established is the one a reader
 * most needs flagged, and the same rule governs the state roll-up (`unswept`)
 * that `g6yr` argued for.
 *
 * Hash formats differ between families and are normalised, not assumed:
 * `block-qa` writes a 12-char SHA-256 prefix, `kg-qa` writes
 * `sha256:<64 hex>`. Comparison strips the algorithm prefix and matches on the
 * shorter of the two lengths, so a prefix and a full digest of the same bytes
 * compare equal instead of reading as a change nobody made.
 *
 * @module content/pipeline/qa-witness
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import type { BlockQaReport, QaCriterionEntry } from "../../schemas/block-qa.ts";
import { KG_QA_MANIFEST_PATH, kgQaSidecarPath } from "../../schemas/kg-qa.ts";
import type { KgQaManifest, KgQaReport } from "../../schemas/kg-qa.ts";
import type { ScriptQaReport } from "../../schemas/script-qa.ts";
import { existingBlockQaPath, translationQaPath } from "./qa-paths.ts";

/** The QA sidecar families a subject can carry. */
export const QA_FAMILIES = ["block", "translation", "script", "kg"] as const;
export type QaFamily = (typeof QA_FAMILIES)[number];

/**
 * Short tag and long label per family, for the icon and its accessible name.
 *
 * The tag rides IN the icon rather than being encoded as a colour or an
 * abstract shape: four unlabelled glyphs in a row are a legend nobody has, and
 * colour alone fails the reader who cannot see it. State keeps the glyph set
 * `g6yr` shipped, so a state means the same thing in every family.
 */
export const QA_FAMILY_LABEL: Record<QaFamily, { tag: string; label: string }> = {
  block: { tag: "QA", label: "Content QA" },
  translation: { tag: "TR", label: "Translation QA" },
  script: { tag: "SC", label: "Script QA" },
  kg: { tag: "KG", label: "Knowledge-graph QA" },
};

/**
 * The roll-up state of one sidecar, for the icon.
 *
 * Mirrors `QaState` in `scripts/gen-docs-pages.ts` — `unswept` covers both "no
 * sidecar" and "a sidecar that checked nothing", because a missing icon and a
 * clean one look identical to a reader and only one of them is true.
 */
export type QaState = "fail" | "warn" | "pass" | "unswept";

/**
 * Whether a witness's verdict still applies to the files on disk.
 *
 * `partial` exists because some criteria hash something that is not a file.
 * `graph` is the chapter's `uses[]` edge set and `lean_statement` is the
 * declaration signatures lexed out of a `.lean`; both are DERIVED, and
 * recomputing them here would mean re-running a slice of the sweep on every
 * docs build. Reporting them as "reviewed, now missing on disk" made 1012 of
 * 5424 witnesses read `unknown` in the first corpus-wide run — a fifth of the
 * panel alarming about files that never existed.
 *
 * So `partial` says exactly what happened: every FILE the entry recorded still
 * matches, and a named derived input was not re-checked. It is not folded into
 * `fresh`, because `fresh` means fully verified and nothing should quietly
 * widen it.
 */
export type QaFreshness = "fresh" | "partial" | "stale" | "unknown";

/**
 * Hashed inputs that are computed rather than read off disk.
 *
 * See {@link QaFieldHash} in `schemas/block-qa.ts`: `graph` is a property of
 * the whole chapter's edge set, `lean_statement` of the declarations lexed out
 * of the `.lean`.
 */
const DERIVED_INPUTS = new Set(["graph", "lean_statement"]);

/** One reviewer's provenance for one criterion, flattened for publication. */
export interface QaWitness {
  /** `script` — a deterministic checker. `agent` — an LLM. `human` — a person. */
  kind: "script" | "agent" | "human";
  /** Script path, model + skill, or GitHub login. */
  id: string;
  version?: string;
  /** When the review ran (ISO-8601), or absent when the sidecar records none. */
  at?: string;
  /** Repo HEAD at review time. */
  sha?: string;
  /** Hash of the checker's own source, and the commit it was last changed in. */
  scriptHash?: string;
  scriptCommitSha?: string;
  /** Hash of every extra input the checker consulted beyond the subject. */
  depsHash?: string;
  /** Agent provenance. */
  model?: string;
  session?: string;
  skill?: string;
  /** How the verdict was measured, where the checker records it. */
  method?: string;
  /** Whether the verdict still holds for the files on disk. */
  freshness: QaFreshness;
  /**
   * On `stale`, the subject files whose hash moved. On `unknown`, why the
   * comparison could not be made, one phrase per unresolved input.
   */
  changed?: string[];
  /** On `partial`, the derived inputs that were not re-computed. */
  notCompared?: string[];
  notes?: string;
}

/** One criterion's current verdict plus every witness that has ruled on it. */
export interface QaCriterionView {
  id: string;
  /** `unknown` is a real outcome: the sidecar holds the criterion but no verdict. */
  result: "fail" | "warn" | "pass" | "n/a" | "unknown";
  severity?: "critical" | "major" | "minor";
  /** Locale, for a per-locale family (`translation`). */
  locale?: string;
  /**
   * The subject this criterion was ruled on, when the doc covers SEVERAL.
   *
   * Absent on a per-subject projection, where the doc's own `subject` already
   * says it and repeating it on every row would be noise. Present on a
   * {@link rollUpWitnessDocs} projection, where the whole point is that one
   * panel carries verdicts about many blocks and a reader must be able to tell
   * which block a failing criterion belongs to.
   */
  block?: string;
  /** Flattened evidence lines, in the shape the reviewer wrote them. */
  evidence?: string[];
  /** Numeric measures the checker recorded alongside its verdict. */
  metrics?: Record<string, number | string>;
  score?: { value: number; max: number };
  witnesses: QaWitness[];
}

/** The published projection of one subject's sidecar(s) in one family. */
export interface QaWitnessDoc {
  $schema: "qa-witness/v1";
  family: QaFamily;
  /** Human-readable subject: a block label, a script path, a process id. */
  subject: string;
  /** Repo-relative sidecar path(s) this was projected from. */
  sidecars: string[];
  state: QaState;
  counts: { fail: number; warn: number; pass: number; na: number; unknown: number };
  criteria: QaCriterionView[];
}

// ── Hash comparison ─────────────────────────────────────────────

/** 12-char SHA-256 prefix of a file, or `undefined` when it is absent. */
function hash12(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  return createHash("sha256").update(readFileSync(path)).digest("hex").slice(0, 12);
}

/**
 * Strip an `sha256:`-style algorithm prefix so digests from different families
 * are comparable.
 */
function bareDigest(h: string): string {
  const colon = h.indexOf(":");
  return colon === -1 ? h : h.slice(colon + 1);
}

/**
 * Whether two digests of the same bytes agree, tolerating a prefix vs a full
 * digest. Returns `undefined` when either side is missing — the caller renders
 * that as `unknown`, never as agreement.
 */
export function digestsAgree(a: string | undefined, b: string | undefined): boolean | undefined {
  if (!a || !b) return undefined;
  const x = bareDigest(a);
  const y = bareDigest(b);
  const n = Math.min(x.length, y.length);
  if (n === 0) return undefined;
  return x.slice(0, n) === y.slice(0, n);
}

/**
 * Compare one entry's recorded input hashes against the files on disk.
 *
 * `live` maps an input name (`md`, `ts`, `po`, `script`, …) to its current
 * hash, `undefined` where the file is absent. A recorded hash with no live
 * counterpart, or a live file the entry recorded nothing for, is `unknown` —
 * the entry cannot be shown to still hold, and the reason is named.
 */
export function freshnessOf(
  recorded: Record<string, string | undefined>,
  live: Record<string, string | undefined>,
): { freshness: QaFreshness; changed?: string[]; notCompared?: string[] } {
  const changed: string[] = [];
  const unresolved: string[] = [];
  const notCompared: string[] = [];
  const names = new Set([...Object.keys(recorded), ...Object.keys(live)]);
  if (names.size === 0) {
    return { freshness: "unknown", changed: ["the entry records no input hashes"] };
  }
  for (const name of [...names].sort()) {
    const agree = digestsAgree(recorded[name], live[name]);
    if (agree === undefined) {
      if (recorded[name] && DERIVED_INPUTS.has(name)) {
        // Computed, not read: absent from `live` because nothing recomputed it,
        // which is not the same as a file that has gone.
        notCompared.push(`${name} (derived, not re-computed here)`);
      } else if (recorded[name] && !live[name])
        unresolved.push(`${name}: reviewed, now missing on disk`);
      else if (!recorded[name] && live[name]) unresolved.push(`${name}: on disk, no hash recorded`);
      else unresolved.push(`${name}: no hash on either side`);
      continue;
    }
    if (!agree) changed.push(name);
  }
  if (changed.length > 0) return { freshness: "stale", changed };
  // An unresolved input can hide a change, so it cannot come back `fresh`.
  if (unresolved.length > 0) return { freshness: "unknown", changed: unresolved };
  if (notCompared.length > 0) return { freshness: "partial", notCompared };
  return { freshness: "fresh" };
}

// ── Sidecar location ────────────────────────────────────────────

/**
 * Where each family keeps a subject's sidecar, given the subject's own file.
 *
 * `translation` returns EVERY locale's sidecar for the block — one file per
 * locale, mirroring `translations/<locale>/`, collected into one view so the
 * block carries one icon rather than one per language.
 *
 * `repoRoot` is REQUIRED rather than defaulted, and only the `kg` family reads
 * it. A default would make a caller that forgot it resolve to a plausible
 * wrong tree and find nothing there — which this projector renders as
 * "unaudited", a false pass rather than an error. The three families that do
 * not need it still pay one argument, which is the cheaper mistake.
 */
export function sidecarPaths(family: QaFamily, subjectPath: string, repoRoot: string): string[] {
  const dir = dirname(subjectPath);
  const stem = basename(subjectPath).replace(/\.[^.]+$/, "");
  switch (family) {
    case "block": {
      // The shared contract (`qa-paths.ts`, bean `2634`) is the ONE answer for
      // where a block's verdict lives: it prefers `test/results/block-qa/…`
      // and falls back to the legacy `<stem>.qa.json` sibling only when the
      // results tree has nothing. `dir`/`stem` above come from `subjectPath`,
      // which may be the block's `.md` rather than its `.ts` — that is fine,
      // because `blockRoot` is the shared path PREFIX every companion file
      // (`.ts`, `.md`, `.lean`) sits under, not a property of one extension.
      //
      // Single entry, not the read-path list: unlike `translation`, where
      // several sidecars are genuinely different data (one verdict per
      // locale), two *block* locations both existing means the SAME block
      // audited twice — a migration-in-progress duplicate, not two verdicts
      // to publish. `readWitnessDoc` already only ever read `paths[0]!` for
      // this family, so returning the read-path pair unfiltered would have
      // let a stale legacy copy silently ride along in `sidecars` even when
      // the results-tree entry is the one actually projected.
      const blockRoot = join(dir, stem);
      const path = existingBlockQaPath(repoRoot, blockRoot);
      return path ? [path] : [];
    }
    case "translation": {
      // TWO trees, scanned in the order `qa-paths.ts` fixes: the results tree
      // that sweeps write to, then the legacy sibling a downstream folio still
      // carries. Unlike `block` above, several sidecars here are genuinely
      // different data — one verdict per LOCALE — so the whole set is returned
      // rather than the first that exists.
      //
      // The two trees are merged BY LOCALE, not concatenated: a folio
      // mid-migration has `fr` in both places, the same verdict written twice,
      // and concatenating would project it as two witnesses of one criterion —
      // a checker appearing to have ruled twice on one text, which is the
      // "sidecar grows a history of one checker arguing with itself" defect
      // bean `oja4` already paid for. First tree wins per locale, so the
      // results-tree copy supersedes the sibling exactly as it does for blocks.
      const subjectRoot = join(dir, stem);
      const re = new RegExp(
        `^${escapeRe(stem)}\\.([a-z]{2,3}(?:-[A-Za-z0-9]+)*)\\.translation-qa\\.json$`,
      );
      const byLocale = new Map<string, string>();
      const resultsDir = dirname(translationQaPath(repoRoot, subjectRoot, "xx"));
      for (const d of [resultsDir, dir]) {
        if (!existsSync(d)) continue;
        for (const f of readdirSync(d).sort()) {
          const m = re.exec(f);
          if (m && !byLocale.has(m[1]!)) byLocale.set(m[1]!, join(d, f));
        }
      }
      return [...byLocale.keys()].sort().map((l) => byLocale.get(l)!);
    }
    case "script":
      return [join(dir, "script-qa", `${stem}.script-qa.json`)].filter((p) => existsSync(p));
    case "kg":
      // The SAME function the auditor writes with. Composing the path here a
      // second time is how a reader ends up looking where nothing was
      // written — and finding nothing reads as "unaudited", a false pass.
      return [kgQaSidecarPath(repoRoot, dir, stem)].filter((p) => existsSync(p));
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The locale a `translation` sidecar covers, from its filename. */
function localeOf(sidecarPath: string): string | undefined {
  const m = basename(sidecarPath).match(/\.([a-z]{2,3}(?:-[A-Za-z0-9]+)*)\.translation-qa\.json$/);
  return m?.[1];
}

// ── Reading ─────────────────────────────────────────────────────

function readJson<T>(path: string): T | undefined {
  // A sidecar that will not parse is not a crash. One malformed file must not
  // take down a docs build, and "could not read this" is the same answer to the
  // reader as "nobody has checked" — which is what the caller renders.
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return undefined;
  }
}

/** Flatten the two evidence shapes the live corpus carries into lines. */
function evidenceLines(e: QaCriterionEntry["evidence"]): string[] | undefined {
  if (!e) return undefined;
  if (typeof e === "string") return e ? [e] : undefined;
  const lines = e
    .map((x) => [x.line !== undefined ? `line ${x.line}` : "", x.text ?? ""].filter(Boolean).join(": "))
    .filter(Boolean);
  return lines.length > 0 ? lines : undefined;
}

/**
 * Turn one `QaCriterionEntry` — the shape `block`, `translation` and `script`
 * share — into a witness, with freshness measured against `live`.
 */
function witnessOf(
  entry: QaCriterionEntry,
  live: Record<string, string | undefined>,
): QaWitness {
  const r = entry.reviewer ?? { kind: "script" as const, id: "unrecorded" };
  const recorded: Record<string, string | undefined> = { ...(entry.field_hash ?? {}) };
  const { freshness, changed, notCompared } = freshnessOf(recorded, live);
  return {
    kind: r.kind ?? "script",
    id: r.id ?? "unrecorded",
    version: r.version,
    at: entry.reviewed_at,
    sha: entry.reviewed_sha,
    scriptHash: r.script_hash,
    scriptCommitSha: r.script_commit_sha,
    depsHash: r.deps_hash,
    model: r.agent_model,
    session: r.agent_session,
    skill: r.agent_skill,
    method: typeof entry.metrics?.method === "string" ? entry.metrics.method : undefined,
    freshness,
    changed,
    notCompared,
    notes: entry.notes,
  };
}

function normaliseResult(r: string | undefined): QaCriterionView["result"] {
  if (r === "fail" || r === "warn" || r === "pass" || r === "n/a") return r;
  return "unknown";
}

function countsOf(criteria: QaCriterionView[]): QaWitnessDoc["counts"] {
  const c = { fail: 0, warn: 0, pass: 0, na: 0, unknown: 0 };
  for (const cr of criteria) {
    if (cr.result === "fail") c.fail++;
    else if (cr.result === "warn") c.warn++;
    else if (cr.result === "pass") c.pass++;
    else if (cr.result === "n/a") c.na++;
    else c.unknown++;
  }
  return c;
}

/**
 * The icon state for a set of criteria.
 *
 * `unswept` when nothing was actually checked — no criterion, or every one
 * `n/a` / `unknown`. An `unknown` does not make a sidecar `pass`: a criterion
 * the sidecar holds but has no verdict for is exactly the gap this module
 * exists to surface.
 */
export function stateOf(counts: QaWitnessDoc["counts"]): QaState {
  if (counts.fail > 0) return "fail";
  if (counts.warn > 0) return "warn";
  if (counts.pass > 0) return "pass";
  return "unswept";
}

/**
 * Live hashes for a block's companions, keyed the way `field_hash` keys them.
 *
 * Only files that could have been hashed are probed; `lean_statement` and
 * `graph` are derived rather than files, so an entry recording them resolves
 * `unknown` rather than being silently dropped — the reader is told the
 * comparison was not made.
 */
function liveBlockHashes(blockDir: string, stem: string, extra: Record<string, string> = {}) {
  const live: Record<string, string | undefined> = {};
  for (const [role, file] of Object.entries({
    md: `${stem}.md`,
    ts: `${stem}.ts`,
    lean: `${stem}.lean`,
    bpmn: `${stem}.bpmn`,
    dmn: `${stem}.dmn`,
    fsh: `${stem}.fsh`,
    cql: `${stem}.cql`,
    xlsx: `${stem}.xlsx`,
    feature: `${stem}.feature`,
    ...extra,
  })) {
    const h = hash12(join(blockDir, file));
    if (h) live[role] = h;
  }
  return live;
}

/**
 * Project a `block-qa/v1` (or `script-qa/v1`) report, whose criteria map to
 * arrays of reviewer entries.
 *
 * Every entry becomes a witness; the criterion's verdict is the FIRST entry's,
 * matching `readQaSummary` in `gen-docs-pages.ts` — later entries are
 * superseded reviews, and taking a verdict from one would report a ruling that
 * has since been revised. They are still published, in order, because "who
 * said otherwise, and when" is the audit trail.
 */
function projectEntryArrays(
  criteria: Record<string, QaCriterionEntry[]>,
  live: Record<string, string | undefined>,
  locale?: string,
): QaCriterionView[] {
  const out: QaCriterionView[] = [];
  for (const [id, entries] of Object.entries(criteria ?? {})) {
    const list = Array.isArray(entries) ? entries : [];
    const first = list[0];
    out.push({
      id,
      result: normaliseResult(first?.result),
      severity: first?.severity,
      locale,
      evidence: evidenceLines(first?.evidence),
      metrics: first?.metrics,
      score: first?.score ? { value: first.score.value, max: first.score.max } : undefined,
      witnesses: list.map((e) => witnessOf(e, live)),
    });
  }
  return out;
}

/**
 * Read a subject's sidecar(s) in one family and project them for publication.
 *
 * `undefined` when the family has no sidecar for this subject — the caller
 * decides whether that is an `unswept` icon (a subject that SHOULD carry one)
 * or no icon at all (a family that does not apply here). Those are different
 * facts and this module does not collapse them.
 */
export function readWitnessDoc(
  family: QaFamily,
  subjectPath: string,
  repoRoot: string,
): QaWitnessDoc | undefined {
  const paths = sidecarPaths(family, subjectPath, repoRoot);
  if (paths.length === 0) return undefined;
  const rel = (p: string) => p.slice(repoRoot.length).replace(/^\//, "");
  const dir = dirname(subjectPath);
  const stem = basename(subjectPath).replace(/\.[^.]+$/, "");

  let subject = rel(subjectPath);
  let criteria: QaCriterionView[] = [];

  if (family === "block" || family === "script") {
    const doc = readJson<BlockQaReport | ScriptQaReport>(paths[0]!);
    if (!doc) return undefined;
    const live =
      family === "block"
        ? liveBlockHashes(dir, stem)
        : { script: hash12(subjectPath) };
    subject =
      (doc as BlockQaReport).label ?? (doc as ScriptQaReport).script_path ?? rel(subjectPath);
    criteria = projectEntryArrays(
      (doc as BlockQaReport | ScriptQaReport).criteria ?? {},
      live,
    );
  } else if (family === "translation") {
    // One sidecar per locale, collected into one view. The block's own `.md` is
    // a hashed input on both sides: a source edit staled every locale at once,
    // which is the fact a reader of a translated page needs first.
    for (const p of paths) {
      const doc = readJson<BlockQaReport & { locale?: string; po?: string }>(p);
      if (!doc) continue;
      const locale = doc.locale ?? localeOf(p);
      const live = liveBlockHashes(dir, stem);
      if (doc.po) {
        const h = hash12(join(repoRoot, doc.po));
        if (h) live.po = h;
      }
      criteria.push(...projectEntryArrays(doc.criteria ?? {}, live, locale));
    }
    subject = `${stem} — translations`;
    if (criteria.length === 0) return undefined;
  } else {
    // kg-qa: ONE auditor for the whole report, one entry per criterion. Each
    // criterion normalises to exactly one script witness, which is what the
    // file records — not padded out to look like a multi-reviewer history.
    const doc = readJson<KgQaReport>(paths[0]!);
    if (!doc) return undefined;
    // The auditor is recorded ONCE for the corpus, not per sidecar — see
    // `KG_QA_MANIFEST_SCHEMA`. Absent manifest reports "unrecorded" rather
    // than inventing a hash, the same rule this file already applies to the
    // timestamp `kg-audit` does not keep.
    const auditor = readJson<KgQaManifest>(join(repoRoot, KG_QA_MANIFEST_PATH))?.auditor;
    const live = { source: hash12(subjectPath) };
    const { freshness, changed } = freshnessOf({ source: doc.source_hash ?? undefined }, live);
    subject = doc.subject?.id ? `${doc.subject.kind} ${doc.subject.id}` : rel(subjectPath);
    for (const [id, entry] of Object.entries(doc.criteria ?? {})) {
      criteria.push({
        id,
        result: normaliseResult(entry?.result),
        evidence:
          entry?.findings && entry.findings.length > 0
            ? entry.findings.map((f) => `${f.where}: ${f.detail}`)
            : undefined,
        witnesses: [
          {
            kind: "script",
            id: auditor?.script ?? "unrecorded",
            version: auditor?.engine_version,
            scriptHash: auditor?.script_hash,
            // `kg-audit` records no timestamp and no repo SHA. Absent rather
            // than invented: a witness with a made-up date is worse than one
            // that admits it has none, and the panel says "not recorded".
            freshness,
            changed,
          },
        ],
      });
    }
  }

  criteria.sort(byResultThenId);
  const counts = countsOf(criteria);
  return {
    $schema: "qa-witness/v1",
    family,
    subject,
    sidecars: paths.map(rel),
    state: stateOf(counts),
    counts,
    criteria,
  };
}

/**
 * One projection over SEVERAL subjects in one family — a page's worth of blocks.
 *
 * ## Why this exists
 *
 * The per-block `TR` icon is honest and almost always empty. Measured on this
 * corpus: 114 of 115 translation badges render as "not swept", because a block
 * gets a sidecar only when a PO actually carries its strings and the site is 3%
 * translated. A reader of a *translated* page therefore had nothing to open
 * anywhere on it — and the page-level round-trip badge that used to be there
 * was deleted (bean `ktt2`) for publishing an unmeasured string as semantic
 * drift. Removing it was right; leaving nothing in its place was the gap.
 * Issue #687, bean `r3ez`.
 *
 * ## It rolls up, it does not re-measure
 *
 * Every criterion here came out of a per-block sidecar with its own witness,
 * its own hashes and its own freshness. Nothing is averaged into a page score
 * and no verdict is synthesised: a page-level `fail` is some block's `fail`,
 * and opening the panel names which block and which locale. A rolled-up number
 * that no witness stands behind is exactly the shape `ktt2` was about.
 *
 * ## An empty roll-up is `undefined`, not an empty doc
 *
 * A page whose blocks carry no translation sidecar has not been swept, which is
 * the caller's `unswept` span — a plain mark, nothing to open. Returning a doc
 * with zero criteria would render as a control that does nothing when pressed,
 * and `stateOf` would call it `unswept` anyway.
 */
export function rollUpWitnessDocs(
  family: QaFamily,
  subjects: readonly { path: string; label?: string }[],
  repoRoot: string,
  subjectName: string,
): QaWitnessDoc | undefined {
  const criteria: QaCriterionView[] = [];
  const sidecars: string[] = [];

  for (const s of subjects) {
    const doc = readWitnessDoc(family, s.path, repoRoot);
    if (!doc) continue;
    sidecars.push(...doc.sidecars);
    // `doc.subject` rather than the caller's label when the projection has
    // named itself: it is what the per-block panel shows, so the two views
    // agree on what a block is called.
    const block = s.label ?? doc.subject;
    for (const c of doc.criteria) criteria.push({ ...c, block });
  }

  if (criteria.length === 0) return undefined;

  criteria.sort(byResultThenId);
  const counts = countsOf(criteria);
  return {
    $schema: "qa-witness/v1",
    family,
    subject: subjectName,
    sidecars,
    state: stateOf(counts),
    counts,
    criteria,
  };
}

/** Worst first: a reader opening a panel is looking for what is wrong. */
const RESULT_ORDER: Record<QaCriterionView["result"], number> = {
  fail: 0,
  warn: 1,
  unknown: 2,
  pass: 3,
  "n/a": 4,
};

function byResultThenId(a: QaCriterionView, b: QaCriterionView): number {
  const d = RESULT_ORDER[a.result] - RESULT_ORDER[b.result];
  if (d !== 0) return d;
  // `block` before `locale`, and only ever set on a roll-up: a reader of a
  // page-level panel is looking for which BLOCK is wrong, and interleaving two
  // blocks' locales under one verdict makes that the one thing the list does
  // not show. Absent on a per-subject projection, where it is a no-op.
  const s = (a.block ?? "").localeCompare(b.block ?? "");
  if (s !== 0) return s;
  const l = (a.locale ?? "").localeCompare(b.locale ?? "");
  return l !== 0 ? l : a.id.localeCompare(b.id);
}
