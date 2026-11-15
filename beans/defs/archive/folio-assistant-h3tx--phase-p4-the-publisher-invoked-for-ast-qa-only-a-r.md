---
# folio-assistant-h3tx
$schema: bean/1.0.0
title: 'PHASE P4: the Publisher invoked for AST + QA only; a release still cut from a full build and saying so'
status: completed
type: feature
priority: normal
created_at: 2026-10-01T12:32:21Z
updated_at: 2026-10-30T19:41:00Z
parent: folio-assistant-uhkv
---

Phase P4 of `ig-publisher-reduction` (approved 2026-09-30 as written). Opened in the 2026-10-01 phased-transition review.

**Exit criterion:** a release is still cut from a full build, and the artefact **says which** it came from.

**Blocked by `a9tx`** (P3's prerequisite: AST measurements on a real IG; needs `packages.fhir.org`, unreachable from these sessions). Nothing to build before P3 lands, so this entry exists so that the phase has a home.

## Done when
- [ ] staging builds from the cached AST; releases from a full build
- [ ] every published artefact records which kind of build it came from

## Owner ruling 2026-10-01: every phase renders equivalent to the standard IG render

In the owner's words: *"each phase needs to render equivalent to existing IG standard render"*.

This is an invariant across **all** phases, not just P0's exit criterion. Whatever a phase changes in the pipeline, its output must stay equivalent to the IG Publisher's standard render of the same IG. The measured reference is `jut3`'s parity table: the Publisher's page set, by page kind.

**Open tension, put to the owner:** P2 as approved drops XML/Turtle ("recorded as a refusal"). Under this invariant, a refused representation is a difference from the standard render.

_2026-10-23T14:20:00Z_ — **The open P2 tension is settled.** Owner, 2026-10-23: *"excise XML and ttl everywhere for now"*. So dropping XML and Turtle is not a difference the "render equivalent to the standard IG render" invariant counts. fhir-harness branch `claude/excise-xml-ttl-links` (69344b4) also stops linking the Publisher's `.xml` and `.ttl` copies. Thread "FHIR beans and WHO migration" (https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19).

## Scoped and built, 2026-10-24 (owner, option C)

a9tx is completed, so this is unblocked. The owner chose C: the stamp, a release guard, and faster refreshes. It is in litlfred/fhir-harness#161 (issue #160), a draft:
- `ig-ast-refresh.yml` rebuilds a stale cache with `IncrementalBuildCli`, and falls back to a full build when it cannot. A `force` run, a `pre-export` caller, and a missing or cannot-tell cache always build in full. `ast-export-ref` is pinned to `ce950d2`.
- `ig-ast.ts build-kind <ast> --require-full` is the release guard. It exits 1 on an incremental AST.
- `folio-build.json` carries `ast.kind`.

Still to show: the first stale-cache refresh on a runner, and the first release step that calls the guard.

## Log
- 2026-10-24 11:55Z: claimed by the "Publisher AST" thread; fhir-harness#161 opened.

- 2026-10-24 12:40Z: fhir-harness#161 merged (`ae07c25`), inside the owner's merge window. CI is green after `fb77e45` regenerated the stale ig-ast schemas. Open: the first stale-cache refresh on a runner, once an IG repins fhir-harness.

_2026-10-29T08:00:00Z_ — Checked. **Release guard:** the only release path in the litlfred forks is smart-base `release.yml`, which hands off to WHO's smart-html release (a full IG Publisher build that never reads the cached AST), so no release step has an AST for `build-kind --require-full` to judge yet. **Stale-cache refresh:** smart-base's ig-ast-refresh ran on the 07:21Z push (run 40834892898) and failed before export because `https://build.fhir.org/ig/WorldHealthOrganization/smart-ig-template/branches/main/package.tgz` returned 404, which is upstream and not this layer. smart-base passes `pre-export`, so it always builds in full anyway; the first incremental refresh needs an IG without pre-export (smart-trust or smart-immunizations). Still open. Session https://claude.ai/code/session_01Qmmkt87nxnLXyraNsmmpKH.


_2026-10-23T14:20:00Z_ — **The open P2 tension is settled.** Owner, 2026-10-23: *"excise XML and ttl everywhere for now"*. So dropping XML and Turtle is not a difference the "render equivalent to the standard IG render" invariant counts. fhir-harness branch `claude/excise-xml-ttl-links` (69344b4) also stops linking the Publisher's `.xml` and `.ttl` copies. Thread "FHIR beans and WHO migration" (https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19).

## Scoped and built, 2026-10-24 (owner, option C)

a9tx is completed, so this is unblocked. The owner chose C: the stamp, a release guard, and faster refreshes. It is in litlfred/fhir-harness#161 (issue #160), a draft:
- `ig-ast-refresh.yml` rebuilds a stale cache with `IncrementalBuildCli`, and falls back to a full build when it cannot. A `force` run, a `pre-export` caller, and a missing or cannot-tell cache always build in full. `ast-export-ref` is pinned to `ce950d2`.
- `ig-ast.ts build-kind <ast> --require-full` is the release guard. It exits 1 on an incremental AST.
- `folio-build.json` carries `ast.kind`.

Still to show: the first stale-cache refresh on a runner, and the first release step that calls the guard.

## Log
- 2026-10-24 11:55Z: claimed by the "Publisher AST" thread; fhir-harness#161 opened.

- 2026-10-24 12:40Z: fhir-harness#161 merged (`ae07c25`), inside the owner's merge window. CI is green after `fb77e45` regenerated the stale ig-ast schemas. Open: the first stale-cache refresh on a runner, once an IG repins fhir-harness.

_2026-10-30T19:55:00Z_: **Stale-cache refresh seen on a runner.** litlfred/smart-immunizations-uganda "IG AST refresh" run 41046593760 (push, 11:14Z, `6218808`, no pre-export): the restored cache was judged `stale-inputs` (sourceRevision and inputDigest differ), so the workflow ran `IncrementalBuildCli` over it. Its own plan chose a full build (`::notice::AST rebuilt by IncrementalBuildCli: full`), the AST passed `validity`, `kind=full` was set as the job output, and the cache branch `cat/fhir-harness/fhir-ast/smart.immunizations.uganda` was re-seeded (16 resources, 79 edges). So the refresh path and the build-kind stamp work end to end.

**Still not exercised: the release guard.** No litlfred release path reads the cached AST: smart-base `release.yml` hands off to WHO's smart-html release, a full Publisher build. `ig-ast.ts build-kind --require-full` therefore has nothing to judge until a litlfred IG cuts its own release from an AST. Owner asked whether to close on this evidence (thread "Finish IG and DAK beans"). Session https://claude.ai/code/session_01Qmmkt9C9fukFK42vgZRrKc.

_2026-10-30T19:41:00Z_: **Completed.** Owner card 19:40Z ("Close h3tx now, or keep it open until a release uses the guard?"): "A. Close it now". Closed on the runner evidence above. Reopen when a litlfred IG cuts its own release from an AST, so that `build-kind --require-full` is exercised.
