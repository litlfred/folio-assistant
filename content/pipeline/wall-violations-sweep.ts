/**
 * Wall-violations sweep (audit P0.1).
 *
 * Greps proof-body markdown for Archimedean / hyperbolic / Mostow /
 * Kashaev / SnapPy / Thurston / Murakami / Gromov references at the
 * derivation level (proof body, not statement / citation / cross-ref).
 *
 * Each hit is auto-triaged into one of five buckets:
 *   citation, appendix-surreals, verification-witness,
 *   tau-side-label, candidate.
 *
 * Only `candidate` requires manual review. Citations and τ-image
 * labels are correct usage; appendix-surreals is post-Archimedean by
 * design.
 *
 * Output: folio-assistant/computations/wall-violations.witness.json
 *
 * Usage (from repo root):
 *   bun run content/pipeline/wall-violations-sweep.ts
 *
 * Pair: docs/audits/2026-05-01-wall-violations-sweep.md
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, basename, relative } from "path";

type Hit = { file: string; line: number; pattern: string; text: string; triage: "citation" | "tau-side-label" | "appendix-surreals" | "verification-witness" | "candidate" };

const PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "Mostow rigidity", re: /\bmostow\b/i },
  { name: "Vol(K) hyperbolic volume", re: /\bvol\s*\(\s*K\s*\)|\bvol\s*\(\s*L\s*\)|hyperbolic\s+volume\b/i },
  { name: "Gromov norm/volume", re: /\bgromov(\s+norm)?\b/i },
  { name: "Thurston geometrization", re: /\bthurston\b/i },
  { name: "Kashaev limit", re: /\bkashaev(\s+limit|\s+conjecture)?\b/i },
  { name: "Murakami volume", re: /\bmurakami\b/i },
  { name: "SnapPy", re: /\bsnappy\b/i },
  { name: "Hyperbolic moduli/structure", re: /\bhyperbolic\s+(structure|moduli|metric|manifold)/i },
  { name: "Cusp shape (analytic)", re: /\banalytic\s+cusp|\bcusp\s+shape/i },
  { name: "SW thimble", re: /\bsw\s+thimble|stokes\s+thimble/i },
];

function classify(file: string, line: string): Hit["triage"] {
  if (/\\cite\{[^}]*\}/.test(line)) return "citation";
  // Surreals appendix: by definition post-Archimedean
  if (/appendix-surreals/.test(file)) return "appendix-surreals";
  // Verification-witness usage (auxiliary numerical check, not derivation input)
  if (/\b(snappy|hyperbolic\s+volume)\s+(witness|verification)|independently\s+verified|verified\s+by\s+(the\s+)?snappy|witness\s+([a-z]*\s+)?(verifies|confirms|computes)|computed\s+(numerically\s+)?by\s+snappy/i.test(line)) {
    return "verification-witness";
  }
  if (/#(conj:hyperbolic-volume-transcendence|conj:kashaev-volume-conjecture|conj:knot-factor-frobenius-pairing|conj:single-volume-irrationality|conj:kashaev-surreal|prop:vol-through-tau|def:archimedean-realization-functor|rem:kashaev-as-archimedean-realization|prop:topological-mass-formula|rem:body-asymptotics-catalog|prf:knot-volumes-verification)/.test(line)) return "tau-side-label";
  if (/post[\s-]?archimedean|τ[\s-]?image|tau[\s-]?image|ℂ[\s-]?side|right[\s-]?of[\s-]?τ|right[\s-]?of[\s-]?tau|archimedean[\s-]?(limit|realization|shadow|side)|classical[\s-]?(limit|kashaev)|τ-pullback|non[\s-]?hyperbolic|geometric.*side|τ.*side|tau.*side|no.+(thurston|geometrization).+(input|required|needed)|geometrization.+(input|required|needed).+(no|not)|disclaim|side.+(geometric|τ-image)/i.test(line)) return "tau-side-label";
  // Meta-discussion: sentences enumerating forbidden patterns (e.g.
  // "(Vol(K), hyperbolic, Mostow, …)") in the audit-tool's own
  // narrative are not violations themselves.
  if (/sweep[s]?\s+(the\s+)?(paper|proof|content|file)|forbid[s]?|forbidden|violation[s]?|examples?\s+of|such\s+(as|inputs)|(?:Vol\(K\),\s*hyperbolic|hyperbolic,\s*Mostow|Mostow,\s*Gromov|Kashaev,\s*Murakami)/i.test(line)) return "tau-side-label";
  return "candidate";
}

function checkLine(file: string, line: string): Array<{ pattern: string; text: string; triage: Hit["triage"] }> {
  const hits: Array<{ pattern: string; text: string; triage: Hit["triage"] }> = [];
  for (const p of PATTERNS) if (p.re.test(line)) hits.push({ pattern: p.name, text: line.trim().slice(0, 200), triage: classify(file, line) });
  return hits;
}

function processFile(p: string, results: Hit[]) {
  const src = readFileSync(p, "utf8");
  const isDedicatedProof = basename(p).endsWith("-proof.md");
  const lines = src.split("\n");
  let inFence = false, inProof = false;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/^```/.test(ln)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (isDedicatedProof) { inProof = true; }
    else {
      if (/^(##+\s+|>\s*)?(\*\*)?(\\?textbf\{)?proof\b/i.test(ln) || /^\*Proof\.\*/.test(ln) || /^\*\*Proof\.\*\*/.test(ln)) { inProof = true; continue; }
      // End-of-proof markers: explicit ✑ / Q.E.D. only — `^##\s`
      // (any level-2 heading) is too broad and would terminate scans
      // on subheadings inside a proof, missing later violations.
      // Audit tools prefer false positives (scanning too much) over
      // false negatives (missing violations).
      if (inProof && /^\$\\square\$|^\\square|\bQ\.E\.D\.|\bQED\b/.test(ln)) { inProof = false; continue; }
    }
    if (!inProof) continue;
    const hits = checkLine(p, ln);
    for (const h of hits) results.push({ file: relative(process.cwd(), p), line: i + 1, ...h });
  }
}

function walk(dir: string, results: Hit[]) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e); const s = statSync(p);
    if (s.isDirectory()) { walk(p, results); continue; }
    if (!p.endsWith(".md")) continue;
    if (basename(p).startsWith("index")) continue;
    processFile(p, results);
  }
}

const results: Hit[] = [];
walk("content/quantum-observable-universe", results);
const seen = new Set<string>();
const unique = results.filter(h => { const k = `${h.file}|${h.line}|${h.pattern}`; if (seen.has(k)) return false; seen.add(k); return true; });

const buckets: Record<string, Hit[]> = { candidate: [], "tau-side-label": [], "verification-witness": [], "appendix-surreals": [], citation: [] };
for (const h of unique) buckets[h.triage].push(h);

const witness = {
  computation: "wall-violations-sweep",
  computedAt: new Date().toISOString(),
  description: "Audit P0.1 — strict-Archimedean-wall enforcement at the proof level. Greps proof bodies for Mostow / Vol(K) / Gromov / Thurston / Kashaev / Murakami / SnapPy / hyperbolic / cusp shape / SW thimble. Auto-triage buckets: 'citation' (cite-adjacent, OK), 'appendix-surreals' (whole chapter is post-Archimedean by design, OK), 'verification-witness' (auxiliary numerical check — SnapPy/Vol independently verifies an algebraically-derived value, OK), 'tau-side-label' (refers to a τ-image block, OK), 'candidate' (manual review required).",
  patternCount: PATTERNS.length,
  fileCount: new Set(unique.map(h => h.file)).size,
  totalHits: unique.length,
  triage: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length])),
  hits: unique,
};

const outputPath = process.argv[2] ?? "folio-assistant/computations/wall-violations.witness.json";
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(witness, null, 2) + "\n");
console.log(`Wrote ${outputPath}`);
console.log(`Total: ${unique.length}`);
for (const [k, v] of Object.entries(buckets)) console.log(`  ${k.padEnd(22)} ${v.length}`);
console.log(`\n# Candidates (manual review):`);
for (const c of buckets.candidate) console.log(`  ${c.file}:${c.line} [${c.pattern}]`);
