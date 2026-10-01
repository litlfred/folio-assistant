import { describe, expect, test } from "bun:test";

import {
  IG_CHROME_SCHEMA_TAG,
  IgChromeSchema,
  chromeCss,
  chromeFileFor,
  tokenOf,
  tokensByPackage,
  type IgChrome,
} from "./ig-chrome";

function chrome(over: Partial<IgChrome> = {}): IgChrome {
  return {
    $schema: IG_CHROME_SCHEMA_TAG,
    id: "smart.who.int.trust",
    canonical: "http://smart.who.int/trust",
    status: "draft",
    version: "1.8.0",
    layers: [
      {
        package: "fhir.base.template",
        version: "1.0.0",
        of: "https://github.com/HL7/ig-template-base",
        ref: "849a8f5298f521a0af0a48256d4a0c5a83297664",
        path: "content/assets/css/project.css",
        readAt: "2026-09-23",
      },
    ],
    tokens: [{ name: "--navbar-bg-color", value: "#00477d", from: "who.template.root", overrides: [] }],
    rules: [],
    conflicts: [],
    ...over,
  };
}

describe("the schema", () => {
  test("a chrome with no layer is refused — provenance is the point of the file", () => {
    expect(IgChromeSchema.safeParse(chrome({ layers: [] })).success).toBe(false);
  });

  test("a token name without its leading `--` is refused", () => {
    const bad = chrome({ tokens: [{ name: "navbar-bg-color", value: "#00477d", from: "x", overrides: [] }] });
    expect(IgChromeSchema.safeParse(bad).success).toBe(false);
  });

  test("a layer with a truncated ref is refused — a 4-character sha is not provenance", () => {
    const bad = chrome({ layers: [{ ...chrome().layers[0]!, ref: "849a" }] });
    expect(IgChromeSchema.safeParse(bad).success).toBe(false);
  });

  test("a `malformed` conflict may name ONE site, which a min(2) would have made unrepresentable", () => {
    const one = chrome({
      conflicts: [
        {
          token: "--breadcrumb-text-color",
          kind: "malformed",
          detail: "a doubled #",
          sites: [{ package: "fhir.base.template", value: "##555555" }],
        },
      ],
    });
    expect(IgChromeSchema.safeParse(one).success).toBe(true);
  });

  test("a conflict with no site at all is still refused", () => {
    const none = chrome({
      conflicts: [{ token: "--x", kind: "malformed", detail: "d", sites: [] }],
    });
    expect(IgChromeSchema.safeParse(none).success).toBe(false);
  });
});

describe("tokensByPackage", () => {
  test("counts what each layer actually WON, not what it declared", () => {
    const c = chrome({
      tokens: [
        { name: "--a", value: "1", from: "who.template.root", overrides: [{ package: "fhir.base.template", value: "0" }] },
        { name: "--b", value: "2", from: "who.template.root", overrides: [] },
        { name: "--c", value: "3", from: "fhir.base.template", overrides: [] },
      ],
    });
    // `--a` was declared by BOTH and is counted once, to the winner.
    expect(tokensByPackage(c)).toEqual({ "who.template.root": 2, "fhir.base.template": 1 });
  });
});

describe("chromeCss", () => {
  test("never emits a bare `:root` — these pages are ours, not the IG's", () => {
    const css = chromeCss(chrome(), ".st-ig");
    expect(css).toContain(".st-ig {");
    expect(css).not.toMatch(/(^|[\s,}]):root\s*\{/);
  });

  test("a conflicted token is EMITTED with a note, never dropped", () => {
    const c = chrome({
      tokens: [{ name: "--toc-box-border", value: "navy", from: "who.template.root", overrides: [] }],
      conflicts: [
        {
          token: "--toc-box-border",
          kind: "shape",
          detail: "two shapes",
          sites: [
            { package: "fhir.base.template", value: "1px solid navy" },
            { package: "who.template.root", value: "navy" },
          ],
        },
      ],
    });
    const css = chromeCss(c, ".st-ig");
    // Dropping it would make our page differ from the IG invisibly, which is
    // worse than reproducing a rule the upstream also gets wrong.
    expect(css).toContain("--toc-box-border: navy;");
    expect(css).toContain("shape conflict");
  });

  test("a mirrored rule is scoped too, so `#publish-box` cannot escape onto the site", () => {
    const c = chrome({
      rules: [
        {
          selector: "#publish-box",
          from: "fhir.base.template",
          declarations: [{ property: "background-color", value: "var(--publish-box-bg-color)" }],
        },
      ],
    });
    expect(chromeCss(c, ".st-ig")).toContain(".st-ig #publish-box {");
  });
});

describe("tokenOf", () => {
  test("finds a token, and returns undefined rather than a default for one that is absent", () => {
    expect(tokenOf(chrome(), "--navbar-bg-color")?.value).toBe("#00477d");
    expect(tokenOf(chrome(), "--nope")).toBeUndefined();
  });
});

describe("chromeFileFor", () => {
  const deps = (roots: string[], names: Record<string, string>, dirs: Record<string, string[]>, files: string[]) => ({
    instanceRootsIn: () => roots,
    declarationNameOf: (r: string) => names[r],
    directoriesForGraph: (r: string) => dirs[r] ?? [],
    exists: (p: string) => files.includes(p),
    join: (...parts: string[]) => parts.join("/"),
  });

  test("resolves through the DECLARATION, so a directory that moves moves for every reader", () => {
    const found = chromeFileFor(
      "/repo",
      "smart-base",
      // The declared directory is `somewhere-else/`, not `fhir-artifact-index/`.
      // A path literal would have missed it — which is the `ylj7` defect.
      deps(["/repo/sb"], { "/repo/sb": "smart-base" }, { "/repo/sb": ["/repo/sb/somewhere-else"] }, [
        "/repo/sb/somewhere-else/chrome.json",
      ]),
    );
    expect(found).toBe("/repo/sb/somewhere-else/chrome.json");
  });

  test("ignores an instance with the same DIRECTORY but a different name", () => {
    const found = chromeFileFor(
      "/repo",
      "smart-base",
      deps(["/repo/st"], { "/repo/st": "smart-trust" }, { "/repo/st": ["/repo/st/fhir-artifact-index"] }, [
        "/repo/st/fhir-artifact-index/chrome.json",
      ]),
    );
    expect(found).toBeUndefined();
  });

  test("a declared directory with no chrome.json yields undefined, not a path that does not exist", () => {
    const found = chromeFileFor(
      "/repo",
      "smart-base",
      deps(["/repo/sb"], { "/repo/sb": "smart-base" }, { "/repo/sb": ["/repo/sb/fhir-artifact-index"] }, []),
    );
    expect(found).toBeUndefined();
  });
});
