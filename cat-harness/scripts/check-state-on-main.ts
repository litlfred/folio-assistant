/**
 * Every declared directory whose graph kind `holds: "state"` is kept OFF
 * `main`, or it is recorded debt that may only go down.
 *
 * @covers cat-harness
 *
 * ## What this is for, and what it deliberately is NOT
 *
 * Arc `fs43`'s plan of record carried a row reading *"`holds: state` ⇒ default
 * `storage.keyedBy: tip`, plus a check that a declared `state` dir on `main`
 * is a finding"*, marked done. It was not done — `grep -c "keyedBy\|storage"
 * cat-harness/schemas/graph-kind-registry.ts` was 0 — and the two halves are
 * not equally worth doing.
 *
 * **The default half is near-worthless and is not built here.** A kind-level
 * default cannot supply the one field that matters: `BranchSourceSchema`
 * REQUIRES `branch`, and a kind has no branch name to give. So the default
 * could supply `keyedBy` and nothing else, every tip-keyed directory would
 * still need its own `source` with its own branch, and the only thing gained
 * would be action at a distance — a directory's storage decided partly in its
 * declaration and partly in a registry entry somebody else edits. Two places
 * answering one question is the defect `resolveSubgraphSource` throws on when
 * `source` and `storage` disagree; a default would reintroduce it by design.
 *
 * **The check half is worth building, and this is it.** After a cutover, a
 * `holds: state` directory declared on `main` is silently fine — nothing
 * fails, and the next one gets declared the old way. That is what the row was
 * for.
 *
 * ## Why a ratchet and not a rule
 *
 * The rule is FALSE TODAY, 19 times over. Measured on `main`, 2026-10-04:
 * 28 declared directories across 10 instances carry a `holds: "state"` kind and
 * 9 of them are off the checkout. The others are legitimately
 * mid-arc — `beans` and `todos` are `p3ny`'s and its sibling's to move,
 * `queue` is `najo`'s, `uploads` is named in the same plan — and some may
 * never move: `swimlane-glossary` at `glossary/` is regenerated from `main`'s
 * own content by a declared writer, so a branch would buy it nothing.
 *
 * A gate that fails 19 times on the commit it lands in is a gate somebody
 * switches off. So this follows the repository's existing idiom for recorded
 * debt — `declared-path-baseline.json`, `check:fhir-harness-exclusions` — and
 * keeps a baseline that may only SHRINK:
 *
 * - a state directory on `main` that the baseline does not name is a NEW
 *   finding, and fails;
 * - a baseline entry that is no longer on `main` has been cut over, and fails
 *   too, with the instruction to delete the line. A baseline entry that has
 *   stopped describing anything is how a ratchet quietly becomes a blanket
 *   exemption (`translation-drift.ts` records the same lesson: its first
 *   version exempted a whole page, and drift under the exemption went
 *   unseen).
 *
 * So the gate answers the question the row wanted — *has anybody declared a
 * NEW state directory on main?* — from the day it lands, without asserting
 * something untrue about the 19.
 *
 * ## `regen` must NOT be allowed to repair this
 *
 * `--update` exists and writes the baseline, so the name-based pairing would
 * make this a verify/write pair — and then a `regen` over a tree with a new
 * state directory on `main` would RAISE the ratchet and report it as a repair.
 * That is the `check:viewer-nav` case exactly, and it is recorded the same
 * way: in `regen-after-merge.ts`'s `NO_WRITER` table, so the gate shows as a
 * deliberate non-pair rather than being quietly absent from the pair set.
 *
 * `--update`'s own refusal to grow without `--allow-growth` is the SECOND line
 * of defence, not the first. A guard that depends on the caller passing no
 * flag is one `--allow-growth` in a script away from being gone, which is why
 * the pairing is refused as well.
 *
 * ## It asks the DECLARATION, never the disk
 *
 * `contentIsOffCheckout` is the single predicate, shared with
 * `materialiseDirectories`, `check:declared-dirs` and `audit:coverage`. This
 * gate does no IO beyond reading declarations: whether a directory's content
 * belongs on `main` is a property of what was declared, and a checkout where
 * somebody has not run `state:mount` must not read as a finding (bean `dh4f`
 * — a clean run over nothing). That also makes it safe in the merge bot,
 * which runs gates before the mount step on some paths.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { findDeclarationFile, instanceRootsIn, nestedDirectories, readDeclaration } from "../schemas/cat-harness.js";
import { defaultGraphKinds } from "../schemas/graph-kind-registry.js";
import { contentIsOffCheckout } from "../schemas/subgraph-source.ts";
// The registration side-effect import, same reason `check:declared-dirs` has
// it: without it a reader's acceptance of this repository's own declaration is
// an import-order property of the process rather than of the declaration.
import "../schemas/folio-graph-kind.js";

/** Where the recorded debt lives. One file, named in one place. */
export const BASELINE = "cat-harness/scripts/state-on-main-baseline.json";

/** A declared directory that holds state, and where its content lives. */
export interface StateDirectory {
  /** Repo-relative instance root; `""` for the repository root itself. */
  instance: string;
  id: string;
  /** Repo-relative path of the directory as declared. */
  path: string;
  /** Only the kinds that `holds: "state"` — the reason it is in this list. */
  stateKinds: string[];
  /** `true` when the declaration puts the content off the checkout. */
  offCheckout: boolean;
  /** The declaring file, for a message somebody can act on. */
  declaredIn: string;
}

/**
 * The key a baseline line carries: instance and id, NOT the path.
 *
 * The path is reported but not keyed on, deliberately. A cutover changes
 * `source` and leaves `path` alone (it becomes where the mount lands), so
 * keying on the path would make a line stop matching for the one change it is
 * meant to track. Keying on `id` within its instance is stable across
 * everything except a rename, and a rename of a declared directory is a
 * reviewed act in its own right.
 */
export function keyOf(d: { instance: string; id: string }): string {
  return `${d.instance || "."}::${d.id}`;
}

/** Does this kind record LIVE state? Asked of the registry, never guessed. */
function holdsState(kind: string): boolean {
  return defaultGraphKinds.get(kind)?.holds === "state";
}

/**
 * Every declared directory in the checkout that holds state.
 *
 * Both levels: an instance's own `directories`, and the entries declared FROM
 * WITHIN one of them (`beans/beans.json`, `todos/todos.json`). The second
 * level is where most of them are, and a one-level read would have reported
 * `beans` as the only bean-shaped finding while missing `defs`, `notes`,
 * `workflows`, `queue` and `surveys` underneath it.
 */
export function stateDirectories(repoRoot: string): StateDirectory[] {
  const root = resolve(repoRoot);
  const out: StateDirectory[] = [];
  for (const inst of instanceRootsIn(root)) {
    const decl = readDeclaration(inst);
    if (decl === undefined) continue;
    const instRel = relative(root, inst);
    // The REAL declaration file, asked of the same finder the reader used.
    // Composing it from the directory's basename gave `som.json` in a git
    // worktree named `som` — a message naming a file that does not exist is
    // worse than no message, because the reader goes looking for it.
    const declFile = `${instRel ? `${instRel}/` : ""}${findDeclarationFile(inst) ?? "<declaration>"}`;
    const own = (decl.directories ?? []).map((d) => ({
      id: d.id,
      path: d.path,
      graphKinds: d.graphKinds ?? [],
      source: d.source,
      storage: (d as { storage?: unknown }).storage,
      declaredIn: declFile,
      parent: undefined as string | undefined,
    }));
    const nested = nestedDirectories(inst, decl).map((d) => ({
      id: d.id,
      path: d.path,
      graphKinds: d.graphKinds ?? [],
      source: d.source,
      storage: d.storage,
      // The from-within file, named by the PARENT entry it hangs off, so a
      // message says which file to edit rather than which instance to search.
      declaredIn: `${instRel ? `${instRel}/` : ""}${d.parentId}/${d.parentId}.json`,
      parent: d.parentId,
    }));
    for (const d of [...own, ...nested]) {
      const stateKinds = d.graphKinds.filter(holdsState);
      if (stateKinds.length === 0) continue;
      out.push({
        instance: instRel,
        id: d.id,
        path: join(instRel, d.path).replace(/\\/g, "/").replace(/\/+$/, ""),
        stateKinds,
        offCheckout: contentIsOffCheckout({ source: d.source as never, storage: d.storage }),
        declaredIn: d.declaredIn,
      });
    }
  }
  return out;
}

export interface Baseline {
  /** Keys of state directories known to be on `main`. May only shrink. */
  onMain: string[];
}

export type Finding =
  | { kind: "new-on-main"; key: string; dir: StateDirectory }
  | { kind: "baseline-stale"; key: string };

/**
 * The two directions, and both of them fail.
 *
 * A one-way ratchet that only looks for new entries goes quiet the moment the
 * debt is paid: the line stays, and the next directory declared with that id
 * inherits an exemption nobody granted.
 */
export function compare(dirs: readonly StateDirectory[], baseline: Baseline): Finding[] {
  const recorded = new Set(baseline.onMain);
  const findings: Finding[] = [];
  const live = new Set<string>();
  for (const d of dirs) {
    if (d.offCheckout) continue;
    const key = keyOf(d);
    live.add(key);
    if (!recorded.has(key)) findings.push({ kind: "new-on-main", key, dir: d });
  }
  for (const key of baseline.onMain) {
    if (!live.has(key)) findings.push({ kind: "baseline-stale", key });
  }
  return findings;
}

export function readBaseline(repoRoot: string): Baseline {
  const raw = JSON.parse(readFileSync(join(repoRoot, BASELINE), "utf8")) as Partial<Baseline>;
  return { onMain: [...(raw.onMain ?? [])].sort() };
}

if (import.meta.main) {
  const repoRoot = process.cwd();
  const update = process.argv.includes("--update");
  const dirs = stateDirectories(repoRoot);
  const onMain = dirs.filter((d) => !d.offCheckout);

  if (update) {
    const next = { onMain: onMain.map(keyOf).sort() };
    const prior = (() => {
      try {
        return readBaseline(repoRoot);
      } catch {
        return { onMain: [] as string[] };
      }
    })();
    const added = next.onMain.filter((k) => !prior.onMain.includes(k));
    if (added.length > 0 && !process.argv.includes("--allow-growth")) {
      // The ratchet's whole value is that it cannot be raised by the tool that
      // reads it. Recording a NEW entry has to be a deliberate, separate act.
      console.error(
        `  ✗ --update would ADD ${added.length} entr(ies): ${added.join(", ")}\n` +
          `    The baseline may only shrink. Move the directory off \`main\`, or pass\n` +
          `    --allow-growth in a commit whose message says why the debt grew.`,
      );
      process.exit(1);
    }
    writeFileSync(
      join(repoRoot, BASELINE),
      JSON.stringify(
        {
          _comment:
            "Declared directories whose graph kind `holds: \"state\"` and whose content is still on `main`, " +
            "as `<instance>::<id>` (`.` for the repository root). RECORDED DEBT, and it may only go DOWN: " +
            "a state directory on `main` that is not listed here fails `check:state-on-main`, and a line " +
            "here that no longer describes a directory on `main` fails too, so a paid-off entry cannot " +
            "linger as an exemption nobody granted. Written by `bun run check:state-on-main --update`; " +
            "growing it needs --allow-growth and a commit message saying why. See the module header of " +
            "scripts/check-state-on-main.ts for why the `holds: state` default was NOT built.",
          onMain: next.onMain,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`${BASELINE} — written, ${next.onMain.length} entr(ies) on \`main\``);
    process.exit(0);
  }

  const findings = compare(dirs, readBaseline(repoRoot));
  for (const f of findings) {
    if (f.kind === "new-on-main") {
      console.error(
        `  ✗ ${f.key} (${f.dir.path}) holds ${f.dir.stateKinds.map((k) => `\`${k}\``).join(" + ")} ` +
          `and its content is on \`main\`, with no \`source\` declared. ` +
          `Declare it on a branch in ${f.dir.declaredIn} — ` +
          `\`source: { kind: "branch", branch: "cat/<harness>/<name>", keyedBy: "tip" }\` — ` +
          `and remember the flip and the removal are ONE commit, because \`mountTip\` ` +
          `refuses a path the checkout still tracks.`,
      );
    } else {
      console.error(
        `  ✗ ${f.key} is in ${BASELINE} but is no longer a state directory on \`main\`. ` +
          `Delete the line: a baseline entry that describes nothing is an exemption for ` +
          `whatever next takes that id.`,
      );
    }
  }
  console.log(
    `${dirs.length} declared director(ies) hold state across ` +
      `${new Set(dirs.map((d) => d.instance || ".")).size} instance(s); ` +
      `${dirs.length - onMain.length} off the checkout, ${onMain.length} on \`main\` ` +
      `(${readBaseline(repoRoot).onMain.length} recorded); ${findings.length} finding(s)`,
  );
  process.exit(findings.length > 0 ? 1 : 0);
}
