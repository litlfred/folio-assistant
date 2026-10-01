/**
 * This instance DECLARES the document adapter, and the harness finds it there.
 *
 * Until 2026-09-30 the harness named this directory itself —
 * `../folio-assistant-core/adapters/document/index.ts` in
 * `src/builtin-adapters.ts` — and its test asserted `layer: "core"`. The
 * dependency is inverted now (bean `p11x`): the declaration lives in
 * `folio-assistant-core.json`, so the assertion that document is THIS
 * instance's lives with it.
 */
import { describe, expect, test } from "bun:test";

import { BUILTIN_ADAPTERS, resolveBuiltinAdapter } from "../../../cat-harness/src/builtin-adapters.ts";
import { DocumentContentAdapter } from "./index.ts";

describe("document adapter declaration", () => {
  test("is discovered from this instance's declaration", () => {
    const doc = BUILTIN_ADAPTERS.find((a) => a.contentType === "document");
    expect(doc).toMatchObject({ instance: "folio-assistant-core", className: "DocumentContentAdapter" });
    expect(doc?.extends).toBeUndefined();
  });

  test("resolves to the class this directory exports", async () => {
    const r = await resolveBuiltinAdapter("document");
    expect(r.fallbackReason).toBeUndefined();
    expect(r.ctor).toBe(DocumentContentAdapter as never);
  });
});
