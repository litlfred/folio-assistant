#!/usr/bin/env bun
/**
 * Is the Bun RUNNING HERE the one `.bun-version` pins?
 *
 * ## Why this is not part of `check:bun-pin`, and not a gate at all
 *
 * `check:bun-pin` asks a question about the CORPUS: do the 22 `setup-bun` sites
 * agree with `.bun-version`? Every checkout answers that identically, so it is
 * gateable, and it belongs in `bun run gates`.
 *
 * This asks a question about the ENVIRONMENT: does the engine that is about to
 * run `bun test` match the pin? The answer differs per container and no commit
 * can change it. Two consequences, both deliberate:
 *
 * 1. **It is not in the gate set.** A gate that fails on a fact about the
 *    machine would go red on every agent container while every reviewer read it
 *    as a verdict on the diff — and the whole point of the pin (#1442) was to
 *    stop an always-red signal, not to install a second one.
 * 2. **It is printed at SESSION START**, by `session-start-coord-sweep.sh`,
 *    because the cost it prevents is paid at `git add`, not at review. An agent
 *    told up front that its Bun differs knows the 72 sidecar rewrites it is
 *    about to see are noise; an agent not told discovers them in a diff and has
 *    to work out whether they are its own.
 *
 * ## The failure this exists to stop
 *
 * Bean `3ozg`, and the near-miss recorded on it 2026-09-27. The pin cannot reach
 * a container image the repository does not control, so `bun test` in a
 * mismatched container still rewrites every sidecar whose stamp differs. The
 * standing remedy was "discard them locally", and it has a timing window:
 *
 * 1. `bun run gates` is started in the BACKGROUND while other work continues.
 * 2. `git status` is checked — clean, the run has not reached the writer yet.
 * 3. The run reaches `saveQaScriptSidecar` and rewrites the sidecars.
 * 4. `git add -A` sweeps them into a commit about something else.
 *
 * Measured: 72 sidecars entered a commit about `check:anchor-names`, caught only
 * on inspection afterwards. The idiom used to inspect —
 * `git status --porcelain | grep -v 'script-sidecars'` — filtered out its own
 * subject. Being told at step 0 is what closes that, since no `git status` at
 * step 2 can.
 *
 * ## `bun-` is a prefix, and getting it wrong would make this silently useless
 *
 * A sidecar records `engine_version: "bun-1.3.14"`; `.bun-version` holds the
 * bare `1.3.14`. Comparing the two directly never matches, so a naive version
 * of this check would report every sidecar as due for a rewrite in every
 * container, including a correctly-matched one. That is the same shape as the
 * `PinDef.tagPrefix` defect #1442 found in the pin machinery while using it
 * (`setup-bun` takes `1.3.14`, upstream tags `bun-v1.3.14`), which is why the
 * prefix is a named constant with its own test rather than an inline template.
 *
 * ## Three states, and `cannot-tell` is not `match`
 *
 *     match        the running engine is the pinned one            exit 0
 *     mismatch     they differ — with the rewrite count            exit 1
 *     cannot-tell  no pin, unparseable pin, or no Bun to ask       exit 2
 *
 * `cannot-tell` exits 2 rather than 0 for the reason the rest of this
 * repository does: an unanswered question rendered as a clean answer is the
 * `dh4f` defect, and it is worse here than a plain failure, because the thing
 * being silently declared fine is the agent's own tree.
 *
 * @module folio-assistant/scripts/check-bun-runtime
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { PIN_FILE, readPinFile } from "./check-bun-pin.ts";
import { SCRIPT_SIDECAR_DIR } from "../content/pipeline/qa-utils.ts";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(INSTANCE_ROOT, "..");

/**
 * What a sidecar's `engine_version` puts in front of the version.
 *
 * Named because it is the difference between this check working and this check
 * reporting every sidecar stale in every container — see the module header.
 */
export const ENGINE_PREFIX = "bun-";

export type Verdict = "match" | "mismatch" | "cannot-tell";

export interface RuntimeReport {
  verdict: Verdict;
  /** The literal `.bun-version` holds, when it could be read. */
  pinned?: string;
  /** The engine actually running, bare — no `bun-` prefix. */
  running?: string;
  /** Why the verdict is `cannot-tell`. Absent otherwise. */
  reason?: string;
  /** Sidecars read. A scan that matched nothing must not read clean. */
  sidecars: number;
  /** Of those, how many carry an `engine_version` the running engine will change. */
  willRewrite: number;
}

/**
 * The whole judgement, as a function of its three inputs.
 *
 * Pure and parameterised rather than reading the environment, so a test can
 * build a mismatch instead of describing one. A check whose only demonstrated
 * behaviour is on a correct machine has not been shown to fire.
 */
export function judge(
  pinned: string | undefined,
  running: string | undefined,
  engineVersions: readonly (string | undefined)[],
): RuntimeReport {
  const sidecars = engineVersions.length;
  if (pinned === undefined) {
    return { verdict: "cannot-tell", running, reason: `${PIN_FILE} is absent or holds no bare X.Y.Z`, sidecars, willRewrite: 0 };
  }
  if (running === undefined) {
    return { verdict: "cannot-tell", pinned, reason: "the running engine did not report a Bun version", sidecars, willRewrite: 0 };
  }
  // Counted against RUNNING, not against the pin: what rewrites the tree is the
  // engine doing the writing, and in a mismatched container that is not the pin.
  const stamp = `${ENGINE_PREFIX}${running}`;
  const willRewrite = engineVersions.filter((v) => v !== stamp).length;
  return { verdict: pinned === running ? "match" : "mismatch", pinned, running, sidecars, willRewrite };
}

/** Every committed sidecar's `engine_version`, `undefined` where it has none. */
export function engineVersionsIn(instanceRoot: string): (string | undefined)[] {
  const dir = join(instanceRoot, SCRIPT_SIDECAR_DIR);
  let names: string[];
  try {
    names = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    // An unreadable directory is not an empty one. The caller distinguishes
    // them by `sidecars`, which stays 0 and is reported.
    return [];
  }
  return names.map((f) => {
    try {
      return (JSON.parse(readFileSync(join(dir, f), "utf-8")) as { engine_version?: string }).engine_version;
    } catch {
      return undefined;
    }
  });
}

export function bunRuntime(repoRoot: string = REPO_ROOT, instanceRoot: string = INSTANCE_ROOT): RuntimeReport {
  let pinned: string | undefined;
  try {
    pinned = readPinFile(readFileSync(join(repoRoot, PIN_FILE), "utf-8"));
  } catch {
    pinned = undefined;
  }
  return judge(pinned, process.versions.bun, engineVersionsIn(instanceRoot));
}

/** The sweep's section. Markdown, because that is what the hook injects. */
export function markdown(r: RuntimeReport): string {
  const head = "## Bun runtime vs the pin\n\n";
  if (r.verdict === "cannot-tell") {
    return (
      head +
      `**Could not determine — treat as unknown, not as matched.** ${r.reason}.\n\n` +
      "Run it by hand: `bun run check:bun-runtime`.\n"
    );
  }
  if (r.verdict === "match") {
    return head + `Running Bun **${r.running}** matches \`${PIN_FILE}\`. Sidecar writes here are real changes.\n`;
  }
  return (
    head +
    `**This container runs Bun ${r.running}; \`${PIN_FILE}\` pins ${r.pinned}.**\n\n` +
    `\`bun test\` and \`bun run gates\` will rewrite **${r.willRewrite}** of ${r.sidecars} ` +
    `committed script sidecars here, changing only \`last_run_at\`, \`last_run_sha\` and ` +
    `\`engine_version\`. That is bean \`3ozg\`: not your change, and not to be committed.\n\n` +
    "```sh\n" +
    `git checkout -- ${SCRIPT_SIDECAR_DIR.replace(/^/, "cat-harness/")}\n` +
    "```\n\n" +
    "**Do not verify this with `git status --porcelain | grep -v script-sidecars`** — that " +
    "filter hides exactly what it is being used to check, and a background `gates` run can " +
    "write the sidecars after you look and before you `git add`. Prefer explicit paths, or " +
    "`git add -A -- . ':(exclude)cat-harness/content/pipeline/script-sidecars'`.\n"
  );
}

if (import.meta.main) {
  const r = bunRuntime();
  if (process.argv.includes("--markdown")) {
    // Printed on stdout whatever the verdict: the sweep injects stdout, and a
    // finding routed to stderr would be the one the agent never reads.
    console.log(markdown(r));
  } else if (r.verdict === "cannot-tell") {
    console.error(`Bun runtime — could not determine: ${r.reason}. This is not a pass.`);
  } else if (r.verdict === "match") {
    console.log(`Bun runtime — ${r.running} matches ${PIN_FILE}; ${r.sidecars} sidecar(s) read.`);
  } else {
    console.error(
      `Bun runtime — this container runs ${r.running}, ${PIN_FILE} pins ${r.pinned}.\n` +
        `  ${r.willRewrite} of ${r.sidecars} script sidecar(s) will be rewritten by any sweep here (bean 3ozg).\n` +
        `  Discard them; do not commit them.`,
    );
  }
  process.exit(r.verdict === "match" ? 0 : r.verdict === "mismatch" ? 1 : 2);
}
