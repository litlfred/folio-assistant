/**
 * This instance DECLARES the paper adapter, and the harness finds it there.
 *
 * Until 2026-09-30 the harness named this directory itself —
 * `../folio-assistant-sci/adapters/paper/index.ts` in `src/builtin-adapters.ts` —
 * and its test asserted `layer: "sci"`. The dependency is inverted now (bean
 * `p11x`): the declaration lives in `folio-assistant-sci.json`, so the
 * assertion that paper is THIS instance's lives with it, and the harness's own
 * test holds in a checkout of the harness alone.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as mainTex from "../../../cat-harness-tools/pipeline/generate-main-tex.ts";
import { resolveRenderTarget } from "../../../cat-harness-tools/pipeline/render-discovery.ts";
import * as builtinAdapters from "../../../cat-harness-tools/src/builtin-adapters.ts";
import {
  BUILTIN_ADAPTERS,
  resolveBuiltinAdapter,
} from "../../../cat-harness-tools/src/builtin-adapters.ts";
import { PAPER_PREAMBLE_PATH, PaperContentAdapter } from "./index.ts";

describe("paper adapter declaration", () => {
  test("is discovered from this instance's declaration, and leads as the superset", () => {
    const paper = BUILTIN_ADAPTERS.find((a) => a.contentType === "paper");
    expect(paper).toMatchObject({ instance: "folio-assistant-sci", className: "PaperContentAdapter", extends: "document" });
    // Falling back TO paper loses nothing; falling back FROM it loses Lean and TeX.
    expect(BUILTIN_ADAPTERS[0]?.contentType).toBe("paper");
  });

  test("resolves to the class this directory exports", async () => {
    const r = await resolveBuiltinAdapter("paper");
    expect(r.fallbackReason).toBeUndefined();
    expect(r.ctor).toBe(PaperContentAdapter as never);
  });

  test("supplies its print preamble template to generate-main-tex when --preamble is omitted (bean 4dj5)", async () => {
    expect(PaperContentAdapter.preamblePath).toBe(PAPER_PREAMBLE_PATH);
    expect(existsSync(PAPER_PREAMBLE_PATH)).toBe(true);
    const resolveAdapterPreamble = (
      builtinAdapters as { resolveAdapterPreamble?: (ct?: string) => Promise<string | undefined> }
    ).resolveAdapterPreamble;
    if (typeof resolveAdapterPreamble === "function") {
      expect(await resolveAdapterPreamble("paper")).toBe(PAPER_PREAMBLE_PATH);
      expect((await resolveRenderTarget("paper")).target?.preamblePath).toBe(PAPER_PREAMBLE_PATH);
    }
    const resolvePaperPreamble = (
      mainTex as { resolvePaperPreamble?: (explicit?: string) => Promise<string> }
    ).resolvePaperPreamble;
    if (typeof resolvePaperPreamble === "function") {
      expect(await resolvePaperPreamble()).toBe(PAPER_PREAMBLE_PATH);
    }
  });

  test("generate-main-tex CLI with no --preamble inlines the paper adapter's template (bean 4dj5)", () => {
    const resolvePaperPreamble = (
      mainTex as { resolvePaperPreamble?: (explicit?: string) => Promise<string> }
    ).resolvePaperPreamble;
    if (typeof resolvePaperPreamble !== "function") {
      // Lower layer (`cat-harness-tools`) checked out prior to 4dj5 merge;
      // verified directly by `cat-harness-tools/test/composition-roots.test.ts`.
      expect(existsSync(PAPER_PREAMBLE_PATH)).toBe(true);
      return;
    }
    const tmp = mkdtempSync(join(tmpdir(), "paper-preamble-cli-"));
    try {
      const chDir = join(tmp, "ch1");
      mkdirSync(chDir, { recursive: true });
      writeFileSync(
        join(chDir, "ch1.ts"),
        `export default { title: "Chapter One", sections: [] };\n`,
      );
      const paperTs = join(tmp, "sample-paper.ts");
      writeFileSync(
        paperTs,
        `export default {
  id: "sample-paper",
  title: "Sample Paper",
  authors: ["Test Author"],
  abstract: "Abstract text.",
  chapters: [{ number: 1, title: "Chapter One", dir: "ch1", sections: [] }],
};\n`,
      );
      const outTex = join(tmp, "main.tex");
      const cliPath = join(import.meta.dir, "../../../cat-harness-tools/pipeline/generate-main-tex.ts");
      const res = Bun.spawnSync(["bun", "run", cliPath, paperTs, "--out", outTex], {
        cwd: tmp,
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(res.exitCode).toBe(0);
      const generated = readFileSync(outTex, "utf-8");
      expect(generated).toContain("\\documentclass[11pt,a4paper]{report}");
      expect(generated).toContain("Sample Paper");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
