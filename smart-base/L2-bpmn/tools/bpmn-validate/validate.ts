#!/usr/bin/env bun
/**
 * validate.ts: one check of a DAK's BPMN, its structure, its vendor
 * namespaces and its lanes' actors. The Tool node is `bpmn-validate.ts`
 * beside this file.
 *
 * Bean folio-assistant-tgaj replaced four overlapping validators with this
 * one: `bpmn_author/validators/bpmn_xml_validator.py` and
 * `swimlane_validator.py`, `bpmn_import/validators/swimlane_actor_validator.py`
 * and `bpmn_layout/validate_swimlanes.py` (all under `.github/skills/`). Their
 * checks are kept, with their codes; two of their defects are not:
 *
 * - a lane was matched to an ActorDefinition by a GUESSED FILE NAME
 *   (`input/fsh/actors/ActorDefinition-DAK.<laneId>.fsh`) or by fuzzy title
 *   matching. Here a lane names its actor by id, as cat-harness's
 *   `role-model` says a lane binds its role: BPMN's own `partitionElementRef`
 *   (naming a top-level `<bpmn:resource>`), else the lane's own id; and that
 *   id is matched, exactly, against the `Instance:` ids of the FSH
 *   ActorDefinitions (and the `id` of any ActorDefinition JSON). A binding
 *   that is a harness role id (a `scenarios/roles.json` of a mounted layer)
 *   is accepted as a role; whether the role is equipped is cat-harness's
 *   `kg:audit` question, not this one;
 * - they read `input/business-processes/`, which no repository has. This
 *   reads the declared process directories: `smart-base/**\/processes/` and
 *   an IG's `input/bpmn/`.
 *
 * The XML is parsed by bpmn-moddle (cat-harness-tools' process renderer's
 * parser, the one bpmn-js imports with), which resolves no external entity
 * and reports every import warning; a warning here is what bpmn-js would
 * warn on import.
 *
 *   bun run smart-base/L2-bpmn/tools/bpmn-validate/validate.ts [file.bpmn ...]
 *     [--root <repo>] [--fsh <dir>]... [--roles <roles.json>]... [--changed <git ref>] [--json]
 *
 * Exit: 0 no error (warnings may be printed), 1 an error, 2 nothing to check
 * (no BPMN found, which is not a pass).
 *
 * @module smart-base/L2-bpmn/tools/bpmn-validate/validate
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { BpmnModdle } from "bpmn-moddle";

export type Severity = "error" | "warning" | "info";

export interface Finding {
  severity: Severity;
  code: string;
  message: string;
  file: string;
}

/** Namespaces a DAK's BPMN may not use: it is OMG BPMN 2.0, not an engine's dialect. */
export const FORBIDDEN_NAMESPACES: Record<string, string> = {
  "http://camunda.org/schema/zeebe/1.0": "Zeebe",
  "http://camunda.org/schema/1.0/bpmn": "Camunda",
  "http://camunda.org/schema/1.0/dmn": "Camunda",
  "http://camunda.org/schema/modeler/1.0": "Camunda Modeler",
};

/** A FHIR id, which an FSH Instance id and so a lane id must be. */
export const FSH_ID = /^[A-Za-z0-9.-]{1,64}$/;

/** The flow nodes a lane should hold. */
const FLOW_NODE_TYPES = new Set(
  [
    "Task", "UserTask", "ServiceTask", "SendTask", "ReceiveTask", "ManualTask", "BusinessRuleTask", "ScriptTask",
    "CallActivity", "SubProcess", "AdHocSubProcess", "Transaction",
    "StartEvent", "EndEvent", "IntermediateThrowEvent", "IntermediateCatchEvent", "BoundaryEvent",
    "ExclusiveGateway", "ParallelGateway", "InclusiveGateway", "EventBasedGateway", "ComplexGateway",
  ].map((t) => `bpmn:${t}`),
);

/** The process directories BPMN is read from when no file is named. */
export const PROCESS_GLOBS = ["smart-base/**/processes/**/*.bpmn", "input/bpmn/**/*.bpmn"];

/** Roles files of the layers a checkout mounts, read when no `--roles` is given. */
export const DEFAULT_ROLES = [
  "smart-base/scenarios/roles.json",
  "cat-harness/scenarios/roles.json",
  "fhir-harness/scenarios/roles.json",
  "folio-assistant-core/scenarios/roles.json",
];

// ── what the lanes may name ───────────────────────────────────────────────

/**
 * The ActorDefinition ids an FSH source declares: each `Instance:` whose
 * entity has `InstanceOf: ActorDefinition`, in whatever order its keyword
 * lines come.
 */
export function actorIdsFromFsh(fsh: string): string[] {
  const ids: string[] = [];
  const entity = /^(Alias|Profile|Extension|Logical|Resource|Instance|Invariant|ValueSet|CodeSystem|RuleSet|Mapping|Logical)\s*:\s*(\S+)/;
  let current: { kind: string; id: string; actor: boolean } | undefined;
  const close = () => { if (current?.kind === "Instance" && current.actor) ids.push(current.id); };
  for (const line of fsh.split("\n")) {
    const m = entity.exec(line);
    if (m) { close(); current = { kind: m[1]!, id: m[2]!, actor: false }; continue; }
    if (current && /^InstanceOf\s*:\s*ActorDefinition\s*$/.test(line.trim())) current.actor = true;
  }
  close();
  return ids;
}

/** The ActorDefinition ids under some directories: FSH `Instance:` ids and JSON resource ids. */
export function actorIdsIn(dirs: string[]): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (d: string): void => {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (e.name.endsWith(".fsh")) for (const id of actorIdsFromFsh(readFileSync(p, "utf-8"))) out.set(id, p);
      else if (e.name.endsWith(".json")) {
        try {
          const j = JSON.parse(readFileSync(p, "utf-8")) as { resourceType?: string; id?: string };
          if (j.resourceType === "ActorDefinition" && j.id) out.set(j.id, p);
        } catch { /* not a resource */ }
      }
    }
  };
  for (const d of dirs) walk(d);
  return out;
}

/** The role ids some `scenarios/roles.json` files declare (`roles[].id`). */
export function roleIdsIn(files: string[]): Set<string> {
  const out = new Set<string>();
  for (const f of files) {
    if (!existsSync(f)) continue;
    const j = JSON.parse(readFileSync(f, "utf-8")) as { roles?: { id?: string }[] };
    for (const r of j.roles ?? []) if (r.id) out.add(r.id);
  }
  return out;
}

// ── one file ──────────────────────────────────────────────────────────────

type El = {
  $type: string;
  id?: string;
  name?: string;
  rootElements?: El[];
  laneSets?: El[];
  lanes?: El[];
  childLaneSet?: El;
  flowNodeRef?: El[];
  flowElements?: El[];
  partitionElementRef?: El;
  $attrs?: Record<string, string>;
};

export interface Context {
  /** ActorDefinition id → where it is declared. */
  actors: Map<string, string>;
  /** Harness role ids. */
  roles: Set<string>;
}

/** Validate one BPMN source. `file` is only the name findings carry. */
export async function validateBpmn(xml: string, file: string, ctx: Context): Promise<Finding[]> {
  const out: Finding[] = [];
  const add = (severity: Severity, code: string, message: string) => out.push({ severity, code, message, file });

  // Vendor namespaces: a namespace is declared before it is used, so its
  // declaration is where to look, whatever prefix it was given.
  for (const m of xml.matchAll(/\bxmlns(?::[\w.-]+)?\s*=\s*["']([^"']+)["']/g)) {
    const uri = m[1]!;
    const vendor = FORBIDDEN_NAMESPACES[uri] ?? (/camunda\.(org|com)/.test(uri) ? "Camunda" : undefined);
    if (vendor) add("error", "BPMN-003", `forbidden ${vendor} namespace ${uri}`);
  }

  let defs: El;
  let warnings: { message: string }[];
  try {
    const r = await new BpmnModdle().fromXML(xml);
    defs = r.rootElement as unknown as El;
    warnings = r.warnings as { message: string }[];
  } catch (e) {
    const msg = (e as Error).message.replace(/\s+/g, " ").trim();
    if (/failed to parse document as <bpmn:Definitions>/.test(msg)) add("error", "BPMN-002", "the root element is not <bpmn:definitions>");
    else add("error", "BPMN-001", `not well-formed XML: ${msg}`);
    return out;
  }
  if (defs?.$type !== "bpmn:Definitions") {
    add("error", "BPMN-002", `the root element is <${defs?.$type ?? "?"}>, not <bpmn:definitions>`);
    return out;
  }
  for (const w of warnings) {
    const msg = w.message.replace(/\s+/g, " ").trim();
    const dup = /duplicate ID <([^>]+)>/.exec(msg);
    if (dup) add("error", "BPMN-005", `duplicate id '${dup[1]}' (bpmn-moddle drops the second element)`);
    else add("error", "BPMN-006", `bpmn-js would warn on import: ${msg}`);
  }

  const processes = (defs.rootElements ?? []).filter((e) => e.$type === "bpmn:Process");
  if (!processes.length) add("error", "BPMN-004", "no <bpmn:process>");

  const laneIds = new Set<string>();
  for (const proc of processes) {
    const pid = proc.id ?? "?";
    const sets = proc.laneSets ?? [];
    if (!sets.length) { add("error", "SWIM-002", `process '${pid}' has no <laneSet>`); continue; }
    const held = new Set<string>();
    const innermost: El[] = [];
    const walk = (set: El | undefined): void => {
      for (const lane of set?.lanes ?? []) {
        const id = lane.id ?? "";
        if (id) {
          if (laneIds.has(id)) add("error", "SWIM-004", `duplicate lane id '${id}'`);
          laneIds.add(id);
          if (!FSH_ID.test(id)) add("warning", "SWIM-003", `lane id '${id}' is not a valid FSH/FHIR id (A-Z a-z 0-9 - . only, at most 64)`);
        }
        for (const n of lane.flowNodeRef ?? []) if (n.id) held.add(n.id);
        if (lane.childLaneSet?.lanes?.length) walk(lane.childLaneSet);
        else innermost.push(lane);
      }
    };
    for (const s of sets) walk(s);
    for (const n of proc.flowElements ?? []) {
      if (FLOW_NODE_TYPES.has(n.$type) && n.id && !held.has(n.id)) {
        add("warning", "SWIM-005", `${n.$type.slice(5)} '${n.id}' is in no lane of process '${pid}'`);
      }
    }
    for (const lane of innermost) {
      const label = lane.name ? `'${lane.id}' (${lane.name})` : `'${lane.id}'`;
      if (!lane.id) { add("warning", "ACTOR-002", `a lane without an id (name '${lane.name ?? ""}')`); continue; }
      const ref = lane.partitionElementRef?.id;
      // A partitionElementRef the file does not declare is unresolved: bpmn-moddle reported it above.
      const raw = lane.$attrs?.partitionElementRef;
      if (!ref && raw) { add("error", "ACTOR-004", `lane ${label} names '${raw}' in partitionElementRef, which no <bpmn:resource> in the file declares`); continue; }
      const binding = ref ?? lane.id;
      if (ctx.actors.has(binding)) { add("info", "ACTOR-000", `lane ${label} → ActorDefinition ${binding}`); continue; }
      if (ref && ctx.roles.has(ref)) { add("info", "ACTOR-005", `lane ${label} → role ${ref} (a harness role, judged by cat-harness's role-model)`); continue; }
      if (ref) add("error", "ACTOR-004", `lane ${label} binds '${ref}', which is neither an ActorDefinition Instance id nor a declared role`);
      else add("error", "ACTOR-003", `lane ${label} binds no actor: no partitionElementRef, and no ActorDefinition has the Instance id '${lane.id}'`);
    }
  }
  return out;
}

// ── the files ─────────────────────────────────────────────────────────────

/** The BPMN under the declared process directories of a checkout. */
export function processFiles(root: string): string[] {
  const out = new Set<string>();
  for (const pattern of PROCESS_GLOBS) {
    for (const f of new Bun.Glob(pattern).scanSync({ cwd: root, onlyFiles: true })) {
      if (!f.split("/").includes("node_modules")) out.add(f);
    }
  }
  return [...out].sort();
}

/** True when a repository path is under a declared process directory. */
export function inProcessDir(path: string): boolean {
  return PROCESS_GLOBS.some((p) => new Bun.Glob(p).match(path));
}

/** The `.bpmn` files a branch changed against `base`, still present and in a process directory. */
export function changedFiles(root: string, base: string): string[] {
  const diff = execFileSync("git", ["-C", root, "diff", "--name-only", "--diff-filter=d", `${base}...HEAD`, "--", "*.bpmn"], { encoding: "utf-8" });
  return diff.split("\n").map((s) => s.trim()).filter((f) => f && inProcessDir(f) && existsSync(join(root, f))).sort();
}

const MARK: Record<Severity, string> = { error: "✗", warning: "!", info: " " };

if (import.meta.main) {
  const args = process.argv.slice(2);
  const many = (k: string) => args.flatMap((a, i) => (a === k && args[i + 1] ? [args[i + 1]!] : []));
  const one = (k: string) => many(k)[0];
  const flagged = new Set(["--root", "--fsh", "--roles", "--changed"]);
  const named = args.filter((a, i) => !a.startsWith("--") && !flagged.has(args[i - 1] ?? ""));
  const root = one("--root") ?? process.cwd();
  const base = one("--changed");
  const files = named.length
    ? named.map((f) => relative(root, join(process.cwd(), f)) || f)
    : base ? changedFiles(root, base) : processFiles(root);
  if (!files.length) {
    console.error(base ? `no .bpmn under a process directory changed against ${base}: nothing to check` : `no BPMN under ${PROCESS_GLOBS.join(", ")} in ${root}: nothing to check (not a pass)`);
    process.exit(base ? 0 : 2);
  }
  const fshDirs = many("--fsh").length ? many("--fsh") : ["input/fsh", "input/resources"];
  const ctx: Context = {
    actors: actorIdsIn(fshDirs.map((d) => join(root, d))),
    roles: roleIdsIn((many("--roles").length ? many("--roles") : DEFAULT_ROLES).map((f) => join(root, f))),
  };
  const all: Finding[] = [];
  for (const f of files) {
    const p = join(root, f);
    if (!existsSync(p) || !statSync(p).isFile()) { all.push({ severity: "error", code: "BPMN-000", message: "file not found", file: f }); continue; }
    all.push(...(await validateBpmn(readFileSync(p, "utf-8"), f, ctx)));
  }
  const count = (s: Severity) => all.filter((x) => x.severity === s).length;
  if (args.includes("--json")) {
    console.log(JSON.stringify({ files, actors: ctx.actors.size, roles: ctx.roles.size, findings: all }, null, 2));
  } else {
    for (const x of all) if (x.severity !== "info" || args.includes("--verbose")) console.log(`${MARK[x.severity]} ${x.file}: ${x.code} ${x.message}`);
    console.log(`bpmn-validate: ${files.length} file(s), ${ctx.actors.size} ActorDefinition(s), ${ctx.roles.size} role(s): ${count("error")} error(s), ${count("warning")} warning(s)`);
  }
  process.exit(count("error") ? 1 : 0);
}
