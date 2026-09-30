/**
 * An instance's release addresses, and the sync that keeps literal copies of
 * them at the declared version (owner, 2026-09-29: agent-facing IRIs carry the
 * full semver, person-facing ones the major).
 */
import { describe, expect, test } from "bun:test";

import { bootstrapRelease, releaseIri, releaseIris, tagCompatible } from "./release-iri";
import { rewrite } from "../scripts/iri-sync";

const R = releaseIris({ iriBase: "https://example.org/kg/", version: "2.3.4" })!;

describe("releaseIris", () => {
  test("agents read the full version, people the major", () => {
    expect(R.agent).toBe("https://example.org/kg/2.3.4/");
    expect(R.human).toBe("https://example.org/kg/v2/");
    expect(releaseIri(R, "schemas/x.schema.json", "agent")).toBe("https://example.org/kg/2.3.4/schemas/x.schema.json");
    expect(releaseIri(R, "/guide.html", "human")).toBe("https://example.org/kg/v2/guide.html");
  });

  test("no iriBase is no release; an iriBase without a semver version is refused", () => {
    expect(releaseIris({ version: "1.0.0" })).toBeUndefined();
    expect(() => releaseIris({ iriBase: "https://example.org/kg/", version: "v1" })).toThrow();
    expect(() => releaseIris({ iriBase: "https://example.org/kg/" })).toThrow();
  });

  test("bootstrap declares one, at the address its own repository owns", () => {
    const b = bootstrapRelease();
    expect(b.iriBase).toBe("https://litlfred.github.io/bootstrap/");
    expect(b.agent).toBe(`${b.iriBase}${b.version}/`);
  });
});

describe("tagCompatible — semver within one major", () => {
  test("same major reads, another major does not", () => {
    expect(tagCompatible("model-registry/1.9.0", "model-registry", 1)).toBe(true);
    expect(tagCompatible("model-registry/2.0.0", "model-registry", 1)).toBe(false);
    expect(tagCompatible("model-registry/v1", "model-registry", 1)).toBe(false);
    expect(tagCompatible("other/1.0.0", "model-registry", 1)).toBe(false);
  });
});

describe("iri-sync rewrite", () => {
  test("a stale version and a stale major move to the declared ones; the current ones stay", () => {
    const text = [
      'xmlns:a="https://example.org/kg/2.3.3/ns#"',
      'href="https://example.org/kg/v1/guide.html"',
      'current="https://example.org/kg/2.3.4/ns#"',
    ].join("\n");
    const r = rewrite(text, R);
    expect(r.changes).toBe(2);
    expect(r.text).toContain("https://example.org/kg/2.3.4/ns#");
    expect(r.text).toContain("https://example.org/kg/v2/guide.html");
    expect(r.text).not.toContain("2.3.3");
  });

  test("--from moves an old base's identifiers, and leaves the bare base alone", () => {
    const r = rewrite('a="https://old.example/b/processes/ns#x" b="https://old.example/b/"', R, "https://old.example/b/");
    expect(r.text).toBe('a="https://example.org/kg/2.3.4/processes/ns#x" b="https://old.example/b/"');
    expect(r.changes).toBe(1);
  });

  test("another base is never touched", () => {
    const text = 'x="https://example.org/other/1.0.0/ns#"';
    expect(rewrite(text, R)).toEqual({ text, changes: 0 });
  });
});

describe("a toolset supports content by major version", () => {
  test("listed majors are supported, others refused; no range syntax", async () => {
    const { supportsContent } = await import("./declaration.ts");
    const tools = { supports: { bootstrap: [0, 2] } };
    expect(supportsContent(tools, "bootstrap", "0.9.1")).toBe(true);
    expect(supportsContent(tools, "bootstrap", "2.0.0")).toBe(true);
    expect(supportsContent(tools, "bootstrap", "1.0.0")).toBe(false);
    expect(supportsContent(tools, "other", "0.1.0")).toBe(false);
    expect(supportsContent({}, "bootstrap", "0.1.0")).toBe(false);
  });
});
