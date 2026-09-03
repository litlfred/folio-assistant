import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, basename } from "path";
import { validateObjects } from "../../content/pipeline/validate";

/**
 * A chapter directory containing `blocks` as `.ts` + `.md` pairs, plus any
 * bare `sidecars` written with no manifest behind them.
 */
function chapter(blocks: string[], sidecars: string[] = []): string {
  const root = mkdtempSync(join(tmpdir(), "orphan-"));
  for (const b of blocks) {
    writeFileSync(
      join(root, `${b}.ts`),
      `export default { kind: "prose", label: "rem:${b}", title: "T", chapter: "c" };\n`,
    );
    writeFileSync(join(root, `${b}.md`), `Body of ${b}.\n`);
  }
  for (const s of sidecars) {
    writeFileSync(
      join(root, `${s}.qa.json`),
      JSON.stringify({ $schema: "block-qa/v1", label: `rem:${s}`, criteria: {} }),
    );
  }
  return root;
}

function orphanIssues(issues: Array<{ message: string }>) {
  return issues.filter((i) => i.message.includes("orphan QA sidecar"));
}

describe("no-orphan-sidecar", () => {
  test("flags a .qa.json whose .ts is gone", async () => {
    const dir = chapter(["alpha"], ["ghost"]);
    const { issues } = await validateObjects(dir);
    const found = orphanIssues(issues);
    expect(found.length).toBe(1);
    expect(found[0].message).toContain("ghost.qa.json");
    rmSync(dir, { recursive: true, force: true });
  });

  test("does not flag a sidecar that has its manifest", async () => {
    const dir = chapter(["alpha"], ["alpha"]);
    const { issues } = await validateObjects(dir);
    expect(orphanIssues(issues).length).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });

  test("clean chapter with no sidecars at all is fine", async () => {
    const dir = chapter(["alpha", "beta"]);
    const { issues } = await validateObjects(dir);
    expect(orphanIssues(issues).length).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });

  test("reports every orphan, not just the first", async () => {
    const dir = chapter(["alpha"], ["ghost-one", "ghost-two"]);
    const { issues } = await validateObjects(dir);
    expect(orphanIssues(issues).length).toBe(2);
    rmSync(dir, { recursive: true, force: true });
  });

  test("does not flag a paper-level audit artefact that shares the extension", async () => {
    // `qa-section-title-audit.ts` writes `content/<paper>/section-title-audit.qa.json`,
    // keyed by paper and chapter rather than by block. It has no `.ts` by
    // design, and four live in the qou corpus. Bean `qou-efzm` had them
    // recorded as orphans left behind by a deleted block; the file shape says
    // they were never blocks. Deleting them would destroy live audit state the
    // producing tool would rewrite.
    const dir = chapter(["alpha"]);
    writeFileSync(
      join(dir, "section-title-audit.qa.json"),
      JSON.stringify({ criterion: "voice-section-title-coherence", paper: "p", chapters: {} }),
    );
    const { issues } = await validateObjects(dir);
    expect(orphanIssues(issues).length).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });

  test("still flags a genuine orphan sitting beside a paper-level artefact", async () => {
    // The discriminator must not become a blanket exemption for the directory.
    const dir = chapter(["alpha"], ["ghost"]);
    writeFileSync(
      join(dir, "section-title-audit.qa.json"),
      JSON.stringify({ criterion: "voice-section-title-coherence", paper: "p", chapters: {} }),
    );
    const { issues } = await validateObjects(dir);
    const found = orphanIssues(issues);
    expect(found.length).toBe(1);
    expect(found[0].message).toContain("ghost.qa.json");
    rmSync(dir, { recursive: true, force: true });
  });

  test("flags an unparseable sidecar rather than excusing it", async () => {
    // Treating unreadable as "not a block sidecar" would let a real orphan
    // hide behind a truncated write, so the helper fails toward reporting.
    const dir = chapter(["alpha"]);
    writeFileSync(join(dir, "corrupt.qa.json"), "{ this is not json");
    const { issues } = await validateObjects(dir);
    const found = orphanIssues(issues);
    expect(found.length).toBe(1);
    expect(found[0].message).toContain("corrupt.qa.json");
    rmSync(dir, { recursive: true, force: true });
  });

  test("is an error, not a warning", async () => {
    // An audit report for a block that does not exist is not a style nit — it
    // can never be refreshed and it corrupts corpus counts.
    const dir = chapter(["alpha"], ["ghost"]);
    const { issues } = await validateObjects(dir);
    expect(orphanIssues(issues)[0]).toMatchObject({ level: "error" });
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("no-orphan-sidecar in chapter mode", () => {
  /**
   * Chapter mode passes an explicit `blockNames` list; flat mode passes null.
   * The first version of this check was gated on `blockNames === null`, which
   * made it a silent no-op for every real paper — the unit tests above all
   * exercise flat mode and passed regardless. This fixture pins the real path.
   */
  function chapterMode(blocks: string[], sidecars: string[]): string {
    const root = mkdtempSync(join(tmpdir(), "orphan-ch-"));
    const name = basename(root);
    for (const b of blocks) {
      writeFileSync(
        join(root, `${b}.ts`),
        `export default { kind: "prose", label: "rem:${b}", title: "T", chapter: "${name}" };\n`,
      );
      writeFileSync(join(root, `${b}.md`), `Body of ${b}.\n`);
    }
    for (const s of sidecars) {
      writeFileSync(
        join(root, `${s}.qa.json`),
        JSON.stringify({ $schema: "block-qa/v1", label: `rem:${s}`, criteria: {} }),
      );
    }
    // `<dirname>.ts` exporting a Chapter makes validateObjects take the
    // chapter branch, which supplies blockNames from the section manifest.
    writeFileSync(
      join(root, `${name}.ts`),
      `export default { title: "T", sections: [{ title: "S", blocks: ${JSON.stringify(blocks)} }] };\n`,
    );
    return root;
  }

  test("still flags an orphan when blockNames is supplied", async () => {
    const dir = chapterMode(["alpha"], ["ghost"]);
    const { issues } = await validateObjects(dir);
    const found = orphanIssues(issues);
    expect(found.length).toBe(1);
    expect(found[0].message).toContain("ghost.qa.json");
    rmSync(dir, { recursive: true, force: true });
  });

  test("a sidecar whose manifest exists but was not requested is not an orphan", async () => {
    // Orphanhood is about the .ts existing ON DISK, not about being in the
    // caller's subset.
    const dir = chapterMode(["alpha"], []);
    writeFileSync(
      join(dir, "beta.ts"),
      `export default { kind: "prose", label: "rem:beta", title: "T", chapter: "c" };\n`,
    );
    writeFileSync(join(dir, "beta.qa.json"), JSON.stringify({ criteria: {} }));
    const { issues } = await validateObjects(dir);
    expect(orphanIssues(issues).length).toBe(0);
    rmSync(dir, { recursive: true, force: true });
  });
});
