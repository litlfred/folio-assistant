/**
 * An instance's release addresses: where its identifiers live at the version
 * it declares.
 *
 * @module schemas/release-iri
 * @graphNode schema
 *
 * ## Two audiences, two forms (owner, 2026-09-29)
 *
 * > "2 used for human narrative centric content, 3 for agentic. but for
 * > document generation/jeckly/liquid stuff, make variables of version
 * > available to minimize drift."
 *
 * | audience | form | example |
 * |---|---|---|
 * | an agent or program — a namespace, a schema `$id`, a BPMN `xmlns` | `<iriBase><version>/` | `…/bootstrap/0.1.0/ns#` |
 * | a person — a page to read | `<iriBase>v<major>/` | `…/bootstrap/v0/` |
 *
 * An agent pins exactly, because a program that read `0.1.0` must not be
 * silently handed `0.2.0`. A person follows a link that stays good for the
 * life of a major version, because prose is not re-checked on every patch.
 *
 * ## Derived, never typed
 *
 * `iriBase` and `version` are written once, in the instance's declaration.
 * Everything here is computed from them; a generator or template that needs
 * an address asks {@link releaseIris} (or reads the `release` variable it is
 * handed) instead of spelling one out. The copies that cannot be computed at
 * read time — an `xmlns` attribute in 70 BPMN files, a value in a code list —
 * are kept at the declared version by `scripts/iri-sync.ts`, whose `--check`
 * is a gate.
 */
import { join } from "node:path";

import { readKnowledgeGraphDeclaration } from "./declaration.ts";

/** MAJOR.MINOR.PATCH, nothing else: no ranges, no pre-release, no `v`. */
export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** An instance's release, as both audiences address it. */
export interface ReleaseIris {
  /** The declared `iriBase`, ending in `/`. */
  readonly iriBase: string;
  /** The declared version, `MAJOR.MINOR.PATCH`. */
  readonly version: string;
  /** `MAJOR` alone, as a number. */
  readonly major: number;
  /** `<iriBase><version>/` — what a program reads. */
  readonly agent: string;
  /** `<iriBase>v<major>/` — what a person reads. */
  readonly human: string;
}

/** The release addresses a declaration implies, or `undefined` when it declares no `iriBase`. */
export function releaseIris(decl: { iriBase?: string; version?: string } | undefined): ReleaseIris | undefined {
  if (!decl?.iriBase) return undefined;
  const version = decl.version ?? "";
  const m = SEMVER.exec(version);
  if (!m) {
    throw new Error(`an iriBase needs a MAJOR.MINOR.PATCH version to mint against; found ${JSON.stringify(decl.version)}`);
  }
  const iriBase = decl.iriBase.endsWith("/") ? decl.iriBase : `${decl.iriBase}/`;
  const major = Number(m[1]);
  return { iriBase, version, major, agent: `${iriBase}${version}/`, human: `${iriBase}v${major}/` };
}

/** One path under a release, for the audience that will read it. */
export function releaseIri(r: ReleaseIris, path: string, audience: "agent" | "human"): string {
  return `${audience === "agent" ? r.agent : r.human}${path.replace(/^\/+/, "")}`;
}

/**
 * bootstrap's release, read from its declaration. `bootstrapDir` is the
 * bootstrap checkout: beside bootstrap-tools here, and wherever a consumer
 * put it after the split — a caller that knows passes it.
 */
export function bootstrapRelease(bootstrapDir: string = join(import.meta.dir, "..", "..", "bootstrap")): ReleaseIris {
  const r = releaseIris(readKnowledgeGraphDeclaration(bootstrapDir));
  if (!r) throw new Error("bootstrap/bootstrap.json declares no iriBase");
  return r;
}

/**
 * Does a `$schema` tag name this schema at a version a reader of `major`
 * understands? Semver's promise: within one major version, a newer minor or
 * patch adds and never breaks.
 */
export function tagCompatible(tag: unknown, name: string, major: number): boolean {
  if (typeof tag !== "string" || !tag.startsWith(`${name}/`)) return false;
  const m = SEMVER.exec(tag.slice(name.length + 1));
  return m !== null && Number(m[1]) === major;
}
