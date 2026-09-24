/**
 * Every declared subgraph should be REACHABLE — by a reader and by an agent.
 *
 * The owner, 2026-09-20: *"everytime an instance names a directory as a
 * subgraph, it needs (QA valduation) to have visualizer, documenationentry. QA
 * if no skill, no tools."* Bean `2krx`.
 *
 * ## Why this is an AXIS and not a gate
 *
 * A navbar stub built over the real declarations measured it: of 22 directories
 * this instance declares, **two** have a renderer. Turning that into a hard
 * gate on day one is 20 failures, which is a wall somebody switches off — and
 * this repository already has the rule for it: *a check that fires on every one
 * of its subjects is a check that is wrong.* So this reports, ranks, and exits
 * 0 on findings. It becomes fatal when the count is low enough to mean
 * something, which is the same path `undeclared` took in
 * `check-instance-render`.
 *
 * ## Declaration-first, never inference
 *
 * A subgraph's coverage is READ FROM ITS DECLARATION (`coverage` on the
 * directory entry), not guessed by scanning for a page that mentions the path.
 * Two reasons, and the second is the one that matters:
 *
 * 1. Fuzzy matching invents both false positives and false negatives, and an
 *    axis nobody trusts is an axis nobody runs.
 * 2. **An absent declaration is the finding.** If the instance has not said
 *    what renders `library/`, that is precisely the gap — inferring an answer
 *    would paper over the thing being measured. This is the repository's
 *    standing principle applied here: *extension is a coincidence; a
 *    declaration inside the file is the contract.*
 *
 * So a declared-and-missing target is a MAJOR finding (somebody claimed a
 * renderer that is not there) while an undeclared one is MINOR (nobody has
 * said yet). Those are different problems and the axis must not merge them.
 *
 * ## Three states, because "could not determine" is not "absent"
 *
 * An unreadable declaration is reported as `undetermined` and never as a clean
 * run. A sweep blind on one instance has not cleared the others.
 *
 * ## Bootstrap is exempt from the VISUALISER criterion, by layer
 *
 * The owner, same day: *"it is exception to harness/layer not having
 * visualtion/workflow visualizer. but it must have its json/jsonld... that is
 * its existence."*
 *
 * The exemption is **not a hole in the axis, it is a second criterion**. An
 * axis that dropped bootstrap entirely would stop checking the one thing
 * bootstrap must have. So bootstrap is not asked for a visualiser, and IS
 * asked whether its graph artefact is produced — a layer that cannot emit its
 * own graph has not shown it is a graph.
 *
 * @covers cat-harness
 */
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  AGENT_INSTRUCTIONS_ROLE,
  assetRolePurpose,
  INSTANCE_README_ROLE,
  instanceRootsIn,
  isExemptFrom,
  readDeclaration,
  siteDirFor,
  repoRootFor,
  instanceRootFor,
  owesVisualiser,
  resolveCoveragePath,
  type CatHarnessDeclaration,
  visualisationsOf,
} from "../schemas/cat-harness.js";

/** The three obligations, in the order the owner named them. */
export const CRITERIA = ["visualiser", "docs", "skill", "serialisations"] as const;

/**
 * What each criterion is asking, in the words the finding prints.
 *
 * A LOOKUP rather than the ternary chain this replaced: that chain had one arm
 * per criterion and no else, so a fourth criterion silently printed the third
 * criterion's question. A map cannot do that — an entry is required by the
 * type, and `tsc` says so at the point a criterion is added.
 */
const ASKS: Record<Criterion, string> = {
  visualiser: "renders it",
  docs: "documents it",
  skill: "governs it",
  serialisations: "serves its json, jsonld and schema.json",
};
export type Criterion = (typeof CRITERIA)[number];

export type Severity = "major" | "minor";

export interface CoverageFinding {
  instance: string;
  directory: string;
  criterion: Criterion;
  severity: Severity;
  detail: string;
}

export interface InstanceCoverage {
  instance: string;
  verdict: "checked" | "undetermined";
  declared: number;
  findings: CoverageFinding[];
  /** The instance-level README finding, when there is one. */
  readme?: { severity: Severity; detail: string };
  /** The instance-level `agent-instructions` finding — the AGENT half of the same pair. */
  agentInstructions?: { severity: Severity; detail: string };
  /** The instance-level `docs/` finding — does it have documentation OF ITS OWN? */
  ownDocs?: { severity: Severity; detail: string };
  /** Waivers honoured, with the reason each one gave. */
  exempted: Array<{ directory: string; criterion: Criterion; reason: string }>;
  reason?: string;
}

/**
 * The layer exempt from `visualiser`, and the layer only.
 *
 * A NAME rather than a path, because the exemption is about what bootstrap IS
 * — the floor that owns no renderer — not about where it happens to sit. An
 * instance that relocated would keep its exemption; a different instance that
 * moved into `bootstrap/` would not inherit one.
 *
 * BOTH NAMES, and the old one is not dead weight. `bootstrap` was renamed to
 * `bootstrap` on main while this branch was open, and the rename would
 * have made this set match NOTHING — the owner's exemption silently stops
 * firing, bootstrap is asked for a visualiser it is exempt from, and the
 * only symptom is one extra minor finding among fifty. Keeping the old name
 * costs nothing and means a half-finished rename in either direction does not
 * quietly revoke a ruling. The test below pins the set against the instances
 * discovery actually finds, so a name that matches nothing is a failure rather
 * than a silence.
 */
export const VISUALISER_EXEMPT_INSTANCES = new Set(["bootstrap", "bootstrap"]);

/**
 * Does this entry's declared target actually resolve?
 *
 * **Against the REPOSITORY root and nothing else**, via
 * {@link resolveCoveragePath} — the owner's ruling of 2026-09-21 on bean
 * `yt7j`, and one call site rather than a `resolve()` per consumer.
 *
 * This tried the instance root first and fell back to the repository root,
 * accepting either. That reads as tolerance and is the opposite: a path
 * incorrect in its declared base passed anyway through the other, so this
 * check could not enforce the convention its own schema documents. Measured
 * before the fallback came out — of **45** coverage paths in this repository,
 * **45** resolve from the repository root, and the fallback was load-bearing
 * for none.
 */
function targetExists(repoRoot: string, target: string): boolean {
  // A target may name a PATH or a node id (a skill or tool). Only a path can
  // be checked here; an id that names nothing is the knowledge-graph audit's
  // job, not this one — and reporting an id as "missing" because it is not a
  // file would be the axis lying about what it looked at.
  if (!target.includes("/") && !target.includes(".")) return true;
  return existsSync(resolveCoveragePath(repoRoot, target));
}

/**
 * Does this instance have a STARTING README of its own?
 *
 * The owner, 2026-09-20: *"each harness kind needs readme, it is added as a
 * reference to repo's root readme.md to explain what is in it"*. Bean `ie9l`.
 *
 * ## Why "of its own" is the whole criterion
 *
 * `check-declared-assets` already verifies that a declared asset RESOLVES, and
 * it reports zero findings here — because `cat-harness` declares
 * `src: "README.md"` with `scope: "repository"`, which resolves to the
 * REPOSITORY ROOT's README. The asset is fine. What is wrong is that one file
 * is doing two jobs: "what this repository is" and "what the cat-harness
 * instance is". A reader arriving at either question gets the other one's
 * answer mixed in.
 *
 * So this asks a question the resolve-check structurally cannot: does the
 * README live INSIDE the instance it describes? A repository-scoped README on
 * a non-root instance is a borrowed one, and that is the finding.
 *
 * MAJOR rather than minor, unlike the subgraph criteria: an instance with no
 * starting README is not a gap somebody has not filled in yet, it is an
 * instance a reader cannot enter. The subgraph criteria are minor because 2 of
 * 22 directories have a renderer and a wall of findings gets switched off;
 * there are four instances and three have a README, so this one can be sharp
 * from the start.
 */
export function readmeFinding(
  root: string,
  decl: { assets?: Array<{ role?: string; src: string; scope?: string }> } | undefined,
  isRepositoryRoot: boolean,
): { severity: Severity; detail: string } | undefined {
  return assetRoleFinding(root, decl, isRepositoryRoot, INSTANCE_README_ROLE);
}

/**
 * The same question, asked about the AGENT half of the pair.
 *
 * Added 2026-09-20 (issue #592) because the axis had only ever asked about the
 * README, and the number that argument rests on is the measurement: ten of
 * eleven instances declared `instance-readme` and **two** declared
 * `agent-instructions`. Nine instances were readable by a person and mute to
 * an agent, and nothing said so — not because the check disagreed, but because
 * it was never asked.
 *
 * Same severity as the README's, and for the owner's reason rather than by
 * symmetry: *"agents.md should give good coldstart instructions (dont
 * duplicatae readme.md) but augment"*. An augment that does not exist is not a
 * thinner answer to the reader's question; it is no answer to a different
 * question. See {@link ASSET_ROLES}, which is where each role says what
 * it is for, once.
 */
export function agentInstructionsFinding(
  root: string,
  decl: { assets?: Array<{ role?: string; src: string; scope?: string }> } | undefined,
  isRepositoryRoot: boolean,
): { severity: Severity; detail: string } | undefined {
  return assetRoleFinding(root, decl, isRepositoryRoot, AGENT_INSTRUCTIONS_ROLE);
}

/**
 * One implementation, asked once per role in {@link REQUIRED_ASSET_ROLES}.
 *
 * Written generically rather than copied because the three failure modes are
 * identical for both roles and the copy is where they drift: the `scope`
 * clause in particular is subtle enough that a second hand-written version
 * would plausibly omit it, and its absence reads as a clean instance.
 */
export function assetRoleFinding(
  root: string,
  decl: { assets?: Array<{ role?: string; src: string; scope?: string }> } | undefined,
  isRepositoryRoot: boolean,
  role: string,
): { severity: Severity; detail: string } | undefined {
  const purpose = assetRolePurpose(role) ?? role;
  const asset = (decl?.assets ?? []).find((a) => a.role === role);
  if (asset === undefined) {
    return {
      severity: "major",
      detail: `declares no \`${role}\` asset — nothing provides: ${purpose}`,
    };
  }
  // The repository root legitimately owns the repository's files; every other
  // instance reaching for a repository-scoped one is borrowing it.
  if (asset.scope === "repository" && !isRepositoryRoot) {
    return {
      severity: "major",
      detail:
        `declares its \`${role}\` \`scope: "repository"\`, so it resolves to the repository root's — ` +
        "one file doing two jobs, and a reader of either question gets the other's answer",
    };
  }
  if (!existsSync(resolve(root, asset.src))) {
    return { severity: "major", detail: `declares \`${role}\` \`${asset.src}\` and it is not there` };
  }
  return undefined;
}

/**
 * Does this instance have documentation OF ITS OWN, at `<instance>/docs/`?
 *
 * A DIRECTORY question, which is why it is not another `assetRoleFinding`:
 * README and `agent-instructions` are declared assets, and this is a tree.
 *
 * ## What it asks, and what it deliberately does not
 *
 * The owner, 2026-09-20, settling what a subject page under a handler means:
 *
 * > `<base>/cat-harness/docs/` is where all harness user documentation is… so
 * > documentation at `<base>/cat-harness/docs/who-iris/` is more documentation
 * > ABOUT iris, how it is ingested etc. **not the iris content**. source
 * > content is repo root `who-iris/docs`.
 *
 * Two different things, and an axis that conflated them would pass a
 * repository where half the documentation is missing. This asks only the
 * first: the instance's own source tree. A handler's rendering of a subject
 * is not the subject having documentation.
 *
 * ## Minor, and NOT in the `--strict` gate — on purpose
 *
 * Measured 2026-09-21 across the 12 instances discovery finds: **2 have a
 * `docs/`**. A check that fires on ten of twelve subjects on the day it lands
 * is one people learn to skim, and this repository's own rule is that a check
 * firing on every one of its subjects is a check that is wrong. It reports and
 * ranks; the count is meant to fall first. That is the staging `2krx` asked
 * for, for the same reason.
 *
 * @param root      the instance root
 * @param decl      its declaration, already parsed
 * @returns the finding, or `undefined` when it has `docs/` or is exempt
 */
export function ownDocsFinding(
  root: string,
  decl: Pick<CatHarnessDeclaration, "renderExemption"> | undefined,
): { severity: Severity; detail: string } | undefined {
  // An exemption is read from the DECLARATION, never from a name literal in
  // this file — the rule `isExemptFrom` exists for, and the one that stopped
  // bootstrap's visualiser exemption dying to a rename.
  if (decl !== undefined && isExemptFrom(decl, "own-docs")) return undefined;
  // `siteDirFor` rather than the string, and it is not merely to dodge the
  // literal: an instance's own documentation IS its site root. The first
  // draft hardcoded `"docs"` and two guards objected — `check:declared-paths`
  // ("a DIRECTORY the declaration already answers") and the site-root test,
  // which forbids the literal because getting that string wrong once
  // unignored 3,080 files. Both were right, and the resolver is the answer
  // to both rather than an exemption from either.
  //
  // It also supplies the third state for free: `siteDirFor` THROWS when it
  // cannot determine a site root, and "unreadable" is not "has no
  // documentation". An instance that will not resolve has not been shown to
  // lack docs; it has been shown to be undeterminable, which is a different
  // answer and belongs in `verdict`, not here.
  let siteDir: string;
  try {
    siteDir = siteDirFor(root);
  } catch {
    // NOT `undefined`. Returning nothing here would mean "has documentation",
    // and an instance whose site root cannot be resolved has not been shown to
    // have any — it has been shown to be undeterminable. The first draft
    // returned undefined and the tests caught it, which is the three-state
    // rule this file states elsewhere being broken in the act of citing it.
    return {
      severity: "minor",
      detail:
        "site root could not be determined, so whether it has `docs/` of its " +
        "own is UNKNOWN — not a finding that it lacks documentation",
    };
  }
  if (existsSync(resolve(root, siteDir))) return undefined;
  return {
    severity: "minor",
    detail:
      "has no `docs/` of its own — a reader entering this instance has its " +
      "README and nothing beneath it",
  };
}

export function auditInstance(root: string, repoRoot: string = repoRootFor(root)): InstanceCoverage {
  const instance = root.split("/").pop() ?? root;
  let decl: CatHarnessDeclaration | undefined;
  try {
    decl = readDeclaration(root);
  } catch (e) {
    return {
      instance,
      verdict: "undetermined",
      declared: 0,
      findings: [],
      exempted: [],
      reason: `declaration unreadable: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  if (decl === undefined) {
    return {
      instance,
      verdict: "undetermined",
      declared: 0,
      findings: [],
      exempted: [],
      reason: "no declaration",
    };
  }

  const findings: CoverageFinding[] = [];
  const exempted: InstanceCoverage["exempted"] = [];
  const dirs = decl.directories ?? [];

  for (const dir of dirs) {
    for (const criterion of CRITERIA) {
      if (criterion === "visualiser" && VISUALISER_EXEMPT_INSTANCES.has(instance)) continue;

      // SERIALISATIONS take no waiver, and `tsc` is what says so: dropping
      // the key from `exempt` in the schema turned this lookup into a type
      // error the moment the criterion was added, rather than into a silent
      // `undefined` that would have read as "not exempted" and worked by luck.
      //
      // The owner's ruling, 2026-09-20: *"harnesses cannot override there
      // being in the KG."* Rendering, documenting and governing are choices
      // about effort; addressability is the claim that the nodes are in the
      // graph at all.
      const waiver = criterion === "serialisations" ? undefined : dir.coverage?.exempt?.[criterion];
      if (waiver !== undefined) {
        exempted.push({ directory: dir.id, criterion, reason: waiver });
        continue;
      }

      const declared = dir.coverage?.[criterion];
      if (declared === undefined) {
        // An UNMET OBLIGATION outranks an unanswered question.
        //
        // The owner, 2026-09-20: a directory an instance declares or initiates
        // and then writes to — `beans/`, `todos/`, `fsh-guts/` — owes a
        // visualiser "as requiement of handler". So for those kinds a missing
        // one is not "nobody has said yet", it is a thing the declaring
        // instance promised and did not deliver.
        //
        // Ranked, not gated, and the axis stays advisory: 0 of 20 such
        // directories have one today, and a hard gate on day one is the wall
        // this file's own header says somebody switches off. What changes is
        // that the 20 stop being indistinguishable from the kinds that never
        // owed anything.
        // SERIALISATIONS are owed by every declared directory, with no
        // by-kind test — the owner's rule is "all dir urls". That is not the
        // usual shape here and `hfkl` is the reason it is right: bootstrap is
        // excused a VISUALISER precisely because its json/jsonld "is its
        // existence", so the thing it is excused into cannot itself be
        // excusable by kind. The visualiser is the courtesy; the serialisation
        // is the existence claim.
        const unmetObligation =
          criterion === "serialisations" ||
          (criterion === "visualiser" && dir.graphKinds.some((g) => owesVisualiser(g)));
        findings.push({
          instance,
          directory: dir.id,
          criterion,
          severity: unmetObligation ? "major" : "minor",
          detail:
            criterion === "serialisations"
              ? `no serialisations declared — every declared directory owes json, jsonld and ` +
                `schema.json at its own URL, and this one is excused nothing`
              : unmetObligation
                ? `no visualiser declared, and ${dir.graphKinds.filter((g) => owesVisualiser(g)).join(", ")} owes one — ` +
                  `an instance renders what it declares`
                : `no ${criterion} declared — nobody has said what ${ASKS[criterion]}`,
        });
        continue;
      }
      // A visualiser may now be SEVERAL — the owner's *"harness can declare >= 1
      // visualiztion"*. Each ref is checked on its own, so a directory whose
      // second visualisation is broken is reported for that one rather than
      // for the whole declaration: "one of your two viewers is missing" and
      // "your viewer is missing" are different repairs.
      const refs =
        criterion === "visualiser"
          ? visualisationsOf(dir.coverage, dir.id).map((v) => v.ref)
          : [declared as string];
      const broken = refs.filter((r) => !targetExists(repoRoot, r));
      if (broken.length > 0) {
        findings.push({
          instance,
          directory: dir.id,
          criterion,
          severity: "major",
          detail:
            broken.length === refs.length
              ? `declares ${criterion} "${broken.join('", "')}" and it does not resolve`
              : `declares ${refs.length} ${criterion}s and ${broken.length} do not resolve: ` +
                `"${broken.join('", "')}"`,
        });
      }
    }
  }

  // `resolve(root) === resolve(repoRootFor(root))` — a directory compared with
  // its own PARENT, which can only be equal at the filesystem root. So this was
  // false for every instance including the repository root itself, and the
  // guard below ("the repository root legitimately owns the repository's
  // files") could never fire for the one instance it exists for. Latent rather
  // than visible today: the root declaration's two assets carry no `scope`, so
  // nothing was being wrongly accused yet. Found while building
  // `resolveCoveragePath` (bean `yt7j`); the repository root is now passed in
  // rather than guessed at, which is the same fix in both places.
  const isRoot = resolve(root) === resolve(repoRoot);
  const readme = readmeFinding(root, decl, isRoot);
  const agentInstructions = agentInstructionsFinding(root, decl, isRoot);
  const ownDocs = ownDocsFinding(root, decl);
  return {
    instance,
    verdict: "checked",
    declared: dirs.length,
    findings,
    exempted,
    readme,
    agentInstructions,
    ownDocs,
  };
}

export function auditAll(repoRoot: string): InstanceCoverage[] {
  return instanceRootsIn(repoRoot).map((r) => auditInstance(r, repoRoot));
}

export function formatReport(rs: InstanceCoverage[]): string {
  const out: string[] = ["Subgraph coverage — visualiser, docs, governing skill, serialisations", ""];
  for (const r of rs) {
    if (r.verdict === "undetermined") {
      out.push(`  ? ${r.instance.padEnd(22)} undetermined — ${r.reason ?? "no reason given"}`);
      continue;
    }
    const major = r.findings.filter((f) => f.severity === "major").length;
    out.push(
      `  · ${r.instance.padEnd(22)} ${String(r.declared).padStart(3)} declared, ` +
        `${String(r.findings.length).padStart(3)} finding(s)` +
        (major ? `, ${major} MAJOR` : "") +
        (r.exempted.length ? `, ${r.exempted.length} exempt` : ""),
    );
    if (r.agentInstructions !== undefined) {
      out.push(`      ✗ ${r.instance} / agent-instructions: ${r.agentInstructions.detail}`);
    }
    if (r.readme !== undefined) {
      out.push(`      ✗ ${r.instance} / readme: ${r.readme.detail}`);
    }
    // A DIFFERENT glyph, because this one is advisory and the two above gate
    // under `--strict`. Printing them alike would invite a reader to treat a
    // backlog item and a defect as the same thing.
    if (r.ownDocs !== undefined) {
      out.push(`      · ${r.instance} / own-docs: ${r.ownDocs.detail}`);
    }
    for (const f of r.findings.filter((x) => x.severity === "major")) {
      out.push(`      ✗ ${f.directory} / ${f.criterion}: ${f.detail}`);
    }
    for (const e of r.exempted) {
      out.push(`      – ${e.directory} / ${e.criterion} exempt: ${e.reason}`);
    }
  }

  const noReadme = rs.filter((r) => r.readme !== undefined).length;
  const noAgents = rs.filter((r) => r.agentInstructions !== undefined).length;
  // Counted and reported as its OWN axis. It was argued for on the grounds
  // that the README and docs sets were disjoint; measured 2026-09-21 they are
  // not — every instance now declares a README, so docs is a strict subset.
  // The axes stay separate anyway, for the reason that survives the
  // measurement: they are different questions. "Can a reader enter this
  // instance" and "is there anything to read once inside" do not collapse into
  // one number just because one set happens to contain the other.
  const noOwnDocs = rs.filter((r) => r.ownDocs !== undefined).length;
  const undet = rs.filter((r) => r.verdict === "undetermined").length;
  const all = rs.flatMap((r) => r.findings);
  const major = all.filter((f) => f.severity === "major").length;
  out.push("");
  out.push(
    `${all.length} finding(s) across ${rs.length - undet} instance(s) — ${major} major, ${all.length - major} minor.`,
  );
  if (noReadme) {
    out.push(
      `${noReadme} instance(s) have no starting README OF THEIR OWN — an instance a reader cannot enter.`,
    );
  }
  if (noAgents) {
    out.push(
      `${noAgents} instance(s) have no \`AGENTS.md\` OF THEIR OWN — readable by a person, mute to an agent.`,
    );
  }
  if (noOwnDocs) {
    // ADVISORY, and it says so in the line itself rather than only in a
    // comment nobody reading the output will see. On the day this landed it
    // fired on 10 of 12, and a reader who does not know that is entitled to
    // read it as 10 defects.
    out.push(
      `${noOwnDocs} instance(s) have no \`docs/\` OF THEIR OWN — advisory, not gated: ` +
        "the count is meant to fall before this is held to.",
    );
  }
  if (undet) {
    out.push(
      `${undet} instance(s) UNDETERMINED — not a clean run. A sweep blind on one has not cleared the others.`,
    );
  }
  // The exemption is a second criterion rather than a hole, so say out loud
  // that it was applied — a waiver nobody sees is a silence list.
  out.push(
    `\`${[...VISUALISER_EXEMPT_INSTANCES].join(", ")}\` is exempt from \`visualiser\` by layer, ` +
      "and owes its own .json/.jsonld instead (owner, 2026-09-20).",
  );
  return out.join("\n");
}

if (import.meta.main) {
  const repoRoot = repoRootFor(instanceRootFor(import.meta.dir));
  const rs = auditAll(repoRoot);
  if (rs.length === 0) {
    console.error("No instance carries a declaration. That is not a clean run — nothing was checked.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(rs, null, 2) : formatReport(rs));
  // ADVISORY, by the rule at the top of this file. `--strict` is for the day
  // the minor count is low enough to hold, and for a caller who wants to pin
  // "no MAJOR findings" now — a declared-but-missing target is already a
  // defect rather than a backlog item.
  if (
    process.argv.includes("--strict") &&
    rs.some(
      (r) =>
        r.readme !== undefined ||
        r.agentInstructions !== undefined ||
        r.findings.some((f) => f.severity === "major"),
    )
  ) {
    process.exit(1);
  }
  if (rs.some((r) => r.verdict === "undetermined")) process.exit(2);
  process.exit(0);
}

export { join };
