/**
 * The instance a root-level library or upload queue is attributed to is the
 * root's DECLARED name, not the folder the repository was cloned into. Bean
 * `t5dm`: a worktree named `pr1290` published `"uploadInstance": "pr1290"`.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { instanceOf } from "../library-graph.ts";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A repository root in a folder whose name is NOT its instance's name. */
function cloneNamed(folder: string, declared?: string): string {
  const parent = mkdtempSync(join(tmpdir(), "t5dm-"));
  made.push(parent);
  const root = join(parent, folder);
  mkdirSync(join(root, "uploads"), { recursive: true });
  mkdirSync(join(root, "who-iris", "library"), { recursive: true });
  if (declared !== undefined) writeDeclaration(root, { name: declared, directories: [] });
  return root;
}

describe("instanceOf (bean t5dm)", () => {
  test("a root-level directory belongs to the root's declared name, whatever the clone is called", () => {
    const root = cloneNamed("pr1290", "folio-assistant");
    expect(instanceOf(join(root, "uploads"), root)).toBe("folio-assistant");
  });

  test("the same repository cloned under two folder names gives one answer", () => {
    const a = cloneNamed("folio-assistant", "folio-assistant");
    const b = cloneNamed("worktree-xyz", "folio-assistant");
    expect(instanceOf(join(b, "uploads"), b)).toBe(instanceOf(join(a, "uploads"), a));
  });

  test("a sub-instance is its path inside the repository — unchanged by the clone's name", () => {
    const root = cloneNamed("pr1290", "folio-assistant");
    expect(instanceOf(join(root, "who-iris", "library"), root)).toBe("who-iris");
  });

  test("a root that declares nothing falls back to its folder name", () => {
    const root = cloneNamed("bare-folio");
    expect(instanceOf(join(root, "uploads"), root)).toBe("bare-folio");
  });
});
