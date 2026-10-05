/**
 * Instance DISCOVERY: which directories are instances, and which file in a
 * directory is its declaration. Filesystem only, and deliberately a LEAF:
 * it imports nothing from the schema layer, so `graph-kind-registry.ts` can
 * find each harness's declared `kinds/` graph (bean dmx1, owner 2026-10-04:
 * "there should not be a central registry for declaring mount tools and
 * subgraph types") without importing `cat-harness.ts`, which imports the
 * registry. Moved verbatim from `cat-harness.ts`, which re-exports all four.
 *
 * @module cat-harness/schemas/instance-roots
 * @graphNode none — constants and functions that locate an instance's declaration; no schema
 */
import { existsSync, readdirSync, readFileSync, type Dirent } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

/**
 * The suffix every instance declaration carries — `<name>.config.json`.
 *
 * ## `harness.json` is gone, and this replaced it
 *
 * The owner, 2026-09-21: *"Excise harness.json.. only
 * `<harness-stub>.config.json` makes instantiation at root of repo"*.
 *
 * There used to be TWO files with no overlap in content: `harness.json` held
 * the DECLARATION (`name`, `directories`, `assets`, `needs`, `stickies`) and
 * `<name>.config.json` held the CONFIG (`contentType`, `adapter`,
 * `dependencies`, `translation`). One instance, two files, and a reader had to
 * know which question each answered. They are one file now.
 *
 * ## A fixed filename cannot be discovered, and that was the point
 *
 * `harness.json` was a CONSTANT, so discovery asked `existsSync(dir +
 * "/harness.json")` and the declared `name` inside was free to be anything.
 * Under `<name>.config.json` the FILENAME CARRIES THE NAME, so the two cannot
 * disagree — and {@link findDeclarationFile} checks exactly that rather than
 * trusting either half.
 *
 * ## What tells a declaration from a plain config — the NAME, then the SUFFIX
 *
 * **A `name` field**, and since 2026-09-21 the suffix as well.
 *
 * Until then both ended `.config.json`, so the only discriminator was inside
 * the file: carrying `name` made it a declaration, lacking one made it a
 * config. That worked and was still the thing `b5f0` §1 warned about — two
 * different schemas, with two different readers, sharing one filename shape
 * and told apart only by which directory they sat in.
 *
 * The owner reversed §1's REPLACE ruling on 2026-09-21 and took its other
 * option, the one `b5f0` recorded as *"`<name>.json` + `<name>.config.json`
 * would at least pair them"*:
 *
 * | file | schema | reader |
 * |---|---|---|
 * | `<name>.json` in the instance | {@link CatHarnessDeclarationSchema} | `readDeclaration` |
 * | `<name>.config.json` at the instantiation root | `HarnessConfigSchema` | `readHarnessConfig` |
 *
 * The `name` check STAYS rather than being replaced by the suffix.
 * {@link findDeclarationFile} still requires the filename stem to equal the
 * declared `name`, which is what makes a declaration self-identifying: a
 * consumer opening a repository it has never seen scans, parses, and takes the
 * file that agrees with itself. That is the property migration-plan I.8 asked
 * for, and it is the reason the suffix could move at all — nothing here
 * derives a filename from a DIRECTORY name, so a clone renamed on disk still
 * resolves.
 */
export const DECLARATION_SUFFIX = ".json";

/**
 * The suffix of an instantiation root's CONFIG, as against its declaration.
 *
 * These were ONE suffix until 2026-09-21, because the declaration had been
 * folded into the config. The owner's reversal separates them again, so there
 * are now two things to spell and they must not be spelled by one constant:
 * composing a config path from {@link DECLARATION_SUFFIX} produced
 * `cat-harness.json` for a file that is `cat-harness.config.json`, and
 * `check:instance-config` reported all three real configs as orphans.
 */
export const CONFIG_SUFFIX = ".config.json";

/**
 * The declaration file in this directory, or `undefined` if there is none.
 *
 * Scans for `*.json` and returns the one that both carries a `name` and
 * whose filename stem EQUALS that name. A file failing either half is not a
 * declaration: no `name` means it is a plain config, and a mismatched stem is
 * the rename-half-done case `check:instance-config` already reports.
 *
 * **Several declarations in one directory THROWS.** Picking one silently is
 * the `dh4f` shape — a consumer reads a declaration, gets an answer, and
 * reports a clean run over the instance it did not see. There is no correct
 * choice to make here, so the caller is told rather than guessed at.
 */
export function findDeclarationFile(dir: string): string | undefined {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    // Unreadable directory is "could not look", and a caller asking "is there
    // a declaration here" gets `undefined` either way. The distinction is not
    // lost: every caller that needs it re-reads and throws.
    return undefined;
  }
  const found: string[] = [];
  const broken: string[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(DECLARATION_SUFFIX)) continue;
    const stem = entry.slice(0, -DECLARATION_SUFFIX.length);
    if (stem.length === 0) continue;
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, entry), "utf-8"));
    } catch {
      // UNPARSEABLE IS NOT ABSENT. Skipping it here would make "this instance
      // declared something and it is broken" indistinguishable from "there is
      // nothing here" — the `xom7` failure, where a sweep that could not look
      // reports a clean run. It cannot be matched on `name` (there is no
      // parse), so it is collected separately and `readDeclaration` throws on
      // it rather than returning `undefined`.
      //
      // BUT ONLY WHEN IT COULD PLAUSIBLY BE THIS INSTANCE'S. The suffix was
      // `.config.json` until 2026-09-21, which made "unparseable file with
      // this suffix" a near-certain broken declaration. A bare `.json` makes
      // it near-certainly NOT one: a malformed `folio/landing.json` — a
      // landing sticky, nothing to do with declarations — was reported as a
      // broken declaration and took `readDeclaration` down with it.
      //
      // The two admissible signals, neither of which is used for RESOLUTION:
      // a sibling `<stem>.config.json`, which is the pairing the split
      // created, or a stem equal to the directory's own name. Matching the
      // directory here does NOT reintroduce what migration-plan I.8 warned
      // about — that is about deriving a declaration's location from a
      // directory name, and resolution still goes only through a file
      // agreeing with its own `name`. This is error REPORTING: the cost of
      // being wrong is a worse message, not a missed instance.
      const plausible = stem === basename(dir) || entries.includes(`${stem}${CONFIG_SUFFIX}`);
      if (plausible) broken.push(entry);
      continue;
    }
    if ((raw as { name?: unknown })?.name === stem) found.push(entry);
  }
  // A VALID declaration wins over a broken sibling: a directory may hold an
  // unrelated `*.config.json` that is merely malformed, and that must not stop
  // the instance being read.
  //
  // With NOTHING valid, the broken one is returned rather than thrown on, and
  // that is the whole third-state design. DISCOVERY MUST BE TOTAL —
  // `instanceRootsIn` asks "which directories are instances" and a throw there
  // takes out every caller, including the ones written to REPORT an unreadable
  // declaration (`workPlanGraphsIn`, `isActiveKg`). Returning it reproduces
  // the old semantics exactly: `harness.json` present made the directory an
  // instance, and `readDeclaration` threw when it came to parse it. Present
  // and unreadable stays distinguishable from absent, which is the property;
  // where the error is raised is not.
  if (found.length === 0 && broken.length > 0) return broken.sort()[0];
  if (found.length > 1) {
    throw new Error(
      `${resolve(dir)} carries ${found.length} declarations (${found.sort().join(", ")}). ` +
        "A directory is one instance; picking one silently would hide the others.",
    );
  }
  return found[0];
}

/**
 * Every instance in `repoRoot` — the repository root itself when it declares,
 * plus each immediate subdirectory that does.
 *
 * {@link findInstanceRoot} walks UP from a path to the instance owning it;
 * this is the same fact in the other direction, and until now it was the
 * direction nobody had implemented — the note on {@link initializationDoc}
 * said so explicitly ("*NOT implemented and is not assumed here*", bean
 * `wggr`).
 *
 * **Two gates were each carrying their own literal `["cat-harness",
 * "bootstrap"]` instead** (`check-declared-assets`, `check-instance-render`),
 * and by 2026-09-20 there were FOUR instances: those two, `folio-assist-core`,
 * and the repository root. So both gates reported clean runs over sets that
 * excluded half the subject — `dh4f` again, in the two checks whose whole job
 * is to look at instances.
 *
 * `check-instance-render`'s literal even sat under the docstring "*Every
 * instance this repository owns — the root, and any beside it*", which was
 * false in both halves: the root was not in the list and two instances beside
 * it were missing. **A list that has to be edited when a directory is added is
 * a list that will be wrong**, and the fix is to ask the filesystem rather
 * than to lengthen it (bean `6tkl`).
 *
 * Scanning is deliberately ONE level deep and skips dot-prefixed segments,
 * matching the dot-prefix guard the directory conventions already apply
 * everywhere else. Results are sorted so a caller's report is stable, with the
 * repository root first when it declares.
 */
export function instanceRootsIn(repoRoot: string): string[] {
  const root = resolve(repoRoot);
  const out: string[] = [];
  if (findDeclarationFile(root) !== undefined) out.push(root);

  let entries: Dirent[];
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    // Unreadable root is "could not determine", and a caller that treats an
    // empty list as "no instances" is the very failure this function exists
    // to end — so say nothing rather than claim an empty set.
    return out;
  }

  const submodules = submodulePathsOf(root);
  // Only a directory INSIDE a checkout has foreign checkouts to exclude. A
  // plain directory of sibling clones — the separated layout, and the
  // standalone rehearsal (bean `ho66`) that lays it out — has no repository
  // for a clone to be foreign to, so every clone in it is an instance. Without
  // this, g43f's filter dropped all of them: `needs` resolved to nothing and
  // 86 tests failed standalone on `main` at 24b5c12 (2026-10-05).
  const inCheckout = insideGitCheckout(root);
  const subs = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => join(root, e.name))
    .filter((p) => !inCheckout || !isForeignCheckout(p, submodules))
    .filter((p) => findDeclarationFile(p) !== undefined)
    .sort();

  return out.concat(subs);
}

/**
 * The submodule paths `root/.gitmodules` declares, or an empty set when it
 * declares none. Git's own declaration of which nested checkouts belong to
 * this repository — read rather than re-derived, so the answer is git's.
 */
function submodulePathsOf(root: string): ReadonlySet<string> {
  const file = join(root, ".gitmodules");
  if (!existsSync(file)) return new Set();
  const out = new Set<string>();
  for (const m of readFileSync(file, "utf-8").matchAll(/^\s*path\s*=\s*(.+?)\s*$/gm)) out.add(m[1]!);
  return out;
}

/**
 * Whether `dir` is a SEPARATE checkout — it holds its own `.git` (a directory
 * for a clone, a FILE for a worktree or submodule) and its parent's
 * `.gitmodules` does not name it — and so is not an instance of the
 * repository being scanned (bean `g43f`).
 *
 * ## The escape this closes
 *
 * {@link repoRootFor} is `dirname`, so for the ROOT instance it climbs out of
 * the checkout. In a Claude Code worktree that lands on `.claude/worktrees/`,
 * whose every child is a sibling worktree declaring `folio-assistant` at its
 * root. Measured 2026-10-03 from `agent-aefc4dcac619f2e1f`:
 * `instanceRootsIn(repoRootFor(root))` returned **ten sibling worktrees** as
 * instances of this one. A caller asking for its siblings that way reads other
 * sessions' uncommitted work as its own corpus.
 *
 * The rule is the same one git applies: a nested checkout is not part of the
 * enclosing tree unless it is a declared submodule. `bootstrap/` and
 * `bootstrap-tools/` have a `.git` file and ARE instances, which is why the
 * `.gitmodules` half exists; an instance directory with no `.git` is
 * untouched, so non-git fixtures read exactly as before.
 */
export function isForeignCheckout(dir: string, submodules: ReadonlySet<string> = submodulePathsOf(resolve(dir, ".."))): boolean {
  if (!existsSync(join(dir, ".git"))) return false;
  return !submodules.has(basename(dir));
}

/**
 * Whether `dir` or any ancestor holds a `.git` — that is, whether `dir` lies
 * inside some checkout. Read from the filesystem: a spawned `git rev-parse`
 * would be slower on a hot path and no more correct.
 */
function insideGitCheckout(dir: string): boolean {
  for (let d = resolve(dir); ; d = dirname(d)) {
    if (existsSync(join(d, ".git"))) return true;
    if (dirname(d) === d) return false;
  }
}
