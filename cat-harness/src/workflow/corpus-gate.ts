/**
 * The commit boundary: refuse a corpus write the process never authorised.
 *
 * Everything before this was answerable — `workflow_gate` will tell an agent
 * whether a step is enabled, if it asks. This is the piece that does not
 * depend on asking. It runs from a pre-commit hook or from CI, so an agent
 * that ignored the whole orchestration still cannot land a block change that
 * no instance records the editor having seen the findings for.
 *
 * That is the difference the proposal called a map versus a rail
 * (`docs/proposals/workflow-orchestration.md` §4), and the reason it is here
 * rather than inside each of twenty-five capability tools: it is one place,
 * and it is not the agent that runs it.
 *
 * ## What counts as a corpus write
 *
 * A changed file that is a block manifest, or a sibling of one — `<block>.ts`,
 * `.md`, `.lean`, and *not* `.qa.json`, which is machine-written by the sweep
 * and would make every sweep look like an unauthorised edit. Anything else is
 * ignored: this gate is about content, not about the platform.
 *
 * ## Identity comes from the module, and failure is closed
 *
 * The block's label is read by importing it (`loadBlockModuleSync`), gated by
 * the cheap textual check so only real manifests are executed — the same split
 * `walkBlocks` uses. Only the changed files are loaded, so the cost is O(the
 * diff) rather than O(the corpus).
 *
 * A block whose label cannot be established is **refused**, not waved through.
 * A gate that fails open is a gate that reports clean by not looking.
 *
 * @module folio-assistant/workflow/corpus-gate
 */

import { existsSync } from "node:fs";
import { workflowFiles } from "../../scripts/known-skills.js";
import { basename, resolve } from "node:path";
import { loadProcessModel, type ProcessModel } from "./process-model.js";
import { checkGate, loadRelaxations, validateRelaxations, type Relaxation } from "./gate.js";
import { instanceId, loadInstance } from "./store.js";

/** The step a corpus write must have been authorised by. */
export const COMMIT_ACTIVITY = "Task_Commit";
/**
 * The diagram this gate exists for, by NAME — not by path.
 *
 * Naming it is correct and stays: `editing-hci-validation` is one of the
 * three STRICT base processes, and the gate's whole job is refusing a corpus
 * write the editor did not authorise IN THAT process. A discovered "whatever
 * process happens to be there" would be a different and much weaker check.
 *
 * What was wrong was looking for it at a fixed `processes/` — an
 * instance that declares its knowledge graph elsewhere has the diagram and
 * the gate cannot find it, so the gate throws rather than gating. The name is
 * the base case; the LOCATION comes from the declaration.
 */
const EDITING_PROCESS_STEM = "editing-hci-validation";

/** Extensions that are a block's own content. `.qa.json` is machine-written. */
const CONTENT_SIBLINGS = [".ts", ".md", ".lean"];

export interface GateFinding {
  /** Repo-relative path that triggered this. */
  file: string;
  /** Block label, when it could be established. */
  label?: string;
  /** Instance id looked for. */
  instance?: string;
  allowed: boolean;
  reason: string;
}

/** Reduce a changed sibling to the block manifest it belongs to. */
function manifestFor(repoRoot: string, file: string): string | undefined {
  const abs = resolve(repoRoot, file);
  const dot = abs.lastIndexOf(".");
  if (dot === -1) return undefined;
  const ext = abs.slice(dot);
  if (!CONTENT_SIBLINGS.includes(ext)) return undefined;
  const ts = `${abs.slice(0, dot)}.ts`;
  return existsSync(ts) ? ts : undefined;
}

/**
 * Establish the block label a changed file belongs to.
 *
 * `undefined` means the file is not part of a block — a helper module, a
 * script, a chapter manifest. Those are not corpus writes and are not this
 * gate's business. A file that *is* a manifest but will not load must throw,
 * because "cannot tell" must not read as "fine".
 *
 * **Supplied by the caller, not imported here.** Reading a block manifest is
 * the content pipeline's job, and this gate is harness-layer: importing
 * `content/pipeline/` from `src/workflow/` was two of the six wrong-direction
 * edges bean `zlmp` is draining, and after the five-repo split each is a
 * circular dependency between repositories. The gate needs a label for a path;
 * it does not need to know what a block manifest is.
 */
export type LabelForPath = (tsPath: string) => string | undefined;

export interface CorpusGateOptions {
  /** Files changed in this commit, repo-relative. */
  files: string[];
  /** Where the folio's `processes/` lives — the platform checkout. */
  platformRoot: string;
  /**
   * Resolve a changed `.ts` path to the block label it declares.
   *
   * Required rather than defaulted: a default would have to import the content
   * pipeline here, which is the dependency this parameter exists to remove.
   */
  labelFor: LabelForPath;
}

/**
 * Check every changed content file against the editing process.
 *
 * Returns one finding per block (not per file — a change to `x.ts` and `x.md`
 * is one block's worth of work, and reporting it twice would suggest two
 * problems). Files that are not content are simply absent from the result.
 */
export async function checkCorpusGate(
  repoRoot: string,
  opts: CorpusGateOptions,
): Promise<GateFinding[]> {
  const bpmn = workflowFiles(opts.platformRoot).find(
    (f) => basename(f, ".bpmn") === EDITING_PROCESS_STEM,
  );
  if (!bpmn) {
    throw new Error(
      `No ${EDITING_PROCESS_STEM}.bpmn in any knowledge-graph directory ` +
        `declared by ${opts.platformRoot}. Point --platform at the folio-assistant checkout.`,
    );
  }
  const model: ProcessModel = await loadProcessModel(bpmn);
  let relaxations: Relaxation[] = [];
  try {
    relaxations = loadRelaxations(opts.platformRoot);
    validateRelaxations(relaxations, [model]);
  } catch (e) {
    // A malformed policy must not silently become "no relaxations", which would
    // refuse work a package had legitimately declared.
    throw new Error(`Workflow policy is not loadable, so the gate cannot run: ${String(e)}`);
  }

  const seen = new Map<string, GateFinding>();

  for (const file of opts.files) {
    const ts = manifestFor(repoRoot, file);
    if (!ts) continue;

    let label: string | undefined;
    try {
      label = opts.labelFor(ts);
    } catch (e) {
      const finding: GateFinding = {
        file,
        allowed: false,
        reason: `${String(e)} — a block whose identity cannot be established cannot be checked, and this gate does not fail open.`,
      };
      seen.set(ts, finding);
      continue;
    }
    if (!label) continue; // not a block: not this gate's business
    if (seen.has(ts)) continue;

    const id = instanceId(model.id, label);
    const state = loadInstance(opts.platformRoot, id) ?? loadInstance(repoRoot, id);
    if (!state) {
      seen.set(ts, {
        file,
        label,
        instance: id,
        allowed: false,
        reason:
          `no workflow instance \`${id}\` — nothing records that the validation findings ` +
          `were shown to the editor for this block. Start one with workflow_start ` +
          `{ process: "editing-hci-validation", subject: "${label}" }.`,
      });
      continue;
    }

    // Either the commit step is enabled now, or it has already been taken —
    // both mean the editor's decision is on record, which is what this checks.
    const alreadyCommitted = state.history.some((h) => h.node === COMMIT_ACTIVITY);
    const verdict = checkGate(model, state, COMMIT_ACTIVITY, relaxations);
    seen.set(ts, {
      file,
      label,
      instance: id,
      allowed: alreadyCommitted || verdict.allowed,
      reason: alreadyCommitted ? `${COMMIT_ACTIVITY} already recorded` : verdict.reason,
    });
  }

  return [...seen.values()];
}
