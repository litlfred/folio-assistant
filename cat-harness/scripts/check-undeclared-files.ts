#!/usr/bin/env bun
/**
 * The reverse sweep: files on disk that no declaration names.
 *
 * @module scripts/check-undeclared-files
 * @covers cat-harness
 *
 * `check-declared-assets.ts` walks **declared → disk**: it reports a declared
 * asset that is missing, a dead link, or one it could not check. Nothing walked
 * the other way, and the gap is not symmetric with it — it is the `dh4f` shape
 * INVERTED:
 *
 * | | |
 * |---|---|
 * | `dh4f` | declared but absent, so a consumer scans nothing and **reports a clean run** |
 * | this | present but undeclared, so **no consumer ever sees it at all** |
 *
 * ## The measured cost
 *
 * Commit `0301fbd2` added three 1.6–1.8 MB PNGs at the repository root, with
 * spaces and commas in their filenames, and **no gate noticed**. They sat
 * outside every instance, undeclared and invisible; they were found only
 * because somebody went looking by hand. An automated pass then misread them as
 * a regeneration of the existing landing art and recommended overwriting three
 * declared `.webp` files — opening the image showed a completely different
 * costume. Both halves of that near-miss trace to one absence: **a file nothing
 * declares is a file nothing reasons about.**
 *
 * ## Why the repository root is swept EXPLICITLY
 *
 * This paragraph read that `check-declared-assets.ts` carries
 * `DECLARED_INSTANCES = ["cat-harness", "bootstrap"]` and that "since the
 * instance moved under `cat-harness/` the repository root is deliberately
 * **not an instance**". **Both halves are now false**, and they became false
 * a day apart: the root gained a `harness.json` of its own
 * (`folio-assistant-checkout`), and the literal was replaced by
 * `declaredInstances()`, which discovers instead of listing (bean `6tkl`).
 *
 * The CONCLUSION survives its premises, which is why the section stays. The
 * root is named here as its own subject rather than reached by accident: a
 * sweep that covered it only as a side effect of some other rule would stop
 * covering it the first time that rule changed — and that rule has now changed
 * twice while this sweep kept working.
 *
 * ## What counts as accounted for
 *
 * A root entry is accounted for when it is one of:
 *
 * 1. **an instance** — a directory holding its own `harness.json`;
 * 2. **a declared directory** of any instance, resolved at repository scope
 *    (`beans/`, `todos/` and friends live at the root by declaration);
 * 3. **repository infrastructure** — {@link ROOT_INFRASTRUCTURE}, which is a
 *    list with a reason per entry rather than a pile of extensions;
 * 4. **git's own business** — dotfiles, `node_modules/`, ignored paths.
 *
 * Anything else is reported. The report is a **finding, not an action**:
 * `deletion-requires-confirmation` governs what happens next, and four of this
 * sweep's five current findings are somebody's uploaded documents.
 *
 * Exit codes: 0 report only, or `--check` with nothing unaccounted · 1 `--check`
 * with findings.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { findDeclarationFile, instanceRootFor, readDeclaration, repoRootFor, rootForScope } from "../schemas/cat-harness.js";
import { instanceConfigFilename } from "../schemas/harness-config.js";

/**
 * Repository-level files that belong at the root, each with why.
 *
 * **A list with reasons, not a pattern.** `*.json` would account for a config
 * and also for any JSON anybody ever drops here, which is the failure this
 * sweep exists to catch. Every entry below is a file whose location is fixed
 * by a tool that looks for it there.
 *
 * ## The instance configs are COMPUTED, and that is not a pattern either
 *
 * `harness.config.json` was an entry here until 2026-09-20. The config is
 * `<instance>.config.json` now, one per instance at the instantiation root,
 * so a fixed entry could only ever account for one of them — and `*.config.json`
 * would be exactly the wildcard this list exists to refuse.
 *
 * {@link instanceConfigNames} therefore asks the DECLARATIONS which names are
 * legitimate. That is still a list with reasons: the reason each name is
 * allowed is that an instance in this checkout declares it, which is a better
 * reason than a line in a constant, and a config for an instance that is not
 * here stays a finding.
 */
export const ROOT_INFRASTRUCTURE: Readonly<Record<string, string>> = {
  "package.json": "bun/npm reads it from the repository root",
  "bun.lock": "the lockfile beside package.json",
  "bunfig.toml": "bun's own config, root-only",
  "tsconfig.json": "tsc's project root",
  "eslint.config.mjs": "eslint flat config, root-only",
  "playwright.config.ts": "playwright's project root",
  "test-server.mjs": "the e2e test server playwright.config.ts starts",
  Dockerfile: "the image build context is the repository",
  "harness.config.example.json": "the worked example beside it",
  "upstream-pins.json": "the pinned upstream revisions check-upstream-pins.ts reads",
  "requirements.txt": "the Python toolchain, read from the root",
  "requirements-extended.txt": "the optional half of the same",
  "AGENTS.md": "the agent-generic instructions every tool looks for at the root",
  "CLAUDE.md": "the tool-specific stub pointing at AGENTS.md",
  "GEMINI.md": "the same, for another tool",
  "README.md": "what a person landing on the repository reads",
  LICENSE: "the repository's licence",
  "LICENSE-CONTENT.md": "the separate licence for content",
  NOTICE: "attribution required by the licence",
  "THIRD-PARTY-NOTICES.md": "the dependency attributions",
  // The one root-level entry that is neither config nor prose. Tool definitions
  // live at `<stub>/tools/*.ts` so a composed instance can contribute its own
  // without colliding on a filename — but FIVE modules import `../tools/index.js`,
  // and had the move stopped at relocating the files, each would now name this
  // instance's stub. That is the defect the stub pattern exists to remove,
  // reintroduced one directory along. The barrel stays at the top on purpose.
  tools: "the merged Tool barrel five modules import as `../tools/index.js`",
  // Playwright's `outputDir`, created by a run rather than authored. Accounted
  // for here rather than left to `gitIgnored`, and the difference is worth
  // noticing: `_kg/` IS in `.gitignore` and this is not, so a run leaves an
  // untracked directory at the root that git will keep offering. Nothing is
  // committed from it today — it holds one dotfile — so this is an
  // inconsistency to raise, not a defect to fix inside a sweep.
  "test-results": "playwright's outputDir, created by a run (note: not gitignored, unlike _kg/)",
};

/**
 * Paths git itself ignores — asked of git rather than listed here.
 *
 * `_kg/` is the case that forced this: a repository build output, gitignored at
 * the root, which a hand-kept exclusion list would have had to learn about. Git
 * already knows, and a second list of ignored paths is a second answer free to
 * disagree with `.gitignore`.
 *
 * Returns an empty set when git is unavailable rather than throwing: a sweep
 * that cannot consult git over-reports, which is the safe direction — the
 * failure being guarded against is a file going UNSEEN.
 */
export function gitIgnored(repoRoot: string, names: readonly string[]): Set<string> {
  if (names.length === 0) return new Set();
  const r = spawnSync("git", ["check-ignore", "--stdin"], {
    cwd: repoRoot,
    input: `${names.join("\n")}\n`,
    encoding: "utf8",
  });
  if (r.error) return new Set();
  return new Set(
    r.stdout
      .split("\n")
      .map((l) => l.trim().replace(/\/$/, ""))
      .filter((l) => l.length > 0),
  );
}

/**
 * Directories that exist only to HOLD ignored files.
 *
 * `gitIgnored` asks whether a path is itself ignored, and for `scripts/` the
 * answer is no — `.gitignore` names `__pycache__/`, not `scripts/`. So a root
 * directory containing nothing but a `__pycache__` was reported as
 * unaccounted-for, and the consequence was asymmetric in the worst direction:
 * **CI stayed green** (a clean checkout has no bytecode) while **every
 * contributor who ran the Python tests went red locally**. The gate failed for
 * the people doing the work and passed for the machine that was not.
 *
 * From git's point of view such a directory is not part of the repository's
 * content at all: nothing in it is tracked, and nothing in it is untracked
 * either, because every candidate is ignored. It exists on disk as a side
 * effect of running something.
 *
 * Both questions have to be asked. `git status` alone would call a directory
 * of tracked, unmodified files empty; `git ls-files` alone would miss one
 * holding only new files a contributor has not added yet.
 *
 * Returns false when git is unavailable, so the sweep REPORTS rather than
 * skips — the same direction `gitIgnored` takes, and for the same reason: the
 * failure being guarded against is a file going unseen.
 */
export function holdsOnlyIgnored(repoRoot: string, name: string): boolean {
  const ask = (args: string[]): string | undefined => {
    const r = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
    return r.error || r.status !== 0 ? undefined : r.stdout;
  };
  const tracked = ask(["ls-files", "--", name]);
  const untracked = ask(["status", "--porcelain", "--untracked-files=all", "--", name]);
  if (tracked === undefined || untracked === undefined) return false;
  return tracked.trim() === "" && untracked.trim() === "";
}

/** Directories no sweep should walk, whatever git says. */
export const IGNORED_ROOT_DIRS = ["node_modules", ".git"] as const;

/** One thing on disk that no declaration accounts for. */
export interface UndeclaredEntry {
  path: string;
  kind: "file" | "directory";
  bytes: number;
}

/**
 * The config filename each declared instance is entitled to at this root.
 *
 * Asked of the declarations rather than listed, because the names are the
 * instances' own (`<name>.config.json`, 2026-09-20). An unreadable
 * declaration contributes NOTHING rather than a guess: the config stays
 * unaccounted for and the sweep reports it, which is the right way round —
 * "could not tell" must not buy a file its place on the list.
 */
export function instanceConfigNames(repoRoot: string): Map<string, string> {
  const out = new Map<string, string>();
  const roots: string[] = [];
  if (findDeclarationFile(repoRoot) !== undefined) roots.push(repoRoot);
  for (const e of readdirSync(repoRoot, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const d = join(repoRoot, e.name);
    if (findDeclarationFile(d) !== undefined) roots.push(d);
  }
  for (const r of roots) {
    let name: string | undefined;
    try {
      name = readDeclaration(r)?.name;
    } catch {
      continue; // unreadable ⇒ no claim
    }
    if (name !== undefined) {
      out.set(instanceConfigFilename(name), `the config of the instance declared at ${relative(repoRoot, r) || "."}`);
    }
  }
  return out;
}

/** Every root-level path that IS accounted for, and by what. */
export function accountedRootPaths(repoRoot: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const [name, why] of Object.entries(ROOT_INFRASTRUCTURE)) out.set(name, `infrastructure: ${why}`);
  for (const [name, why] of instanceConfigNames(repoRoot)) out.set(name, `infrastructure: ${why}`);
  for (const d of IGNORED_ROOT_DIRS) out.set(d, "not this sweep's business");

  // TWO PASSES, and the order is the whole correctness argument.
  //
  // A single pass got this wrong in a way that only CI could see. It marked a
  // directory "an instance", then walked that instance's declared directories
  // and OVERWROTE entries — and `cat-harness` declares `bootstrap/skills/` at
  // repository scope, whose first segment is `bootstrap`. So whether
  // `bootstrap` ended up reading "an instance: it declares itself" or "declared
  // by folio-assistant" depended on which `readdirSync` returned first. Locally
  // that is bootstrap; on the CI runner it is not, and the test failed there and
  // nowhere else.
  //
  // Being an instance is the stronger fact and must win: an instance is
  // accounted for BY ITSELF, and another instance happening to declare a
  // directory inside it does not change that. So instances are marked first and
  // the declared-directory pass never replaces one.
  const instances: string[] = [];
  for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    // An instance declares itself. That is the contract everywhere else here,
    // and it means a new instance is accounted for the moment it exists rather
    // than when somebody remembers to add it to a list.
    if (findDeclarationFile(join(repoRoot, entry.name)) !== undefined) {
      out.set(entry.name, "an instance: it declares itself");
      instances.push(entry.name);
    }
  }

  // THE ROOT MAY ITSELF BE AN INSTANCE, and since 2026-09-20 it is.
  //
  // Owner: *"only uploads/ on this repo's root b/c acting as if it was
  // intialized"*. A `harness.json` at the repository root declares the checkout
  // as an initialized instance, so the directories IT names sit at the root
  // legitimately — `uploads/` is the worked example, and it is a DIFFERENT
  // queue from `cat-harness/uploads/`: same id, different instance, not one
  // directory declared twice.
  //
  // This sweep was written when the root was deliberately not an instance, and
  // said so; that premise changed and the sweep reported 19.4 MB of correctly
  // declared content as unaccounted. A sweep whose model of the repository has
  // gone stale reports exactly like one finding a real defect, which is why
  // this reads the declaration rather than gaining two `ROOT_INFRASTRUCTURE`
  // entries — the entries would still be there after the next instance is
  // declared, and would account for anything sharing those names.
  //
  // `rootForScope` is deliberately NOT used here. For the root instance both
  // scopes land at the root, and `repoRootFor` would resolve a
  // repository-scoped entry to the checkout's PARENT — outside the repository
  // entirely. A root instance declaring repository scope is a contradiction in
  // terms; it is not special-cased because nothing should write one.
  if (findDeclarationFile(repoRoot) !== undefined) {
    out.set(findDeclarationFile(repoRoot) ?? "", "the repository's own declaration: it acts as an initialized instance");
    const rootDecl = readDeclaration(repoRoot);
    for (const dir of rootDecl?.directories ?? []) {
      const top = dir.path.replace(/^\.\//, "").split("/")[0];
      // Same `!out.has` guard and the same reason: being an instance is the
      // stronger fact, and the root claiming a name does not unmake one.
      if (top && !out.has(top)) {
        out.set(top, `declared by ${rootDecl?.name ?? "the repository"} as "${dir.id}"`);
      }
    }
  }

  for (const name of instances) {
    const abs = join(repoRoot, name);
    const decl = readDeclaration(abs);
    for (const dir of decl?.directories ?? []) {
      // A repository-scoped entry resolves against the ROOT, which is how
      // `beans/` and `todos/` legitimately live there.
      const base = rootForScope(abs, dir.scope);
      if (base !== abs) {
        const top = dir.path.replace(/^\.\//, "").split("/")[0];
        // `!out.has(top)` is what makes this order-independent: an entry
        // already marked an instance keeps that, and so does one already
        // claimed by an earlier instance's declaration.
        if (top && !out.has(top)) out.set(top, `declared by ${decl?.name ?? name} as "${dir.id}"`);
      }
    }
  }
  return out;
}

/** Root-level entries nothing accounts for, largest first. */
export function undeclaredAtRoot(repoRoot: string): UndeclaredEntry[] {
  const accounted = accountedRootPaths(repoRoot);
  const names = readdirSync(repoRoot, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."))
    .map((e) => e.name);
  const ignored = gitIgnored(repoRoot, names);
  const out: UndeclaredEntry[] = [];
  for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    // A directory holding nothing but ignored files is git's business too —
    // `scripts/` with only a `__pycache__` in it is not a finding.
    if (entry.isDirectory() && holdsOnlyIgnored(repoRoot, entry.name)) continue;
    // Dotfiles are git's and the tooling's; sweeping them would report
    // `.gitignore` as a finding on every run, and a report whose first five
    // lines are always the same is a report nobody reads.
    if (entry.name.startsWith(".")) continue;
    if (accounted.has(entry.name)) continue;
    const abs = join(repoRoot, entry.name);
    const st = statSync(abs);
    out.push({
      path: entry.name,
      kind: entry.isDirectory() ? "directory" : "file",
      bytes: entry.isDirectory() ? dirBytes(abs) : st.size,
    });
  }
  return out.sort((a, b) => b.bytes - a.bytes);
}

function dirBytes(dir: string): number {
  let total = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, e.name);
    try {
      total += e.isDirectory() ? dirBytes(abs) : statSync(abs).size;
    } catch {
      // A path that vanished mid-walk contributes nothing rather than throwing:
      // a size report is not worth failing a sweep over.
    }
  }
  return total;
}

/** Human-readable size, for a report a person reads rather than a machine parses. */
export function humanBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} KB`;
  return `${n} B`;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const repoRoot = repoRootFor(instanceRootFor(import.meta.dir));
  const findings = undeclaredAtRoot(repoRoot);

  if (findings.length === 0) {
    console.log("✓ nothing at the repository root is unaccounted for");
    process.exit(0);
  }

  console.log(`${findings.length} path(s) at the repository root that no declaration names:\n`);
  let total = 0;
  for (const f of findings) {
    total += f.bytes;
    console.log(`  · ${humanBytes(f.bytes).padStart(8)}  ${f.path}${f.kind === "directory" ? "/" : ""}`);
  }
  console.log(`\n  ${humanBytes(total)} in total.`);
  // Sizes and the remedy, never the removal. Four of the five findings today
  // are somebody's uploaded documents, and an agent does not relocate or delete
  // a durable artefact on its own initiative — it reports what would go, with
  // sizes, and waits to be told.
  console.log(
    `\nEach is either something that belongs in a declared directory (uploads/ is the\n` +
      `ingestion queue) or something the repository root genuinely owns, in which case\n` +
      `add it to ROOT_INFRASTRUCTURE with the reason. This sweep REPORTS; it never moves\n` +
      `or deletes anything.`,
  );

  if (check) process.exit(1);
}
