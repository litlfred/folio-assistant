/**
 * Our BPMN extension elements are recognised by NAMESPACE, never by the prefix
 * a diagram binds (bean `12s9`, stage 1).
 *
 * The owner's ruling is that a prefix names the Subgraph that declares the
 * element (`bootstrap.processes:`). Until 2026-09-24 every reader matched the
 * text `folio:`, so that rename would have parsed cleanly and silently dropped
 * every Skill, Role and decision. These tests pin the property the rename
 * needs: same address, any prefix, same model.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadProcessModel } from "../src/workflow/process-model.ts";
import { BOOTSTRAP_PROCESSES_NS, FOLIO_BPMN_NS, ownElementPattern, ownExtensionPrefixes } from "./namespaces.ts";

const REPO_ROOT = join(import.meta.dir, "..", "..");
const DIAGRAM = join("processes", "initialize-harness.bpmn");

const tmp = mkdtempSync(join(tmpdir(), "extension-ns-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

/** A copy of bootstrap with its main diagram rewritten by `edit`, so relative refs still resolve. */
function variant(name: string, edit: (xml: string) => string): string {
  const root = join(tmp, name);
  cpSync(join(REPO_ROOT, "bootstrap"), root, { recursive: true });
  const file = join(root, DIAGRAM);
  writeFileSync(file, edit(readFileSync(file, "utf-8")));
  return file;
}

/** The model as data — Maps included, which JSON would drop — with the copy's location taken out so two copies compare. */
async function modelOf(file: string, root: string): Promise<unknown> {
  const m = await loadProcessModel(file);
  const text = JSON.stringify(m, (_k, v: unknown) => (v instanceof Map ? Object.fromEntries(v) : v));
  return JSON.parse(text.split(root).join("<root>"));
}

/** Every skill any node names. */
function skillsOf(model: unknown): string[] {
  const nodes = (model as { nodes: Record<string, { skills?: string[] }> }).nodes;
  return Object.values(nodes).flatMap((n) => n.skills ?? []);
}

describe("the parser follows the namespace, not the prefix", () => {
  test("bootstrap's diagram, written bootstrap.processes:, binds bootstrap's own address (stage 2)", () => {
    const xml = readFileSync(join(REPO_ROOT, "bootstrap", DIAGRAM), "utf-8");
    expect(ownExtensionPrefixes(xml)).toEqual(["bootstrap.processes"]);
    expect(xml).toContain(`xmlns:bootstrap.processes="${BOOTSTRAP_PROCESSES_NS}"`);
    expect(xml).not.toMatch(/<\/?folio:/);
  });

  test("the same address under any other prefix loads into the same model", async () => {
    const same = variant("same", (x) => x);
    const renamed = variant("renamed", (x) =>
      x.replace(/xmlns:bootstrap\.processes=/g, "xmlns:x=").replace(/(<\/?)bootstrap\.processes:/g, "$1x:"),
    );
    expect(readFileSync(renamed, "utf-8")).not.toContain("bootstrap.processes:skill");
    const a = await modelOf(same, join(tmp, "same"));
    const b = await modelOf(renamed, join(tmp, "renamed"));
    // Vacuity: the original must carry extensions for "identical" to mean anything.
    expect(skillsOf(a)).toContain("confirm-harness");
    expect(b).toEqual(a);
  });

  test("the older single address is still ours, so a diagram not yet moved reads the same", async () => {
    const older = variant("older", (x) =>
      x
        .replace(`xmlns:bootstrap.processes="${BOOTSTRAP_PROCESSES_NS}"`, `xmlns:folio="${FOLIO_BPMN_NS}"`)
        .replace(/(<\/?)bootstrap\.processes:/g, "$1folio:"),
    );
    const a = await modelOf(variant("same2", (x) => x), join(tmp, "same2"));
    expect(await modelOf(older, join(tmp, "older"))).toEqual(a);
  });

  test("folio: bound to someone else's namespace is not ours, whatever it spells", async () => {
    const foreign = variant("foreign", (x) =>
      x
        .replace(`xmlns:bootstrap.processes="${BOOTSTRAP_PROCESSES_NS}"`, 'xmlns:folio="urn:somebody-else"')
        .replace(/(<\/?)bootstrap\.processes:/g, "$1folio:"),
    );
    expect(readFileSync(foreign, "utf-8")).toContain("<folio:skill");
    const control = await modelOf(variant("control", (x) => x), join(tmp, "control"));
    expect(skillsOf(control).length).toBeGreaterThan(0);
    expect(skillsOf(await modelOf(foreign, join(tmp, "foreign")))).toEqual([]);
  });
});

describe("raw-XML readers follow the namespace too", () => {
  const doc = (bindings: string, body: string) => `<bpmn:definitions ${bindings}>${body}</bpmn:definitions>`;

  test("the prefixes bound to our namespace are found, dotted ones included", () => {
    const xml = doc(`xmlns:bootstrap.processes="${FOLIO_BPMN_NS}" xmlns:folio="urn:other"`, "");
    expect(ownExtensionPrefixes(xml)).toEqual(["bootstrap.processes"]);
  });

  test("a pattern matches our element under any prefix, and never a foreign folio:", () => {
    const xml = doc(
      `xmlns:bootstrap.processes="${FOLIO_BPMN_NS}" xmlns:folio="urn:other"`,
      '<bootstrap.processes:skill ref="a"/><folio:skill ref="b"/>',
    );
    const refs = [...xml.matchAll(ownElementPattern(xml, "skill", String.raw`\s+ref="([^"]+)"`))].map((m) => m[1]);
    expect(refs).toEqual(["a"]);
  });

  test("a document that binds none of our namespaces has none of our elements", () => {
    const xml = doc("", '<folio:skill ref="a"/>');
    expect([...xml.matchAll(ownElementPattern(xml, "skill"))]).toEqual([]);
  });
});

describe("nothing matches our elements by the text folio: again", () => {
  /**
   * A regex LITERAL containing `folio:<name>` in code (not a comment, not a
   * test) is a reader matching the prefix text — the defect stage 1 removed.
   * `$type === "folio:…"` is fine: the parser has already normalised it by
   * namespace. Use `ownElementPattern` from `schemas/namespaces.ts` instead.
   */
  const LITERAL = /(^|[\s(=,!&|?:])\/(?:[^/\\\n]|\\.)*folio:[a-z]/;
  const offenders: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      if (f === "node_modules" || f.startsWith(".")) continue;
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts")) {
        readFileSync(p, "utf-8").split("\n").forEach((line, i) => {
          const t = line.trimStart();
          if (t.startsWith("*") || t.startsWith("/*") || t.startsWith("//")) return;
          if (LITERAL.test(line)) offenders.push(`${p.slice(REPO_ROOT.length + 1)}:${i + 1}`);
        });
      }
    }
  };
  for (const top of ["cat-harness", "folio-assistant-core"]) walk(join(REPO_ROOT, top));

  test("no regex literal matches folio:<element> in raw text", () => {
    expect(offenders).toEqual([]);
  });
});
