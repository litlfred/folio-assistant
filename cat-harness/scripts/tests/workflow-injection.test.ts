/**
 * Workflow expression injection, falsified.
 *
 * Every case here produces a GREEN workflow run. Nothing about an injected
 * `${{ }}` looks wrong from CI's output — the step succeeds, because executing
 * the attacker's command IS success as far as bash is concerned.
 */

import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { classify, resolveProvenance, scanWorkflows, yieldsOnlyLiterals } from "../check-workflow-injection.ts";

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
    // `steps.*.outputs` is here in the ONE-ARGUMENT form only: with no
    // provenance, the expression text genuinely says nothing about what the
    // step wrote. The scanner always passes provenance — see below.
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

describe("a step output CARRIES whatever the step put in it (bean `6bhf`)", () => {
  // Live in this repository, not hypothetical: `release-folio-assistant.yml`
  // bound `github.event.inputs.version` to env correctly, wrote it to
  // `$GITHUB_OUTPUT`, and a later step interpolated the output into
  // `mv *.tgz "folio-assistant-….tgz"`. The gate saw `steps.*.outputs` and said
  // nothing. A dispatch of `1.0";id;"` ran `id`.
  const launderer = [
    "jobs:",
    "  release:",
    "    steps:",
    "      - name: Determine version",
    "        id: version",
    "        env:",
    "          INPUT_VERSION: ${{ github.event.inputs.version }}",
    "        run: |",
    '          echo "version=$INPUT_VERSION" >> "$GITHUB_OUTPUT"',
    "      - name: Pack",
    "        run: |",
    '          mv *.tgz "folio-assistant-${{ steps.version.outputs.version }}.tgz"',
    "",
  ].join("\n");

  test("the producing step is recorded as carrying free text, keyed job.stepId", () => {
    const prov = resolveProvenance(launderer.split("\n"));
    expect(prov.get("release.version")).toBe("free-text");
  });

  test("the consumption is FREE TEXT, and the finding names the step that leaked", () => {
    const f = scanWorkflows(workflows(launderer));
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe("free-text");
    // Without `via` the reader looks at a line whose expression is harmless.
    expect(f[0].via).toBe("release.version");
  });

  test("a step that writes an output but binds nothing is NOT a producer", () => {
    // Over-tainting costs an `env:` line, so the rule is deliberately coarse —
    // but it must still be a rule about the value, not about writing outputs.
    const prov = resolveProvenance(
      [
        "jobs:",
        "  a:",
        "    steps:",
        "      - id: plain",
        "        run: |",
        '          echo "n=3" >> "$GITHUB_OUTPUT"',
        "",
      ].join("\n").split("\n"),
    );
    expect([...prov]).toEqual([]);
  });

  test("a step that binds free text but writes NO output is not a producer either", () => {
    const prov = resolveProvenance(
      [
        "jobs:",
        "  a:",
        "    steps:",
        "      - id: quiet",
        "        env:",
        "          B: ${{ github.event.pull_request.body }}",
        "        run: |",
        '          echo "$B" > /tmp/x',
        "",
      ].join("\n").split("\n"),
    );
    expect([...prov]).toEqual([]);
  });

  test("the taint is JOB-scoped — step outputs are, so two jobs may reuse an id", () => {
    const f = scanWorkflows(
      workflows(
        [
          "jobs:",
          "  dirty:",
          "    steps:",
          "      - id: v",
          "        env:",
          "          T: ${{ github.event.inputs.tag }}",
          "        run: |",
          '          echo "x=$T" >> "$GITHUB_OUTPUT"',
          "  clean:",
          "    steps:",
          "      - id: v",
          "        run: |",
          '          echo "x=3" >> "$GITHUB_OUTPUT"',
          "      - run: |",
          '          echo "${{ steps.v.outputs.x }}"',
          "",
        ].join("\n"),
      ),
    );
    // `clean.v` wrote a literal. Keying on the bare id would have borrowed
    // `dirty.v`'s taint and reported a step that is fine.
    expect(f).toEqual([]);
  });

  test("a job output is followed one more hop, so `needs.*.outputs.*` inherits", () => {
    const f = scanWorkflows(
      workflows(
        [
          "jobs:",
          "  setup:",
          "    outputs:",
          "      sel: ${{ steps.pick.outputs.sel }}",
          "    steps:",
          "      - id: pick",
          "        env:",
          "          P: ${{ inputs.package }}",
          "        run: |",
          '          echo "sel=$P" >> "$GITHUB_OUTPUT"',
          "  use:",
          "    steps:",
          "      - run: |",
          '          echo "${{ needs.setup.outputs.sel }}"',
          "",
        ].join("\n"),
      ),
    );
    expect(f.map((i) => [i.severity, i.via])).toEqual([["free-text", "setup.sel"]]);
  });

  test("the SAME laundered output in `env:` is still not reported — env is the remedy", () => {
    // The fix for all four real sites was exactly this. If the gate flagged it
    // there would be nowhere left to go.
    const f = scanWorkflows(
      workflows(
        [
          "jobs:",
          "  release:",
          "    steps:",
          "      - id: version",
          "        env:",
          "          I: ${{ github.event.inputs.version }}",
          "        run: |",
          '          echo "version=$I" >> "$GITHUB_OUTPUT"',
          "      - env:",
          "          VERSION: ${{ steps.version.outputs.version }}",
          "        run: |",
          '          mv *.tgz "folio-assistant-$VERSION.tgz"',
          "",
        ].join("\n"),
      ),
    );
    expect(f).toEqual([]);
  });

  test("the real corpus is parsed, not skipped — an empty map would make this gate vacuous", () => {
    // `could not determine` is never rendered as clean. If the step walker
    // breaks, every `steps.*.outputs` silently returns to the safe band and
    // this gate goes green having asked nothing. Should this repository ever
    // genuinely have no such producer, say so deliberately rather than by
    // deleting the guard.
    const dir = join(import.meta.dir, "..", "..", "..", ".github", "workflows");
    const found = readdirSync(dir)
      .filter((f) => /\.ya?ml$/.test(f))
      .map((f) => resolveProvenance(readFileSync(join(dir, f), "utf-8").split("\n")));
    const producers = found.reduce((n, m) => n + m.size, 0);
    expect(producers).toBeGreaterThan(0);
  });
});
