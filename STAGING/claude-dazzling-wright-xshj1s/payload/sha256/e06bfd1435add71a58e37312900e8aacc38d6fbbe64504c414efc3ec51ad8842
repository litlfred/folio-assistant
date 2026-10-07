---
# folio-assistant-f1e1
title: Identity of the person typing, outside a GitHub environment — needs WAY more work
status: todo
type: feature
created_at: 2026-10-06T18:50:25Z
updated_at: 2026-10-06T18:50:25Z
parent: folio-assistant-7x5n
---

Owner 2026-10-06: 'this needs WAY more work when not in GitHub environment'.

What landed (bean ar1s P1, this session): interaction preferences are keyed by GitHub handle (+ optional published aliases); the session-start sweep resolves the handle through the authentication Tool's own resolver (`bun run auth:login` -> githubIdentity, part of auth_whoami, issue #1207) and matches it with the Claude login, GITHUB_ACTOR and the git author; no match is a THIRD state that applies the strictest profile on record. It works ONLY where a GitHub token is present (GH_TOKEN/GITHUB_TOKEN, or Actions).

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
