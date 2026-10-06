---
# folio-assistant-qmqg
title: 'TRANSLATIONS: the convention fallback would have made #1448''s declaration edit a silent no-op'
status: todo
type: bug
priority: normal
created_at: 2026-09-27T06:20:28Z
updated_at: 2026-09-27T06:38:17Z
parent: folio-assistant-bzyu
---

Found 2026-09-27 while doing the `.pot` relocation in PR #1448, which is the
thing that makes this measurable rather than theoretical.

## The shape

Ten production readers resolve the translations directory like this:

```ts
directoryForGraph(root, "translation-sources") ?? join(root, "translations")
```

`po-resolve.ts` documents it as a deliberate **third source**: *"the
convention, `translations/`, for an instance that declares neither."* So this
is not hidden debt. Nine of the ten carry a `declared-path-literal: <reason>`
marker and are COUNTED by `check:declared-paths`; the tenth
(`simulate-translation.ts`) uses `deferResolution` with `what`/`under`, which
is the stronger mechanism. **Recorded debt, not a leak.**

A first draft of this finding said `po-resolve.ts` "has no fallback" and
described the ten sites as unmarked. Both were wrong — it has the fallback on
line 87 and nine sites are marked — and the error ran in the direction of
making the codebase look sloppier than it is. It is recorded here rather than
silently fixed, because the correction is the whole reason the bean says what
it says.

## What is actually wrong, and #1448 is the proof

The fallback is not *dangerous* where it fires. It is dangerous in what it
hides when a DECLARATION is wrong.

#1448 did two things: it moved 15 `.pot` files out of `bootstrap/translations/`
and it removed the `bootstrap-translations` node from `bootstrap.json`. Do only
the second — remove the declaration, leave the files — and every one of the ten
readers goes on finding `bootstrap/translations/` **by convention**, reads all
15 templates, and reports a clean run. The declaration would be wrong and
nothing in the repository would say so.

That is the `dh4f` inverse: present-but-undeclared. `check:declared-dirs` and
`check:harness-dirs` are blind to it by construction — both compare
declarations against disk, never the reverse (measured on `e8m3`, where
`beans/defs/archive/` held 631 undeclared `bean-defs`). The convention fallback
is what turns that blindness from a gap into a green.

## And the branch is now unreachable, which is its own problem

Measured on `claude/pot-out-of-bootstrap` at 50ba870901a:

  - instances declaring `translation-sources`: **1** (cat-harness)
  - instances with a `translations/` directory on disk: **1** (cat-harness,
    529 files)

bootstrap was the only other one and both halves are gone. So after #1448 the
`??` branch fires for **nobody**, in ten places, with reasons recorded for a
path nothing takes. That is `1xhc`: a branch that does not fire is
indistinguishable from one that passed. Nothing today separates "this fallback
is correct" from "this fallback is broken" — and the next instance to arrive
without a declaration is the one that finds out.

## Two candidate fixes, and they are NOT the same change

1. **Make the resolver refuse.** Replace `?? join(root, "translations")` with a
   throw naming the instance and the graph kind. Cheap, and it converts the
   `dh4f`-inverse silence into an error at the reader. But it deletes a
   documented third source that `folio_init` may be relying on for a
   freshly-scaffolded folio — CHECK `init-folio` before touching this, because
   a scaffolder that writes `translations/` before writing the declaration is
   exactly the caller the fallback exists for.
2. **Make the blindness a gate.** A check that walks disk for directories whose
   CONTENTS match a declared graph kind and are not declared. That is the
   general fix for `dh4f`-inverse and it subsumes this instance of it, but it is
   a much larger piece of work and it needs a rule for what counts as "matches
   a kind".

Fix 1 without answering the `folio_init` question would break scaffolding. Fix
2 without fix 1 leaves the silent-green in place until the gate ships.

## Done when

[ ] `init-folio` is read and it is settled whether the convention fallback has
    a live caller — a scaffolded folio that writes `translations/` before its
    declaration, or none
[ ] if none: the ten sites refuse rather than default, with the failure naming
    the instance root and `translation-sources`, falsified by removing
    cat-harness's declaration and confirming ten readers error rather than
    resolve
[ ] if there is a live caller: the fallback stays and its reason says WHO takes
    it, since a reason naming nobody is the `1xhc` state this bean reports
[ ] either way, the present-but-undeclared direction is stated somewhere a
    reader of `check:declared-dirs` will find it, because that check's name
    promises a symmetry it does not have

## NOT in scope

The general `dh4f`-inverse gate (fix 2). It is a separate bean's worth of work
and needs its own rule for kind-matching; folding it in here would let the
narrow, checkable half wait on the broad one.

## FALSIFIED by CI, 2026-09-27 — the fallback IS load-bearing, and #1448 is what takes it

This bean asserted:

> after #1448 the `??` branch fires for **nobody**, in ten places, with reasons
> recorded for a path nothing takes

**False.** #1448's own CI proved it within the hour. Three jobs went red on one
cause:

    $ bun run cat-harness/scripts/kg-locale-export.ts --check --instance ./bootstrap
    bootstrap graph per locale — source language en
    No locale directories under bootstrap/translations — refusing to call that clean.
    exit 2

`kg-locale-export.ts:172` is one of the ten sites. bootstrap declares no
`translation-sources` once #1448 removes the node, so `translationsRootFor`
takes the fallback, composes `bootstrap/translations`, finds nothing, and
`6tkl`'s refusal fires — correctly, on its own terms: *a per-locale build over
no locales asserts nothing.*

So the caller I said did not exist is `kg:locale:check:bootstrap`, wired into
`code-quality-gates.yml` and `feature-staging.yml`. Recorded rather than
edited out: the claim was reached by counting DECLARATIONS and disk
directories, and no count of either could have found a caller that reaches the
path by not declaring.

## What the falsification also settles

The fallback is not the thing to make refuse. It is standing in for a real
question this bean did not ask: **whose locale set is bootstrap's?**

`feature-staging.yml` records, from bean `jmpb`: *"Writes NOTHING today and
says so: measured 2026-09-22, no locale carries a catalogue applying to either
graph."* bootstrap never had `.po` catalogues — only the 15 `.pot` templates.
So the gate was green purely because five locale DIRECTORIES existed, and they
existed only because the templates sat in them. It asserted nothing about
content, and moving the templates removed the only thing holding it up.

That makes the `Done when` list above wrong in its framing. Superseded by:

[ ] decide whose locale set an instance that declares no `translation-sources`
    has — its own (none, so no per-locale export) or its host's
[ ] whichever is chosen, `kg-locale-export --instance ./bootstrap` distinguishes
    "declares no translation sources, so nothing to export" (a determined
    empty, exit 0) from "declares one and it is empty" (`6tkl`, exit 2). Today
    the fallback collapses the two, which is the actual defect and is NOT
    what this bean first described
[ ] only then decide whether the ten sites refuse, because the answer above
    tells you what they should refuse

The `init-folio` question stands and is now the second unknown, not the first.
