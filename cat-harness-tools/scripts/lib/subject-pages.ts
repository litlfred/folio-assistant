/**
 * Where a knowledge-graph subject's own page is, for a generator that links
 * to it — the ⓘ panel and the call-activity links in rendered BPMN.
 *
 * @module scripts/lib/subject-pages
 *
 * Owner, 2026-10-23T14:57Z: *"the info button/icons in the bpmn rendering
 * should point to those new IRIs"* (litlfred/cat-harness-tools#603). The IRI
 * is `makeIri`'s, against the document of the instance that declares the
 * subject (`publishedIdentity`), so a link and the `@id` it names cannot
 * disagree. `kg-export`'s `writeSubjectDocuments` writes the page there.
 *
 * A link is answered ONLY where a page is written: the host's document and
 * every instance `instance-exports.ts` exports that mints against this site
 * (not its own `canonicalUrl`), and — since the owner's 2026-10-29 choice
 * on litlfred/cat-harness-tools#638 (option B) — the COPY this site publishes
 * of an own-canonical instance's subjects, `owl:sameAs` the canonical IRI.
 * bootstrap's graph is still
 * bootstrap-tools' `export-graph.ts`, which mints fragments until its own
 * phase of #603, so its subjects get `undefined` and the caller keeps the
 * link it had — never a slash path nothing serves.
 */
import { resolve } from "node:path";
import { findInstanceRoot, readDeclaration } from "../../schemas/kg/cat-harness.js";
import { makeIri, publishedIdentity } from "../kg-export.js";
import { declaresOwnCanonical, instanceDocPath, publishesInstanceSchema } from "../instance-exports.js";
import { HARNESS_ROOT } from "./roots.ts";

const docIris = new Map<string, string | undefined>();

/** The document IRI subjects of `instanceRoot` are minted against, when kg-export publishes their pages. */
function servingDocIri(instanceRoot: string): string | undefined {
  const key = resolve(instanceRoot);
  if (!docIris.has(key)) {
    let doc: string | undefined;
    try {
      const host = key === resolve(HARNESS_ROOT);
      const decl = readDeclaration(key);
      if (host || (publishesInstanceSchema(key) && !declaresOwnCanonical(decl))) {
        doc = publishedIdentity(key).docIri;
      } else if (publishesInstanceSchema(key) && decl !== undefined) {
        // An instance minting against its OWN `canonicalUrl` (e.g.
        // `http://smart.who.int/base`), which serves nothing yet: link the
        // copy `instance-exports` publishes on THIS site under `<name>/`
        // (#638 option B), never the canonical IRI.
        const stub = publishedIdentity(key).docPath.replace(/\.jsonld$/, "").split("/").pop()!;
        const siteBase = publishedIdentity(resolve(HARNESS_ROOT)).base;
        if (/^https?:\/\//.test(siteBase)) doc = `${siteBase}/${instanceDocPath({ name: decl.name, stub })}`;
      }
    } catch {
      doc = undefined;
    }
    docIris.set(key, doc);
  }
  return docIris.get(key);
}

/**
 * The page of subject `<kind>/<id>` declared by the file at `source`
 * (absolute): its subject IRI, absolute — the ruling is that the link IS the
 * IRI. `undefined` when nothing serves a page for it.
 *
 * Absolute rather than relative: the generators' own "way up" leads to their
 * docs root (`docs/<instance>/` on the site), not to the site root the
 * subjects are under, and a link built from the wrong root is the 404 this
 * migration exists to remove.
 */
export function subjectHref(source: string, kind: string, id: string): string | undefined {
  const inst = findInstanceRoot(resolve(source));
  if (inst === undefined) return undefined;
  const doc = servingDocIri(inst);
  return doc === undefined ? undefined : makeIri(doc, kind, id);
}
