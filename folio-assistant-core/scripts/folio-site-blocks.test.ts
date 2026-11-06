/**
 * folio-site-blocks (owner, 2026-10-10): a block's QA report and Lean status on
 * the folio site, read through the platform's own resolvers.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { configureFormalRefResolver, formalRefResolverConfigured } from "@litlfred/cat-harness-tools/schemas/formal-ref.js";
import { configureLeanPackages, leanPackageByName, LEAN_REF_PATTERN, parseLeanRef } from "@litlfred/cat-harness-tools/schemas/lean-packages.js";
import { blockLean, blockQaReport, criterionGroup, latestEntryIndex, loadLeanStatus, qaSummary } from "./folio-site-blocks.js";

const h12 = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 12);
let roots: string[] = [];
afterEach(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots = [];
});
function repo(): string {
  const d = mkdtempSync(join(tmpdir(), "fsblocks-"));
  roots.push(d);
  mkdirSync(join(d, "folio", "p", "ch"), { recursive: true });
  return d;
}
const entry = (result: string, at: string, md: string) => ({
  field_hash: { md },
  result,
  reviewed_at: at,
  reviewer: { kind: "script", id: "checker.ts" },
});

describe("QA report", () => {
  test("each criterion shows its MOST RECENT verdict, whether a writer appended or prepended it", () => {
    expect(latestEntryIndex([{ reviewed_at: "2026-01-01" }, { reviewed_at: "2026-02-01" }])).toBe(1);
    expect(latestEntryIndex([{ reviewed_at: "2026-03-01" }, { reviewed_at: "2026-02-01" }])).toBe(0);
    // No dates: the later position supersedes.
    expect(latestEntryIndex([{}, {}])).toBe(1);
  });

  test("read from the sidecar the platform resolves; stale when the block changed since; Milnor first", () => {
    const d = repo();
    const md = join(d, "folio", "p", "ch", "x.md");
    writeFileSync(md, "now\n");
    const now = h12("now\n");
    writeFileSync(
      join(d, "folio", "p", "ch", "x.qa.json"),
      JSON.stringify({
        $schema: "block-qa/v1",
        label: "prop:x",
        kind: "proposition",
        criteria: {
          // appended newer verdict: fail, on the current text
          "voice-status-leak": [entry("pass", "2026-01-01T00:00:00Z", now), entry("fail", "2026-02-01T00:00:00Z", now)],
          // prepended newer verdict: pass, on an older text -> stale
          "expo-milnor-clarity": [entry("pass", "2026-03-01T00:00:00Z", "000000000000"), entry("fail", "2026-01-01T00:00:00Z", now)],
          "da-objection": [entry("n/a", "2026-01-01T00:00:00Z", now)],
        },
      }),
    );
    const r = blockQaReport(md, d)!;
    expect(r.sidecars).toEqual(["folio/p/ch/x.qa.json"]);
    expect(r.criteria.map((c) => c.id)).toEqual(["expo-milnor-clarity", "da-objection", "voice-status-leak"]);
    const byId = Object.fromEntries(r.criteria.map((c) => [c.id, c]));
    expect(byId["voice-status-leak"]!.result).toBe("fail");
    expect(byId["voice-status-leak"]!.stale).toBe(false);
    expect(byId["expo-milnor-clarity"]!.result).toBe("pass");
    expect(byId["expo-milnor-clarity"]!.stale).toBe(true);
    expect(r.counts).toEqual({ pass: 1, fail: 1, warn: 0, na: 1, unknown: 0, stale: 1 });
    expect(qaSummary(r).milnor).toEqual({ total: 1, notPassing: 0 });
    expect(criterionGroup("milnor-motivation")).toBe("Milnor");
    expect(criterionGroup("proof-lean-compiles")).toBe("proof");
  });

  test("the results tree wins over the legacy sibling, and a block with neither has no report", () => {
    const d = repo();
    const md = join(d, "folio", "p", "ch", "x.md");
    writeFileSync(md, "t\n");
    const sidecar = (result: string) => JSON.stringify({ $schema: "block-qa/v1", label: "x", kind: "remark", criteria: { c: [entry(result, "2026-01-01", h12("t\n"))] } });
    writeFileSync(join(d, "folio", "p", "ch", "x.qa.json"), sidecar("fail"));
    mkdirSync(join(d, "test", "results", "block-qa", "folio", "p", "ch"), { recursive: true });
    writeFileSync(join(d, "test", "results", "block-qa", "folio", "p", "ch", "x.qa.json"), sidecar("pass"));
    expect(blockQaReport(md, d)!.criteria[0]!.result).toBe("pass");
    expect(blockQaReport(join(d, "folio", "p", "ch", "y.md"), d)).toBeUndefined();
  });
});

describe("Lean", () => {
  test("compile status is MEASURED or 'unchecked'; a measured sorry beats the text", () => {
    const d = repo();
    const lean = join(d, "folio", "p", "ch", "x.lean");
    writeFileSync(lean, "theorem t : 1 = 1 := rfl\n");
    const statusFile = join(d, "status.json");
    writeFileSync(statusFile, JSON.stringify({ schema: "qou-lean-status/v1", files: { "folio/p/ch/x.lean": { status: "fail", error: "boom", sorry: true } } }));
    const measured = blockLean({ kind: "theorem", sibling: lean, repoRoot: d, status: loadLeanStatus(statusFile) });
    expect(measured).toMatchObject({ expected: true, via: "sibling", path: "folio/p/ch/x.lean", compiles: "fail", error: "boom", sorry: true, sorryBasis: "measured" });
    const unmeasured = blockLean({ kind: "theorem", sibling: lean, repoRoot: d, status: loadLeanStatus(undefined) });
    expect(unmeasured).toMatchObject({ compiles: "unchecked", sorry: false, sorryBasis: "text" });
  });

  test("a kind that expects Lean with none found is marked absent; a remark is not", () => {
    const d = repo();
    const none = loadLeanStatus(undefined);
    expect(blockLean({ kind: "definition", sibling: join(d, "nope.lean"), repoRoot: d, status: none })).toEqual({ expected: true });
    expect(blockLean({ kind: "remark", sibling: join(d, "nope.lean"), repoRoot: d, status: none })).toEqual({ expected: false });
  });

  test("a lean.ref resolves through the platform resolver once the folio's packages are declared", () => {
    const d = repo();
    const none = loadLeanStatus(undefined);
    mkdirSync(join(d, "folio", "p", "lean", "P"), { recursive: true });
    writeFileSync(join(d, "folio", "p", "lean", "P", "Foo.lean"), "namespace P.Foo\ntheorem bar : True := trivial\nend P.Foo\n");
    configureLeanPackages([{ name: "pp", paperDir: "p", lakeRoot: "folio/p/lean", lib: "P" }]);
    if (!formalRefResolverConfigured()) {
      configureFormalRefResolver({
        refPattern: LEAN_REF_PATTERN,
        resolve(ref: string) {
          try {
            const parsed = parseLeanRef(ref);
            const pkg = leanPackageByName(parsed.package);
            const basename = `${parsed.name}.lean`;
            if (!pkg) return { candidatePaths: [], declName: parsed.name, basename };
            const modulePath = `${pkg.lakeRoot}/${parsed.module.replace(/\./g, "/")}.lean`;
            return { candidatePaths: [modulePath], declName: parsed.name, basename, treeRoot: pkg.lakeRoot };
          } catch {
            return undefined;
          }
        },
        resolveCanonical(ref: string, repoRoot: string) {
          try {
            const parsed = parseLeanRef(ref);
            const pkg = leanPackageByName(parsed.package);
            if (!pkg) return undefined;
            const p = join(repoRoot, pkg.lakeRoot, `${parsed.module.replace(/\./g, "/")}.lean`);
            return p;
          } catch {
            return undefined;
          }
        },
      });
    }
    const hit = blockLean({ kind: "theorem", ref: "pp:P.Foo.bar", sibling: join(d, "none.lean"), repoRoot: d, status: none });
    expect(hit).toMatchObject({ via: "ref", path: "folio/p/lean/P/Foo.lean", compiles: "unchecked" });
    const miss = blockLean({ kind: "theorem", ref: "pp:P.Nope.baz", sibling: join(d, "none.lean"), repoRoot: d, status: none });
    expect(miss).toMatchObject({ expected: true, refState: "unresolved" });
    expect(miss.path).toBeUndefined();
  });
});
