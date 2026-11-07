import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CHUNK_SIZE, ingest, moduleOfDocPath, rewriteHeader, type IndexFile } from "./lean-kg-ingest.ts";
import { signatureStyles } from "./lean-kg-publish.ts";

const decl = (name: string, kind = "theorem") => ({
  header: `<div class="decl_header"><span class="decl_kind">${kind}</span> <a href="./QOU/A.html#${name}">${name}</a> <a href="./Mathlib/Algebra/Field/Defs.html#Field">Field</a></div>`,
  info: { name, kind, doc: `doc of ${name}`, sourceLink: "https://example/x.lean#L1", line: 1 },
});

function fixture(): { docData: string; content: string } {
  const root = mkdtempSync(join(tmpdir(), "lkg-"));
  const docData = join(root, "doc-data");
  mkdirSync(docData);
  const write = (m: string, decls: unknown[]) =>
    writeFileSync(join(docData, `declaration-data-${m}.bmp`), JSON.stringify({ name: m, imports: ["Init"], declarations: decls, instances: [] }));
  write("QOU.A", [decl("QOU.A.x"), decl("QOU.A.y", "def")]);
  write("QOU.Big", Array.from({ length: CHUNK_SIZE + 3 }, (_, i) => decl(`QOU.Big.d${i}`)));
  write("Mathlib.Algebra.Field.Defs", [decl("Field", "class")]);
  const content = join(root, "folio", "ch");
  mkdirSync(content, { recursive: true });
  writeFileSync(join(content, "blk.ts"), `export default { label: "prop:x", lean: { ref: "qou:QOU.A.x" } }`);
  return { docData, content: join(root, "folio") };
}

describe("lean-kg-ingest", () => {
  test("moduleOfDocPath maps doc-gen4 paths to module + fragment", () => {
    expect(moduleOfDocPath("./QOU/Mass/X.html#QOU.Mass.X.y")).toEqual({ module: "QOU.Mass.X", frag: "QOU.Mass.X.y" });
    expect(moduleOfDocPath("./foundational_types.html")).toBeUndefined();
  });

  test("rewriteHeader routes kept modules to the viewer and the rest to the external docs", () => {
    const h = rewriteHeader(decl("QOU.A.x").header, new Set(["qou"]), "https://ext/");
    expect(h).toContain(`href="#/m/QOU.A/QOU.A.x"`);
    expect(h).toContain(`href="https://ext/Mathlib/Algebra/Field/Defs.html#Field"`);
  });

  test("ingest prunes to kept roots, chunks signatures, links lean.ref blocks", () => {
    const { docData, content } = fixture();
    const out = mkdtempSync(join(tmpdir(), "lkg-out-"));
    const r = ingest({ docData, out, modules: ["QOU"], contentRoot: content });
    expect(r.modules).toBe(2);
    expect(r.decls).toBe(2 + CHUNK_SIZE + 3);
    expect(r.formalized).toBe(1);
    const index = JSON.parse(readFileSync(join(out, "index.json"), "utf-8")) as IndexFile;
    expect(index.modules.map((m) => m.name)).toEqual(["QOU.A", "QOU.Big"]);
    expect(index.modules[1]!.chunks).toBe(2);
    expect(readdirSync(join(out, "m")).filter((f) => f.startsWith("QOU.Big.")).sort()).toEqual(["QOU.Big.0.sig.json", "QOU.Big.1.sig.json", "QOU.Big.jsonld"]);
    const shard = JSON.parse(readFileSync(join(out, "m", "QOU.A.jsonld"), "utf-8"));
    const x = shard["@graph"].find((n: { name?: string }) => n.name === "QOU.A.x");
    expect(x.formalizes).toEqual([{ "@id": "block:prop:x", label: "prop:x", md: "ch/blk.md" }]);
  });

  test("overlay mode writes only changed modules", () => {
    const { docData, content } = fixture();
    const base = mkdtempSync(join(tmpdir(), "lkg-base-"));
    ingest({ docData, out: base, modules: ["QOU"], contentRoot: content });
    const baseIndex = JSON.parse(readFileSync(join(base, "index.json"), "utf-8")) as IndexFile;
    writeFileSync(join(docData, "declaration-data-QOU.A.bmp"), JSON.stringify({ name: "QOU.A", imports: ["Init"], declarations: [decl("QOU.A.z")], instances: [] }));
    const out = mkdtempSync(join(tmpdir(), "lkg-ov-"));
    const r = ingest({ docData, out, modules: ["QOU"], contentRoot: content, base, baseIndex });
    expect(r.written).toBe(1);
    expect(r.unchanged).toBe(1);
    const ov = JSON.parse(readFileSync(join(out, "overlay.json"), "utf-8"));
    expect(ov.changed).toEqual(["QOU.A"]);
    expect(readdirSync(join(out, "m")).some((f) => f.startsWith("QOU.Big"))).toBe(false);
  });

  test("ingest refuses a directory that is not doc-gen4 doc-data", () => {
    expect(() => ingest({ docData: mkdtempSync(join(tmpdir(), "lkg-empty-")), out: mkdtempSync(join(tmpdir(), "x-")), modules: [] })).toThrow(/not a doc-gen4/);
  });
});

describe("signatureStyles", () => {
  test("keeps custom properties and signature rules, scoped; drops page layout", () => {
    const css = `* { box-sizing: border-box; }\nbody { margin: 0 }\nnav { position: fixed }\n:root { --x: 1 }\n.decl_header { color: red }\nmain .fn, .impl_arg { color: blue }\n@media (prefers-color-scheme: dark) { :root { --x: 2 } nav { left: 0 } }`;
    const out = signatureStyles(css);
    expect(out).toContain(":root{ --x: 1 }");
    expect(out).toContain(".lkg-sig .decl_header");
    expect(out).toContain(".lkg-sig .impl_arg");
    expect(out).not.toMatch(/(^|[},\n])\s*(body|nav|\*)\s*\{/);
    expect(out).toContain("@media (prefers-color-scheme: dark){:root{ --x: 2 }}");
  });
});
