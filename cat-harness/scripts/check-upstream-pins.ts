#!/usr/bin/env bun
/**
 * Has a pinned upstream dependency fallen behind a release?
 *
 * ```sh
 * bun run check:upstream-pins              # table, exit 1 behind / 2 unknown
 * bun run check:upstream-pins --markdown   # the tracking issue's body, always exit 0
 * bun run check:upstream-pins --out <file> # write the markdown AND keep the exit code
 * ```
 *
 * `git ls-remote --tags` per row. Nothing is cloned and no token is needed, so
 * this runs identically on a laptop and in CI — unlike an API-backed check,
 * which would be rate-limited at session start and would fail differently in
 * the two places.
 *
 * `--markdown` always exits 0 and `--out` keeps the code, for the same reason
 * `check-ci-health.ts` splits them: a notifier that both prints the report and
 * signals failure through its exit status cannot be used by a caller that
 * treats non-zero as "could not produce a report".
 *
 * @module scripts/check-upstream-pins
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { assessPin, exitCode, readPin, render, type PinDef, type PinVerdict } from "../src/upstream/pins.js";
import { repoRootFor } from "../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "..");
const argv = process.argv.slice(2);
const markdown = argv.includes("--markdown");
const outIdx = argv.findIndex((a) => a === "--out" || a.startsWith("--out="));
const outFile =
  outIdx === -1
    ? undefined
    : argv[outIdx].startsWith("--out=")
      ? argv[outIdx].slice("--out=".length)
      : argv[outIdx + 1];
if (outIdx !== -1 && !outFile) {
  console.error("--out needs a file path");
  process.exit(2);
}

const registryPath = join(repoRootFor(ROOT), "upstream-pins.json");
if (!existsSync(registryPath)) {
  // Absent registry is `unknown`, not "nothing to watch". A declaration that
  // vanished looks identical to one that never existed, and this check is the
  // only thing standing between a pin and silent staleness.
  console.error(`upstream-pins.json not found at ${registryPath} — cannot tell whether any pin is stale.`);
  process.exit(2);
}

const pins: PinDef[] = JSON.parse(readFileSync(registryPath, "utf8")).pins ?? [];

/** Upstream's tag names, or `undefined` when the remote could not be read. */
function remoteTags(repo: string): string[] | undefined {
  try {
    const out = execFileSync("git", ["ls-remote", "--tags", "--refs", repo], {
      encoding: "utf8",
      timeout: 60_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return out
      .split("\n")
      .map((l) => l.split("refs/tags/")[1]?.trim())
      .filter((t): t is string => Boolean(t));
  } catch {
    return undefined;
  }
}

const verdicts: PinVerdict[] = pins.map((pin) => {
  const abs = join(ROOT, pin.pinnedIn);
  const text = existsSync(abs) ? readFileSync(abs, "utf8") : undefined;
  const pinned = text === undefined ? undefined : readPin(text, pin.pattern);
  return assessPin(pin, pinned, remoteTags(pin.repo));
});

const report = render(verdicts);
if (outFile) writeFileSync(outFile, `${report}\n`);
console.log(report);

const code = exitCode(verdicts);
if (markdown) process.exit(0);
if (code === 2) {
  console.error("\nAt least one pin could NOT be determined. That is not `current`.");
}
process.exit(code);
