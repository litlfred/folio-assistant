/**
 * The content types this layer owns, registered at load time.
 *
 * @module schemas/content-types-base
 * @graphNode schema
 *
 * Separate from `content-type.ts` for the reason `folio-graph-kind.ts` is
 * separate from `cat-harness.ts`: the registry is a mechanism and the entries
 * are a layer's opinion. A layer that does not own a type must not be the
 * place it is declared, and the split is what makes that enforceable rather
 * than merely stated.
 *
 * Two are registered here — `harness` and `folio` — because they are the two
 * this layer owns.
 *
 * ## They are NOT the same type, and this repository is the proof
 *
 * `harness` says *this is an instance*: a name, a stub, the directories it
 * holds. `folio` says *this authors folio content*: it carries `contentType`,
 * and `folio_init` writes it.
 *
 * ```
 *                        declared   contentType
 *   cat-harness/            yes         NO
 *   the repository root     yes         yes
 * ```
 *
 * So `cat-harness/` is a harness and is **not** a folio — which is exactly
 * right, and is the platform-not-content rule `AGENTS.md` opens with, showing
 * up as a measurable fact rather than as a slogan.
 *
 * ## ONE FILE now states both, so the DISCRIMINATOR MOVED INSIDE IT
 *
 * This table used to have `harness.json` and `harness.config.json` as its
 * columns, and the two memberships were simply two files. `harness.json` was
 * excised on 2026-09-21 — both are `<name>.config.json` — and for a few
 * minutes that made **every declared instance a folio**, because one marker
 * answered both questions.
 *
 * The distinction survived the merge by moving from the FILENAME into the
 * CONTENT: `folioMarkerFilename` returns the file only when it declares a
 * `contentType`, which is what this type's own summary always said it meant.
 * A bare `{"name":"x"}` is an instance and not a folio, exactly as before.
 *
 * This is also what `isFolio` in `folio-intent.dmn` has always meant. That
 * input is documented as *"harness.config.json exists in the working
 * directory"* — so it was never "is this an instance", it is one membership of
 * the set, and `getting-started.md` now says so. The file it names has been
 * renamed twice since; the question it asks has not changed.
 *
 * ## `dak` and `sushi` are NOT here, and the partition gate is why
 *
 * They were, for about ten minutes, under a comment saying *"registering a
 * type is not claiming it … when a WHO adapter becomes its own layer, those
 * two entries move there."* `check:partition:edges` disagreed, immediately and
 * correctly:
 *
 * ```
 * schemas/content-types-base.ts [folio-assist-core] -> schemas/dak.ts [smart-base]
 * A repo may not import one that depends on it.
 * ```
 *
 * `smart-base` depends on core, so core recognising a DAK means core importing
 * downstream. The comment was right about the destination and wrong that it
 * could wait: recognising `dak.json` needs `DAK_TYPE`, and reaching for it is
 * the edge. They live in {@link module:schemas/dak-content-type}, registered by
 * the layer that owns the model — exactly as `folio-graph-kind.ts` registers
 * `folio` rather than the harness declaring a kind it cannot serve.
 *
 * `ig` is registered nowhere, and that is also deliberate. `79t3` records it as
 * half-formalised — `l3-fhir` exists as a translation content type with `fsh`
 * and `fhir-json` formats, but **nothing declares an IG instance**, so there is
 * no marker file to recognise. An entry for it would mint a type whose
 * membership can never be asserted: something that looks like coverage and
 * detects nothing.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { defaultContentTypes, type ContentTypeRegistry } from "./content-type";
import { CONFIG_SUFFIX, findDeclarationFile } from "./cat-harness";
import { instanceConfigFilename, instanceConfigFor } from "./harness-config";
import { termIri } from "./namespaces";

/** The `@type` a harness declaration projects to. */
export const HARNESS_TYPE = termIri("Instance");

/**
 * The folio marker's filename, resolved from the instance that declares it.
 *
 * HOISTED to module scope, and that is not tidiness. `sameType` compares
 * `filename` by `===`, so a resolver defined inline inside
 * {@link registerBaseContentTypes} is a fresh closure on every call and a
 * second call — which `content-type.test.ts` makes deliberately, and which a
 * diamond makes by accident — reads as a CONFLICTING redefinition of `folio`.
 * The literal it replaced was equal to itself for free; a function has to be
 * given that property on purpose.
 *
 * `undefined` on an unreadable declaration, NOT a throw. This resolver runs
 * inside `describeRepository`, whose whole subject is markers that may be
 * absent, present-and-unparseable, or present-and-invalid — and
 * `readDeclaration` throws on the last two. Letting that escape turned "the
 * harness marker is unreadable, so the folio marker's NAME is undetermined"
 * into a crash that reported nothing at all about either marker, which is the
 * third state collapsed in the loudest possible direction.
 */
function folioMarkerFilename(repoRoot: string): string | undefined {
  let inst: ReturnType<typeof instanceConfigFor>;
  try {
    inst = instanceConfigFor(repoRoot);
  } catch {
    return undefined;
  }
  if (inst === undefined) return undefined;
  const file = instanceConfigFilename(inst.name);

  // IT MUST ACTUALLY DECLARE A CONTENT TYPE, which this did not have to check
  // while `harness.json` existed: the declaration and the config were two
  // files, so the mere presence of `<name>.config.json` meant somebody had
  // configured a folio. They are ONE file since 2026-09-21, and a bare
  // `{"name":"x"}` is an instance that is not a folio — asserting both
  // memberships off one marker made every declared instance a folio.
  //
  // This type's own summary is the rule: "it declares a content type". The
  // `harness` marker still reports the file, so nothing is lost — the two
  // memberships are simply no longer the same question.
  try {
    const raw = JSON.parse(readFileSync(join(repoRoot, file), "utf-8")) as { contentType?: unknown };
    return typeof raw.contentType === "string" ? file : undefined;
  } catch {
    // Unreadable: `harness` reports the membership it can see. Claiming folio
    // membership off a file nothing could parse would be inventing the one
    // fact this marker exists to carry.
    return undefined;
  }
}

/**
 * The harness marker — any `<name>.config.json` at this root.
 *
 * A FUNCTION rather than a constant because `harness.json` was excised
 * (2026-09-21) and the filename now carries the instance's name, so there is
 * no fixed string to look for.
 *
 * It falls back to any `*.config.json` when none is a valid declaration, and
 * that is deliberate: a marker PRESENT AND UNREADABLE is its own state — the
 * membership is asserted whether or not this module can parse the assertion.
 * Dropping it would under-report what the repository says about itself, which
 * is the third-state rule this file already applies to `sushi-config.yaml`.
 */
function harnessMarkerFilename(repoRoot: string): string | undefined {
  let found: string | undefined;
  try {
    found = findDeclarationFile(repoRoot);
  } catch {
    // Several declarations, or only broken ones — either way the directory
    // plainly carries the marker, and the fallback below names it.
  }
  if (found !== undefined) return found;
  try {
    // CONFIG_SUFFIX, not DECLARATION_SUFFIX. This fallback exists for the
    // directory that plainly carries the marker while its declaration is
    // broken or duplicated, and `.config.json` names a harness artefact and
    // nothing else. The declaration suffix became a bare `.json` on
    // 2026-09-21, at which point this matched `dak.json`, `package.json` and
    // every other JSON file — so a DAK repository was reported as carrying a
    // harness marker it does not have. `findDeclarationFile` above is safe
    // under the same suffix because it additionally requires the stem to equal
    // the declared `name`; a bare suffix filter has no such guard, which is
    // exactly why it cannot use the bare suffix.
    return readdirSync(repoRoot)
      .filter((e) => e.endsWith(CONFIG_SUFFIX) && e.length > CONFIG_SUFFIX.length)
      .sort()[0];
  } catch {
    return undefined;
  }
}

export function registerBaseContentTypes(registry: ContentTypeRegistry = defaultContentTypes): void {
  registry.register("harness", {
    filename: harnessMarkerFilename,
    type: HARNESS_TYPE,
    summary:
      "An instance of the harness — it declares a name, a stub and the directories it holds.",
    facts: (d) => {
      const doc = d as { name?: unknown; stub?: unknown; canonicalUrl?: unknown };
      return {
        name: typeof doc.name === "string" ? doc.name : undefined,
        stub: typeof doc.stub === "string" ? doc.stub : undefined,
        canonicalUrl: typeof doc.canonicalUrl === "string" ? doc.canonicalUrl : undefined,
      };
    },
  });

  registry.register("folio", {
    // COMPUTED, because the marker's name is the instance's own as of
    // 2026-09-20 — `<name>.config.json` at the instantiation root. A literal
    // here would have gone on testing for a file no instance writes, and
    // `describeRepository` would have reported every folio as not-a-folio
    // while looking perfectly healthy.
    filename: folioMarkerFilename,
    type: termIri("Folio"),
    summary:
      "A repository that authors folio content — it declares a content type, and `folio_init` wrote this file.",
    facts: (d) => {
      const doc = d as { contentType?: unknown };
      return {
        // NOT cross-checked against anything today, and that is the honest
        // state: no other marker here states a content type, so this fact has
        // nobody to disagree with. It is carried because a consumer asking
        // "what are you?" wants `paper` or `document`, not just `folio` — and
        // because the day a second marker states it, the cross-check is
        // already wired.
        contentType: typeof doc.contentType === "string" ? doc.contentType : undefined,
      };
    },
  });
}

registerBaseContentTypes();
