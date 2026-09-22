/**
 * Workflow expression injection, falsified.
 *
 * Every case here produces a GREEN workflow run. Nothing about an injected
 * `${{ }}` looks wrong from CI's output — the step succeeds, because executing
 * the attacker's command IS success as far as bash is concerned.
 */

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { classify, scanWorkflows, yieldsOnlyLiterals } from "../check-workflow-injection.ts";

function workflows(body: string): string {
  const dir = mkdtempSync(join(tmpdir(), "injection-"));
  writeFileSync(join(dir, "w.yml"), body);
  return dir;
}

describe("classify", () => {
  test("free text is free text — a quote is all it takes", () => {
    for (const e of [
      "github.event.pull_request.title",
      "github.event.pull_request.body",
      "github.event.comment.body",
      "github.event.head_commit.message",
      "github.event.inputs.package",
      "inputs.anything",
    ]) {
      expect({ e, c: classify(e) }).toEqual({ e, c: "free-text" });
    }
  });

  test("attacker-chosen but shape-constrained is reported, not ignored", () => {
    // A git ref cannot contain a space, a quote or a semicolon; a PR number is
    // an integer. Neither carries the payload — but calling them SAFE would
    // assert a property of git this gate does not check.
    for (const e of ["github.head_ref", "github.event.pull_request.number", "github.event.repository.name"]) {
      expect({ e, c: classify(e) }).toEqual({ e, c: "constrained" });
    }
  });

  test("values the attacker does not influence are not reported at all", () => {
    for (const e of ["github.workspace", "steps.slug.outputs.branch", "matrix.package", "secrets.GITHUB_TOKEN"]) {
      expect({ e, c: classify(e) }).toEqual({ e, c: null });
    }
  });
});

describe("a comparison yielding literals is not an injection", () => {
  // Caught on this gate's FIRST run, against correct code in
  // `discussions-maintain.yml`. A gate whose first act is a false alarm on a
  // legitimate idiom trains people to route around it.
  test("the shell receives one of two constants, never the input", () => {
    expect(yieldsOnlyLiterals("inputs.force_rerender == true && '--force' || ''")).toBe(true);
    expect(classify("inputs.force_rerender == true && '--force' || ''")).toBeNull();
  });

  test("but a branch that IS an input still reports", () => {
    // The narrowness is the point: one literal branch does not launder the other.
    expect(yieldsOnlyLiterals("inputs.a == 'x' && inputs.b || ''")).toBe(false);
    expect(classify("inputs.a == 'x' && inputs.b || ''")).toBe("free-text");
  });

  test("a bare input with no comparison is not laundered", () => {
    expect(yieldsOnlyLiterals("inputs.package")).toBe(false);
  });
});

describe("scanWorkflows reads `run:` blocks and nothing else", () => {
  test("free text inside a run block is found, with its line", () => {
    const dir = workflows(
      ["jobs:", "  a:", "    steps:", "      - run: |", "          echo '${{ github.event.pull_request.body }}'", ""].join("\n"),
    );
    const f = scanWorkflows(dir);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe("free-text");
    expect(f[0].line).toBe(5);
  });

  test("the SAME expression in `env:` is not reported — env is the remedy", () => {
    // Flagging it would push people back toward interpolation, which is the
    // one thing this gate exists to stop.
    const dir = workflows(
      [
        "jobs:",
        "  a:",
        "    steps:",
        "      - env:",
        "          PR_BODY: ${{ github.event.pull_request.body }}",
        "        run: |",
        '          echo "$PR_BODY"',
        "",
      ].join("\n"),
    );
    expect(scanWorkflows(dir)).toEqual([]);
  });

  test("an expression in `with:` is not a shell injection and is not graded", () => {
    const dir = workflows(
      ["jobs:", "  a:", "    steps:", "      - uses: x@v1", "        with:", "          t: ${{ github.event.issue.title }}", ""].join("\n"),
    );
    expect(scanWorkflows(dir)).toEqual([]);
  });

  test("a one-line `run:` is scanned too, not just a block", () => {
    const dir = workflows(
      ["jobs:", "  a:", "    steps:", "      - run: echo '${{ github.event.comment.body }}'", ""].join("\n"),
    );
    expect(scanWorkflows(dir).map((i) => i.severity)).toEqual(["free-text"]);
  });
});
