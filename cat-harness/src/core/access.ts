/**
 * Folio Assistant — who is asking, and what the instance's ODRL policies say
 * they may do.
 *
 * One loader for both callers that decide access: the HTTP routes
 * (`core/rbac.ts`) and the BPMN executor (`workflow/authorize.ts`). Two
 * loaders would be two answers to "which policies are in force", free to
 * disagree, which is the failure issue #1207 exists to end.
 *
 * ## Authentication is the executor's responsibility
 *
 * Owner, 2026-09-23 (issue #1207): *"process bpmn executor responsibility. its
 * skill, tools may be http but we dont have this setup yet. we do have agentic
 * discussion + git(hub) KG-DS and with github we use it as auth / auth
 * control."* So a {@link Principal} carries HOW its identity was established,
 * and nothing here pretends a typed string is a login:
 *
 * - `github` — GitHub authenticated the caller. Today that is a GitHub Actions
 *   run (`GITHUB_ACTOR` is set by the runner, not by the caller). The actor id
 *   is still the one claimed; the GitHub login rides along as `account`.
 * - `http-gateway` — the auth-gateway's OAuth session, as headers.
 * - `asserted` — an actor id the caller typed. Recorded, never trusted as
 *   identity. This is every local agent session today.
 * - `none` — nobody said who they are.
 *
 * The other half of GitHub as access control needs no code here: the KG data
 * store is a git repository on GitHub, so instance state, beans and content
 * only become durable through a push GitHub has authorised.
 *
 * @module folio-assistant/core/access
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { directoriesForGraph, repoRootFor } from "../../schemas/cat-harness.js";
import { actionGraph, readPolicies, type ActionGraph, type OdrlPolicy } from "../../schemas/odrl.js";
import { readActors, readPermissions, type LoadedActor } from "../../schemas/role-graph.js";
import { kgRoots } from "../../scripts/known-skills.js";

export type AuthMethod = "github" | "http-gateway" | "asserted" | "none";

export interface Principal {
  /** A declared actor id, or `null` for nobody. */
  actor: string | null;
  authenticatedBy: AuthMethod;
  /** The external account that authenticated, when there is one (a GitHub login, an email). */
  account?: string;
}

export interface AccessContext {
  policies: ReadonlyMap<string, OdrlPolicy>;
  graph: ActionGraph;
  actors: ReadonlyMap<string, LoadedActor>;
}

/** This platform instance's own root: where its default policies live. */
const PLATFORM_ROOT = resolve(import.meta.dir, "../..");

/**
 * The policies, action profile and actors in force for `root`.
 *
 * `root` may be an instance root or the repository root above it (the server is
 * started with either). When `root` declares no `policies` graph the platform's
 * own policies apply — a folio that writes none inherits the defaults, which is
 * what `dependents: skip` on the declaration means.
 */
export function loadAccessContext(root: string): AccessContext {
  const policyDirs = directoriesForGraph(root, "policies");
  const instanceRoot = policyDirs.length > 0 ? root : PLATFORM_ROOT;
  const dirs = policyDirs.length > 0 ? policyDirs : directoriesForGraph(PLATFORM_ROOT, "policies");

  const policies = new Map<string, OdrlPolicy>();
  for (const d of dirs) for (const [uid, p] of readPolicies(d)) policies.set(uid, p);

  const profile = kgRoots(instanceRoot)
    .map((r) => readPermissions(r))
    .find((v) => v !== undefined);
  const graph = actionGraph(profile?.permissions ?? []);

  const actors = new Map<string, LoadedActor>();
  // declared-path-literal: actors are not yet a declared graph kind; this is
  // where kg-audit and check-actor-reach read them too.
  for (const base of [root, repoRootFor(instanceRoot)]) {
    const dir = join(base, ".claude", "skills", "actors");
    if (!existsSync(dir)) continue;
    for (const a of readActors(dir)) actors.set(a.id, a);
    break;
  }
  return { policies, graph, actors };
}

let cached: { root: string; ctx: AccessContext } | undefined;

/** {@link loadAccessContext}, cached per root. Policies change by commit, not per request. */
export function accessContext(root: string = PLATFORM_ROOT): AccessContext {
  if (!cached || cached.root !== root) cached = { root, ctx: loadAccessContext(root) };
  return cached.ctx;
}

/**
 * The principal for a non-HTTP caller (an MCP tool call, a script): the actor
 * it claims, and whatever the environment can vouch for.
 *
 * `env` is a parameter so a test can state it; callers pass `process.env`.
 */
export function principalFromEnv(
  claimed: string | undefined,
  env: Readonly<Record<string, string | undefined>>,
): Principal {
  const actor = claimed?.trim() || null;
  if (env.GITHUB_ACTIONS === "true" && env.GITHUB_ACTOR) {
    return { actor, authenticatedBy: "github", account: env.GITHUB_ACTOR };
  }
  return { actor, authenticatedBy: actor ? "asserted" : "none" };
}
