/**
 * `document-structure` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/schemas/document-structure.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the document structures
 * committed in the content instances' libraries, which only the checkout
 * holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

import { structureOf } from "../cat-harness/schemas/document-structure.ts";

/** The directory these tests were written in (`cat-harness/schemas/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/schemas");

const REPO = resolve(ORIGIN_DIR, "..", "..");

describe("structureOf reads every committed structure, each as its own variant", () => {
  // The whole premise of A+B: pdf-structure/v1 stays as it is. If any
  // committed file stops reading through the accessor, the premise is false.
  const files = spawnSync("git", ["ls-files", "*structure.json"], { cwd: REPO, encoding: "utf-8" })
    .stdout.split("\n")
    .filter((f) => f.endsWith("/structure.json"));

  test("there are committed files to read — the guard every assertion below needs", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  test("each reads as a declared variant, with that variant's locator", () => {
    // The whole premise of A+B: pdf-structure/v1 files read UNCHANGED as the
    // pdf variant (pages), and a notebook reads as the notebook variant
    // (cells). A file that reads as neither, or with the other's locator, is
    // the misreading this base exists to prevent.
    const bad: string[] = [];
    const want = { pdf: "pages", notebook: "cells", text: "lines" } as const;
    for (const f of files) {
      const s = structureOf(JSON.parse(readFileSync(join(REPO, f), "utf-8")));
      if ("reason" in s) bad.push(`${f}: ${s.reason}`);
      else if (s.sections.some((x) => x.locator.kind !== want[s.variant])) bad.push(`${f}: ${s.variant} with a foreign locator`);
    }
    expect(bad).toEqual([]);
  });

  test("every variant is present in the corpus, so none is vacuous", () => {
    const variants = new Set(
      files.map((f) => {
        const s = structureOf(JSON.parse(readFileSync(join(REPO, f), "utf-8")));
        return "reason" in s ? "unreadable" : s.variant;
      }),
    );
    expect([...variants].sort()).toEqual(["notebook", "pdf", "text"]);
  });
});
