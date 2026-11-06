/**
 * Unit tests for `pipeline/language-trap-audit.ts` — LLM rhetorical trap detectors,
 * prose stripping, markdown report formatting, and `--write-sidecars` attestation preservation.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { instanceDeclarationFilename } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.js";
import {
  blockAttestationKey,
  entryIdentity,
  readCriteriaAttestations as readAttestations,
  writeCriteriaAttestations as writeAttestations,
  type CriteriaMap,
} from "@litlfred/cat-harness-tools/schemas/sdlc/qa-attestations.ts";
import { blockQaPath } from "@litlfred/cat-harness-tools/pipeline/qa-paths.ts";

import {
  CRITERIA,
  PROSE_KINDS,
  T,
  buildMd,
  findingsFor,
  parseKind,
  parseLabel,
  prose,
  sentences,
  wordCount,
  type Block,
} from "./language-trap-audit.ts";

function makeBlock(md: string, overrides: Partial<Block> = {}): Block {
  return {
    root: "sec-test",
    dir: "content/ch1",
    kind: "prose",
    label: "sec:test",
    mdPath: "content/ch1/sec-test.md",
    tsPath: "content/ch1/sec-test.ts",
    md,
    ts: 'export default prose({ label: "sec:test", body: "x" });\n',
    ...overrides,
  };
}

describe("language-trap-audit helpers", () => {
  test("parseKind and parseLabel extract builder kind and label from .ts source", () => {
    const ts = 'export default remark({\n  label: "rem:gauge-fixing",\n  title: "Gauge",\n});\n';
    expect(parseKind(ts)).toBe("remark");
    expect(parseLabel(ts)).toBe("rem:gauge-fixing");
    expect(PROSE_KINDS.includes("remark")).toBe(true);
    expect(PROSE_KINDS.includes("equation")).toBe(false);
  });

  test("prose strips math, code fences, inline code, tables, and markdown links", () => {
    const raw = [
      "First paragraph with [a link](https://example.com) and $x^2 + y^2 = z^2$.",
      "$$",
      "\\int_0^1 f(x) dx",
      "$$",
      "| col1 | col2 |",
      "| --- | --- |",
      "Final line of prose.",
    ].join("\n");
    const stripped = prose(raw);
    expect(stripped).toContain("a link");
    expect(stripped).not.toContain("https://example.com");
    expect(stripped).not.toContain("x^2");
    expect(stripped).not.toContain("col1");
    expect(stripped).toContain("Final line of prose.");
  });

  test("wordCount and sentences split prose cleanly", () => {
    expect(wordCount("One two three four.")).toBe(4);
    expect(wordCount("   ")).toBe(0);
    const sents = sentences("First sentence is here. Second sentence follows! Is there a third?");
    expect(sents).toHaveLength(3);
  });
});

describe("findingsFor across LLM rhetorical trap criteria", () => {
  test("detects trap-negation-contrast ('not a X, but Y')", () => {
    const hitBlock = makeBlock("The framework is not a mere approximation, but a complete reformulation of the dynamics.");
    const findings = findingsFor(hitBlock, "trap-negation-contrast");
    expect(findings).toHaveLength(1);
    expect(findings[0]!.result).toBe("fail");

    const cleanBlock = makeBlock("The framework provides a direct reformulation of the dynamics.");
    expect(findingsFor(cleanBlock, "trap-negation-contrast")[0]!.result).toBe("pass");
  });

  test("detects trap-rhetorical-pivot, trap-meta-commentary, trap-thesis-restatement, trap-performed-warmth, trap-superlative", () => {
    const text = [
      "The real question is whether the boundary condition determines the spectrum.",
      "It is worth noting that the operator is self-adjoint, and we emphasize its positivity.",
      "In summary, the resolvent is compact.",
      "We are excited to begin this journey with you, dear reader.",
      "This is a crucial and unprecedented property of the spectrum.",
    ].join(" ");
    const b = makeBlock(text);
    const failedIds = new Set(
      findingsFor(b)
        .filter((f) => f.result === "fail")
        .map((f) => f.criterion),
    );
    expect(failedIds.has("trap-rhetorical-pivot")).toBe(true);
    expect(failedIds.has("trap-meta-commentary")).toBe(true);
    expect(failedIds.has("trap-thesis-restatement")).toBe(true);
    expect(failedIds.has("trap-performed-warmth")).toBe(true);
    expect(failedIds.has("trap-superlative")).toBe(true);
  });

  test("detects trap-em-dash and trap-triples when density exceeds threshold", () => {
    const text =
      "Alpha — beta — gamma — delta — epsilon. " +
      "We study groups, rings, and fields; we analyze spaces, maps, and functors; we construct sheaves, schemes, and stacks.";
    const b = makeBlock(text);
    const failedIds = new Set(
      findingsFor(b)
        .filter((f) => f.result === "fail")
        .map((f) => f.criterion),
    );
    expect(failedIds.has("trap-em-dash")).toBe(true);
    expect(failedIds.has("trap-triples")).toBe(true);
  });

  test("detects trap-closing-aphorism and trap-nonspeakable", () => {
    const longSentence = Array.from({ length: 65 }, (_, i) => `word${i}`).join(" ") + ".";
    const text = [
      `First long sentence: ${longSentence}`,
      `Second long sentence: ${longSentence}`,
      "Ultimately, a proof is only as strong as its assumptions.",
    ].join(" ");
    const b = makeBlock(text);
    const failedIds = new Set(
      findingsFor(b)
        .filter((f) => f.result === "fail")
        .map((f) => f.criterion),
    );
    expect(failedIds.has("trap-closing-aphorism")).toBe(true);
    expect(failedIds.has("trap-nonspeakable")).toBe(true);
  });

  test("buildMd renders markdown summary with criteria table", () => {
    expect(CRITERIA.length).toBe(10);
    expect(T.dashMin).toBeGreaterThan(0);
    const b = makeBlock("The theory is not a heuristic, but a deduction.");
    const findings = findingsFor(b);
    const md = buildMd(findings, 1, "main", 25);
    expect(md).toContain("# Language-trap audit");
    expect(md).toContain("`trap-negation-contrast`");
  });
});

describe("language-trap-audit --write-sidecars attestation survival", () => {
  test("language-trap-audit --write-sidecars keeps both attestations when prior report is absent", () => {
    const parent = realpathSync(mkdtempSync(join(tmpdir(), "lang-trap-sidecar-")));
    const root = join(parent, "repo");
    try {
      mkdirSync(root);
      if (spawnSync("git", ["init", "-q"], { cwd: root }).status !== 0) {
        throw new Error("git init failed");
      }
      writeFileSync(
        join(root, instanceDeclarationFilename("probe")),
        JSON.stringify({
          name: "probe",
          description: "one folio directory",
          directories: [{ id: "folio", path: "content/", graphTypologies: ["folio"] }],
        }),
        "utf-8",
      );
      mkdirSync(join(root, "content", "ch1"), { recursive: true });
      const blockRoot = join(root, "content", "ch1", "blk");
      writeFileSync(`${blockRoot}.ts`, 'export default prose({ label: "sec:blk", body: "x" });\n');
      writeFileSync(`${blockRoot}.md`, "We are excited to begin this journey. Thank you, dear reader.\n");

      const adjudication = {
        field_hash: { md: "000000000000" },
        result: "pass" as const,
        reviewer: { kind: "agent" as const, id: "voice-editorial-review", version: "claude-opus-5" },
        reviewed_at: "2026-09-18T23:52:40.659Z",
        reviewed_sha: "339c01a7b8fb032ec02f807456a076bb4dceec78",
        notes: "Quoted speech — the author is showing an utterance, not speaking.",
      };
      const human = {
        ...adjudication,
        result: "fail" as const,
        reviewer: { kind: "human" as const, id: "owner" },
        notes: "Overruled.",
      };

      writeAttestations(root, blockAttestationKey(root, blockRoot), {
        "voice-emoji-content": [adjudication],
        "human-only-axis": [human],
      });

      const scriptPath = resolve(import.meta.dir, "language-trap-audit.ts");
      const r = spawnSync("bun", [scriptPath, join(root, "content"), "--write-sidecars", "--quiet"], {
        cwd: root,
        encoding: "utf-8",
        env: { ...process.env },
      });
      expect([0, 1]).toContain(r.status ?? -1);

      const report = JSON.parse(readFileSync(blockQaPath(root, blockRoot), "utf-8")) as { criteria: CriteriaMap };
      const all = Object.values(report.criteria).flat().map(entryIdentity);
      expect(all).toContain(entryIdentity(adjudication));
      expect(all).toContain(entryIdentity(human));

      const store = readAttestations(root, blockAttestationKey(root, blockRoot));
      expect(store.state).toBe("hit");
      if (store.state === "hit") {
        const held = Object.values(store.criteria).flat().map(entryIdentity);
        expect(held).toContain(entryIdentity(adjudication));
        expect(held).toContain(entryIdentity(human));
      }
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  }, 30_000);
});
