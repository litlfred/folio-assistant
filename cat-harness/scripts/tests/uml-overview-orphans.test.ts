/**
 * Bean `ghgn`: a retired instance's UML pages must not stay published. The
 * generator removes, and `--check` reports, what it would no longer write.
 */
import { describe, expect, test } from "bun:test";

import { umlOrphans } from "../gen-uml-overview.ts";

describe("umlOrphans (ghgn)", () => {
  const written = new Map([["uml/overview/cat-harness.mmd", ""], ["docs/uml/overview/cat-harness.md", ""]]);
  const svgs = new Set(["img/uml/overview/cat-harness.svg"]);

  test("a retired instance's page, diagram and picture are orphans", () => {
    const existing = [
      ...written.keys(),
      ...svgs,
      "docs/uml/overview/detangle.md",
      "uml/overview/detangle/detangle-schemas.puml",
      "img/uml/overview/detangle.svg",
    ];
    expect(umlOrphans(existing, written, svgs)).toEqual([
      "docs/uml/overview/detangle.md",
      "uml/overview/detangle/detangle-schemas.puml",
      "img/uml/overview/detangle.svg",
    ]);
  });

  test("what this run writes is never an orphan", () => {
    expect(umlOrphans([...written.keys(), ...svgs], written, svgs)).toEqual([]);
  });

  test("a file of a kind the generator does not write is left alone", () => {
    expect(umlOrphans(["docs/uml/overview/notes.txt", "uml/overview/.gitkeep"], written, svgs)).toEqual([]);
  });

  test("a declared directory's README is readme:subgraphs' output, never an orphan (PR #2094)", () => {
    // Both overview roots are declared directories, so `readme:subgraphs`
    // writes a README into each. Treating it as an orphan made the two writers
    // alternate forever: this one deleted it, that one wrote it back.
    const existing = [...written.keys(), ...svgs, "docs/uml/overview/README.md", "img/uml/overview/README.md"];
    expect(umlOrphans(existing, written, svgs)).toEqual([]);
  });
});
