/**
 * The harness's two stores: where they are, who agrees about it, and whether an
 * agent can still work the plan when the `beans` CLI is not installed.
 *
 * Three claims are worth a test here, and they are the three that would fail
 * silently:
 *
 *   1. `harness.config.json`, `.beans.yml` and `workflow/store.ts` agree. They are
 *      three files naming the same two paths, and nothing but a check stops them
 *      drifting — at which point beans go to a store nothing else reads.
 *   2. The fallback writes what the CLI reads. If the layouts diverge, the
 *      fallback becomes a shadow store and the divergence is discovered by
 *      whoever loses work to it.
 *   3. `create` refuses a duplicate title. The CLI's own `create` does not, and
 *      an unguarded loop over it produced 14,688 duplicates in one afternoon.
 */

import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { WORKFLOW_DIR } from "../../src/workflow/store.js";
import { beansYmlPath, checkHarnessDirs } from "../check-harness-dirs.js";
import { readHarnessConfig, resolveHarnessConfigPath } from "../../schemas/harness-config.js";
import { BASE_GRAPH_KINDS, readDeclaration } from "../../schemas/agent-harness.js";
import {
  createBean,
  findBean,
  listBeans,
  noteBean,
  readStoreConfig,
  updateBean,
} from "../beans-fallback.js";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

/** A throwaway store shaped exactly like the real one. */
function scratchStore(): string {
  const root = mkdtempSync(join(tmpdir(), "beans-fallback-"));
  writeFileSync(
    join(root, ".beans.yml"),
    "beans:\n    path: beans\n    prefix: test-\n    id_length: 4\n    default_status: todo\n    default_type: task\n",
  );
  mkdirSync(join(root, "beans"), { recursive: true });
  return root;
}

/** An `agent-harness.json` declaring the two work-plan directories. */
function writeDeclaration(root: string, workPlan: string, processState: string): void {
  writeFileSync(
    join(root, "agent-harness.json"),
    JSON.stringify({
      name: "scratch",
      directories: [
        { id: "workplan", path: workPlan, graph: "workplan" },
        { id: "process-state", path: processState, graph: "process-state" },
      ],
    }),
  );
}

describe("the two stores are visible and agreed upon", () => {
  test("this repo's declaration, .beans.yml and store.ts all say the same thing", () => {
    const r = checkHarnessDirs(REPO_ROOT);
    expect(r.problems).toEqual([]);
    expect(r.beansYmlPath).toBe(r.declaredWorkPlan);
    expect(r.compiledWorkflowState).toBe(r.declaredWorkflowState);
  });

  test("neither store is hidden behind a dot — that is the whole point", () => {
    const r = checkHarnessDirs(REPO_ROOT);
    expect(r.declaredWorkPlan.startsWith(".")).toBe(false);
    expect(r.declaredWorkflowState.startsWith(".")).toBe(false);
    expect(WORKFLOW_DIR).toBe(join("beans", "workflow"));
  });

  test("the work plan is where it says it is, and is not empty", () => {
    const r = checkHarnessDirs(REPO_ROOT);
    expect(r.declaredWorkPlan).toBe("beans");
    expect(r.beanCount).toBeGreaterThan(0);
  });

  test("a disagreement is a failure, not a shrug", () => {
    const root = scratchStore();
    try {
      // The folio declares one path; the CLI is pointed at another.
      writeFileSync(join(root, "harness.config.json"), JSON.stringify({ harness: { workPlan: "beans" } }));
      writeFileSync(join(root, ".beans.yml"), "beans:\n    path: somewhere-else\n");
      const r = checkHarnessDirs(root);
      expect(r.problems.some((p) => p.includes("Work-plan path disagrees"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a dot-prefixed declaration is refused", () => {
    const root = scratchStore();
    try {
      writeDeclaration(root, ".beans", "beans/workflow");
      writeFileSync(join(root, ".beans.yml"), "beans:\n    path: .beans\n");
      mkdirSync(join(root, ".beans"), { recursive: true });
      const r = checkHarnessDirs(root);
      expect(r.problems.some((p) => p.includes("hidden behind a dot"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("no config at all is 'not configured', never a failure", () => {
    const root = scratchStore();
    try {
      const r = checkHarnessDirs(root);
      expect(r.configured).toBe(false);
      expect(r.problems).toEqual([]);
      expect(r.notes.join(" ")).toContain("defaults");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("beansYmlPath reads the key, and reports absence rather than guessing", () => {
    expect(beansYmlPath(REPO_ROOT)).toBe("beans");
    expect(beansYmlPath(tmpdir())).toBeUndefined();
  });
});

describe("the fallback can work the plan, not just read it", () => {
  test("it honours .beans.yml's prefix and id length", () => {
    const root = scratchStore();
    try {
      const cfg = readStoreConfig(root);
      expect(cfg.dir).toBe("beans");
      expect(cfg.prefix).toBe("test-");
      const { bean } = createBean(root, { title: "First item" });
      expect(bean.id.startsWith("test-")).toBe(true);
      expect(bean.id.slice("test-".length)).toHaveLength(cfg.idLength);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("create, claim, update and note all round-trip through the file", () => {
    const root = scratchStore();
    try {
      const { bean } = createBean(root, { title: "Round trip", body: "## What\n\nA body.\n" });
      expect(bean.status).toBe("todo");

      const claimed = updateBean(root, bean.id, { status: "in-progress" });
      expect(claimed.status).toBe("in-progress");
      // The body survives a front-matter rewrite — the whole risk of editing YAML
      // in place is clobbering what is underneath it.
      expect(claimed.body).toContain("A body.");

      const noted = noteBean(root, bean.id, "found the cause");
      expect(noted.body).toContain("found the cause");
      expect(noted.body).toContain("A body.");
      expect(noted.status).toBe("in-progress");

      expect(listBeans(root)).toHaveLength(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("an id can be given bare or fully prefixed", () => {
    const root = scratchStore();
    try {
      const { bean } = createBean(root, { title: "Either way" });
      const bare = bean.id.slice("test-".length);
      expect(findBean(root, bean.id)?.id).toBe(bean.id);
      expect(findBean(root, bare)?.id).toBe(bean.id);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("create refuses a duplicate title and points at the existing bean", () => {
    const root = scratchStore();
    try {
      const first = createBean(root, { title: "Only once" });
      expect(first.duplicateOf).toBeUndefined();

      const second = createBean(root, { title: "Only once" });
      expect(second.duplicateOf).toBeDefined();
      expect(second.bean.id).toBe(first.bean.id);
      expect(listBeans(root)).toHaveLength(1);

      // --force is the deliberate escape hatch, and it has to be asked for.
      const forced = createBean(root, { title: "Only once", force: true });
      expect(forced.duplicateOf).toBeUndefined();
      expect(listBeans(root)).toHaveLength(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("what it writes parses as the layout the CLI expects", () => {
    const root = scratchStore();
    try {
      const { bean } = createBean(root, { title: "Layout check", type: "bug", status: "in-progress" });
      const raw = readFileSync(bean.path, "utf-8");
      expect(raw.startsWith("---\n")).toBe(true);
      // The id comment on the first front-matter line is how the CLI names a bean.
      expect(raw).toContain(`# ${bean.id}`);
      for (const key of ["title:", "status:", "type:", "priority:", "created_at:", "updated_at:"]) {
        expect(raw).toContain(key);
      }
      expect(bean.path.endsWith(`${bean.id}--layout-check.md`)).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("it reads this repo's real store, which the CLI also reads", () => {
    // The strongest available assertion that the two are one store: the beans
    // this session created through the CLI are visible to the fallback.
    const beans = listBeans(REPO_ROOT);
    expect(beans.length).toBeGreaterThan(100);
    expect(beans.every((b) => b.id.startsWith("folio-assistant-"))).toBe(true);
    expect(beans.every((b) => b.title !== "(untitled)")).toBe(true);
  });
});

describe("the config name — harness.config.json, and only that", () => {
  test("the config is found by its name", () => {
    const root = scratchStore();
    try {
      writeFileSync(join(root, "harness.config.json"), JSON.stringify({ contentType: "document" }));
      expect(resolveHarnessConfigPath(root)!.path.endsWith("harness.config.json")).toBe(true);
      expect(readHarnessConfig(root)?.contentType).toBe("document");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("folio.config.json is NOT read — the old name is dead, not deprecated", () => {
    // A fallback would leave a folio half-configured by a path nothing else
    // agrees about. Not configured is the honest state, and the loud one.
    const root = scratchStore();
    try {
      writeFileSync(join(root, "folio.config.json"), JSON.stringify({ contentType: "paper" }));
      expect(resolveHarnessConfigPath(root)).toBeUndefined();
      expect(readHarnessConfig(root)).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("an absent config is `undefined`, not an error — the platform has none", () => {
    const root = scratchStore();
    try {
      expect(resolveHarnessConfigPath(root)).toBeUndefined();
      expect(readHarnessConfig(root)).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("the harness config no longer declares directories — that is agent-harness.json's job", () => {
    // Regression guard on a deliberate removal: a `harness` block here would be
    // a second declaration of the same fact, free to disagree with the first.
    const root = scratchStore();
    try {
      writeFileSync(
        join(root, "harness.config.json"),
        JSON.stringify({ harness: { workPlan: "somewhere-else" } }),
      );
      const r = checkHarnessDirs(root);
      expect(r.configured).toBe(false);
      expect(r.declaredWorkPlan).toBe("beans");
      expect(r.problems).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("the directories are declared in agent-harness.json", () => {
  test("this repo declares both kinds, and they are the ones that moved", () => {
    const decl = readDeclaration(REPO_ROOT)!;
    const wp = decl.directories.find((d) => d.graph === "workplan");
    const ps = decl.directories.find((d) => d.graph === "process-state");
    expect(wp?.path).toBe("beans/");
    expect(ps?.path).toBe("beans/workflow/");
  });

  test("both kinds exist in the harness's own table, not core's", () => {
    // The work plan is the harness's because the harness HAS one — unlike
    // `folio`, which only core can render.
    expect(BASE_GRAPH_KINDS.workplan).toBeDefined();
    expect(BASE_GRAPH_KINDS["process-state"]).toBeDefined();
    expect(BASE_GRAPH_KINDS.workplan!.renderable).toBe(false);
    expect(BASE_GRAPH_KINDS["process-state"]!.renderable).toBe(false);
    expect(BASE_GRAPH_KINDS.folio).toBeUndefined();
  });

  test("they are two kinds, so a consumer asking for work cannot be handed process state", () => {
    expect(BASE_GRAPH_KINDS.workplan!.type).not.toBe(BASE_GRAPH_KINDS["process-state"]!.type);
  });

  test("an unmigrated instance is `not configured`, never a failure", () => {
    const root = scratchStore();
    try {
      const r = checkHarnessDirs(root);
      expect(r.configured).toBe(false);
      expect(r.problems).toEqual([]);
      expect(r.notes.join(" ")).toContain("not been migrated");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a declaration that will not load is a problem, not a shrug", () => {
    const root = scratchStore();
    try {
      writeFileSync(join(root, "agent-harness.json"), "{ not json");
      const r = checkHarnessDirs(root);
      expect(r.problems.some((x) => x.includes("will not load"))).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
