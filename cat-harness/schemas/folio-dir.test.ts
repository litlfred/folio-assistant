/**
 * `folioDir` — a folio says where its content is, and the platform asks.
 *
 * Bean `hs08`. These pin the three answers and, more importantly, the two
 * NON-answers: the convention is not a stand-in for a declaration, and an
 * unreadable declaration is not silently a `folio/`.
 *
 * @module schemas/folio-dir.test
 */
import { folioDir } from "./cat-harness.js";
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

// The `folio` kind is registered by CORE as a load-time side effect. Without
// this import `directoryForGraph` cannot read a declaration that names it —
// which is the fragility `ot9a` recorded, and which `folioDir` now refuses to
// paper over.
import "./folio-graph-kind.js";
import { writeDeclaration } from "../test/support/instance-fixture.js";

/** A repository root with an optional declaration. */
function repo(declaration?: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), "folio-dir-"));
  if (declaration) {
    writeDeclaration(root, JSON.stringify(declaration, null, 2));
  }
  return root;
}

function declaring(path: string): Record<string, unknown> {
  return {
    name: "probe",
    description: "a folio that says where its content lives",
    directories: [{ id: "folio", path, dependents: "reproduce", graphKinds: ["folio"] }],
  };
}

describe("folioDir", () => {
  test("a folio DECLARING content/ resolves to content/ — the qou case", () => {
    // Owner, 2026-09-20: "qou can declare a new folio at content/". This is
    // that sentence as a test. Before `folioDir`, 162 sites spelled
    // `join(root, "folio")` as a literal and this declaration was ignored.
    const root = repo(declaring("content/"));
    mkdirSync(join(root, "content"), { recursive: true });
    expect(folioDir(root)).toBe(join(root, "content"));
  });

  test("a folio declaring some OTHER path resolves there too", () => {
    // Nothing privileges `content/`; the point is that the declaration wins.
    const root = repo(declaring("paper/"));
    mkdirSync(join(root, "paper"), { recursive: true });
    expect(folioDir(root)).toBe(join(root, "paper"));
  });

  test("no declaration falls back to the CONVENTION, which is folio/", () => {
    expect(folioDir(repo())).toMatch(/[/\\]folio$/);
  });

  test("the fallback is never `content/` — that root is excised", () => {
    // A folio keeping `content/` must SAY so. Silence means the convention,
    // and reading silence as `content/` would reinstate what was excised.
    expect(folioDir(repo())).not.toMatch(/[/\\]content$/);
  });

  test("a declaration that does NOT name a folio graph falls back", () => {
    const root = repo({
      name: "probe",
      description: "declares something else entirely",
      directories: [{ id: "beans", path: "beans/", dependents: "reproduce", graphKinds: ["beans"] }],
    });
    expect(folioDir(root)).toBe(join(root, "folio"));
  });

  test("a MALFORMED declaration throws rather than guessing", () => {
    const root = mkdtempSync(join(tmpdir(), "folio-dir-bad-"));
    // Named after the DIRECTORY, not "broken". An unparseable file has no
    // `name` to agree with, so since 2026-09-21 it counts as this instance's
    // broken declaration only when its stem matches the directory or a paired
    // `<stem>.config.json` sits beside it — otherwise every malformed JSON
    // file in the tree would be reported as a broken declaration.
    writeDeclaration(root, "{ not json at all", basename(root));
    // The convention would be a plausible answer to a question that could not
    // be asked. A broken declaration is a fault, not a default.
    expect(() => folioDir(root)).toThrow();
  });
});

describe("end to end — a consumer finds a folio that declares content/", () => {
  test("findPapers reads a folio whose declaration names content/", async () => {
    // The whole point, and the thing that was NOT true before `folioDir`:
    // `findPapers` is a real platform consumer, not a probe. With the folio
    // root hardcoded it looked in `folio/` and reported nothing, so a folio
    // keeping `content/` was invisible however correctly it declared itself.
    const { findPapers } = await import("../content/pipeline/repo-root.js");
    const root = repo(declaring("content/"));
    mkdirSync(join(root, "content", "demo-paper"), { recursive: true });
    writeFileSync(
      join(root, "content", "demo-paper", "demo-paper.ts"),
      "export default { title: \"Demo\" };\n",
    );
    expect(findPapers(root)).toEqual(["demo-paper"]);
  });
});
