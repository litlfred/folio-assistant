/**
 * The base an export mints its `@id`s against belongs to the PUBLICATION,
 * not to the instance whose content is being exported.
 *
 * ## The failure these tests are cut from
 *
 * `docs-site.yml` ran red on `main` seven consecutive times on 2026-09-21 and
 * the fast gate set was green through every one of them; six merges landed
 * against that green. One command was failing — `kg-export.ts --instance
 * ./cat-bootstrap` — because `exportIdentity` had been given an
 * `instanceRoot` and let the base follow it.
 *
 * That is right for a separate repository and wrong for an instance with no
 * site of its own. Measured the same day: **one** of thirteen instances here
 * declares a `canonicalUrl`, so twelve would have failed the moment they were
 * published. `cat-bootstrap` was only the first one the deploy tried.
 *
 * ## Why the agreement matters rather than merely the exit code
 *
 * `skillHome` mints a link into a sibling's document with *this* export's
 * base. If the sibling's own document names itself by a different rule, the
 * IRI a consumer follows and the IRI it arrives at are two derivations of one
 * fact — and the assertion below pins them equal rather than pinning either
 * one to a literal.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { exportIdentity } from "../kg-export.js";
import { artefactStub, instanceConfigFilename, readDeclaration } from "../../schemas/cat-harness.js";

const REPO_ROOT = resolve(import.meta.dir, "..", "..", "..");
const HOST = join(REPO_ROOT, "cat-harness");
const NESTED = join(REPO_ROOT, "cat-bootstrap");

/** The host instance's declared base, read rather than written down here. */
function hostBase(): string {
  const decl = readDeclaration(HOST);
  const url = decl?.canonicalUrl;
  if (url === undefined) throw new Error("the host instance declares no canonicalUrl — this suite's premise is gone");
  return url.replace(/\/+$/, "");
}

describe("publicationBase", () => {
  test("a nested instance that declares no canonicalUrl inherits the host's", () => {
    // The premise, asserted rather than assumed: if cat-bootstrap ever gains
    // its own canonicalUrl this test is no longer about inheritance, and it
    // should say so loudly rather than pass for a new reason.
    expect(readDeclaration(NESTED)?.canonicalUrl).toBeUndefined();

    const id = exportIdentity({ instanceRoot: NESTED });
    expect(id.docIri).toBe(`${hostBase()}/${id.stub}.jsonld`);
    expect(id.docIri.startsWith("http")).toBe(true);
  });

  test("the inherited base is the SAME one this export links to it with", () => {
    // The assertion the deploy actually needs. `skillHome` resolves a foreign
    // skill to `exportIdentity({ baseUrl: base, instanceRoot }).docIri` — the
    // exporting document's base. Published on its own, that document must
    // name itself identically, or the link 404s with an `@id` in front of it.
    const asLinked = exportIdentity({ baseUrl: hostBase(), instanceRoot: NESTED }).docIri;
    const asPublished = exportIdentity({ instanceRoot: NESTED }).docIri;
    expect(asPublished).toBe(asLinked);
  });

  test("an explicit --base-url still wins, so a staged copy stays staged", () => {
    // feature-staging.yml passes one. If inheritance outranked it, every
    // branch preview's graph would claim to be the canonical document.
    const staged = "https://example.invalid/preview/pr-1";
    const id = exportIdentity({ baseUrl: staged, instanceRoot: NESTED });
    expect(id.docIri).toBe(`${staged}/${id.stub}.jsonld`);
    expect(id.isPreview).toBe(true);
    // ...and the canonical IRI it is a preview OF is the inherited one, which
    // is what makes `isPreview` mean anything for a nested instance at all.
    expect(id.canonicalIri).toBe(`${hostBase()}/${id.stub}.jsonld`);
  });

  test("an instance that declares its own base keeps it", () => {
    const id = exportIdentity({ instanceRoot: HOST });
    expect(id.docIri).toBe(`${hostBase()}/${id.stub}.jsonld`);
  });

  test("an instance OUTSIDE this repository keeps the third state", () => {
    // Here the fallback would be a guess: a sibling checkout is published, if
    // at all, somewhere this repository cannot know. A relative `@id` plus a
    // reported problem is the honest answer, and it is the behaviour that
    // existed before inheritance — deliberately unchanged.
    const dir = mkdtempSync(join(tmpdir(), "outside-instance-"));
    try {
      const name = "outsider";
      writeFileSync(
        join(dir, instanceConfigFilename(name)),
        JSON.stringify({ name, directories: [] }),
      );
      const decl = readDeclaration(dir);
      expect(decl?.name).toBe(name);

      const id = exportIdentity({ instanceRoot: dir });
      expect(id.stub).toBe(artefactStub(decl!));
      expect(id.docIri.startsWith("http")).toBe(false);
      expect(id.canonicalIri).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a sibling path sharing a prefix with the repo root is NOT inside it", () => {
    // `startsWith` would call `/repo-other` a child of `/repo`. The boundary
    // check is what keeps a neighbouring checkout from silently inheriting
    // this repository's base — the failure mode inheritance could introduce,
    // and the reason it is a path comparison rather than a string one.
    const sibling = `${REPO_ROOT}-other`;
    const dir = mkdtempSync(join(tmpdir(), "prefix-sibling-"));
    try {
      // The comparison is on the resolved path, so a directory that does not
      // exist is enough to test the boundary — nothing is read from it unless
      // it is judged inside.
      expect(sibling.startsWith(REPO_ROOT)).toBe(true);
      const id = exportIdentity({ instanceRoot: sibling });
      expect(id.docIri.startsWith("http")).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
