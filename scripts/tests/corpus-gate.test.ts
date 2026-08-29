import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { checkCorpusGate, COMMIT_ACTIVITY } from "../../src/workflow/corpus-gate";
import { loadProcessModel } from "../../src/workflow/process-model";
import { complete, startInstance } from "../../src/workflow/instance";
import { instanceId, saveInstance } from "../../src/workflow/store";

/**
 * Everything before this was answerable: `workflow_gate` tells an agent whether
 * a step is enabled, *if it asks*. This is the piece that does not depend on
 * asking — it runs from a hook or from CI, so an agent that ignored the
 * orchestration entirely still cannot land a block change no instance records
 * the editor having authorised.
 *
 * The two properties worth pinning are that it refuses by default, and that it
 * refuses when it cannot tell. A gate that fails open reports clean by not
 * looking.
 */

const PLATFORM = resolve(import.meta.dir, "../..");
const BUILDERS = JSON.stringify(join(PLATFORM, "schemas/builders.ts"));

let repo: string;

const block = (slug: string, label: string): string => {
  const dir = join(repo, "content", "paper", "ch");
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `${slug}.ts`);
  writeFileSync(
    p,
    `import { proposition } from ${BUILDERS};\n` +
      `export default proposition({ label: ${JSON.stringify(label)}, title: "T", statement: "s" });\n`,
  );
  writeFileSync(join(dir, `${slug}.md`), "Prose.\n");
  return `content/paper/ch/${slug}.ts`;
};

/** Drive a real instance to the point where the commit step is enabled. */
const authorise = async (label: string, decision = "accept"): Promise<void> => {
  const model = await loadProcessModel(join(PLATFORM, "docs/workflows/editing-hci-validation.bpmn"));
  const state = startInstance(model, { id: instanceId(model.id, label), subject: label });
  for (const n of ["Task_DescribeChange", "Task_ClaimBean", "Task_DraftEdit",
                   "Task_SchemaValidate", "Task_SyntaxSpell", "Task_BuildGates"]) {
    complete(model, state, n);
  }
  complete(model, state, "Gateway_ReviewerKind", { outcome: "no" });
  complete(model, state, "Task_AgentReview");
  complete(model, state, "Task_CollateFindings");
  complete(model, state, "Task_LogFindings");
  complete(model, state, "Task_ReviewFindings");
  complete(model, state, "Gateway_EditorDecision", { outcome: decision });
  saveInstance(repo, state);
};

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "corpus-gate-"));
});
afterEach(() => rmSync(repo, { recursive: true, force: true }));

const check = (files: string[]) => checkCorpusGate(repo, { files, platformRoot: PLATFORM });

describe("what the gate ignores", () => {
  test("non-content files are not its business", async () => {
    writeFileSync(join(repo, "README.md"), "hi\n");
    expect(await check(["README.md", "package.json", "src/thing.ts"])).toEqual([]);
  });

  test("a .qa.json is machine-written by the sweep and is not a corpus write", async () => {
    block("x", "prop:x");
    // Gating these would make every qa-sweep look like an unauthorised edit.
    expect(await check(["content/paper/ch/x.qa.json"])).toEqual([]);
  });

  test("a .ts that is not a block manifest is skipped", async () => {
    mkdirSync(join(repo, "content", "paper", "ch"), { recursive: true });
    writeFileSync(join(repo, "content/paper/ch/helper.ts"), "export const n = 1;\n");
    expect(await check(["content/paper/ch/helper.ts"])).toEqual([]);
  });
});

describe("refusing by default", () => {
  test("a block with no instance is refused, and told how to start one", async () => {
    const f = block("carbon", "prop:carbon");
    const [finding] = await check([f]);
    expect(finding.allowed).toBe(false);
    expect(finding.label).toBe("prop:carbon");
    expect(finding.reason).toContain("no workflow instance");
    expect(finding.reason).toContain("workflow_start");
  });

  test("an instance that has not reached the editor's decision is refused", async () => {
    const f = block("carbon", "prop:carbon");
    const model = await loadProcessModel(
      join(PLATFORM, "docs/workflows/editing-hci-validation.bpmn"),
    );
    const state = startInstance(model, {
      id: instanceId(model.id, "prop:carbon"),
      subject: "prop:carbon",
    });
    complete(model, state, "Task_DescribeChange");
    saveInstance(repo, state);

    const [finding] = await check([f]);
    expect(finding.allowed).toBe(false);
    expect(finding.reason).toContain("not enabled");
  });

  test("a discarded change never authorises a write", async () => {
    const f = block("carbon", "prop:carbon");
    await authorise("prop:carbon", "discard");
    // The instance completed — but through the discard end event, so the commit
    // step was never enabled and never taken.
    const [finding] = await check([f]);
    expect(finding.allowed).toBe(false);
  });
});

describe("allowing what the process authorised", () => {
  test("a block whose editor accepted the change is allowed", async () => {
    const f = block("carbon", "prop:carbon");
    await authorise("prop:carbon");
    const [finding] = await check([f]);
    expect(finding.allowed).toBe(true);
    expect(finding.instance).toBe("editing--prop-carbon");
  });

  test("a block already committed in an earlier round stays allowed", async () => {
    const f = block("carbon", "prop:carbon");
    const model = await loadProcessModel(
      join(PLATFORM, "docs/workflows/editing-hci-validation.bpmn"),
    );
    await authorise("prop:carbon");
    const state = (await import("../../src/workflow/store")).loadInstance(
      repo,
      instanceId(model.id, "prop:carbon"),
    )!;
    complete(model, state, COMMIT_ACTIVITY);
    saveInstance(repo, state);

    const [finding] = await check([f]);
    expect(finding.allowed).toBe(true);
    expect(finding.reason).toContain("already recorded");
  });

  test("a sibling .md is checked against its block, and reported once", async () => {
    block("carbon", "prop:carbon");
    await authorise("prop:carbon");
    // One block's worth of work, not two problems.
    const findings = await check(["content/paper/ch/carbon.ts", "content/paper/ch/carbon.md"]);
    expect(findings).toHaveLength(1);
    expect(findings[0].allowed).toBe(true);
  });
});

describe("it does not fail open", () => {
  test("a manifest whose identity cannot be established is refused", async () => {
    const dir = join(repo, "content", "paper", "ch");
    mkdirSync(dir, { recursive: true });
    // Reads as a manifest textually, but the module throws on import: the
    // builder rejects a theorem label on a proposition.
    writeFileSync(
      join(dir, "bad.ts"),
      `import { proposition } from ${BUILDERS};\n` +
        `export default proposition({ label: "theorem:x", title: "T", statement: "s" });\n`,
    );
    const [finding] = await check(["content/paper/ch/bad.ts"]);
    expect(finding.allowed).toBe(false);
    expect(finding.reason).toContain("does not fail open");
  });

  test("an unloadable workflow policy stops the gate rather than emptying it", async () => {
    const platform = mkdtempSync(join(tmpdir(), "platform-"));
    mkdirSync(join(platform, "docs", "workflows"), { recursive: true });
    mkdirSync(join(platform, "skills", "pkg"), { recursive: true });
    writeFileSync(
      join(platform, "docs/workflows/editing-hci-validation.bpmn"),
      await Bun.file(join(PLATFORM, "docs/workflows/editing-hci-validation.bpmn")).text(),
    );
    writeFileSync(join(platform, "skills/pkg/workflow-policy.json"), "{ not json");

    // Treating a broken policy as "no relaxations" would refuse work a package
    // had legitimately declared.
    await expect(checkCorpusGate(repo, { files: [], platformRoot: platform })).rejects.toThrow(
      /policy is not loadable/,
    );
    rmSync(platform, { recursive: true, force: true });
  });
});
