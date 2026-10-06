#!/usr/bin/env bun
/**
 * Print the GitHub login of whoever this session acts for — one line, or
 * nothing — for the session-start sweep's "who is typing" step.
 *
 * Part of the user authentication and authorization Tool (`auth_whoami`,
 * issue #1207): it asks the same resolver, `githubIdentity`, rather than a
 * second answer to the same question. Owner, 2026-10-06: a person may hold
 * more than one Claude account, so the GitHub handle is the identity the
 * interaction preferences are keyed by, and resolving it belongs to the
 * authentication process and its GitHub-specific tools, not to the sweep.
 *
 * Exits 0 with the login on stdout when GitHub named one; exits 2 (could not
 * determine) with the reason on stderr otherwise — never 0 with an empty line,
 * so a caller cannot read "nobody" as "somebody we know nothing about".
 *
 * @module cat-harness-tools/scripts/auth-login
 * @covers none — a resolver, not a gate
 */
import { githubIdentity } from "../src/core/github-auth.js";

if (import.meta.main) {
  const id = await githubIdentity({ env: process.env });
  if (id.login) {
    console.log(id.login);
    process.exit(0);
  }
  console.error(`could not determine the GitHub login: ${id.reason ?? id.status}`);
  process.exit(2);
}
