/**
 * Blocks are modules. Two propagation audits were reading them with a
 * regex instead, against a hand-written list of twelve kinds while
 * `Block` has fifteen — so `algorithm`, `proof` and `table` blocks were
 * invisible to both. `schemas/types.ts` already documents this exact
 * drift costing ~13% of the qou corpus across five other lists; those
 * two were a sixth and seventh.
 *
 * The scan's stated justification was "too slow + needs deps". Measured
 * on 300 blocks: scan 34 ms reading 151, import 197 ms reading 263.
 * 0.66 ms per block, and Bun needs no dependency to import TypeScript.
 *
 * These pin the loader, and the write-path verifier that replaces
 * trusting a text edit with reading back what the edit produced.
 */
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  loadBlockModule,
  loadBlocksUnder,
  verifyEditedBlock,
} from "../../content/pipeline/block-module";

const BUILDERS = join(import.meta.dir, "../../schemas/builders");

let root: string;

function block(dir: string, name: string, body: string): string {
  const p = join(root, dir, `${name}.ts`);
  writeFileSync(p, body.replace(/__BUILDERS__/g, BUILDERS));
  return p;
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "blockmod-"));
  mkdirSync(join(root, "ch1"), { recursive: true });

  block("ch1", "t1", `import { theorem } from "__BUILDERS__";
export default theorem({ label: "thm:t1", title: "T", statement: "s", uses: ["def:d1"] });
`);
  // The three kinds the audits' twelve-kind regex could not see.
  block("ch1", "p1", `import { proof } from "__BUILDERS__";
export default proof({ label: "prf:p1", title: "P", of: "thm:t1", statement: "s" });
`);
  block("ch1", "a1", `import { algorithm } from "__BUILDERS__";
export default algorithm({ label: "alg:a1", title: "A", statement: "s", steps: ["one"], uses: ["thm:t1"] });
`);
  block("ch1", "tb1", `import { table } from "__BUILDERS__";
export default table({ label: "tbl:tb1", title: "Tb", caption: "c", data: { headers: ["h"], rows: [["1"]] } });
`);
  // Not a block: a chapter manifest. Legitimately skipped.
  block("ch1", "ch1", `import { chapter } from "__BUILDERS__";
export default chapter({ title: "Ch", sections: [{ title: "S", blocks: ["t1"] }] });
`);
  // A block that throws on import. Must be REPORTED, not skipped.
  block("ch1", "broken", `import { theorem } from "__BUILDERS__";
export default theorem({ label: "NOT-A-VALID-PREFIX", title: "B", statement: "s" });
`);
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("loadBlocksUnder sees every block kind", () => {
  test("finds proof, algorithm and table — the three the regex missed", async () => {
    const { blocks } = await loadBlocksUnder(root);
    expect(blocks.has("prf:p1")).toBe(true);
    expect(blocks.has("alg:a1")).toBe(true);
    expect(blocks.has("tbl:tb1")).toBe(true);
    expect(blocks.has("thm:t1")).toBe(true);
  });

  test("reads uses[] from the validated object, not from source text", async () => {
    const { blocks } = await loadBlocksUnder(root);
    expect(blocks.get("thm:t1")!.uses).toEqual(["def:d1"]);
    expect(blocks.get("alg:a1")!.uses).toEqual(["thm:t1"]);
    // Absent uses[] is [], not undefined.
    expect(blocks.get("prf:p1")!.uses).toEqual([]);
  });

  test("a chapter manifest is skipped, not reported as a failure", async () => {
    const { blocks, failures } = await loadBlocksUnder(root);
    for (const b of blocks.values()) expect(b.kind).not.toBe("chapter");
    expect(failures.map((f) => f.file)).not.toContain(join(root, "ch1", "ch1.ts"));
  });

  test("a block that will not load is REPORTED, never silently dropped", async () => {
    // The whole failure mode: a sweep that reports clean because it
    // could not read the files that would have failed it.
    const { failures } = await loadBlocksUnder(root);
    expect(failures.length).toBe(1);
    expect(failures[0].file).toContain("broken.ts");
    expect(failures[0].error.length).toBeGreaterThan(0);
  });
});

describe("loadBlockModule", () => {
  test("rejects a label the schema would reject", async () => {
    // The regex accepted `label: "theorem:x"` — any string. The builder
    // does not: a theorem's label must start with `thm:`. A graph keyed
    // on labels that cannot exist has edges that cannot resolve.
    const p = block("ch1", "badlabel", `import { theorem } from "__BUILDERS__";
export default theorem({ label: "theorem:x", title: "T", statement: "s" });
`);
    await expect(loadBlockModule(p)).rejects.toThrow();
    rmSync(p, { force: true });
  });
});

describe("verifyEditedBlock — the write path stops trusting the splice", () => {
  const SRC = `import { theorem } from "${BUILDERS}";
export default theorem({
  label: "thm:v1",
  title: "V",
  statement: "s",
  uses: ["def:a", "def:b"],
});
`;
  let target: string;

  beforeAll(() => {
    target = join(root, "ch1", "v1.ts");
    writeFileSync(target, SRC);
  });

  test("accepts an edit that produces exactly the intended uses[]", async () => {
    const edited = SRC.replace(`["def:a", "def:b"]`, `["def:a"]`);
    expect(await verifyEditedBlock(target, edited, ["def:a"])).toEqual({ ok: true });
  });

  test("rejects an edit whose uses[] is not what was asked for", async () => {
    const edited = SRC.replace(`["def:a", "def:b"]`, `["def:b"]`);
    const v = await verifyEditedBlock(target, edited, ["def:a"]);
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.reason).toContain("uses[]");
  });

  test("rejects an edit that landed in a different field", async () => {
    // The concrete old bug: `/uses:\s*\[[\s\S]*?\]/` had no word
    // boundary, so on a block with an earlier field it rewrote that one
    // and left uses[] alone. Here the label is clobbered instead.
    const edited = SRC.replace(`label: "thm:v1"`, `label: "thm:other"`);
    const v = await verifyEditedBlock(target, edited, ["def:a", "def:b"]);
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.reason).toContain("label changed");
  });

  test("rejects an edit that no longer parses", async () => {
    const v = await verifyEditedBlock(target, `export default theorem({ label:`, ["def:a"]);
    expect(v.ok).toBe(false);
    if (v.ok) return;
    expect(v.reason).toContain("does not load");
  });

  test("rejects an edit the schema refuses", async () => {
    const edited = SRC.replace(`label: "thm:v1"`, `label: "nonsense"`);
    const v = await verifyEditedBlock(target, edited, ["def:a", "def:b"]);
    expect(v.ok).toBe(false);
  });

  test("leaves no probe file behind, on success or failure", async () => {
    await verifyEditedBlock(target, SRC, ["def:a", "def:b"]);
    await verifyEditedBlock(target, `broken(`, ["def:a"]);
    const strays = readdirSync(join(root, "ch1")).filter((f) => f.includes("prune-verify"));
    expect(strays).toEqual([]);
  });

  test("never writes to the target itself", async () => {
    // Verification must be side-effect free on the real file — the
    // caller writes only after an ok.
    const before = Bun.file(target).size;
    await verifyEditedBlock(target, SRC.replace(`["def:a", "def:b"]`, `["def:a"]`), ["def:a"]);
    expect(Bun.file(target).size).toBe(before);
  });
});
