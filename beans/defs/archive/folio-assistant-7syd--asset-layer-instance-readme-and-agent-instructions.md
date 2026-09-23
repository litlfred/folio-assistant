---
# folio-assistant-7syd
title: 'ASSET LAYER: instance-readme and agent-instructions declare layer context, and the read-as-a-file trigger is tested'
status: completed
type: task
priority: normal
created_at: 2026-09-21T05:50:07Z
updated_at: 2026-09-21T06:55:24Z
parent: folio-assistant-zzmr
---


Carved out of `ie9l` when issue #592 was closed (2026-09-21, owner's word).
Two of `ie9l`'s `Done when` boxes, both **partly** landed.

**What landed** (PR #593): both roles are declared assets on all eleven
instances, they appear in the published `.jsonld`, and
`ASSET_ROLE_PURPOSE` states each role's purpose once, per role.
`agent-memory` carries the delivery rule — a file is READ and nothing
truncates it; memory is INJECTED and pays a 200-line budget.

**What did not**: the assets do not declare `layer: context`, and the rule
that an agent reaches them as a FILE is documented rather than **tested**.
`ie9l` asked for the trigger to be "named and tested"; it is named.

Owner, on why the layer matters:

> its static content at process runtime and treated as an asset like memories

That is `context` word for word — READ at session start, never written by a
running process. Declaring it makes a step that writes one a defect rather
than an update, which is the whole point of the layer.

## Done when

[x] `instance-readme` and `agent-instructions` declare `layer: context` — on
    the ROLE, in `ASSET_ROLES`, never per asset
[x] A test asserts the delivery path — `asset-roles.test.ts` measures this
    repository's own `AGENTS.md` past the 200-line injection budget, legal
    only because its delivery is `file`
[x] The declaration is checkable, so a process writing one fails —
    `processMayWriteAsset` through the shared `layerIsWritable`, and
    `check:asset-roles` in the gate set

Issue #665 · PR #666.

## What changed from the plan, and why

`ASSET_ROLE_PURPOSE` was going to gain two sibling `Record<string, …>`
constants. Three maps keyed on the same thing is a shape where one gains a key
the others lack and nothing says so — a role with a purpose and no layer reads
as governed while `assetRoleLayer` returns `undefined` for it. One record of
objects (`ASSET_ROLES`) makes that unrepresentable, and `layer`/`delivery` are
REQUIRED for `GraphKindDef.holds`'s reason.

`layerIsWritable(layer)` was extracted from `processMayWrite` rather than
copied into `processMayWriteAsset`. The docstring on `processMayWrite` already
promised a fourth layer would be one edit; that promise is only true while
there is one site to edit.

The stray-key check reads the RAW `harness.json`. `KgAssetSchema` strips an
unknown key without a word — deliberately, since that is how a downstream
instance carries a key this layer has not learned yet — so after parsing the
evidence is gone.

## A slip in this bean's own record, kept rather than quietly fixed

The first attempt to write everything above **silently did not apply**, and
the bean was marked `completed` with all three boxes unticked while the
session reported them ticked. Cause: the replacement was anchored on the text
`beans show` RENDERS, which re-wraps, rather than on the file — and that one
call had no assert, so a no-op looked identical to a success.

The same edit against `7sfm` in the same minute DID apply, because that one
printed the raw block first and asserted on it. **Anchor on the file; assert
on the anchor.** A silent no-op is the `ie9l` shape (a bean completed at
N-of-M boxes) arriving through the tooling instead of through haste.

Issue #665 · PR #666.
