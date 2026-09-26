import { describe, expect, test } from "bun:test";

import { malformation, overlay, rootTokens, ruleFor, type RawLayer } from "../ingest-ig-chrome";
import type { IgChromeLayer } from "../../schemas/ig-chrome";

function layer(pkg: string, css: string): RawLayer {
  const meta: IgChromeLayer = {
    package: pkg,
    version: "1.0.0",
    of: `https://github.com/example/${pkg}`,
    ref: "0000000000000000000000000000000000000000",
    path: "content/assets/css/x.css",
    readAt: "2026-09-23",
  };
  return { layer: meta, css };
}

describe("rootTokens", () => {
  test("reads every :root block, so a layer that splits its palette in two is not half-read", () => {
    // `who.css` really does this — a WHO block and a "generic settings" block.
    const css = `:root { --a: 1; }\n.x { color: red }\n:root { --b: 2; }`;
    expect(rootTokens(css).map((t) => t.name)).toEqual(["--a", "--b"]);
  });

  test("a `;` inside a comment does not end a declaration", () => {
    const css = `:root { --a: 1; /* note; with a semicolon */ --b: 2; }`;
    expect(rootTokens(css)).toEqual([
      { name: "--a", value: "1" },
      { name: "--b", value: "2" },
    ]);
  });
});

describe("ruleFor", () => {
  test("an ABSENT selector returns undefined — the fact that makes the yellow box HL7's", () => {
    // This is not a nicety. `who.css` styles no `#publish-box`, and only an
    // absent/present distinction can attribute the rule to the right layer.
    expect(ruleFor(`#ig-status { color: red; }`, "#publish-box")).toBeUndefined();
  });

  test("does not match a selector that merely ENDS with the one asked for", () => {
    // `#ig-status` must not be answered by `#not-ig-status`.
    expect(ruleFor(`#not-ig-status { color: red; }`, "#ig-status")).toBeUndefined();
  });

  test("reads a compound selector with a class", () => {
    const decls = ruleFor(`#ig-status.ig-status-draft { background-image: url("x"); }`, "#ig-status.ig-status-draft");
    expect(decls).toEqual([{ property: "background-image", value: 'url("x")' }]);
  });
});

describe("overlay", () => {
  test("the LAST layer wins, and the shadowed value is recorded", () => {
    const { tokens } = overlay([
      layer("fhir.base.template", `:root { --navbar-bg-color: #7b1fad; }`),
      layer("who.template.root", `:root { --navbar-bg-color: #00477d; }`),
    ]);
    expect(tokens).toEqual([
      {
        name: "--navbar-bg-color",
        value: "#00477d",
        from: "who.template.root",
        overrides: [{ package: "fhir.base.template", value: "#7b1fad" }],
      },
    ]);
  });

  test("`overrides: []` means ONE layer decided it — the yellow-box case", () => {
    // Nobody at WHO ever touched the publish box. An empty `overrides` is what
    // says so, and it is why the field is required rather than optional.
    const { tokens } = overlay([
      layer("fhir.base.template", `:root { --publish-box-bg-color: yellow; }`),
      layer("who.template.root", `:root { --navbar-bg-color: #00477d; }`),
    ]);
    const box = tokens.find((t) => t.name === "--publish-box-bg-color")!;
    expect(box.from).toBe("fhir.base.template");
    expect(box.overrides).toEqual([]);
  });

  test("a lower layer declaring the IDENTICAL value is not an override", () => {
    // Otherwise `overrides: []` would stop meaning "one layer decided this".
    const { tokens } = overlay([
      layer("base", `:root { --x: #fff; }`),
      layer("top", `:root { --x: #fff; }`),
    ]);
    expect(tokens[0]!.overrides).toEqual([]);
  });

  test("within one layer the LAST declaration wins, as CSS says", () => {
    const { tokens } = overlay([layer("one", `:root { --x: 1; }\n:root { --x: 2; }`)]);
    expect(tokens[0]!.value).toBe("2");
    expect(tokens[0]!.overrides).toEqual([]);
  });

  test("a SHAPE conflict is detected — the --toc-box-border case, measured", () => {
    const { conflicts } = overlay([
      layer("fhir.base.template", `:root { --toc-box-border: 1px solid navy; }`),
      layer("who.template.root", `:root { --toc-box-border: navy; }`),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.kind).toBe("shape");
    expect(conflicts[0]!.sites.map((s) => s.value)).toEqual(["1px solid navy", "navy"]);
  });

  test("agreeing layers raise NO conflict — the detector must not fire on every token", () => {
    const { conflicts } = overlay([
      layer("base", `:root { --a: #fff; --b: 1px solid navy; }`),
      layer("top", `:root { --a: #000; }`),
    ]);
    expect(conflicts).toEqual([]);
  });

  test("a MALFORMED value is recorded against the ONE layer that ships it", () => {
    const { conflicts } = overlay([layer("fhir.base.template", `:root { --breadcrumb-text-color: ##555555; }`)]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]!.kind).toBe("malformed");
    expect(conflicts[0]!.sites).toEqual([{ package: "fhir.base.template", value: "##555555" }]);
  });

  test("the malformed value is still MIRRORED — a mirror that corrects its subject is not a mirror", () => {
    const { tokens } = overlay([layer("fhir.base.template", `:root { --breadcrumb-text-color: ##555555; }`)]);
    expect(tokens[0]!.value).toBe("##555555");
  });

  test("a rule is attributed to the TOPMOST layer that declares it", () => {
    const { rules } = overlay([
      layer("fhir.base.template", `#publish-box { background-color: yellow; }\n#ig-status p { color: red; }`),
      layer("who.template.root", `#ig-status p { color: blue; }`),
    ]);
    const byId = Object.fromEntries(rules.map((r) => [r.selector, r.from]));
    expect(byId["#ig-status p"]).toBe("who.template.root");
    expect(byId["#publish-box"]).toBe("fhir.base.template");
  });
});

describe("malformation", () => {
  test("catches the doubled hash and nothing else", () => {
    expect(malformation("##555555")).toContain("doubled");
    expect(malformation("#555555")).toBeUndefined();
    expect(malformation("navy")).toBeUndefined();
    expect(malformation("1px solid navy")).toBeUndefined();
    // NARROW on purpose: a false positive accuses somebody else's published
    // stylesheet of a fault it does not have.
    expect(malformation("rgba(245,45,45,0.5)")).toBeUndefined();
    expect(malformation('url("data:image/svg+xml;utf8,<svg/>")')).toBeUndefined();
  });
});
