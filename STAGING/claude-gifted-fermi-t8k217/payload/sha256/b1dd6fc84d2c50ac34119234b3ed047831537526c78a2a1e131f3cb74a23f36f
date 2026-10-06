---
# folio-assistant-5akx
title: KeyedBySchema and DirectoryStorageSchema were two spellings of one enum — route parsed in one and threw in the other
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T08:35:58Z
updated_at: 2026-10-06T06:26:48Z
parent: folio-assistant-fs43
---

## What was measured

`main@12b916e9a5`, probe calling both schemas on one `storage` value:

    A. DirectoryStorageSchema accepts keyedBy route? true
    B. resolveSubgraphSource THREW: ZodError |
       Invalid option: expected one of "commit"|"tip"

`DirectoryStorageSchema.keyedBy` (`schemas/cat-harness.ts`) gained `"route"` with bean `1j3q`.
`KeyedBySchema` (`schemas/subgraph-source.ts`), which every consumer parses through, did not.

Not a silent defect: `offCheckoutFindings` catches the throw and reports an `unmounted` finding
carrying the zod message. A blocker for `xsrv`'s flip, not a `dh4f`.

## Fixed in PR #2069

- `DirectoryStorageSchema.keyedBy` now IS `KeyedBySchema` — one enum, imported, no cycle.
- Four consumers that guarded `keyedBy !== "tip"` and silently took the else-arm now decide:
  `check-declared-dirs` (`routePresence`), `graph-read`, `audit-coverage`, and
  `resolveSubgraphSource`'s `qa` guard.

## The transferable lesson

**Widening an enum is SILENT where widening a discriminated union is loud.** `SubgraphSourceSchema`'s
docblock promises "a new kind is a new member here and a compile error at every consumer that has not
decided what to do with it" — and that promise is real for a new `kind` and worthless for a new
`keyedBy` value. Every `!== "tip"` guard kept compiling.

`directory-storage.test.ts` had already written the rule down: "A guard that named one value would
admit every value added after it — which is exactly how `route` would have slipped past the check
written for `tip`." It had, in the same file's own subject.

## Still open, recorded not done

`mountTip` reads no `keyedBy` at all. Pointed at a route branch it opens a tip-keyed store and
`verifiedTip` answers `corrupt` — which reads as "the branch is damaged" rather than "mounting is a
tip operation". Measured against the seeded `cat/cat-harness/uml-overview`. Deliberately NOT folded
into #2069.

## Done when

- [x] one enum, with the second spelling deleted
- [x] each of the four consumers has a decided answer for `route`, argued in its own docblock
- [x] mutation tested: every new guard reverted one at a time reddens the suite
- [ ] `mountTip` refuses a non-tip keying with a reason naming the keying, instead of `corrupt`


## Re-measured 2026-10-06 on main at 2fdbb5109a — not closable yet
Items 1–3 landed (#2069; `keyedBy: KeyedBySchema` in cat-harness.ts). **Item 4 fails:** `mountTip` (branch-store.ts ~1083) opens the store with no `keyedBy`, so it defaults to `tip`; a probe with a route-keyed declaration returns `{state: corrupt, reason: "… keyed by route, not tip"}` rather than `refused` with a reason naming the keying. The CLI `mount` goes through the same path.
