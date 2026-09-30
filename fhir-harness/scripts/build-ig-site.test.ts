/**
 * One IG → one just-the-docs Jekyll source with `site.data.fhir` (bean
 * `bamf`). Driven by a synthetic IG, so it names no real one.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { includeTargets, pageNav, stageIgSite, type StageResult } from "./build-ig-site";

let dir: string;
let out: string;
let r: StageResult;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "ig-site-"));
  const src = join(dir, "src");
  for (const d of ["input/pagecontent", "input/includes", "input/images", "input/images-source"]) mkdirSync(join(src, d), { recursive: true });
  writeFileSync(
    join(src, "sushi-config.yaml"),
    [
      "id: example.ig",
      "canonical: http://example.org/ig",
      "name: ExampleIG",
      "title: Example IG",
      "status: draft",
      "version: 0.1.0",
      "fhirVersion: 4.0.1",
      "publisher:",
      "  name: Example Org",
      "pages:",
      "  index.md:",
      "    title: Home",
      "    overview.md:",
      "      title: Overview",
      "  changes.md:",
      "    title: Change Log",
      "",
    ].join("\n"),
  );
  const pc = join(src, "input", "pagecontent");
  writeFileSync(join(pc, "index.md"), "Package {{ site.data.fhir.packageId }}.\n{% include overview.md %}\n");
  writeFileSync(join(pc, "overview.md"), "{% include flow.svg %}\n{% include notes.md %}\n");
  writeFileSync(join(pc, "changes.md"), "Nothing yet.\n");
  writeFileSync(join(pc, "orphan.md"), "Not in sushi-config.\n");
  writeFileSync(join(src, "input", "includes", "notes.md"), "a note\n");
  writeFileSync(join(src, "input", "images", "logo.png"), "png");
  writeFileSync(join(src, "input", "images-source", "flow.plantuml"), "@startuml\nA -> B\n@enduml\n");
  out = join(dir, "site");
  r = stageIgSite(src, out, { baseurl: "/site/example" });
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("staging one IG as one just-the-docs site", () => {
  test("site.data.fhir is written from sushi-config, only what is sourced", () => {
    const fhir = JSON.parse(readFileSync(join(out, "_data", "fhir.json"), "utf-8"));
    expect(fhir.packageId).toBe("example.ig");
    expect(fhir.ig.version).toBe("0.1.0");
    expect(fhir.ig.publisher).toBe("Example Org");
    expect(JSON.stringify(fhir)).not.toContain('""');
  });

  test("navigation comes from sushi-config pages: titles, parents, order", () => {
    const nav = pageNav({ "index.md": { title: "Home", "overview.md": { title: "Overview" } }, "changes.md": { title: "Change Log" } });
    expect(nav.get("index")).toEqual({ title: "Home", navOrder: 1 });
    expect(nav.get("overview")).toEqual({ title: "Overview", parent: "Home", navOrder: 2 });
    expect(nav.get("changes")).toEqual({ title: "Change Log", navOrder: 3 });
    expect(readFileSync(join(out, "overview.md"), "utf-8")).toStartWith('---\ntitle: "Overview"\nparent: "Home"\nnav_order: 2\n---\n');
  });

  test("a page sushi-config does not list is kept, titled by file name, and reported", () => {
    expect(r.unlisted).toEqual(["orphan.md"]);
    expect(readFileSync(join(out, "orphan.md"), "utf-8")).toContain('title: "orphan"');
  });

  test("pages, includes and images land where Jekyll resolves them", () => {
    expect(r.pages).toEqual(["changes.md", "index.md", "orphan.md", "overview.md"]);
    for (const f of ["notes.md", "overview.md", "index.md"]) expect(readFileSync(join(out, "_includes", f), "utf-8").length).toBeGreaterThan(0);
    expect(readFileSync(join(out, "logo.png"), "utf-8")).toBe("png");
  });

  test("a diagram the Publisher renders, with no renderer given, is a VISIBLE marker and reported", () => {
    expect(r.notRendered).toEqual(["flow.svg"]);
    expect(r.rendered).toEqual([]);
    expect(readFileSync(join(out, "_includes", "flow.svg"), "utf-8")).toContain("⟦not rendered: flow.svg⟧");
  });

  test("the config is one just-the-docs site at the given baseurl", () => {
    const cfg = readFileSync(join(out, "_config.yml"), "utf-8");
    expect(cfg).toContain('title: "Example IG"');
    expect(cfg).toContain('baseurl: "/site/example"');
    expect(cfg).toContain("theme: just-the-docs");
  });

  test("include targets are read from the page", () => {
    expect(includeTargets("{% include a.svg %} x {%- include b.md -%}")).toEqual(["a.svg", "b.md"]);
  });
});
