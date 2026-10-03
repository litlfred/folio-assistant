import { describe, expect, it } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OpenApiConfigSchema, fallbackOperationId, operationsOf, type OpenApiDocument } from "../schemas/openapi.ts";
import { checkCommitted } from "./ingest-openapi.ts";
import { PAGE_CONFIG_ID, pagesFor } from "./gen-openapi-pages.ts";
import { thinPageConfigOf } from "../../cat-harness/scripts/thin-page.ts";

const ROOT = join(import.meta.dir, "..", "..");
const doc = (paths: OpenApiDocument["paths"]): OpenApiDocument => ({ openapi: "3.0.1", info: { title: "T", version: "1" }, paths });

describe("operationsOf", () => {
  it("uses the document's operationId, in path order then OpenAPI's method order", () => {
    const ops = operationsOf(doc({ "/a": { post: { operationId: "makeA" }, get: { operationId: "getA" } }, "/b": { delete: {} } }));
    expect(ops.map((o) => [o.id, o.method])).toEqual([["getA", "get"], ["makeA", "post"], ["delete-b", "delete"]]);
    expect(ops[2]!.declaredId).toBe(false);
  });

  it("derives a filename-safe id when there is no operationId", () => {
    expect(fallbackOperationId("get", "/trustList/{type}/{country}")).toBe("get-trustList-type-country");
    expect(fallbackOperationId("get", "/")).toBe("get-root");
  });

  it("refuses two operations that would share an id rather than suffixing one", () => {
    expect(() => operationsOf(doc({ "/a": { get: { operationId: "x" } }, "/b": { get: { operationId: "x" } } }))).toThrow(/share the id "x"/);
  });

  it("ignores path-item keys that are not operations (parameters, summary)", () => {
    expect(operationsOf(doc({ "/a": { parameters: [], summary: "s", get: {} } })).map((o) => o.id)).toEqual(["get-a"]);
  });
});

describe("cat-openapi.config.json", () => {
  it("smart-trust's config parses", () => {
    expect(OpenApiConfigSchema.safeParse(JSON.parse(readFileSync(join(ROOT, "smart-trust", "cat-openapi.config.json"), "utf8"))).success).toBe(true);
  });

  it("refuses a document id declared twice", () => {
    const d = { id: "x", source: { repository: "o/r", path: "p.json" } };
    expect(OpenApiConfigSchema.safeParse({ $schema: "cat-openapi-config/v1", directory: "d", documents: [d, d] }).success).toBe(false);
  });
});

describe("the committed smart-trust gateway API", () => {
  it("is held and matches its provenance", () => {
    expect(checkCommitted(join(ROOT, "smart-trust"))).toEqual([]);
  });

  it("a hand edit to the document is caught", () => {
    const dir = mkdtempSync(join(tmpdir(), "openapi-"));
    try {
      const inst = join(dir, "smart-trust");
      cpSync(join(ROOT, "smart-trust", "smart-trust.json"), join(inst, "smart-trust.json"));
      cpSync(join(ROOT, "smart-trust", "cat-openapi.config.json"), join(inst, "cat-openapi.config.json"));
      cpSync(join(ROOT, "smart-trust", "openapi"), join(inst, "openapi"), { recursive: true });
      const f = join(inst, "openapi", "gateway.openapi.json");
      writeFileSync(f, readFileSync(f, "utf8").replace("Uploads Trusted Certificate", "Uploads A Certificate"));
      expect(checkCommitted(inst).join("\n")).toMatch(/does not match its provenance/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("pages", () => {
  const files = pagesFor(join(ROOT, "smart-trust"));
  const pages = files.filter((f) => f.path.endsWith("/index.html"));

  it("one page per operation, plus the document's", () => {
    const ops = JSON.parse(files.find((f) => f.path === "gateway.jsonld")!.content)["hydra:supportedOperation"];
    expect(ops.length).toBe(22);
    expect(pages.length).toBe(ops.length + 1);
  });

  it("every operation's @id is the address of its own JSON-LD", () => {
    for (const f of files.filter((x) => /^gateway\/[^/]+\.jsonld$/.test(x.path))) {
      expect(JSON.parse(f.content)["@id"]).toBe(`https://litlfred.github.io/folio-assistant/smart-trust/openapi/${f.path}`);
    }
  });

  it("a page copies nothing of the API: its config names the document relative to itself", () => {
    for (const p of pages) {
      const cfg = thinPageConfigOf(p.content, PAGE_CONFIG_ID)!;
      const depth = p.path.split("/").length - 1;
      expect(cfg.openapi).toBe(`${"../".repeat(depth)}gateway.openapi.json`);
      expect(p.content).not.toContain("Base64 encoded CMS");
    }
  });
});
