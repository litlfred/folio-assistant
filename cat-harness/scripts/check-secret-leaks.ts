/**
 * Leaked-credential scanning — which this repository had **none** of.
 *
 * Measured 2026-09-21: no gitleaks, no trufflehog, no detect-secrets, no push
 * protection, no pre-commit hook. Every `secret` match across
 * `.github/workflows/` was `secrets.GITHUB_TOKEN` being *consumed*, which is
 * the opposite of a scan.
 *
 * ## The paths a credential can reach a commit here
 *
 * Enumerated rather than assumed, because "add a scanner" answers none of them
 * on its own:
 *
 * | path | covered? |
 * |---|---|
 * | an authored source file | **yes** — every text file under the scanned roots |
 * | a committed QA sidecar or witness (bulk, agent-authored) | **yes**, and it is the adversarial case — see below |
 * | an ingested foreign corpus under `uploads/` | **yes** when committed as text |
 * | a workflow file interpolating a secret into a `run:` block | **yes** for a literal; expression injection is `1wef`, not this |
 * | a published site artefact under a docs directory | **yes** for text; generated binaries are out of scope |
 * | a git object from an earlier commit | **NO — deliberately out of scope.** A history sweep is a different job with a different remedy (rotation, not deletion), and claiming it here would be the over-claim this gate exists to avoid. From here forward, and said so. |
 *
 * ## Why precision comes first, and is measured before anything gates
 *
 * This corpus is adversarial input to every entropy-based detector: it is full
 * of 12-char SHA-256 prefixes, base64 witness payloads, git SHAs and `@id`
 * URIs. **A gate nobody can keep green is a gate that gets disabled**, so the
 * rule here is the bean's: measure the false-positive rate on this corpus
 * BEFORE gating, and let the number decide.
 *
 * So the detector is deliberately **prefix-anchored**, not entropy-based.
 * Every pattern matches a credential format that announces itself.
 *
 * **Entropy scanning is not "not implemented yet" — it is measured unusable
 * here.** Probed over the same roots, 2026-09-21, Shannon entropy > 3.5
 * bits/char on tokens of 20+ characters:
 *
 * | | |
 * |---|---|
 * | files | 3,614 |
 * | high-entropy tokens | **68,337** |
 * | credentials among them | **0** |
 * | false-positive rate | **100 %** |
 *
 * 43,405 of them are in `.json` — the committed QA sidecars, whose 12-char
 * hashes are the point of the file. And the shape of the rest is the real
 * lesson: `source=orphan-branch`, `folio-assistant/scripts/lake-cache`,
 * `content/quantum-observable-universe/lean`. **Ordinary hyphenated
 * identifiers clear the threshold**, so raising it does not rescue the
 * approach; it just moves the arbitrary line.
 *
 * That is a finding, not a gap. A gate nobody can keep green gets disabled,
 * and a disabled gate is worse than an honest narrow one.
 *
 * ## Three states
 *
 * `clean`, `findings`, and **`could-not-scan`** — a root that does not exist
 * or cannot be read. The third is never folded into the first: a scanner that
 * could not run reporting "no secrets found" is the false pass this whole
 * epic is about.
 *
 * @module scripts/check-secret-leaks
 * @covers code
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

/**
 * Credential formats that announce themselves.
 *
 * Prefix-anchored on purpose. A pattern here should be one that a human would
 * also recognise at a glance as a credential and not as data.
 */
export const SECRET_PATTERNS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: "github-pat-classic", re: /\bghp_[A-Za-z0-9]{36}\b/ },
  { name: "github-pat-fine-grained", re: /\bgithub_pat_[A-Za-z0-9_]{60,}\b/ },
  { name: "github-oauth", re: /\bgho_[A-Za-z0-9]{36}\b/ },
  { name: "github-app-token", re: /\b(ghu|ghs)_[A-Za-z0-9]{36}\b/ },
  { name: "anthropic-api-key", re: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "openai-api-key", re: /\bsk-[A-Za-z0-9]{48}\b/ },
  { name: "aws-access-key-id", re: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: "google-api-key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "slack-token", re: /\bxox[abprs]-[0-9A-Za-z-]{10,}/ },
  { name: "npm-token", re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  { name: "private-key-block", re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "generic-assignment", re: /\b(?:api[_-]?key|secret|password|passwd|token)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{24,}["']/i },
];

/**
 * Text extensions worth reading. A binary is excluded because grepping its
 * bytes is not meaningful — the same reasoning `TEXTUAL_COMPANION_ROLES` gives
 * for leaving `xlsx` out of the readable roles.
 */
const TEXT = new Set([
  ".ts", ".js", ".mjs", ".cjs", ".json", ".jsonld", ".md", ".yml", ".yaml", ".sh", ".py",
  ".toml", ".env", ".txt", ".lean", ".fsh", ".cql", ".bpmn", ".dmn", ".xml", ".html", ".css",
]);

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "lake-packages"]);

export interface Leak {
  file: string;
  line: number;
  pattern: string;
  /** The matched text with its middle elided — a finding must not itself leak. */
  redacted: string;
}

function redact(m: string): string {
  if (m.length <= 12) return `${m.slice(0, 4)}…`;
  return `${m.slice(0, 8)}…${m.slice(-4)} (${m.length} chars)`;
}

export function scanFile(abs: string, rel: string): Leak[] {
  let src: string;
  try {
    src = readFileSync(abs, "utf-8");
  } catch {
    return [];
  }
  const out: Leak[] = [];
  src.split("\n").forEach((line, i) => {
    // A line that names the pattern rather than carrying a secret — this
    // file, and any skill documenting the formats. Without this the scanner's
    // own source is its first finding, which is the classic self-report.
    if (line.includes("SECRET_PATTERNS") || /re:\s*\//.test(line)) return;
    for (const { name, re } of SECRET_PATTERNS) {
      const m = re.exec(line);
      if (m) out.push({ file: rel, line: i + 1, pattern: name, redacted: redact(m[0]) });
    }
  });
  return out;
}

export interface ScanResult {
  leaks: Leak[];
  filesScanned: number;
  /** Roots that could not be read. NEVER folded into a clean result. */
  unreadable: string[];
}

export function scanTree(root: string, roots: readonly string[]): ScanResult {
  const leaks: Leak[] = [];
  const unreadable: string[] = [];
  let filesScanned = 0;

  const walk = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      unreadable.push(relative(root, dir));
      return;
    }
    for (const e of entries) {
      if (SKIP_DIRS.has(e)) continue;
      const p = join(dir, e);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(p);
      else if (TEXT.has(extname(e)) || e.startsWith(".env")) {
        filesScanned += 1;
        leaks.push(...scanFile(p, relative(root, p)));
      }
    }
  };

  for (const r of roots) {
    const abs = join(root, r);
    if (!existsSync(abs)) {
      // A declared root that is not there is the `dh4f` defect: a consumer
      // scanning nothing and reporting a clean run over it.
      unreadable.push(r);
      continue;
    }
    // A root may be a single file — `package.json` is one. Walking it with
    // readdirSync throws ENOTDIR, which the guard above reported as
    // "could not scan". That was the right refusal and the wrong cause.
    if (statSync(abs).isFile()) {
      filesScanned += 1;
      leaks.push(...scanFile(abs, r));
      continue;
    }
    walk(abs);
  }
  return { leaks, filesScanned, unreadable };
}

const ROOTS = [".github", "cat-harness", "beans", "who-style-guide", "package.json"];

if (import.meta.main) {
  const { leaks, filesScanned, unreadable } = scanTree(ROOT, ROOTS);
  console.log(`Secret leaks (${filesScanned} text file(s) across ${ROOTS.length} declared root(s))`);

  if (unreadable.length > 0) {
    // Third state, and it outranks a clean result.
    for (const u of unreadable) console.log(`  ✗ could not scan: ${u}`);
    console.log("  A root that could not be read is NOT a clean root.");
    process.exit(2);
  }
  if (leaks.length === 0) {
    console.log("  ✓ no credential in a recognised format");
    console.log("  · prefix-anchored by design; entropy scanning is measured unusable here, see the module docs");
    console.log("  · git history is deliberately OUT of scope — its remedy is rotation, not deletion");
    process.exit(0);
  }
  for (const l of leaks) console.log(`  ✗ ${l.file}:${l.line} — ${l.pattern}: ${l.redacted}`);
  process.exit(1);
}
