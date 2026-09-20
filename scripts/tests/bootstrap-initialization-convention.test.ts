/**
 * Every instance keeps its initialization instructions in the same place.
 *
 * @module scripts/tests/bootstrap-initialization-convention.test
 *
 * Bootstrap is handed ONE reference and reads everything else. That works only
 * while the place to read is the same for every target — otherwise the agent
 * needs per-instance knowledge of every harness it might be pointed at, which
 * is exactly what one reference was meant to remove.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  BOOTSTRAP_INIT_DOC,
  initializationDoc,
  readDeclaration,
  siteDir,
} from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "../..");

describe("the convention is composed, not spelled", () => {
  test("it is built from siteDir rather than a literal", () => {
    // The stub pattern INVERTED on 2026-09-19 — `docs/<stub>` became
    // `<stub>/docs` — and every literal spelling of the old layout had to be
    // found and changed. Composing from the one function that knows the site
    // root survives the next relocation.
    for (const name of ["f-a-sci", "smart-base", "anything-at-all"]) {
      expect(initializationDoc({ name })).toBe(`${siteDir({ name })}/${BOOTSTRAP_INIT_DOC}`);
    }
  });

  test("it is the SAME suffix for every instance", () => {
    // The property bootstrap depends on: differing only by the instance's own
    // site root, never by which harness it is.
    const suffixes = new Set(
      ["a", "b", "c"].map((n) => initializationDoc({ name: n }).split("/").slice(1).join("/")),
    );
    expect(suffixes.size).toBe(1);
  });

  test("a stub overrides the name, as everywhere else", () => {
    expect(initializationDoc({ name: "smart-base", stub: "base" })).toContain("base/");
  });
});

describe("this instance honours the convention it publishes", () => {
  test("the file is where the convention says", () => {
    // A convention its own author does not follow is not a convention.
    const rel = initializationDoc(readDeclaration(ROOT)!);
    expect(existsSync(join(ROOT, rel))).toBe(true);
  });

  test("and it is DECLARED, so the asset gate checks its links too", () => {
    // Conventional AND declared: the convention means bootstrap can find it
    // without reading a declaration; the declaration means
    // `check:declared-assets` verifies it exists and that its links resolve.
    const decl = readDeclaration(ROOT)!;
    const asset = (decl.assets ?? []).find((a) => a.role === "bootstrap-initialization");
    expect(asset?.src).toBe(initializationDoc(decl));
  });
});

describe("the README tells an agent the same path the code computes", () => {
  test("bootstrap's README states the convention in its fenced block", () => {
    // The two could disagree, and a README that sends an agent to the wrong
    // place is worse than one that says nothing — it will be believed.
    //
    // Asserted against the FENCED BLOCK, not against the file text. The first
    // version of this test was `readme.toContain(path)`, and it passed after
    // the stated convention had been changed to `<name>/docs/setup.md` —
    // because the old path still appeared in a worked example further down.
    // A presence check over prose is satisfied incidentally; this reads the
    // one place the README actually makes the claim.
    const readme = readFileSync(join(ROOT, "bootstrap", "README.md"), "utf-8");
    const fenced = [...readme.matchAll(/```\n([^`]*)\n```/g)].map((m) => m[1]!.trim());
    expect(fenced).toContain(`<name>/docs/${BOOTSTRAP_INIT_DOC}`);
  });

  test("the convention is stated in ONE place, not echoed into the skill", () => {
    // `confirm-harness.md` deliberately does NOT repeat the path. It used to,
    // and this test asserted it did — two copies of a convention are two
    // things to keep in step, and the README is where an Initiator is sent.
    // What the skill owns is the CONTRACT (at most one harness); what the
    // README owns is WHERE that harness keeps its instructions.
    const skill = readFileSync(join(ROOT, "bootstrap", "skills", "confirm-harness.md"), "utf-8");
    expect(skill).not.toContain(BOOTSTRAP_INIT_DOC);
  });
});
