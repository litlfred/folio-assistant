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
    id: "acme.template.root",
    version: "0.5.0",
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
    tokens: [{ name: "--navbar-bg-color", value: "#00477d", from: "acme.template.root", overrides: [] }],
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
        { name: "--a", value: "1", from: "acme.template.root", overrides: [{ package: "fhir.base.template", value: "0" }] },
        { name: "--b", value: "2", from: "acme.template.root", overrides: [] },
        { name: "--c", value: "3", from: "fhir.base.template", overrides: [] },
      ],
    });
    // `--a` was declared by BOTH and is counted once, to the winner.
    expect(tokensByPackage(c)).toEqual({ "acme.template.root": 2, "fhir.base.template": 1 });
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
      tokens: [{ name: "--toc-box-border", value: "navy", from: "acme.template.root", overrides: [] }],
      conflicts: [
        {
          token: "--toc-box-border",
          kind: "shape",
          detail: "two shapes",
          sites: [
            { package: "fhir.base.template", value: "1px solid navy" },
            { package: "acme.template.root", value: "navy" },
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
      "acme-base",
      // The declared directory is `somewhere-else/`, not `fhir-artifact-index/`.
      // A path literal would have missed it — which is the `ylj7` defect.
      deps(["/repo/sb"], { "/repo/sb": "acme-base" }, { "/repo/sb": ["/repo/sb/somewhere-else"] }, [
        "/repo/sb/somewhere-else/chrome.json",
      ]),
    );
    expect(found).toBe("/repo/sb/somewhere-else/chrome.json");
  });

  test("ignores an instance with the same DIRECTORY but a different name", () => {
    const found = chromeFileFor(
      "/repo",
      "acme-base",
      deps(["/repo/st"], { "/repo/st": "acme-ig" }, { "/repo/st": ["/repo/st/fhir-artifact-index"] }, [
        "/repo/st/fhir-artifact-index/chrome.json",
      ]),
    );
    expect(found).toBeUndefined();
  });

  test("a declared directory with no chrome.json yields undefined, not a path that does not exist", () => {
    const found = chromeFileFor(
      "/repo",
      "acme-base",
      deps(["/repo/sb"], { "/repo/sb": "acme-base" }, { "/repo/sb": ["/repo/sb/fhir-artifact-index"] }, []),
    );
    expect(found).toBeUndefined();
  });

  test("a PATH reaches an instance the one-level scan cannot: the platform as a submodule in a fork (n3ni stage E)", () => {
    // In an IG fork the platform is a submodule, so the chrome's owner sits two levels down.
    const d = deps(
      ["/fork/platform", "/fork/ig-data"],
      { "/fork/platform": "platform", "/fork/ig-data": "some-ig", "/fork/platform/base-harness": "base-harness" },
      { "/fork/platform/base-harness": ["/fork/platform/base-harness/themes"] },
      ["/fork/platform/base-harness/themes/chrome.json"],
    );
    expect(chromeFileFor("/fork", "base-harness", d)).toBeUndefined();
    expect(chromeFileFor("/fork", "platform/base-harness", d)).toBe("/fork/platform/base-harness/themes/chrome.json");
  });

  test("a path to a directory that declares no instance yields undefined, never a guess", () => {
    const d = deps([], {}, {}, ["/fork/nowhere/themes/chrome.json"]);
    expect(chromeFileFor("/fork", "nowhere", d)).toBeUndefined();
    expect(chromeFileFor("/fork", "x/nowhere", d)).toBeUndefined();
  });
});
