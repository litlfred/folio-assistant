/**
 * The reverse sweep: present-but-undeclared, which is `dh4f` inverted.
 *
 * Written against synthetic repositories rather than only against this one,
 * because a sweep tested solely on the tree it was written beside agrees with
 * whatever that tree happens to contain. The live assertions at the end are the
 * second half, not the whole test.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ROOT_INFRASTRUCTURE,
  accountedRootPaths,
  humanBytes,
  undeclaredAtRoot,
} from "../check-undeclared-files.js";
import { repoRootFor, instanceRootFor } from "../../schemas/cat-harness.js";
import "../../schemas/folio-graph-kind.js";

/** A repository with one instance, which declares a repository-scoped directory. */
function repo(): string {
  const root = mkdtempSync(join(tmpdir(), "undeclared-"));
  mkdirSync(join(root, "an-instance"), { recursive: true });
  writeFileSync(
    join(root, "an-instance", "harness.json"),
    JSON.stringify(
      {
        name: "an-instance",
        directories: [
          { id: "work", path: "work/", graphs: ["beans"], scope: "repository" },
          { id: "own", path: "own/", graphs: ["schemas"] },
        ],
      },
      null,
      2,
    ),
  );
  mkdirSync(join(root, "work"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{}");
  return root;
}

describe("an instance is accounted for because it DECLARES itself", () => {
  test("a directory holding harness.json is not a finding", () => {
    const root = repo();
    expect(undeclaredAtRoot(root).map((e) => e.path)).not.toContain("an-instance");
  });

  test("and the reason says so, rather than naming it in a list", () => {
    // A new instance is accounted for the moment it exists, not when somebody
    // remembers to add it. That is the property; this is the evidence.
    expect(accountedRootPaths(repo()).get("an-instance")).toContain("declares itself");
  });
});

describe("a repository-scoped declared directory is accounted for", () => {
  test("`work/` at the root is named by the instance's declaration", () => {
    const root = repo();
    expect(undeclaredAtRoot(root).map((e) => e.path)).not.toContain("work");
    expect(accountedRootPaths(root).get("work")).toContain("an-instance");
  });

  test("an INSTANCE-scoped directory of the same name would NOT account for a root one", () => {
    // `own/` is declared without a scope, so it resolves inside the instance.
    // A root-level `own/` is a different directory, and conflating the two is
    // how a sweep reports a clean run over something nothing names.
    const root = repo();
    mkdirSync(join(root, "own"), { recursive: true });
    writeFileSync(join(root, "own", "stray.txt"), "x");
    expect(undeclaredAtRoot(root).map((e) => e.path)).toContain("own");
  });
});

describe("the check can fire — which is the whole point", () => {
  test("a stray file at the root IS reported", () => {
    const root = repo();
    writeFileSync(join(root, "Some Uploaded Thing.pdf"), "x".repeat(1234));
    const found = undeclaredAtRoot(root);
    expect(found.map((e) => e.path)).toContain("Some Uploaded Thing.pdf");
  });

  test("a name with spaces and commas survives the report intact", () => {
    // The measured incident: three PNGs at the root with spaces and commas in
    // their filenames. A sweep that mangles the name cannot be acted on.
    const root = repo();
    const name = "ChatGPT Image Sep 20, 2026, 08_26_47 AM.png";
    writeFileSync(join(root, name), "x");
    expect(undeclaredAtRoot(root).map((e) => e.path)).toContain(name);
  });

  test("a stray DIRECTORY is reported, with its recursive size", () => {
    const root = repo();
    mkdirSync(join(root, "dropped", "deep"), { recursive: true });
    writeFileSync(join(root, "dropped", "deep", "a.bin"), "x".repeat(100));
    writeFileSync(join(root, "dropped", "b.bin"), "x".repeat(50));
    const d = undeclaredAtRoot(root).find((e) => e.path === "dropped")!;
    expect(d.kind).toBe("directory");
    expect(d.bytes).toBe(150);
  });

  test("findings are ordered largest first, so the costly one is read first", () => {
    const root = repo();
    writeFileSync(join(root, "small.bin"), "x".repeat(10));
    writeFileSync(join(root, "large.bin"), "x".repeat(10_000));
    const found = undeclaredAtRoot(root).map((e) => e.path);
    expect(found.indexOf("large.bin")).toBeLessThan(found.indexOf("small.bin"));
  });
});

describe("what is deliberately NOT reported", () => {
  test("infrastructure is accounted for, with a reason per entry", () => {
    const root = repo();
    expect(undeclaredAtRoot(root).map((e) => e.path)).not.toContain("package.json");
    // A reason per entry rather than a pattern: `*.json` would account for
    // harness.config.json and for any JSON anybody ever drops here, which is
    // the failure this sweep exists to catch.
    for (const [name, why] of Object.entries(ROOT_INFRASTRUCTURE)) {
      expect(why.length, `${name} has no reason`).toBeGreaterThan(10);
    }
  });

  test("dotfiles are skipped", () => {
    // A report whose first five lines are always `.gitignore` is a report
    // nobody reads.
    const root = repo();
    writeFileSync(join(root, ".somerc"), "x");
    expect(undeclaredAtRoot(root).map((e) => e.path)).not.toContain(".somerc");
  });

  test("a gitignored path is skipped, asked of git rather than listed", () => {
    // A real repository, because `git check-ignore` needs one — and an
    // assertion that cannot fail is not a test. `_kg/` is the live case this
    // exists for: a build output a hand-kept exclusion list would have had to
    // learn about, which git already knows.
    const root = repo();
    spawnSync("git", ["init", "-q"], { cwd: root });
    writeFileSync(join(root, ".gitignore"), "build-output/\n");
    mkdirSync(join(root, "build-output"), { recursive: true });
    writeFileSync(join(root, "build-output", "x.js"), "x");
    expect(undeclaredAtRoot(root).map((e) => e.path)).not.toContain("build-output");
  });

  test("...and that skip is real: the same directory unignored IS reported", () => {
    // The falsifier. Without this, the test above passes equally well for a
    // sweep that never reports a directory at all.
    const root = repo();
    spawnSync("git", ["init", "-q"], { cwd: root });
    writeFileSync(join(root, ".gitignore"), "something-else/\n");
    mkdirSync(join(root, "build-output"), { recursive: true });
    writeFileSync(join(root, "build-output", "x.js"), "x");
    expect(undeclaredAtRoot(root).map((e) => e.path)).toContain("build-output");
  });
});

describe("this repository, as it stands", () => {
  const REPO = repoRootFor(instanceRootFor(import.meta.dir));

  test("the sweep runs over the real root without throwing", () => {
    expect(() => undeclaredAtRoot(REPO)).not.toThrow();
  });

  test("cat-harness and bootstrap are accounted for as instances", () => {
    const accounted = accountedRootPaths(REPO);
    expect(accounted.get("cat-harness")).toContain("declares itself");
    expect(accounted.get("bootstrap")).toContain("declares itself");
  });

  test("beans/ and todos/ are accounted for by declaration, not by a list", () => {
    // They live at the root because they are declared repository-scoped — the
    // work plan belongs to the checkout rather than to any instance in it.
    const accounted = accountedRootPaths(REPO);
    expect(accounted.get("beans")).toContain("declared by");
    expect(accounted.get("todos")).toContain("declared by");
  });

  test("the root is clean, and stays that way", () => {
    // Pinned deliberately. If this list grows, something arrived at the root
    // that nobody declared — which is the event the sweep exists to surface.
    //
    // It was FOUR files when this sweep was written — the style guide's .pdf,
    // -info.pdf, .html and a 1.2 MB _files.zip, 1.8 MB in all. They were not
    // deleted: they had never been processed into `library/` (no slug for
    // them), so on the owner's ruling — *"if already processed, then delete"* —
    // they moved to `uploads/`, the declared ingestion queue, where document
    // ingestion can reach them and where a gate can see them. This expectation
    // was updated in the same change that dealt with them, as the note it
    // replaces asked.
    expect(undeclaredAtRoot(REPO).map((e) => e.path)).toEqual([]);
  });
});

describe("the size report is for a person", () => {
  test.each([
    [512, "512 B"],
    [1_500, "2 KB"],
    [232_840, "233 KB"],
    [1_234_660, "1.2 MB"],
  ])("%i renders as %s", (n, expected) => {
    expect(humanBytes(n as number)).toBe(expected);
  });
});
