import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CONTENT_QA_SIDECAR,
  INJECTION_RULES,
  collectItems,
  contentDigest,
  contentGate,
  decoded,
  makeSidecar,
  readSidecar,
  resourceItems,
  runGate,
  scanText,
  sidecarProblems,
} from "./ig-content-qa.ts";

const rules = (t: string) => scanText(t).map((h) => h.rule);

/** A narrative of the shape the Publisher generates: no hit. */
const PUBLISHER_DIV =
  '<div xmlns="http://www.w3.org/1999/xhtml"><p class="res-header-id"><b>Generated Narrative: ValueSet example</b></p><a name="example"> </a><table class="grid"><tr><td colspan="2" style="background-color: #f0f0f0">Code</td></tr></table><ul><li>Include codes from <a href="CodeSystem-x.html"><code>http://example.org/cs</code></a></li></ul></div>';

describe("scanText", () => {
  test("a Publisher narrative and plain prose are clean", () => {
    expect(rules(PUBLISHER_DIV)).toEqual([]);
    expect(rules("When age < 5 and onset = birth, see [the guide](https://example.org/a?b=c). JavaScript: a language.")).toEqual([]);
    expect(rules("The expression is evaluated in FHIRPath")).toEqual([]);
  });

  test("each of the issue's flags is caught", () => {
    expect(rules("<div><script>alert(1)</script></div>")).toContain("script-tag");
    expect(rules('<iframe src="x">')).toContain("iframe-tag");
    expect(rules("<object data=x>")).toContain("object-tag");
    expect(rules("<embed src=x>")).toContain("embed-tag");
    expect(rules('<form action="https://evil">')).toContain("form-tag");
    expect(rules('<base href="https://evil/">')).toContain("base-tag");
    expect(rules('<meta http-equiv="refresh" content="0;url=https://evil">')).toContain("meta-http-equiv");
    expect(rules('<img src=x onerror="alert(1)">')).toContain("event-handler");
    expect(rules("<svg/onload=alert(1)>")).toContain("event-handler");
    expect(rules('<a href="javascript:alert(1)">x</a>')).toContain("script-url");
    expect(rules("[click](javascript:alert(1))")).toContain("script-url");
    expect(rules("<a href='vbscript:msgbox'>")).toContain("script-url");
    expect(rules('<a href="data:text/html;base64,PHNjcmlwdD4=">')).toContain("data-html-url");
    expect(rules('<iframe srcdoc="<p>">')).toContain("srcdoc");
    expect(rules("<style>p { width: expression(alert(1)) }</style>")).toContain("css-expression");
    expect(rules('<style>p { background: url("javascript:alert(1)") }</style>')).toContain("script-url");
    expect(rules("access‮gnp.exe")).toContain("bidi-control");
  });

  test("character references and a tab inside the scheme do not hide a URL", () => {
    expect(decoded("&#106;ava&#x09;script&colon;")).toBe("javascript:");
    expect(rules('<a href="&#106;avascript:alert(1)">')).toContain("script-url");
    expect(rules('<a href="java&#x09;script:alert(1)">')).toContain("script-url");
    expect(rules("&lt;script&gt;alert(1)&lt;/script&gt;")).toContain("script-tag");
    expect(rules('<a href="&amp;#106;avascript:x">')).toContain("script-url");
  });
});

describe("resourceItems", () => {
  test("the narrative and the markdown fields at any depth, contained resources included", () => {
    const items = resourceItems({
      resourceType: "StructureDefinition",
      id: "p",
      text: { status: "generated", div: PUBLISHER_DIV },
      description: "A profile.",
      purpose: "  ",
      title: "not markdown",
      differential: { element: [{ id: "a", definition: "Def A", comment: "C" }, { id: "b", short: "s" }] },
      contained: [{ resourceType: "ValueSet", id: "vs", text: { div: "<div>c</div>" }, description: "inner" }],
      note: [{ text: "an annotation" }],
    });
    expect(items.map((i) => `${i.kind} ${i.where} ${i.field}`)).toEqual([
      "narrative StructureDefinition/p text.div",
      "markdown StructureDefinition/p description",
      "markdown StructureDefinition/p differential.element[0].definition",
      "markdown StructureDefinition/p differential.element[0].comment",
      "narrative StructureDefinition/p contained[0].text.div",
      "markdown StructureDefinition/p contained[0].description",
      "markdown StructureDefinition/p note[0].text",
    ]);
  });
});

describe("contentDigest", () => {
  const a = resourceItems({ resourceType: "X", id: "1", description: "one", purpose: "two" });
  test("order-free, and any change changes it", () => {
    expect(contentDigest(a)).toBe(contentDigest([...a].reverse()));
    expect(contentDigest(a)).not.toBe(contentDigest(resourceItems({ resourceType: "X", id: "1", description: "one!", purpose: "two" })));
    expect(contentDigest(a)).not.toBe(contentDigest(a.slice(1)));
    expect(contentDigest(a)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});

describe("contentGate", () => {
  const items = resourceItems({ resourceType: "X", id: "1", text: { div: PUBLISHER_DIV }, description: "fine" });
  const reviewer = { kind: "agent" as const, name: "claude" };

  test("reviewed and clean passes", () => {
    const v = contentGate({ items, sidecar: makeSidecar({ items, reviewer }) });
    expect(v.ok).toBe(true);
    expect(v.state).toBe("reviewed");
  });

  test("missing and stale refuse, unless a preview accepts them", () => {
    expect(contentGate({ items, sidecar: undefined })).toMatchObject({ ok: false, state: "missing" });
    const old = makeSidecar({ items: items.slice(1), reviewer });
    expect(contentGate({ items, sidecar: old })).toMatchObject({ ok: false, state: "stale" });
    expect(contentGate({ items, sidecar: old, acceptUnreviewed: true })).toMatchObject({ ok: true, accepted: true, state: "stale" });
    expect(contentGate({ items, sidecar: undefined, acceptUnreviewed: true })).toMatchObject({ ok: true, accepted: true, state: "missing" });
  });

  test("an open finding refuses, even on a preview; a cleared one with a reason passes", () => {
    const f = { where: "X/1", field: "description", kind: "prompt-injection", note: "asks an agent to ignore its instructions" };
    const open = makeSidecar({ items, reviewer, findings: [{ ...f, status: "open" }] });
    expect(contentGate({ items, sidecar: open, acceptUnreviewed: true })).toMatchObject({ ok: false, state: "open-findings" });
    const cleared = makeSidecar({ items, reviewer, findings: [{ ...f, status: "cleared", reason: "quotes an attack as an example" }] });
    expect(contentGate({ items, sidecar: cleared })).toMatchObject({ ok: true, state: "reviewed" });
    expect(() => makeSidecar({ items, reviewer, findings: [{ ...f, status: "cleared" }] })).toThrow(/without a reason/);
  });

  test("a pattern hit refuses whatever the review says", () => {
    const bad = resourceItems({ resourceType: "X", id: "1", description: "[x](javascript:alert(1))" });
    const v = contentGate({ items: bad, sidecar: makeSidecar({ items: bad, reviewer }), acceptUnreviewed: true });
    expect(v).toMatchObject({ ok: false, state: "pattern-hits" });
    expect(v.said).toContain("X/1 description");
  });

  test("an unusable review refuses", () => {
    expect(sidecarProblems({ $schema: "other" }).length).toBeGreaterThan(0);
    expect(contentGate({ items, sidecar: { unparsable: "x" } })).toMatchObject({ ok: false, state: "unusable" });
  });
});

describe("a checkout", () => {
  function igWith(description: string): string {
    const ig = mkdtempSync(join(tmpdir(), "ig-content-qa-"));
    mkdirSync(join(ig, "output-ast", "resources"), { recursive: true });
    mkdirSync(join(ig, "input", "pagecontent"), { recursive: true });
    writeFileSync(join(ig, "output-ast", "manifest.json"), JSON.stringify({ $schema: "ig-ast/v1", resources: [{ file: "resources/X-1.json" }] }));
    writeFileSync(join(ig, "output-ast", "resources", "X-1.json"), JSON.stringify({ resourceType: "X", id: "1", description }));
    writeFileSync(join(ig, "input", "pagecontent", "index.md"), "# Home\n");
    writeFileSync(join(ig, "input", "pagecontent", "logo.png"), "png");
    return ig;
  }

  test("collects the AST's texts and the IG's pages; record then gate passes, an edit makes it stale", () => {
    const ig = igWith("fine");
    const ast = join(ig, "output-ast");
    expect(collectItems({ ig, ast }).map((i) => `${i.where} ${i.field}`)).toEqual(["X/1 description", "input/pagecontent/index.md page"]);
    expect(() => runGate({ ig, ast, log: () => {} })).toThrow(/no review/);
    mkdirSync(join(ig, "qa"));
    writeFileSync(join(ig, CONTENT_QA_SIDECAR), JSON.stringify(makeSidecar({ items: collectItems({ ig, ast }), reviewer: { kind: "agent", name: "t" } })));
    const work = join(ig, "work");
    expect(runGate({ ig, ast, work, log: () => {} }).state).toBe("reviewed");
    expect(JSON.parse(readFileSync(join(work, "ig-content-qa-verdict.json"), "utf-8")).ok).toBe(true);
    writeFileSync(join(ig, "input", "pagecontent", "index.md"), "# Home, edited\n");
    expect(() => runGate({ ig, ast, log: () => {} })).toThrow(/stale/);
  });

  test("a review outside the declared read scope is refused, not silently skipped", () => {
    const ig = igWith("fine");
    mkdirSync(join(ig, "qa"));
    writeFileSync(join(ig, CONTENT_QA_SIDECAR), "{}");
    expect(() => readSidecar(ig, { declares: (r) => r !== CONTENT_QA_SIDECAR, reaches: () => true })).toThrow(/contentTypes\.ig\.include/);
  });
});

describe("the browser's copy of the rules", () => {
  test("ast-resource.js holds the same list as the gate", () => {
    const js = readFileSync(join(import.meta.dir, "templates", "ig-pages", "ast-resource.js"), "utf-8");
    const m = /INJECTION_RULES:BEGIN\s*\n\s*var INJECTION_RULES = ([\s\S]*?);\s*\n\s*\/\/ INJECTION_RULES:END/.exec(js);
    expect(m).not.toBeNull();
    expect(JSON.parse(m![1]!)).toEqual(INJECTION_RULES);
  });

  test("ast-resource.js shows a flagged narrative as text and renders a clean one", () => {
    const js = readFileSync(join(import.meta.dir, "templates", "ig-pages", "ast-resource.js"), "utf-8");
    // The loader's own functions, run outside a page: take the IIFE body up to `begin`.
    const body = js.slice(js.indexOf("// INJECTION_RULES:BEGIN"), js.indexOf("  function begin()"));
    const injectionHits = new Function(`${body}; return injectionHits;`)() as (t: string) => string[];
    expect(injectionHits(PUBLISHER_DIV)).toEqual([]);
    expect(injectionHits('<div><img src=x onerror="alert(1)"></div>')).toEqual(["an on* event handler attribute"]);
    expect(injectionHits('<a href="&#106;avascript:x">')).toEqual(["a javascript:/vbscript: URL"]);
  });
});
