#!/usr/bin/env bun
/**
 * Validate the voice graph — and, above all, that every rule cites something.
 *
 * `loadVoices` already refuses a malformed profile, so this adds the checks a
 * Zod schema cannot make: that a cited `library/` section EXISTS on disk, that a
 * cited KG node exists, and that the quote is long enough to be a quote.
 *
 * The defect it exists to make impossible is PR #210's: three WHO voice profiles
 * with ten plausible rules each and `source: null`. Plausible is not right — its
 * first rule asserted `-ise/-isation` as WHO's spelling baseline, and the WHO
 * Editorial Style Manual says "`-ize` … is preferred" on page 14. Nothing in a
 * type system catches a confident invention; a resolvable citation does.
 *
 *     bun run check:voices
 *
 * @module scripts/check-voices
 */

import { existsSync, readdirSync } from "node:fs";
import { explainFailure, resolveLibraryRef } from "../../folio-assistant-core/schemas/library-ref.js";
import { join, relative, resolve } from "node:path";

import { loadVoices, unionRules, voicesPresent } from "../schemas/voices";
import { instanceRootsIn, readDeclaration, repoRootFor, resolveDirectories } from "../schemas/cat-harness.ts";
import { readRoleGraph, type RoleGraph } from "../schemas/role-graph";

const ROOT = resolve(import.meta.dir, "..");
/** The checkout, one level out: a cross-instance citation is resolved against sibling instances. */
const REPO_ROOT = resolve(ROOT, "..");

/**
 * Every instance in this checkout that ships a `voices/` directory — FOUND,
 * not assumed to be this one.
 *
 * ## Measured, on the change that needed it
 *
 * This module read `ROOT` and nothing else. Bean `w095` moved the three WHO
 * voices into `who-style-guide/`, and the very next run reported
 *
 *     Voice graph  (1 voices, 12 rules)
 *     ✓ every rule cites a source that resolves
 *
 * and exited 0. **Twenty-five rules across three voices went unchecked and
 * nothing said so** — the `dh4f` defect in the gate whose entire subject is
 * citations that do not resolve. Predicted before the move and confirmed by
 * making it, which is the only way to tell a guess from a finding.
 *
 * It is the same shape as `check-declared-assets`, fixed hours earlier the
 * same day: a checker pinned to one instance in a repository that has eight.
 * The remedy is the same and it is not "add who-style-guide to a list" — a
 * hardcoded list is a declaration nobody declared, and the next instance
 * would be invisible in exactly this way.
 *
 * One level down plus the root itself. Deeper is deliberately NOT walked: a
 * `voices/` inside `node_modules/` or a vendored checkout belongs to somebody
 * else, and auditing another project's citations reports findings nobody here
 * can act on.
 */
function instancesWithVoices(repoRoot: string): string[] {
  const out: string[] = [];
  if (voicesPresent(repoRoot)) out.push(repoRoot);
  for (const e of readdirSync(repoRoot, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const dir = join(repoRoot, e.name);
    if (voicesPresent(dir)) out.push(dir);
  }
  return out.sort();
}

// No `LIBRARY` constant any more, and that is the change rather than a tidy-up.
// This module composed `join(LIBRARY, libraryId, "sections", …)` against the
// VOICE'S OWN instance root, which made a cross-instance citation
// unrepresentable — the blocker on moving the three WHO voices out (beans
// `z7ev`, `w095`), predicted by bean `r1lz` the day before the move was
// decided. `resolveLibraryRef` reads the target instance's own declaration, so
// where a corpus lives is answered once, by the instance that owns it.
const MIN_QUOTE = 24;

/**
 * Resolve a citation, in this instance or another.
 *
 * Delegates to `folio-assist-core`'s `resolveLibraryRef` rather than composing
 * a path. Composing one is what this file did until 2026-09-20 — `join(LIBRARY,
 * …)` against the VOICE'S OWN instance root — which made a cross-instance
 * citation unrepresentable and was the blocker on moving the three WHO voices
 * out (beans `z7ev`, `w095`). Bean `r1lz` predicted it the day before the move
 * was decided.
 *
 * The resolver's four failure kinds are reported as they come back, unmerged:
 * "that instance is not in this checkout", "that instance holds no corpus",
 * "that document was never ingested" and "that section is missing" need four
 * different fixes, and collapsing them sends a reader to the wrong one.
 */
function resolveCitation(
  src: { instance?: string; libraryId: string; sectionId?: string },
  citingRoot: string,
): { ok: true; path: string } | { ok: false; why: string } {
  // The CITING instance, not always `cat-harness`. A BARE citation resolves
  // against whoever wrote it, so hardcoding one root would have answered a
  // who-style-guide voice's bare reference out of the platform's library —
  // the wrong corpus, reported as a confident resolution.
  const r = resolveLibraryRef(src, citingRoot, REPO_ROOT);
  return r.ok ? { ok: true, path: r.path } : { ok: false, why: explainFailure(r.failure) };
}

/**
 * The root of the instance a citation names, or the voice's own when it names
 * none.
 *
 * `undefined` means the name resolves to no instance in this repository, which
 * is a DIFFERENT finding from "the file is not there" and is reported as one:
 * a typo in the instance name and a moved file are fixed in different places.
 */
function instanceRootFor(instance: string | undefined, ownRoot: string): string | undefined {
  if (instance === undefined) return ownRoot;
  const repo = repoRootFor(ownRoot);
  for (const root of instanceRootsIn(repo)) {
    if (readDeclaration(root)?.name === instance) return root;
  }
  return undefined;
}

/**
 * An instance's role graph, from its declared `scenarios` directory, or
 * `undefined` when it declares none. Cached: every voice addressing a role in
 * the same instance would otherwise re-read the same file.
 */
const roleGraphs = new Map<string, RoleGraph | undefined>();
function roleGraphOf(instanceRoot: string): RoleGraph | undefined {
  if (!roleGraphs.has(instanceRoot)) {
    const dir = resolveDirectories([{ name: "(local)", root: instanceRoot, own: true }]).find(
      (d) => d.id === "scenarios" && d.own && d.scope !== "repository",
    )?.absPath;
    roleGraphs.set(instanceRoot, dir === undefined ? undefined : readRoleGraph(dir));
  }
  return roleGraphs.get(instanceRoot);
}

function main(): number {
  const instances = instancesWithVoices(REPO_ROOT);
  if (instances.length === 0) {
    // Third state. A checkout with no voice graph anywhere is legitimate;
    // saying "0 problems" over a directory that is not there would be a clean
    // run across nothing.
    console.log("check:voices — no instance in this checkout ships a voices/ directory. Nothing checked.");
    return 0;
  }

  // Each voice keeps the root it was LOADED from, because that is the instance
  // a bare citation resolves against. Flattening them into one list and
  // resolving everything against `ROOT` is the bug this enumeration exists to
  // avoid, one step in.
  const loaded = instances.flatMap((root) =>
    loadVoices(root).map((voice) => ({ voice, root })),
  );
  const voices = loaded.map((l) => l.voice);

  // ── A voice id must IDENTIFY a voice, and that is checked here ──────────
  //
  // Everything below — `rootOf`, `instanceOfSource`, and `unionRules`, which
  // reports a finding as `<voiceId>/<ruleId>` — is keyed on the id alone.
  // `instanceOfSource`'s own comment says why a global map is wrong ("two
  // voices may legitimately derive same-named documents from different
  // instances, and a global map would silently pick one") and then keys on
  // `v.id`, which collides the moment two INSTANCES ship a voice of the same
  // name. The loser's citations would then resolve against the winner's
  // instance root: a wrong pass, reported in the same words as a right one.
  //
  // Refusing the duplicate is the fix rather than composite keys, because the
  // id is already load-bearing elsewhere and a duplicate is unworkable there
  // too: `harness.config.json` activates voices by bare id
  // (`{"voices": {"active": ["who-editorial"]}}`), so two voices called
  // `who-editorial` give that line no meaning either. One refusal, at the one
  // place both problems start.
  const seenId = new Map<string, string>();
  for (const { voice, root } of loaded) {
    const prior = seenId.get(voice.id);
    if (prior !== undefined) {
      console.error(
        `check:voices — voice id "${voice.id}" is declared by two instances: ` +
          `${relative(REPO_ROOT, prior) || "."} and ${relative(REPO_ROOT, root) || "."}.\n` +
          `  A voice id is how a citation resolves and how \`<name>.config.json\` ` +
          `activates one, so it has to name exactly one voice. Rename one of them.`,
      );
      return 1;
    }
    seenId.set(voice.id, root);
  }

  const rootOf = new Map(loaded.map((l) => [l.voice.id, l.root]));
  const rules = unionRules(voices);
  const problems: string[] = [];

  /**
   * Which instance holds each declared source, from the VOICE that declares
   * it — so a rule citing that source need not repeat the answer.
   *
   * A voice's `sources[]` is where it says what it was derived from. A rule's
   * `source` says which of those, and where in it. Making every rule restate
   * the instance would put one fact in two places and let them disagree: a
   * voice pointing at `who-iris` with a rule pointing at `folio-assistant-sci` is
   * representable, meaningless, and nothing would catch it.
   *
   * This became load-bearing with bean `frs5`, which moved the corpus out of
   * the platform. Before it every citation resolved locally and the instance
   * was never written down at all; after it, the four voices in `cat-harness/`
   * cite documents in two other instances across dozens of rules.
   *
   * Keyed per VOICE, not globally: two voices may legitimately derive
   * same-named documents from different instances, and a global map would
   * silently pick one.
   */
  const instanceOfSource = new Map<string, Map<string, string>>();
  for (const v of voices) {
    const m = new Map<string, string>();
    for (const srcDecl of v.sources) {
      if (srcDecl.libraryId && srcDecl.instance) m.set(srcDecl.libraryId, srcDecl.instance);
    }
    instanceOfSource.set(v.id, m);
  }

  for (const { voice, rule } of rules) {
    const src = rule.source;
    const where = `${voice}/${rule.id}`;
    // An explicit `instance` on the rule always wins: inheritance is a default,
    // not an override, so a rule citing a document its voice does not declare
    // can still say where it is.
    const citedInstance =
      src.instance ??
      (src.libraryId ? instanceOfSource.get(voice)?.get(src.libraryId) : undefined);
    if (src.quote.trim().length < MIN_QUOTE) {
      problems.push(`${where}: quote is ${src.quote.trim().length} chars — a citation that short cannot be checked`);
    }
    if (src.libraryId && src.sectionId) {
      // The resolver's own explanation is used verbatim: it distinguishes four
      // failures this check cannot, and restating them here would make a fifth
      // wording of the same facts, free to drift from the four.
      const res = resolveCitation(
        { instance: citedInstance, libraryId: src.libraryId, sectionId: src.sectionId },
        rootOf.get(voice)!,
      );
      if (!res.ok) {
        const from = citedInstance ? `${citedInstance}:` : "";
        problems.push(`${where}: cites ${from}${src.libraryId}/${src.sectionId} — ${res.why}`);
      }
    } else if (src.kgRef) {
      // A `#anchor` is a section within the file; check the file.
      const file = src.kgRef.split("#")[0]!;
      // Resolved through the CITED instance, exactly as the library branch
      // above does. It did not until 2026-09-21, and the asymmetry was
      // invisible while every kgRef happened to be instance-local: a voice
      // citing a file in another instance could not pass however correctly it
      // declared where that file was. It surfaced the moment `milnor` moved to
      // folio-assistant-sci carrying one rule that cites a cat-harness module
      // — the rule was right, the checker was not.
      const citedRoot = instanceRootFor(citedInstance, rootOf.get(voice)!);
      if (citedRoot === undefined) {
        problems.push(
          `${where}: cites kgRef ${file} in instance "${citedInstance}", which is not an ` +
            `instance of this repository`,
        );
      } else if (!existsSync(join(citedRoot, file))) {
        const from = citedInstance ? `${citedInstance}:` : "";
        problems.push(`${where}: cites kgRef ${from}${file}, which does not exist there`);
      }
    }
  }

  // Every declared source document must itself be ingested. A voice naming a
  // library id nobody ingested is the `source: null` defect wearing an id.
  for (const v of voices) {
    for (const s of v.sources) {
      if (s.libraryId) {
        // Document-level: no sectionId, so the resolver checks `structure.json`
        // — "was this ingested at all", which is a different question from
        // "does this section exist" and gets its own finding.
        const res = resolveCitation({ instance: s.instance, libraryId: s.libraryId }, rootOf.get(v.id)!);
        if (!res.ok) problems.push(`${v.id}: names source ${s.libraryId} — ${res.why}`);
      }
      // Against the DECLARING instance: a `kgRef` is a node of the voice's own
      // knowledge graph, so looking for it under the platform would report a
      // who-style-guide voice's own node as missing.
      // Through the NAMED instance when the source names one, exactly as a
      // rule's `kgRef` is resolved above: a voice addressing a role cites the
      // role graph that declares it, which is the dependency's, not its own.
      if (s.kgRef) {
        const citedRoot = instanceRootFor(s.instance, rootOf.get(v.id)!);
        if (citedRoot === undefined) {
          problems.push(`${v.id}: names source ${s.kgRef} in instance "${s.instance}", which is not an instance of this repository`);
        } else if (!existsSync(join(citedRoot, s.kgRef.split("#")[0]!))) {
          problems.push(`${v.id}: names source ${s.instance ? `${s.instance}:` : ""}${s.kgRef}, which does not exist`);
        }
      }
    }
  }

  // ── A voice points at the roles it addresses, and each must resolve ─────
  //
  // `activeIn.roles` is the pointer from the dependent (the voice) to the
  // general node (the role) — #1168, B2. A role id that resolves to nothing
  // scopes the voice to a lane nobody can act in, which switches it off in
  // silence; that is a problem, not a note.
  const addressed = new Map<string, Set<string>>(); // instance root -> role ids some voice addresses
  for (const { voice: v, root } of loaded) {
    for (const ref of v.activeIn?.roles ?? []) {
      const rolesRoot = instanceRootFor(ref.instance, root);
      const graph = rolesRoot === undefined ? undefined : roleGraphOf(rolesRoot);
      const from = ref.instance ? `${ref.instance}:` : "";
      if (rolesRoot === undefined) {
        problems.push(`${v.id}: addresses role ${from}${ref.role}, but "${ref.instance}" is not an instance of this repository`);
      } else if (graph === undefined) {
        problems.push(`${v.id}: addresses role ${from}${ref.role}, but that instance declares no role graph`);
      } else if (!graph.roles.some((r) => r.id === ref.role)) {
        problems.push(`${v.id}: addresses role ${from}${ref.role}, which that instance's role graph does not declare`);
      } else {
        (addressed.get(rolesRoot) ?? addressed.set(rolesRoot, new Set()).get(rolesRoot)!).add(ref.role);
      }
    }
  }

  console.log(`Voice graph  (${voices.length} voices, ${rules.length} rules)\n`);
  for (const v of voices) {
    const mech = v.rules.filter((r) => r.patterns || r.terminology).length;
    const judged = v.rules.filter((r) => r.judgementOnly).length;
    console.log(
      `  ${v.id.padEnd(26)} ${String(v.rules.length).padStart(2)} rules  ` +
        `${String(mech).padStart(2)} with a mechanical half  ${String(judged).padStart(2)} judgement-only`,
    );
  }
  console.log();

  // Coverage, reported and never failed: which roles that READ prose no voice
  // addresses. It was the audit criterion \`role-declares-voice\` while the
  // role carried its voice; now the voice points at the role, from an
  // instance the role graph cannot see, so it is answered here, where both
  // are visible. Only for instances some voice already addresses — a role
  // graph no voice reaches is not this check's to grade.
  for (const [rolesRoot, ids] of addressed) {
    const unaddressed = (roleGraphOf(rolesRoot)?.roles ?? [])
      .filter((r) => !r.actedUpon && r.persona !== undefined && !ids.has(r.id))
      .map((r) => r.id);
    const name = readDeclaration(rolesRoot)?.name ?? relative(REPO_ROOT, rolesRoot);
    console.log(
      `  ${name}: ${ids.size} role(s) addressed by a voice` +
        (unaddressed.length ? `; ${unaddressed.length} with a persona and no voice: ${unaddressed.join(", ")}` : ""),
    );
  }
  if (addressed.size > 0) console.log();

  if (problems.length > 0) {
    console.error(`${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    return 1;
  }
  console.log("✓ every rule cites a source that resolves, with a quote long enough to check");
  return 0;
}

process.exit(main());
