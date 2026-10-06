/**
 * Tests for the pipeline plug-in slots (bean `squu`).
 *
 * Three properties the hook exists to have, plus the one that makes the
 * follow-up `git mv` safe:
 *
 * 1. A dependency REGISTERS an implementation and generic code reaches it by
 *    kind, through the same `contributes` walk as every other contribution.
 * 2. A kind claimed by two contributors THROWS (the `contributions.ts` rule).
 * 3. An unfilled kind is an error that names what is missing, never a default.
 * 4. Generic pipeline code names none of the files that fill the slots.
 *
 * The tests here whose subject is folio-assistant-sci's contribution (that
 * this instance fills every pipeline-plugin slot) live in
 * `folio-assistant-sci/scripts/tests/pipeline-plugins.test.ts` (bean `ho66`):
 * standing alone, cat-harness has no such contribution to read.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ContributionCollisionError,
  ContributionRegistry,
  type FolioContribution,
} from "../../schemas/contributions";
import { loadContributionsSync } from "../../schemas/harness-config";
import { writeInstanceConfig } from "../../test/support/instance-fixture.js";
import {
  UnregisteredPipelinePluginError,
  optionalPipelinePlugin,
  pipelinePlugin,
  stripLeanComments,
  usePipelinePluginRegistry,
} from "./pipeline-plugins";

// Under the system temp directory, not beside this file (bean `dlqu`): an
// in-tree scratch directory is visible to every test that enumerates the
// checkout, and under `bun test --parallel` those run at the same time.
const TMP = mkdtempSync(join(tmpdir(), "test_pipeline_plugins-"));

/** A fixture dependency whose contributes module fills `lean-lexer`. */
function writeDep(name: string, body: string): string {
  const dir = join(TMP, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "contributions.ts"), body, "utf-8");
  writeInstanceConfig(dir, JSON.stringify({ contributes: "./contributions.ts" }));
  return dir;
}

function writeRoot(name: string, deps: Array<{ name: string; path: string }>): string {
  const dir = join(TMP, name);
  mkdirSync(dir, { recursive: true });
  writeInstanceConfig(dir, JSON.stringify({ contentType: "document", dependencies: { folioAssistant: deps } }));
  return dir;
}

const LEXER_DEP = `export default function () {
  return {
    name: "claimed-by-module",
    pipelinePlugins: [{
      kind: "lean-lexer",
      implementation: {
        stripLeanComments: (s) => "stripped:" + s,
        declarationStarts: () => [{ name: "fixture", at: 0 }],
      },
    }],
  };
}`;

let lexerRoot: string;
let collidingRoot: string;
let asyncRoot: string;

beforeAll(() => {
  const a = writeDep("dep-a", LEXER_DEP);
  const b = writeDep("dep-b", LEXER_DEP);
  const p = writeDep("dep-promise", `export default async function () { return { name: "p" }; }`);
  lexerRoot = writeRoot("root-lexer", [{ name: "dep-a", path: a }]);
  collidingRoot = writeRoot("root-colliding", [
    { name: "dep-a", path: a },
    { name: "dep-b", path: b },
  ]);
  asyncRoot = writeRoot("root-async", [{ name: "dep-promise", path: p }]);
});

afterEach(() => usePipelinePluginRegistry(undefined));
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const lexer = (contributor: string): FolioContribution => ({
  name: contributor,
  pipelinePlugins: [
    {
      kind: "lean-lexer",
      implementation: { stripLeanComments: (s: string) => `${contributor}:${s}`, declarationStarts: () => [] },
    },
  ],
});

describe("registration", () => {
  it("a registered implementation is what the slot returns, and the delegate calls it", () => {
    const reg = new ContributionRegistry();
    reg.register(lexer("dep-a"));
    usePipelinePluginRegistry(reg);
    expect(pipelinePlugin("lean-lexer").stripLeanComments("x")).toBe("dep-a:x");
    // The delegate under the implementing module's own name — what the
    // consumers import — reaches the same implementation.
    expect(stripLeanComments("y")).toBe("dep-a:y");
    expect(reg.contributedPipelinePlugins()).toEqual([{ kind: "lean-lexer", contributor: "dep-a" }]);
  });

  it("loads through the declared dependency walk, synchronously, with the entry's name pinned", () => {
    const reg = loadContributionsSync<FolioContribution, ContributionRegistry>(lexerRoot, new ContributionRegistry());
    usePipelinePluginRegistry(reg);
    expect(pipelinePlugin("lean-lexer").stripLeanComments("z")).toBe("stripped:z");
    // The module said "claimed-by-module"; the dependency entry says dep-a.
    expect(reg.contributedPipelinePlugins()[0]?.contributor).toBe("dep-a");
  });

  it("a diamond — the same contributor twice — is not a collision", () => {
    const reg = new ContributionRegistry();
    reg.register(lexer("dep-a"));
    expect(() => reg.register(lexer("dep-a"))).not.toThrow();
  });

  it("the sync loader refuses a contributor that returns a Promise rather than skipping it", () => {
    expect(() =>
      loadContributionsSync<FolioContribution, ContributionRegistry>(asyncRoot, new ContributionRegistry()),
    ).toThrow(/returns a Promise/);
  });
});

describe("a duplicate THROWS", () => {
  it("two contributors for one kind is a collision naming both", () => {
    const reg = new ContributionRegistry();
    reg.register(lexer("dep-a"));
    let err: unknown;
    try {
      reg.register(lexer("dep-b"));
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ContributionCollisionError);
    const c = err as ContributionCollisionError;
    expect(c.what).toBe("pipeline-plugin");
    expect(c.id).toBe("lean-lexer");
    expect(c.message).toContain('"dep-a"');
    expect(c.message).toContain('"dep-b"');
  });

  it("and it throws through the loader too, whatever order the dependencies are listed in", () => {
    expect(() =>
      loadContributionsSync<FolioContribution, ContributionRegistry>(collidingRoot, new ContributionRegistry()),
    ).toThrow(ContributionCollisionError);
  });
});

describe("an unregistered kind", () => {
  it("throws an error naming the kind and what IS filled, never a default", () => {
    const reg = new ContributionRegistry();
    reg.register(lexer("dep-a"));
    usePipelinePluginRegistry(reg);
    let err: unknown;
    try {
      pipelinePlugin("latex-preflight");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(UnregisteredPipelinePluginError);
    const msg = (err as Error).message;
    expect(msg).toContain('"latex-preflight"');
    expect(msg).toContain("lean-lexer (dep-a)");
  });

  it("says so when nothing at all is filled", () => {
    usePipelinePluginRegistry(new ContributionRegistry());
    expect(() => pipelinePlugin("lean-coverage")).toThrow(/No slot is filled at all/);
  });

  it("is undefined from the optional accessor, for callers with their own could-not-determine state", () => {
    usePipelinePluginRegistry(new ContributionRegistry());
    expect(optionalPipelinePlugin("lean-coverage")).toBeUndefined();
  });
});

describe("this repository", () => {

  it("generic pipeline code imports none of the modules that fill the slots", () => {
    // The point of the hook: after the move, any of these specifiers in a
    // generic module would be a lower → higher import. `check:import-direction`
    // catches that only once the files have moved; this catches it now.
    const filled = [
      "lean-lexer",
      "_folio-chapter-profiles.qou",
      "latex-preflight",
      "lean-coverage",
    ];
    // Sci-bound leaves that still sit here and import a slot filler directly.
    // That edge is sci → sci, so it is fine; they move together. The move PR
    // empties this list, because the files leave this directory.
    const sciBoundHere = new Set([
      "lean-atlas-ingest.ts",
      "qa-checkers-vacuity.ts",
      "conditional-class-banner-audit.ts",
      "lean-triviality-probe.ts",
      "lean-signature.ts",
    ]);
    const offenders: string[] = [];
    for (const f of readdirSync(import.meta.dir)) {
      if (!f.endsWith(".ts") || f.endsWith(".test.ts")) continue;
      if (filled.some((leaf) => f === `${leaf}.ts`) || sciBoundHere.has(f)) continue;
      const src = readFileSync(join(import.meta.dir, f), "utf-8");
      for (const leaf of filled) {
        const re = new RegExp(`from\\s+["'][^"']*/${leaf.replace(/\./g, "\\.")}(\\.js|\\.ts)?["']`);
        if (re.test(src)) offenders.push(`${f} → ${leaf}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
