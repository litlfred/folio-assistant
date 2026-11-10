import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AST_ZIP, draftRelease, type Gh, releaseAssets, releaseBody, releaseKind, SUMS } from "./ig-release.ts";

const build = (): { root: string; output: string; ast: string; out: string } => {
  const root = mkdtempSync(join(tmpdir(), "ig-release-test-"));
  const output = join(root, "output");
  const ast = join(root, "ast");
  mkdirSync(output);
  mkdirSync(join(ast, "resources"), { recursive: true });
  writeFileSync(join(output, "package.tgz"), "pkg");
  writeFileSync(join(output, "package.r4.tgz"), "r4");
  writeFileSync(join(output, "full-ig.zip"), "not carried");
  writeFileSync(join(ast, "manifest.json"), "{}");
  writeFileSync(join(ast, "resources", "Library-x.json"), '{"content":[{"contentType":"application/elm+json"}]}');
  return { root, output, ast, out: join(root, "release") };
};

describe("ig-release", () => {
  test("kindFromSushiConfig", () => {
    expect(releaseKind({ version: "1.0.0", releaseLabel: "STU1" })).toBe("release");
    expect(releaseKind({ version: "1.0.0", releaseLabel: "trial-use" })).toBe("release");
    expect(releaseKind({ version: "1.0.0-ballot" })).toBe("prerelease");
    expect(releaseKind({ version: "0.2.0", releaseLabel: "ci-build" })).toBe("prerelease");
    expect(releaseKind({ version: "0.2.0", releaseLabel: "Draft for comment" })).toBe("prerelease");
  });

  test("gathersPackagesAndAst", () => {
    const b = build();
    const before = statSync(join(b.ast, "manifest.json")).mtimeMs;
    const a = releaseAssets(b);
    expect(a.map((x) => x.name)).toEqual(["package.tgz", "package.r4.tgz", AST_ZIP]);
    expect(readFileSync(join(b.out, SUMS), "utf-8")).toContain(`  ${AST_ZIP}\n`);
    expect(statSync(join(b.ast, "manifest.json")).mtimeMs).toBe(before);
    // The same AST zips to the same bytes.
    const again = releaseAssets({ ...b, out: join(b.root, "again") });
    expect(again.find((x) => x.name === AST_ZIP)!.sha256).toBe(a.find((x) => x.name === AST_ZIP)!.sha256);
    rmSync(b.root, { recursive: true });
  });

  test("refusesBuildWithoutPackage", () => {
    const b = build();
    rmSync(join(b.output, "package.tgz"));
    expect(() => releaseAssets(b)).toThrow(/no package.tgz/);
    rmSync(b.root, { recursive: true });
  });

  test("bodyListsFilesAndAuthorisation", () => {
    const body = releaseBody("v1.0.0", [{ name: "package.tgz", bytes: 2_000_000, sha256: "ab" }], true);
    expect(body).toContain("pre-release");
    expect(body).toContain("| `package.tgz` | 2.0 MB | `ab` |");
    expect(body).toContain("draft-to-publication.bpmn");
  });

  test("makesDraftAndUploads", () => {
    const b = build();
    releaseAssets(b);
    const calls: string[][] = [];
    const sent: (string | undefined)[] = [];
    const call: Gh = (args, input) => {
      calls.push(args);
      sent.push(input);
      if (args[0] === "repos/o/r/releases?per_page=100") return { status: 0, out: "[]" };
      if (args[1] === "POST" && args[2] === "repos/o/r/releases") return { status: 0, out: JSON.stringify({ id: 7, draft: true, upload_url: "https://uploads.github.com/repos/o/r/releases/7/assets{?name,label}", assets: [] }) };
      return { status: 0, out: "{}" };
    };
    const log = draftRelease({ repo: "o/r", tag: "v1.0.0", dir: b.out, prerelease: false }, call);
    expect(log[0]).toBe("made a draft for v1.0.0");
    expect(JSON.parse(sent[1]!)).toMatchObject({ tag_name: "v1.0.0", draft: true, prerelease: false });
    expect(calls.filter((c) => c[2]?.startsWith("https://uploads.github.com/repos/o/r/releases/7/assets?name=")).map((c) => c[2]!.split("name=")[1])).toEqual(["package.tgz", "package.r4.tgz", AST_ZIP, SUMS]);
    rmSync(b.root, { recursive: true });
  });

  test("refusesPublishedRelease", () => {
    const b = build();
    releaseAssets(b);
    const call: Gh = () => ({ status: 0, out: JSON.stringify([{ id: 1, tag_name: "v1.0.0", draft: false, upload_url: "", assets: [] }]) });
    expect(() => draftRelease({ repo: "o/r", tag: "v1.0.0", dir: b.out, prerelease: false }, call)).toThrow(/published release/);
    rmSync(b.root, { recursive: true });
  });

  test("refreshesExistingDraft", () => {
    const b = build();
    releaseAssets(b);
    const deleted: string[] = [];
    const call: Gh = (args) => {
      if (args[0] === "repos/o/r/releases?per_page=100") return { status: 0, out: JSON.stringify([{ id: 3, tag_name: "v1.0.0", draft: true, upload_url: "u{?name}", assets: [{ id: 9, name: "package.tgz" }, { id: 10, name: "notes.pdf" }] }]) };
      if (args[1] === "PATCH") return { status: 0, out: JSON.stringify({ id: 3, draft: true, upload_url: "u{?name}", assets: [] }) };
      if (args[1] === "DELETE") deleted.push(args[2]!);
      return { status: 0, out: "{}" };
    };
    expect(draftRelease({ repo: "o/r", tag: "v1.0.0", dir: b.out, prerelease: true }, call)[0]).toBe("refreshed the draft for v1.0.0");
    expect(deleted).toEqual(["repos/o/r/releases/assets/9"]);
    rmSync(b.root, { recursive: true });
  });
});
