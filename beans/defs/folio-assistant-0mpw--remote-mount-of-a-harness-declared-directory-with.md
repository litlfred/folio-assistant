---
# folio-assistant-0mpw
title: 'Remote mount of a harness: declared directory with a remote source, defaults in the harness''s own declaration'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-06T17:55:54Z
updated_at: 2026-10-06T22:02:03Z
parent: folio-assistant-fnx4
---

Owner ruling 2026-10-06 (this session): replace submodule linking (e.g. litlfred/smart-ra has folio-assistant as a submodule) with a REMOTE MOUNT. Not .deps/ (dot-dir; collides with GitHub conventions and our own dot-prefix guard).

## Design (option 1, amended by the owner)
- A remote mount is a DECLARED DIRECTORY with a new SubgraphSource member, e.g. source: {remote: {repository, ref: <40-char sha>}} — mounted at the declared path, ignored through directory-storage rules, read by the overlay like any declared directory.
- DEFAULTS LIVE IN THE HARNESS'S OWN DECLARATION: the harness (cat-harness.json, smart-base.json, ...) declares once what a downstream mounts — which of its directories, and the default mount path. A downstream folio names only the dependency and its pin; it never restates the paths.
- Mount via state:mount (or a sibling), pinned SHA only, reusing kg-materialize's gitPartFetcher + fixity (materialization.json tree digest). Three-state report: mounted / missing / could-not-determine; never clean when it could not check.
- Code (builders shim, MCP server, scripts) comes as a pinned package (bun add github:litlfred/folio-assistant#<sha>), separately.

## Todo
- [ ] Schema: harness-side mount defaults field in <instance>.json; downstream dependency entry {repository, ref}.
- [ ] SubgraphSource remote member + resolver into the overlay (resolveSkillDirs, declarationChain).
- [ ] Mount command + session-start hook wiring; lock of {sha, treeDigest}; gate that fails when a needs layer is unmounted in CI.
- [ ] BPMN process (mount-dependency) + skill: choosing submodule vs package vs remote mount.
- [ ] init-folio --link remote.
- [ ] Pin skill_fetch's REFERENCE_PACKAGES (currently ref main, unpinned).
- [ ] Pilot: litlfred/smart-ra drops its submodule.

## Done when
smart-ra builds and serves its harness skills with no submodule, from a pinned remote mount whose paths come from the harness's declaration.


**Amended by owner 2026-10-06: a downstream folio MAY OVERRIDE the harness's defaults** — which directories it mounts and where. Overrides match on the entry's id (as config.subgraphSources and directory overrides already do), never on path; an absent override inherits the harness default.


_2026-10-06_ — owner: this pilot is S8's first live run (bean w0at amended: code -> pinned package, KG -> declared remote mount, cutover dirs -> fsh-guts) and is UNBLOCKED from mgxw — smart-ra is already its own repository.

_2026-10-06T22:01:50Z_ — Claimed by claude/remote-mount-0mpw — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Progress 2026-10-06 — PR #2326 (session_01GTPSAegNUMWKWUpve56XJS)

Built on branch claude/remote-mount-0mpw:
- [x] Schema: `mountDefaults` (harness side) and `remoteMounts` with per-instance overrides by id (downstream side) — cat-harness/schemas/remote-mount.ts; `SubgraphSource` gains `kind: "remote"` {repository, ref: 40-char SHA, upstreamPath?}.
- [x] Resolver into the overlay: `resolveDependencyPath` reads the mount lock instead of `.deps/`; `dependenciesFromNeeds` scopes a mounted instance's siblings via `mountScopeFor`; API `mountedInstanceRoots(scope)`.
- [x] Mount command (`bun run mount:remote`, `--plan`), transitive closure through `needs` in the pinned tree then gitlinks as pins; lock {repository, sha, treeDigest} + what was not mounted; offline gate `mount:remote:check` (mounted / missing / could-not-determine); wired into `state:mount` so the session-start hook runs it.
- [x] BPMN `processes/kg/mount-dependency.bpmn` (+ a `remote` flow in mount-subgraph) and skill `remote-mount` (mount vs subscribe vs associate; no submodules, no .deps/).
- [x] 18 tests over local bare repositories, incl. a cross-instance import and a declaration whose directory is not its name.
- [ ] init-folio --link remote; pin skill_fetch REFERENCE_PACKAGES; smart-ra pilot — not in #2326.

SUPERSEDED in this bean's design: "Code … comes as a pinned package" — per the owner's later ruling (bean g8jp) code arrives through the remote-mounted declared code directories.
