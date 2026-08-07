import { describe, expect, test, beforeEach } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  checkLeanRefOwnsDecl,
  resetUsesGraphCache,
} from "../../content/pipeline/qa-checkers-uses";
import { buildContentGraph } from "../../content/pipeline/content-graph";

interface Blk {
  slug: string;
  label: string;
  kind: string;
  ref?: string;
}

function makeRepo(blocks: Blk[]) {
  const root = mkdtempSync(join(tmpdir(), "ownsdecl-"));
  const dir = join(root, "content", "p", "ch");
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(root, "computations"), { recursive: true });
  const paths: Record<string, string> = {};
  for (const b of blocks) {
    const p = join(dir, `${b.slug}.ts`);
    const lean = b.ref ? `  lean: { ref: "${b.ref}" },\n` : "";
    writeFileSync(
      p,
      `export default ${b.kind}({\n  label: "${b.label}",\n${lean}});\n`,
    );
    paths[b.label] = p;
  }
  return { root, paths };
}

let cwd: string;
beforeEach(() => {
  cwd = process.cwd();
  resetUsesGraphCache();
});
function inRepo<T>(root: string, fn: () => T): T {
  process.chdir(root);
  try {
    return fn();
  } finally {
    process.chdir(cwd);
  }
}

describe("lean-ref-owns-decl", () => {
  test("a prop + proof pair sharing one decl is LEGITIMATE", () => {
    // The distinction that makes this criterion usable. On a real corpus
    // 5 of 7 shared decls were pairs like this; reporting them would
    // bury the 2 genuine collisions in noise.
    const { root, paths } = makeRepo([
      { slug: "x", label: "prop:x", kind: "proposition", ref: "p:P.x" },
      { slug: "x-proof", label: "prf:x", kind: "proof", ref: "p:P.x" },
    ]);
    const r = inRepo(root, () => checkLeanRefOwnsDecl(paths["prop:x"]));
    expect(r.result).toBe("pass");
    expect(r.metrics?.decl_claimants).toBe(2);
    rmSync(root, { recursive: true, force: true });
  });

  test("two definitions claiming one decl FAILS, from both sides", () => {
    const { root, paths } = makeRepo([
      { slug: "a", label: "def:a", kind: "definition", ref: "p:P.Thing" },
      { slug: "b", label: "def:b", kind: "definition", ref: "p:P.Thing" },
    ]);
    const ra = inRepo(root, () => checkLeanRefOwnsDecl(paths["def:a"]));
    resetUsesGraphCache();
    const rb = inRepo(root, () => checkLeanRefOwnsDecl(paths["def:b"]));
    expect(ra.result).toBe("fail");
    expect(rb.result).toBe("fail");
    expect(ra.hits[0].text).toContain("def:b");
    expect(rb.hits[0].text).toContain("def:a");
    rmSync(root, { recursive: true, force: true });
  });

  test("distinct decls pass", () => {
    const { root, paths } = makeRepo([
      { slug: "a", label: "def:a", kind: "definition", ref: "p:P.A" },
      { slug: "b", label: "def:b", kind: "definition", ref: "p:P.B" },
    ]);
    const r = inRepo(root, () => checkLeanRefOwnsDecl(paths["def:a"]));
    expect(r.result).toBe("pass");
    rmSync(root, { recursive: true, force: true });
  });

  test("n/a for a block with no lean.ref", () => {
    const { root, paths } = makeRepo([
      { slug: "a", label: "rem:a", kind: "remark" },
    ]);
    const r = inRepo(root, () => checkLeanRefOwnsDecl(paths["rem:a"]));
    expect(r.result).toBe("n/a");
    rmSync(root, { recursive: true, force: true });
  });
});

describe("graph decl ownership tie-break", () => {
  test("a decl resolves to the STATEMENT block, not its proof", () => {
    // Formal edges must attach to the proposition. This was
    // first-writer-wins, so the graph's shape depended on filesystem
    // walk order — and could hang a decl off the proof block.
    const { root } = makeRepo([
      // `x-proof` sorts before `x`, so a naive walk sees the proof first.
      { slug: "x-proof", label: "prf:x", kind: "proof", ref: "p:P.x" },
      { slug: "x", label: "prop:x", kind: "proposition", ref: "p:P.x" },
    ]);
    const g = buildContentGraph(join(root, "content"), root);
    expect(g.declOwners.get("P.x")?.sort()).toEqual(["prf:x", "prop:x"]);
    // Ownership for edge attachment goes to the proposition either way.
    const owners = g.declOwners.get("P.x")!;
    const statement = owners.find((l) => g.nodes.get(l)?.kind === "proposition");
    expect(statement).toBe("prop:x");
    rmSync(root, { recursive: true, force: true });
  });
});
