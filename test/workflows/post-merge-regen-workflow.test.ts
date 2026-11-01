/**
 * `post-merge-regen.yml` must build the same pre-gate inputs that
 * `code-quality-gates.yml` gives the gate jobs — bean `folio-assistant-ksek`.
 *
 * Measured on `main` runs 39820219694, 41203302217, 41202266031, and
 * 41207335082: `main`'s gates were green while `post-merge-regen.yml` failed
 * because the job lacked `ig-index:build`, `smart:pages`, `qa:working-copy`,
 * `derive:publish`, and `plantuml-java`, causing `index:render:check` to exit 2
 * (`could not determine: no artefact index at .../smart-base/fhir-artifact-index/index.json`)
 * and `uml:overview:check` to repeatedly trigger 25-minute `qa:working-copy`
 * rebuilds across every regen pass.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const WORKFLOW = join(resolve(import.meta.dir, "../.."), ".github", "workflows", "post-merge-regen.yml");

interface Step {
  name?: string;
  uses?: string;
  run?: string;
  "continue-on-error"?: boolean;
  env?: Record<string, string>;
}
interface Doc {
  on?: Record<string, unknown>;
  true?: Doc["on"];
  jobs: Record<string, { steps: Step[] }>;
}

const doc = Bun.YAML.parse(readFileSync(WORKFLOW, "utf-8")) as Doc;
const steps = doc.jobs.regen!.steps;
const runOf = (s: Step): string => s.run ?? "";

describe("post-merge-regen.yml builds the gates' inputs before running post-merge:regen (bean ksek)", () => {
  const mountIdx = steps.findIndex((s) => runOf(s).includes("mount-from-lock.sh"));
  const stateIdx = steps.findIndex((s) => runOf(s).includes("bun run cat state:mount"));
  const javaIdx = steps.findIndex((s) => (s.uses ?? "").includes("plantuml-java"));
  const igIndexIdx = steps.findIndex((s) => runOf(s).includes("bun run cat ig-index:build"));
  const smartPagesIdx = steps.findIndex((s) => runOf(s).includes("bun run cat smart:pages"));
  const qaCopyIdx = steps.findIndex((s) => runOf(s).includes("bun run cat qa:working-copy"));
  const derivePublishIdx = steps.findIndex((s) => runOf(s).includes("bun run cat derive:publish"));
  const regenIdx = steps.findIndex((s) => runOf(s).includes("bun run cat post-merge:regen"));

  test("installs the PlantUML Java runtime before building QA and publish outputs", () => {
    expect(javaIdx).toBeGreaterThan(mountIdx);
    expect(javaIdx).toBeLessThan(qaCopyIdx);
    expect(javaIdx).toBeLessThan(derivePublishIdx);
  });

  test("builds the IG artefact indexes and mounted IG pages after state:mount and before post-merge:regen", () => {
    expect(igIndexIdx).toBeGreaterThan(stateIdx);
    expect(smartPagesIdx).toBeGreaterThan(igIndexIdx);
    expect(smartPagesIdx).toBeLessThan(regenIdx);
  });

  test("produces the QA working copy and publish-time pages before post-merge:regen", () => {
    expect(qaCopyIdx).toBeGreaterThan(smartPagesIdx);
    expect(derivePublishIdx).toBeGreaterThan(qaCopyIdx);
    expect(derivePublishIdx).toBeLessThan(regenIdx);
    expect(steps[qaCopyIdx]?.["continue-on-error"]).toBe(true);
    expect(steps[derivePublishIdx]?.["continue-on-error"]).toBe(true);
  });

  test("sets QA_WORKING_COPY_BUILDING=1 on the regen step and preserves || code=$? reporting", () => {
    const regen = steps[regenIdx]!;
    expect(regen.env?.QA_WORKING_COPY_BUILDING).toBe("1");
    expect(runOf(regen)).toContain('bun run cat post-merge:regen "${args[@]}" > "$RUNNER_TEMP/regen.json" || code=$?');
  });
});
