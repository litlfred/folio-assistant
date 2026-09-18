/**
 * The stakeholder map reports what it can derive, and says what it cannot.
 *
 * The proposed version of this tool read "affected roles from
 * `harness.config.json` and CODEOWNERS" — neither of which exists in this
 * repository, so it would have reported no stakeholders for every change
 * while looking like it worked. These tests pin the two properties that
 * failure mode would have violated: something is actually derived, and the
 * undetermined part is stated rather than rendered as emptiness.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { stakeholderMap, formatStakeholderMap } from "../../src/impact/stakeholder-map.ts";

const ROOT = join(import.meta.dir, "../..");

describe("stakeholder map", () => {
  test("a changed skill resolves to its name and declared roles", async () => {
    const map = await stakeholderMap(ROOT, ["skills/folio-core/todo-manager.md"]);
    expect(map.skills.map((s) => s.name)).toEqual(["todo-manager"]);
    // todo-manager is read by everyone who touches the work plan.
    expect(map.skills[0].roles.length).toBeGreaterThan(0);
    expect(map.untraced).toEqual([]);
  });

  test("a changed skill reaches the process lanes accountable for using it", async () => {
    const map = await stakeholderMap(ROOT, ["skills/folio-core/todo-manager.md"]);
    // The work-plan lane appears in several processes; the point is that the
    // mapping produces LANES, which is the half CODEOWNERS could never give.
    expect(map.lanes.length).toBeGreaterThan(0);
    for (const lane of map.lanes) {
      expect(lane.viaSkills).toContain("todo-manager");
      expect(lane.activities.length).toBeGreaterThan(0);
    }
  });

  test("a path that is not a skill is untraced, not silently dropped", async () => {
    const map = await stakeholderMap(ROOT, ["README.md"]);
    expect(map.untraced).toEqual(["README.md"]);
    expect(map.skills).toEqual([]);
    // "Unknown impact" must not read as "no impact".
    expect(map.notDetermined.join(" ")).toContain("unknown impact");
  });

  test("the undetermined part is always reported, even on a clean mapping", async () => {
    const map = await stakeholderMap(ROOT, ["skills/folio-core/todo-manager.md"]);
    expect(map.notDetermined.length).toBeGreaterThan(0);
    // The people half is never answered mechanically.
    expect(map.notDetermined[0]).toContain("does not guess");
  });

  test("the report names the lanes and the undetermined section", async () => {
    const text = formatStakeholderMap(await stakeholderMap(ROOT, ["skills/folio-core/todo-manager.md"]));
    expect(text).toContain("Process lanes reached");
    expect(text).toContain("NOT DETERMINED");
  });
});
