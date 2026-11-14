import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { actorIdsFromFsh, actorIdsIn, inProcessDir, roleIdsIn, validateBpmn, type Context, type Finding } from "./validate";

const FIX = join(import.meta.dir, "fixtures");
const ctx: Context = { actors: actorIdsIn([join(FIX, "fsh")]), roles: roleIdsIn([join(FIX, "roles.json")]) };
const codes = (fs: Finding[], s: Finding["severity"]) => fs.filter((f) => f.severity === s).map((f) => f.code).sort();
const run = (name: string) => validateBpmn(readFileSync(join(FIX, name), "utf-8"), name, ctx);

describe("bpmn-validate", () => {
  test("readsActorDefinitionInstanceIdsFromFsh", () => {
    expect(actorIdsFromFsh(readFileSync(join(FIX, "fsh", "actors.fsh"), "utf-8"))).toEqual(["DAK.Persona.HealthWorker", "DAK.Persona.Client"]);
    expect([...ctx.roles]).toEqual(["reviewer"]);
  });

  test("goodFixtureHasNoErrorOrWarning", async () => {
    const fs = await run("good.bpmn.xml");
    expect(codes(fs, "error")).toEqual([]);
    expect(codes(fs, "warning")).toEqual([]);
    expect(codes(fs, "info")).toEqual(["ACTOR-000", "ACTOR-000", "ACTOR-005"]);
  });

  test("badFixtureReportsEachDefect", async () => {
    const fs = await run("bad.bpmn.xml");
    expect(codes(fs, "error")).toEqual(["ACTOR-003", "ACTOR-004", "BPMN-003", "BPMN-005", "SWIM-002"]);
    expect(codes(fs, "warning")).toEqual(["SWIM-003", "SWIM-005"]);
    // Matched by Instance id, never by name or title: the lane named "Health worker" is not the health worker.
    expect(fs.find((f) => f.code === "ACTOR-003")!.message).toContain("Lane_Guessed");
  });

  test("malformedOrForeignRootIsAnError", async () => {
    expect(codes(await validateBpmn("<bpmn:definitions xmlns:bpmn=\"http://www.omg.org/spec/BPMN/20100524/MODEL\"><bpmn:process id=\"P\">", "x", ctx), "error")).toEqual(["BPMN-001"]);
    expect(codes(await validateBpmn("<foo xmlns=\"urn:x\"/>", "x", ctx), "error")).toEqual(["BPMN-002"]);
  });

  test("readsOnlyTheDeclaredProcessDirectories", () => {
    expect(inProcessDir("smart-base/L2/collab/processes/l2-dak-authoring.bpmn")).toBe(true);
    expect(inProcessDir("input/bpmn/anc.bpmn")).toBe(true);
    expect(inProcessDir("input/business-processes/anc.bpmn")).toBe(false);
  });
});
