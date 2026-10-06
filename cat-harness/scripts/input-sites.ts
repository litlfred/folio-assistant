/**
 * Which lines of a check's source can make its answer depend on something the
 * input hash does not see — and the reviewed annotation that says why one does
 * not. Bean `f017`.
 *
 * @module scripts/input-sites
 * @graphNode none — a source scanner read by `input-hash.ts`
 *
 * ## Why this exists
 *
 * `input-hash.ts` skips a check whose declared inputs hash to its last pass.
 * That is sound only if the check reads NOTHING else: no environment variable,
 * no network, no clock, no git history, no file outside the working tree, no
 * module it reaches by a computed path. Until this module that was a claim a
 * person made by reading one script, once (`task-io.ts`, "declare by reading")
 * — and a claim about a script's IMPORT CLOSURE, which moves under every edit
 * to a shared module without anybody re-reading the scripts that import it.
 *
 * So the claim is now checked mechanically, on every fingerprint: the closure
 * is walked, every line matching a {@link RISKS} pattern is a SITE, and a site
 * must carry a reviewed annotation (below) whose pin matches the code it
 * annotates. One unannotated or stale site anywhere in the closure makes the
 * fingerprint UNDETERMINED, and the check runs. Could-not-determine is never a
 * pass; an edit to a shared module costs skips, never correctness.
 *
 * ## The annotation
 *
 * A `//` comment on the line(s) directly above the site:
 *
 * ```ts
 * // input-site: env-unset FOLIO_FIXTURE_CHECKOUT #3f9c2a1b — a test-only override naming a checkout outside the tree
 * const fixture = process.env[FIXTURE_ENV];
 * ```
 *
 * The verdicts, separated by `;` when a site needs more than one:
 *
 * | verdict | means | the fingerprint then |
 * |---|---|---|
 * | `env A,B` | the site reads these variables, and their VALUES are all that reaches the answer | hashes each value (unset distinct from empty) |
 * | `env-unset A` | the variable names something outside the tree (a path, a URL) | is undetermined unless `A` is unset or empty |
 * | `tree` | the answer is a function of the working tree and index — `git ls-files`, `git rev-parse --show-toplevel` | is undetermined unless the declaration is `{tracked}` |
 * | `head` | the answer reads commit history reachable from `HEAD` — `git log`, `git rev-list HEAD` | hashes the `HEAD` commit id and the shallow boundary: a commit id names its whole history |
 * | `store` | configures or performs a branch-store read (`branch-store.ts`, `qa-store.ts`), whose every git call is reported to the trace — by `qa-store`'s snapshot as the ref it reads, by `TreeStore.git()` otherwise | nothing; a recording run tolerates only `qa-ref` lines for the `--against` refs whose identity it hashed |
 * | `refs A,B` | the answer reads these refs (`origin/main`) and the history they reach | hashes what each resolves to, missing included |
 * | `traced` | a read no check is known to reach, behind a call to `inputSiteReached()` on the line directly above it (`input-trace.ts`) | nothing — a run that reaches it records no hash |
 * | `inert` | the value read never reaches the exit code: a timestamp in a message, a duration, a temp dir removed before exit | nothing |
 * | `imports <glob>,…` | a computed `import()` / `require()` whose targets all lie under these globs | adds the globs' files to the closure as IMPORTED modules |
 * | `scripts <name>,…` | a spawned `bun run <name>` of these package.json scripts, with this process's environment | adds each script's entry files (`entryFiles`) as ENTRIES; a name that does not resolve is undetermined |
 * | `runs <glob>,…` | a spawned `bun` script whose entry files all lie under these globs, run with this process's environment | adds the globs' files to the closure as ENTRIES — their `import.meta.main` blocks run |
 *
 * The PIN is the first 8 hex digits of the sha-256 of the site's STATEMENT
 * (the site line plus the lines up to where its brackets balance, at most
 * {@link MAX_STATEMENT_LINES}, whitespace-normalised). Change the statement —
 * `git ls-files` to `git log` — and the pin is stale: the site counts as
 * unannotated until a person re-reads it and re-pins. `bun run
 * input-hash:coverage --sites <file>` prints the current pins.
 *
 * ## What this cannot see, stated rather than hidden
 *
 * - packages (bare specifiers): covered by `bun.lock`'s content, not scanned;
 * - an access spelled to dodge every pattern (`globalThis["proc"+"ess"]`) —
 *   the scanner is a reviewer's aid with a refusal default, not a sandbox;
 * - `.py` / `.sh` sources: not scanned at all, so a check that runs one is
 *   undetermined (`input-hash.ts`).
 */
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/** A statement longer than this is pinned on its first lines only. */
export const MAX_STATEMENT_LINES = 12;

/**
 * Patterns for a line whose code can read something the hash does not see.
 * Matched against code lines only (comment lines are skipped). Broad on
 * purpose: a false site costs an annotation, a missed one costs a false skip.
 */
export const RISKS: Readonly<Record<string, RegExp>> = {
  env: /\bprocess\.env\b|\bBun\.env\b|\bimport\.meta\.env\b|\bDeno\.env\b/,
  network: /\bfetch\s*\(|["']node:(?:https?|http2|net|dns|tls|dgram)["']|\bWebSocket\b|\bBun\.connect\b|\bXMLHttpRequest\b/,
  clock: /\bDate\.now\s*\(|\bnew Date\s*\(\s*\)|\bperformance\.now\s*\(|\bprocess\.hrtime\b|\bBun\.nanoseconds\b/,
  random: /\bMath\.random\s*\(|\brandomUUID\s*\(|\brandomBytes\s*\(|\bgetRandomValues\s*\(/,
  spawn: /(?<!typeof\s)\bspawnSync\b|(?<!\w)spawn\s*\(|\bexecSync\b|\bexecFileSync\b|(?<!\w)execFile\s*\(|(?<![\w.])exec\s*\(|\bBun\.spawn(?:Sync)?\b|\bBun\.\$|\bnew Worker\s*\(/,
  host: /\bhomedir\s*\(|\btmpdir\s*\(|\bhostname\s*\(|\buserInfo\s*\(|\bcpus\s*\(|\bnetworkInterfaces\s*\(/,
  computed: /(?:^|[^\w$.])import\s*\(\s*(?!["'][^"'`$]*["']\s*\))|\brequire\s*\(\s*(?!["'][^"'`$]*["']\s*\))|\beval\s*\(|\bnew Function\s*\(/,
  outside: /["'`]\/(?:home|root|tmp|etc|usr|var|proc)\//,
};

/** One reviewed verdict on a site. */
export type SiteVerdict =
  | { kind: "env"; names: string[] }
  | { kind: "env-unset"; names: string[] }
  | { kind: "tree" }
  | { kind: "head" }
  | { kind: "store" }
  | { kind: "traced" }
  | { kind: "refs"; names: string[] }
  | { kind: "inert" }
  | { kind: "imports"; globs: string[] }
  | { kind: "runs"; globs: string[] }
  | { kind: "scripts"; names: string[] };

/** A line of a source file that matched a risk. */
export interface Site {
  file: string;
  /** 1-based. */
  line: number;
  risks: string[];
  /** The pin the annotation must carry for this statement as it stands. */
  pin: string;
  /** The annotation's verdicts — `undefined` when unannotated, `"stale"` when the pin does not match. */
  verdicts: SiteVerdict[] | "stale" | undefined;
  /** Why an annotation could not be read, when it could not. */
  malformed?: string;
  /**
   * Inside an `if (import.meta.main) { … }` block: it runs only when this file
   * is the process's entry, never when it is imported.
   */
  inMain?: boolean;
}

/**
 * Annotations for files this repository cannot edit — the `bootstrap` and
 * `bootstrap-tools` submodules, whose source is pinned by commit. Keyed by
 * file, then by the statement's PIN, so a submodule bump that changes the
 * statement leaves the site unannotated, exactly as an inline pin would. Each
 * value is the verdict text an inline annotation would carry, then ` — why`.
 * Inline annotations are preferred; an entry here moves upstream with the file.
 */
export const SUBMODULE_SITES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "bootstrap-tools/scripts/git-files.ts": {
    "7e7c88ec": "tree — ls-files --cached --others --exclude-standard: the index and the untracked files",
    "481c0381": "tree — ls-files: the index and the untracked files",
  },
};

const ANNOTATION_RE = /^\s*\/\/\s*input-site:\s*(.+?)\s*#([0-9a-f]{8})\b/;

/** Parse `env A,B; tree` into verdicts, or say what is wrong with it. */
export function parseVerdicts(text: string): SiteVerdict[] | { error: string } {
  const out: SiteVerdict[] = [];
  for (const part of text.split(";").map((p) => p.trim()).filter(Boolean)) {
    const [word, ...rest] = part.split(/\s+/);
    const args = rest.join(" ").split(",").map((a) => a.trim()).filter(Boolean);
    switch (word) {
      case "env":
      case "env-unset":
        if (args.length === 0 || !args.every((a) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(a))) {
          return { error: `\`${word}\` needs variable names` };
        }
        out.push({ kind: word, names: args });
        break;
      case "scripts":
        if (args.length === 0 || !args.every((a) => /^[A-Za-z0-9:_-]+$/.test(a))) return { error: "`scripts` needs package script names" };
        out.push({ kind: "scripts", names: args });
        break;
      case "refs":
        if (args.length === 0 || !args.every((a) => /^[A-Za-z0-9_./-]+$/.test(a))) return { error: "`refs` needs ref names" };
        out.push({ kind: "refs", names: args });
        break;
      case "imports":
      case "runs":
        if (args.length === 0) return { error: `\`${word}\` needs globs` };
        out.push({ kind: word, globs: args });
        break;
      case "tree":
      case "head":
      case "store":
      case "traced":
      case "inert":
        if (args.length > 0) return { error: `\`${word}\` takes no arguments` };
        out.push({ kind: word });
        break;
      default:
        return { error: `unknown verdict \`${word}\`` };
    }
  }
  return out.length > 0 ? out : { error: "no verdict" };
}

/** The pin of the statement that starts at `lines[i]`. */
export function statementPin(lines: readonly string[], i: number): string {
  let depth = 0;
  const parts: string[] = [];
  for (let j = i; j < lines.length && j < i + MAX_STATEMENT_LINES; j++) {
    const code = lines[j]!.replace(/\/\/.*$/, "").replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '""');
    parts.push(lines[j]!.trim().replace(/\s+/g, " "));
    for (const c of code) {
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
    }
    if (depth <= 0) break;
  }
  return createHash("sha256").update(parts.join("\n")).digest("hex").slice(0, 8);
}

/**
 * A static import whose bindings keep their own names — `import { spawnSync }
 * from "node:child_process"`. Not a site itself: every USE of those names is
 * matched where it is called. A renamed, default or namespace import of a
 * module that carries a risk IS a site, since its uses no longer match.
 */
const RISKY_MODULE_RE = /["']node:(?:child_process|os|https?|http2|net|dns|tls|dgram|worker_threads)["']|["'](?:child_process|os|https?|net|dns|tls|dgram|worker_threads)["']/;
function isPlainImport(code: string): boolean {
  if (!/^\s*(?:import|export)\b[^(]*\bfrom\s*["']/.test(code) && !/^\s*\}\s*from\s*["']/.test(code)) return false;
  if (!RISKY_MODULE_RE.test(code)) return true;
  return /^\s*(?:import|export)\s*(?:type\s*)?\{[^}]*\}\s*from/.test(code) && !/\bas\b/.test(code.replace(/\bimport\s+type\b/, ""));
}

/**
 * The source with every comment removed and every string literal's CONTENTS
 * blanked, line for line — a template literal keeps its `${…}` expressions,
 * which are code. A `/…/` after an operator or at a statement start is read as
 * a regular expression and blanked too, so `/["']/` does not open a string.
 * A heuristic lexer, not a parser: where it guesses wrong it can only blank
 * too little (ADD a site) or treat a regex as division and read on — the
 * lines it then mis-blanks are still scanned.
 */
export function blankSource(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  type Mode = "code" | "line" | "block" | "sq" | "dq" | "tpl" | "re";
  let mode: Mode = "code";
  const tplDepth: number[] = []; // brace depth at each open `${`
  let depth = 0;
  let reClass = false;
  let prevSig = ""; // last significant code character, for regex detection
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    const n = text[i + 1];
    if (c === "\n") {
      out.push(cur);
      cur = "";
      if (mode === "line") mode = "code";
      if (mode === "sq" || mode === "dq" || mode === "re") mode = "code"; // unterminated: recover
      continue;
    }
    switch (mode) {
      case "line":
        continue;
      case "block":
        if (c === "*" && n === "/") {
          mode = "code";
          i++;
        }
        continue;
      case "sq":
      case "dq":
        if (c === "\\") {
          cur += "  ";
          i++;
        } else if ((mode === "sq" && c === "'") || (mode === "dq" && c === '"')) {
          cur += c;
          mode = "code";
          prevSig = c;
        } else cur += " ";
        continue;
      case "re":
        if (c === "\\") {
          cur += "  ";
          i++;
        } else if (c === "[") {
          reClass = true;
          cur += " ";
        } else if (c === "]") {
          reClass = false;
          cur += " ";
        } else if (c === "/" && !reClass) {
          cur += c;
          mode = "code";
          prevSig = c;
        } else cur += " ";
        continue;
      case "tpl":
        if (c === "\\") {
          cur += "  ";
          i++;
        } else if (c === "`") {
          cur += c;
          mode = "code";
          prevSig = c;
        } else if (c === "$" && n === "{") {
          cur += "${";
          i++;
          tplDepth.push(depth);
          depth++;
          mode = "code";
        } else cur += " ";
        continue;
      case "code":
        if (c === "/" && n === "/") {
          mode = "line";
          continue;
        }
        if (c === "/" && n === "*") {
          mode = "block";
          i++;
          continue;
        }
        if (c === "'" || c === '"' || c === "`") {
          cur += c;
          mode = c === "'" ? "sq" : c === '"' ? "dq" : "tpl";
          continue;
        }
        if (c === "/" && (prevSig === "" || /[(,=:[!&|?{};+\-*%<>~^]/.test(prevSig) || /\b(?:return|typeof|case|in|of)\s*$/.test(cur))) {
          cur += c;
          mode = "re";
          reClass = false;
          continue;
        }
        if (c === "{") depth++;
        if (c === "}") {
          depth--;
          if (tplDepth.length > 0 && tplDepth[tplDepth.length - 1] === depth) {
            tplDepth.pop();
            cur += c;
            mode = "tpl";
            continue;
          }
        }
        cur += c;
        if (!/\s/.test(c)) prevSig = c;
        continue;
    }
  }
  out.push(cur);
  return out;
}

/** Risks whose evidence is a string's CONTENT, matched on the raw line of a code line. */
const STRING_RISKS: Readonly<Record<string, RegExp>> = {
  network: /["']node:(?:https?|http2|net|dns|tls|dgram)["']/,
  outside: RISKS.outside!,
};

/**
 * The 0-based lines inside a top-level `if (import.meta.main) { … }` block,
 * found on the blanked source (so a brace in a string does not count). Only
 * the plain block form: `if (import.meta.main) await main();` runs a function
 * whose body is elsewhere, and its sites stay reachable.
 */
export function mainBlockLines(code: readonly string[]): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < code.length; i++) {
    if (!/^if\s*\(\s*import\.meta\.main\s*\)\s*\{/.test(code[i]!)) continue;
    let depth = 0;
    for (let j = i; j < code.length; j++) {
      for (const ch of code[j]!) {
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
      }
      out.add(j);
      if (depth <= 0) {
        i = j;
        break;
      }
    }
  }
  return out;
}

/** Every site in one source text, with its annotation (if any) read and checked. */
export function scanSource(file: string, text: string): Site[] {
  const lines = text.split("\n");
  const code = blankSource(text);
  const main = mainBlockLines(code);
  const sites: Site[] = [];
  for (let i = 0; i < lines.length; i++) {
    const c = code[i] ?? "";
    if (c.trim() === "") continue;
    const raw = lines[i]!;
    // A multi-line `import { … } from "…"` is judged as one statement.
    if (/^\s*(?:import|export)\s*(?:type\s*)?\{[^}]*$/.test(c) && !/\bfrom\s*["']/.test(raw)) {
      let j = i;
      const parts = [raw];
      while (j + 1 < lines.length && !/\bfrom\s*["']/.test(lines[j]!) && j - i < 200) parts.push(lines[++j]!);
      if (isPlainImport(parts.map((p) => p.trim()).join(" "))) {
        i = j;
        continue;
      }
    }
    if (isPlainImport(raw)) continue;
    const risks = new Set<string>();
    // A renamed, default or namespace import of a risky module: its uses may
    // not match a call pattern (`cp.exec(…)`), so the import itself is a site.
    if (/^\s*(?:import|export)\b/.test(c) && RISKY_MODULE_RE.test(raw)) risks.add("aliased-import");
    for (const [k, re] of Object.entries(RISKS)) if (k !== "outside" && re.test(c)) risks.add(k);
    for (const [k, re] of Object.entries(STRING_RISKS)) if (re.test(raw.replace(/\s\/\/\s.*$/, ""))) risks.add(k);
    if (risks.size === 0) continue;
    const pin = statementPin(lines, i);
    let verdicts: Site["verdicts"];
    let malformed: string | undefined;
    // A `traced` site's annotation sits above its `inputSiteReached(…)` call.
    const hook = i > 0 && /^\s*inputSiteReached\(/.test(lines[i - 1]!);
    for (let j = i - (hook ? 2 : 1); j >= 0 && lines[j]!.trim().startsWith("//"); j--) {
      const m = ANNOTATION_RE.exec(lines[j]!);
      if (m === null) continue;
      const parsed = parseVerdicts(m[1]!);
      if ("error" in parsed) malformed = parsed.error;
      else if (parsed.some((v) => v.kind === "traced") !== hook) {
        malformed = hook ? "a site behind inputSiteReached() must be annotated `traced`" : "`traced` needs an inputSiteReached() call on the line directly above the site";
      } else verdicts = m[2] === pin ? parsed : "stale";
      break;
    }
    const side = verdicts === undefined && malformed === undefined ? SUBMODULE_SITES[file]?.[pin] : undefined;
    if (side !== undefined) {
      const parsed = parseVerdicts(side.split(" — ")[0]!);
      if ("error" in parsed) malformed = `SUBMODULE_SITES: ${parsed.error}`;
      else verdicts = parsed;
    }
    sites.push({ file, line: i + 1, risks: [...risks], pin, verdicts, ...(malformed ? { malformed } : {}), ...(main.has(i) ? { inMain: true } : {}) });
  }
  return sites;
}

const IMPORT_RE =
  /(?:^|[^\w$.])(?:import|export)\s[^'"`;]*?from\s*["']([^"']+)["']|(?:^|[^\w$.])import\s*["']([^"']+)["']|(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g;

function resolveModule(fromFile: string, spec: string): string | undefined {
  const base = resolve(dirname(fromFile), spec);
  for (const c of [base, base.replace(/\.js$/, ".ts"), `${base}.ts`, `${base}.tsx`, `${base}.js`, join(base, "index.ts"), join(base, "index.js")]) {
    try {
      if (statSync(c).isFile()) return c;
    } catch {
      /* try the next */
    }
  }
  return undefined;
}

/** What an audited closure contributes to a fingerprint. */
export interface AuditedClosure {
  /** Every source file reached, repo-relative, sorted. */
  files: string[];
  /** Variables whose values must be hashed. */
  env: string[];
  /** Variables that must be unset or empty. */
  envUnset: string[];
  /** Whether some site's answer is a function of the whole tree (`tree`). */
  needsTree: boolean;
  /** Whether some site reads history reachable from `HEAD` (`head`). */
  needsHead: boolean;
  /** Refs some site reads (`refs`). */
  refs: string[];
}

/** Per-run memo of each file's scan, keyed by absolute path + size + mtime. */
export class SiteMemo {
  private memo = new Map<string, { key: string; sites: Site[]; imports: string[] }>();
  read(abs: string, root: string): { sites: Site[]; imports: string[] } {
    const st = statSync(abs);
    const key = `${st.size}:${st.mtimeMs}`;
    const hit = this.memo.get(abs);
    if (hit !== undefined && hit.key === key) return hit;
    const text = readFileSync(abs, "utf-8");
    const sites = scanSource(relative(root, abs), text);
    const imports: string[] = [];
    // Imports are read from code lines only, as sites are, so an example in a
    // docblock is not followed.
    // `import type` / `export type … from` are erased before the module runs,
    // so they load nothing and are not followed.
    const code = text
      .split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n")
      .replace(/(^|\n)\s*(?:import|export)\s+type\s[^;]*?from\s*["'][^"']+["']/g, "$1");
    for (const m of code.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3];
      if (spec !== undefined && spec.startsWith(".")) imports.push(spec);
    }
    const entry = { key, sites, imports };
    this.memo.set(abs, entry);
    return entry;
  }
  private globs = new Map<string, string[]>();
  /** A glob's matches under `root`, memoised for the run: a `**` glob walks the whole tree. */
  glob(root: string, g: string): string[] {
    const key = `${root}\0${g}`;
    let hit = this.globs.get(key);
    if (hit === undefined) {
      hit = [...new Bun.Glob(g).scanSync({ cwd: root, onlyFiles: true })].filter(
        // Tests are never a load target (bun runs them, a check does not), and
        // packages are covered by `bun.lock`.
        (f) => !/(^|\/)node_modules\//.test(f) && !/\.test\.[jt]sx?$/.test(f),
      );
      this.globs.set(key, hit);
    }
    return hit;
  }
  clear(): void {
    this.memo.clear();
    this.globs.clear();
  }
}

/** Why a site is not good enough, in the words `--explain` prints. */
export function siteProblem(s: Site): string | undefined {
  const where = `${s.file}:${s.line} (${s.risks.join(", ")})`;
  if (s.malformed !== undefined) return `malformed input-site annotation at ${where}: ${s.malformed}`;
  if (s.verdicts === undefined) {
    return s.risks.includes("computed")
      ? `unannotated non-literal dynamic import or computed load at ${where}`
      : `unannotated input site at ${where}`;
  }
  if (s.verdicts === "stale") return `stale input-site pin at ${where} — the statement changed; re-read it and re-pin #${s.pin}`;
  return undefined;
}

/**
 * Walk the RELATIVE-import closure of `entries` and audit every site in it.
 * Returns undetermined on the first site that is unannotated, stale or
 * malformed, on an import that does not resolve, and on an `imports` glob
 * that matches nothing.
 */
export function auditClosure(
  root: string,
  entries: readonly string[],
  memo: SiteMemo = new SiteMemo(),
  /** Report: gather EVERY problem instead of stopping at the first (`input-hash:coverage`). */
  problems?: string[],
  /** Resolves a `scripts` verdict's package script to its entry files; absent, such a site is undetermined. */
  scriptEntries?: (name: string) => string[] | undefined,
): AuditedClosure | { undetermined: string } {
  // A file is visited at most twice: once IMPORTED (its `import.meta.main`
  // block does not run) and once as an ENTRY (it does). Entry subsumes import.
  const seen = new Map<string, "import" | "entry">();
  const env = new Set<string>();
  const envUnset = new Set<string>();
  let needsTree = false;
  let needsHead = false;
  const refs = new Set<string>();
  const stack: { file: string; entry: boolean }[] = entries.map((e) => ({ file: resolve(root, e), entry: true }));
  const pushGlobs = (globs: readonly string[], entry: boolean) => {
    // A glob matching nothing is allowed: a computed load that today loads
    // nothing reads nothing. That the globs cover what the DATA names is a
    // test's job (`input-sites.test.ts`), since the data is in the tree a
    // {tracked} fingerprint hashes anyway. Tests are never a target: bun runs
    // them, a check does not.
    for (const g of globs) for (const f of memo.glob(root, g)) stack.push({ file: join(root, f), entry });
  };
  while (stack.length > 0) {
    const { file, entry } = stack.pop()!;
    const prior = seen.get(file);
    if (prior === "entry" || (prior === "import" && !entry)) continue;
    seen.set(file, entry ? "entry" : "import");
    if (!/\.(m?[jt]sx?)$/.test(file)) continue;
    const { sites, imports } = memo.read(file, root);
    for (const s of sites) {
      if (s.inMain === true && !entry) continue;
      const problem = siteProblem(s);
      if (problem !== undefined) {
        if (problems === undefined) return { undetermined: problem };
        problems.push(problem);
        continue;
      }
      for (const v of s.verdicts as SiteVerdict[]) {
        if (v.kind === "env") v.names.forEach((n) => env.add(n));
        else if (v.kind === "env-unset") v.names.forEach((n) => envUnset.add(n));
        else if (v.kind === "tree") needsTree = true;
        else if (v.kind === "head") needsHead = true;
        else if (v.kind === "refs") v.names.forEach((n) => refs.add(n));
        else if (v.kind === "imports") pushGlobs(v.globs, false);
        else if (v.kind === "runs") pushGlobs(v.globs, true);
        else if (v.kind === "scripts") {
          for (const name of v.names) {
            const files = scriptEntries?.(name);
            if (files === undefined) {
              const why = `input-site at ${s.file}:${s.line} runs package script ${name}, which does not resolve to script files`;
              if (problems === undefined) return { undetermined: why };
              problems.push(why);
              continue;
            }
            for (const f of files) stack.push({ file: resolve(root, f), entry: true });
          }
        }
      }
    }
    if (prior === "import") continue; // its imports were followed on the first visit
    for (const spec of imports) {
      const target = resolveModule(file, spec);
      // A module Bun cannot load fails the script when run; running it is the answer.
      if (target === undefined) return { undetermined: `${relative(root, file)} imports unresolvable ${spec}` };
      stack.push({ file: target, entry: false });
    }
  }
  if (problems !== undefined && problems.length > 0) return { undetermined: problems[0]! };
  return {
    files: [...seen.keys()].map((f) => relative(root, f)).sort(),
    env: [...env].sort(),
    envUnset: [...envUnset].sort(),
    needsTree,
    needsHead,
    refs: [...refs].sort(),
  };
}
