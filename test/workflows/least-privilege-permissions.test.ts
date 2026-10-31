/**
 * Least-privilege defaults for workflows that run on dispatch — bean
 * `folio-assistant-aso6`, litlfred/folio-assistant#2826.
 *
 * Each workflow below declares a top-level `permissions: contents: read`, so
 * a job that does not set its own gets a read-only token. The deploy workflow
 * also runs only on main and only through the `production` environment, where
 * required reviewers and branch rules can be set.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DIR = join(resolve(import.meta.dir, "../.."), ".github", "workflows");
interface Job { if?: string; environment?: string | { name?: string }; permissions?: Record<string, string> }
interface Doc { permissions?: Record<string, string> | string; jobs: Record<string, Job> }
const read = (f: string) => Bun.YAML.parse(readFileSync(join(DIR, f), "utf-8")) as Doc;

describe("read-only default token", () => {
  for (const f of ["deploy-folio.yml", "pyhecke.yml", "pyodide-smoke.yml", "pyhecke-native-wheels.yml"]) {
    test(`${f} declares permissions: contents: read at the top`, () => {
      expect(read(f).permissions).toEqual({ contents: "read" });
    });
  }

  test("the wheel publish jobs keep their own, narrower grants", () => {
    const jobs = read("pyhecke-native-wheels.yml").jobs;
    expect(jobs.build_wheels!.permissions).toBeUndefined();
    expect(jobs.publish_release!.permissions).toEqual({ contents: "write" });
    expect(jobs.publish_testpypi!.permissions).toEqual({ "id-token": "write" });
    expect(jobs.publish_pypi!.permissions).toEqual({ "id-token": "write" });
  });
});

describe("deploy-folio runs only on main, through an environment", () => {
  const jobs = read("deploy-folio.yml").jobs;
  test("every job is gated on main and on the production environment", () => {
    for (const j of Object.values(jobs)) {
      expect(j.if).toContain("github.ref == 'refs/heads/main'");
      const env = typeof j.environment === "string" ? j.environment : j.environment?.name;
      expect(env).toBe("production");
    }
  });
});

describe("every workflow declares a top-level permissions block (bean folio-assistant-aso6)", () => {
  test("no workflow in .github/workflows/ omits top-level permissions", () => {
    const { readdirSync } = require("node:fs") as typeof import("node:fs");
    const missing: string[] = [];
    for (const f of readdirSync(DIR).filter((n) => /\.ya?ml$/.test(n)).sort()) {
      const doc = read(f);
      if (doc.permissions === undefined) missing.push(f);
    }
    expect(missing).toEqual([]);
  });
});

describe("sage container image is pinned by @sha256: digest (bean folio-assistant-vbhb)", () => {
  test(".mcp.json pins SAGE_DOCKER_IMAGE by sha256 digest", () => {
    const mcp = JSON.parse(readFileSync(join(resolve(import.meta.dir, "../.."), ".mcp.json"), "utf-8")) as {
      mcpServers?: { sage?: { env?: { SAGE_DOCKER_IMAGE?: string } } };
    };
    const img = mcp.mcpServers?.sage?.env?.SAGE_DOCKER_IMAGE ?? "";
    expect(img).toMatch(/^sagemath\/sagemath@sha256:[0-9a-f]{64}$/);
  });
});
