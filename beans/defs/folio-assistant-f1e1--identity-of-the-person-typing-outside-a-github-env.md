---
# folio-assistant-f1e1
$schema: bean/1.0.0
title: Identity of the person typing, outside a GitHub environment — needs WAY more work
status: in-progress
type: feature
priority: normal
created_at: 2026-10-06T18:50:25Z
updated_at: 2026-10-12T16:50:00Z
parent: folio-assistant-7x5n
---

Owner 2026-10-06: 'this needs WAY more work when not in GitHub environment'.

What landed (bean ar1s P1, this session): interaction preferences are keyed by GitHub handle (+ optional published aliases); the session-start sweep resolves the handle through the authentication Tool's own resolver (`bun run cat auth:login` -> githubIdentity, part of auth_whoami, issue #1207) and matches it with the Claude login, GITHUB_ACTOR and the git author; no match is a THIRD state that applies the strictest profile on record. It works ONLY where a GitHub token is present (GH_TOKEN/GITHUB_TOKEN, or Actions).

## Gaps outside GitHub
- [ ] Local CLI with no GH token: no handle — today falls to 'could not determine' + strictest profile.
- [ ] Other forges (GitLab, Gitea, Bitbucket) and no forge at all: the identity key is GitHub-specific; needs a provider-neutral identity (provider + handle) with the GitHub resolver as one provider.
- [ ] Other agent hosts (Gemini CLI, Antigravity, Copilot, Codex, Cursor): what login/identity each exposes to a session-start hook, if any; whether they even run the sweep.
- [ ] Several people on one machine/session; a person with several accounts per provider.
- [ ] Privacy: aliases are published in the repo; per-person preferences that must NOT be committed need a non-repo store (user-level config), read through the same resolver.
- [ ] Authorization tie-in: the same resolved identity should feed auth_whoami/ODRL decisions, so 'who is typing' has one answer for both preferences and permissions.
- [ ] Skill: put the identity-resolution steps in the user authentication/authorization skills (task-authorization, deployment-auth) and the interaction-modality skill, not only in the sweep script.

## Done when
On every supported host, with or without a forge token, the session states who it is talking to (or that it could not determine) from one resolver shared by preferences and permissions.

## Owner ruling (2026-10-10, drain session ml9h)

**Provider-neutral:** identity is (provider, handle), GitHub implemented first; preferences that are not repo content live in a user-level config store.

## Progress 2026-10-12 (lane A): cat-harness-tools#157
Covers the gaps for a local CLI with no token, other forges or no forge at all, and privacy (the user-level store):
- `src/core/identity.ts` `resolveIdentities()` returns (provider, handle) pairs, each marked vouched or self-asserted: github through `githubIdentity`; gitlab from `GITLAB_USER_LOGIN`, only under `GITLAB_CI`; claude from `CLAUDE_CODE_USER_EMAIL`; any provider from the user store's `identities`; and the git author.
- The user store is `$XDG_CONFIG_HOME/cat-harness/identity.json` (or `CAT_HARNESS_USER_CONFIG`). It is never committed and has three states: absent, ok and unreadable.
- `auth:login --all` gives the sweep a key per identity, bare and as `provider:handle`. The sweep also prints the user store's `interaction` preferences.
- A self-asserted identity never authorizes: permissions still take only what GitHub vouched for.
Still open: identity on other agent hosts, several people per session, wiring the resolver into auth_whoami/ODRL, and the skill text.

## Progress 2026-10-12 16:45 (lane A)
- cat-harness-tools#157 is merged (28c6dc4): the resolver, `auth:login --all`, the user store, and the sweep.
- cat-harness#178 is merged: the skill box. interaction-modality §3.1 covers who is typing and the providers; task-authorization says one resolver feeds two thresholds, so a preference may follow a self-asserted identity and a permission never does.
Still open: identity on other agent hosts (Gemini CLI, Antigravity, Copilot, Codex, Cursor), several people per machine or session, and wiring `resolveIdentities` into `auth_whoami` output.
- The authorization tie-in box is done: cat-harness-tools#163 (cfb7474, merged) has `auth_whoami` list every other identity under "Also seen (for preferences only, never for permissions)", while the permission answer still reads only what GitHub vouched for.
Remaining: identity on other agent hosts, and several people per machine or session.
