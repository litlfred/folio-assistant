/**
 * Bean `zdfa`: a folio linked to its platform as a SIBLING checkout
 * (`platform_dir: ../platform`) names a path outside the Actions workspace,
 * where `actions/checkout` cannot write. The reusable workflow checks the
 * platform out inside the workspace and links it to the path the folio names.
 *
 * These run the workflow's OWN step scripts, read from the YAML, against a
 * fake workspace, so a test cannot pass while the workflow says something else.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { parse } from "yaml";

const WORKFLOW = resolve(import.meta.dir, "../../../.github/workflows/folio-staging.yml");

interface Step { name?: string; id?: string; run?: string; with?: Record<string, string> }
const jobs = (parse(readFileSync(WORKFLOW, "utf8")) as { jobs: Record<string, { steps: Step[] }> }).jobs;

function step(job: string, name: string): Step {
  const s = jobs[job]!.steps.find((x) => x.name === name);
  if (!s) throw new Error(`${job} has no step '${name}'`);
  return s;
}

function outputs(file: string): Record<string, string> {
  return Object.fromEntries(
    readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
}

/** Run a step's script in `ws` as the runner would, returning its outputs. */
function run(script: string, ws: string, env: Record<string, string>): { status: number | null; out: Record<string, string>; stderr: string } {
  const out = join(mkdtempSync(join(tmpdir(), "gh-out-")), "out");
  writeFileSync(out, "");
  const r = spawnSync("bash", ["-e", "-c", script], { cwd: ws, env: { ...process.env, ...env, GITHUB_WORKSPACE: ws, GITHUB_OUTPUT: out }, stdio: "pipe" });
  return { status: r.status, out: outputs(out), stderr: r.stdout.toString() + r.stderr.toString() };
}

for (const job of ["stage", "publish-main"]) {
  describe(`${job}: where the platform is checked out (zdfa)`, () => {
    const locate = step(job, "Locate the platform");
    const link = step(job, "Link the platform where the folio names it");

    test("a sibling path is checked out inside the workspace, then linked where the folio names it", () => {
      const ws = join(realpathSync(mkdtempSync(join(tmpdir(), "runner-"))), "repo");
      mkdirSync(ws);
      const loc = run(locate.run!, ws, { PLATFORM_DIR: "../platform" });
      expect(loc.status).toBe(0);
      expect(loc.out).toMatchObject({ outside: "true", checkout: ".folio-platform", present: "false" });
      // The checkout step writes to the path the locate step chose.
      expect(step(job, "Check out the platform").with!.path).toBe("${{ steps.platform.outputs.checkout }}");
      // Simulate that checkout, then run the link step.
      mkdirSync(join(ws, ".folio-platform"));
      writeFileSync(join(ws, ".folio-platform", "marker"), "platform");
      const ln = run(link.run!, ws, { ABS: loc.out.abs! });
      expect(ln.status).toBe(0);
      // The folio's own relative path now reaches the platform, as it does locally.
      expect(readFileSync(join(ws, "../platform/marker"), "utf8")).toBe("platform");
    });

    test("a path inside the workspace is checked out where it is named, and not linked", () => {
      const ws = realpathSync(mkdtempSync(join(tmpdir(), "runner-")));
      const loc = run(locate.run!, ws, { PLATFORM_DIR: "folio-assistant" });
      expect(loc.out).toMatchObject({ outside: "false", checkout: "folio-assistant" });
    });

    test("the link step refuses to replace something already at the named path", () => {
      const ws = join(realpathSync(mkdtempSync(join(tmpdir(), "runner-"))), "repo");
      mkdirSync(ws);
      mkdirSync(join(ws, "../platform"));
      const ln = run(link.run!, ws, { ABS: resolve(ws, "../platform") });
      expect(ln.status).not.toBe(0);
      expect(ln.stderr).toContain("refusing to replace it");
      expect(existsSync(join(ws, ".folio-platform"))).toBe(false);
    });
  });
}
