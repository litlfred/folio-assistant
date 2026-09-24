/**
 * `prose-reviewed-since-code-changed` — bean `cuxx`, issue #1042 (R1, R2).
 *
 * The rule under test is asymmetric on purpose: a CODE change with the prose
 * standing still is a finding; a prose edit never is. Each case below builds a
 * throwaway repo so the hashes are real.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { attest, discoverPairs, evaluatePairs, readAttestations } from "../prose-code-pairs";
import { BOOTSTRAP_PROCESSES_NS, CAT_HARNESS_PROCESSES_NS } from "../../schemas/namespaces.ts";

function repo(): { root: string; inst: string } {
  const root = mkdtempSync(join(tmpdir(), "pairs-"));
  const inst = join(root, "inst");
  mkdirSync(join(inst, "processes"), { recursive: true });
  mkdirSync(join(inst, "skills", "pkg"), { recursive: true });
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  writeFileSync(join(root, ".github/workflows/w.yml"), "jobs: {}\n");
  writeFileSync(
    join(inst, "processes/p.bpmn"),
    `<bpmn:process id="P" xmlns:bootstrap.processes="${BOOTSTRAP_PROCESSES_NS}" xmlns:cat-harness.processes="${CAT_HARNESS_PROCESSES_NS}"><bpmn:extensionElements><cat-harness.processes:implements workflow=".github/workflows/w.yml"/></bpmn:extensionElements></bpmn:process>`,
  );
  writeFileSync(join(inst, "skills/pkg/s.md"), "# s\n");
  writeFileSync(join(inst, "skills/pkg/s.ts"), "export const s = 1;\n");
  writeFileSync(join(inst, "skills/pkg/lonely.md"), "# no code beside me\n");
  return { root, inst };
}

describe("discoverPairs — declared pairs only (R1)", () => {
  test("a diagram's <cat-harness.processes:implements workflow> and a co-located skill .md/.ts", () => {
    const { root, inst } = repo();
    expect(discoverPairs({ kind: "process", path: "processes/p.bpmn" }, inst, root)).toEqual([
      { kind: "implements", prose: "inst/processes/p.bpmn", code: ".github/workflows/w.yml" },
    ]);
    expect(discoverPairs({ kind: "skill", path: "skills/pkg/s.md" }, inst, root)).toEqual([
      { kind: "co-located", prose: "inst/skills/pkg/s.md", code: "inst/skills/pkg/s.ts" },
    ]);
  });

  test("a skill with no code beside it, and a subject with no path, declare nothing", () => {
    const { root, inst } = repo();
    expect(discoverPairs({ kind: "skill", path: "skills/pkg/lonely.md" }, inst, root)).toEqual([]);
    expect(discoverPairs({ kind: "role", path: null }, inst, root)).toEqual([]);
  });
});

describe("evaluatePairs — one-sided change (R2)", () => {
  const setup = () => {
    const { root, inst } = repo();
    const pairs = discoverPairs({ kind: "skill", path: "skills/pkg/s.md" }, inst, root);
    const first = evaluatePairs(pairs, [], root);
    return { root, inst, pairs, first };
  };

  test("first sight records a baseline and passes", () => {
    const { first } = setup();
    expect(first.entry.result).toBe("pass");
    expect(first.attestations[0]!.by).toBe("baseline");
  });

  test("code changed, prose did not → finding, and the old attestation is kept", () => {
    const { root, inst, pairs, first } = setup();
    writeFileSync(join(inst, "skills/pkg/s.ts"), "export const s = 2;\n");
    const r = evaluatePairs(pairs, first.attestations, root);
    expect(r.entry.result).toBe("fail");
    expect(r.entry.findings[0]!.where).toBe("inst/skills/pkg/s.ts");
    expect(r.attestations).toEqual(first.attestations);
  });

  test("prose edited — alone or with the code — never raises, and the baseline moves", () => {
    const { root, inst, pairs, first } = setup();
    writeFileSync(join(inst, "skills/pkg/s.ts"), "export const s = 2;\n");
    writeFileSync(join(inst, "skills/pkg/s.md"), "# s, updated for 2\n");
    const r = evaluatePairs(pairs, first.attestations, root);
    expect(r.entry.result).toBe("pass");
    expect(r.attestations[0]!.code_hash).not.toBe(first.attestations[0]!.code_hash);
  });

  test("a missing side of a declared pair is unknown, never a pass", () => {
    const { root } = repo();
    const r = evaluatePairs([{ kind: "implements", prose: "inst/processes/p.bpmn", code: ".github/workflows/gone.yml" }], [], root);
    expect(r.entry.result).toBe("unknown");
  });

  test("no declared pair is n/a", () => {
    const { root } = repo();
    expect(evaluatePairs([], [], root).entry.result).toBe("n/a");
  });
});

describe("attest — the re-review mark", () => {
  test("moves the attestation to current hashes with who and why, which clears the finding", () => {
    const { root, inst } = repo();
    const pairs = discoverPairs({ kind: "skill", path: "skills/pkg/s.md" }, inst, root);
    const first = evaluatePairs(pairs, [], root);
    const sidecar = join(root, "s.kg-qa.json");
    writeFileSync(sidecar, JSON.stringify({ criteria: {}, pair_attestations: first.attestations }));
    writeFileSync(join(inst, "skills/pkg/s.ts"), "export const s = 3;\n");
    expect(evaluatePairs(pairs, readAttestations(sidecar), root).entry.result).toBe("fail");

    expect(attest(sidecar, "human", "re-read against s = 3", root)).toBe(1);
    const after = readAttestations(sidecar);
    expect(after[0]).toMatchObject({ by: "human", reason: "re-read against s = 3" });
    expect(evaluatePairs(pairs, after, root).entry.result).toBe("pass");
    expect(readFileSync(sidecar, "utf-8").endsWith("\n")).toBe(true);
  });
});
