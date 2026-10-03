---
# note on folio-assistant-9ofm from claude/9ofm-cutover-prereqs
$schema: folio-bean-note/v1
bean: folio-assistant-9ofm
branch: "claude/9ofm-cutover-prereqs"
created: "2026-10-03"
---
## Phase 3 measured: the cutover is ONE step, and two of its prerequisites are missing

I planned Phase 3 in four steps on issue #1850 and said step 2 was "flip ONE
declaration (`beans/defs`) to `storage.keyedBy: \"tip\"` … revertible by
reverting the declaration". I then measured it. **Four of that sentence's
claims are wrong**, and the ordering it implies would install a false green in
the session-start hook. The measurements, each reproducible on the stated
commit:

### 1. `beans/defs` is not the declaration the mount reads

`tipLocations()` resolves through `instanceRootsIn()`, and `beans/` is **not**
an instance root. On `main@4622dc2a73b5`:

```
instance roots: [root, bootstrap, bootstrap-tools, cat-harness, cat-harness-tools,
                 fhir-harness, folio-assistant-core, folio-assistant-sci,
                 smart-base, smart-ig, smart-immunizations, smart-trust,
                 who-iris, who-style-guide]
```

`beans/beans.json`'s five entries (`defs`, `archive`, `notes`, `workflows`,
`surveys`) are a **nested** graph declaration that `tipLocations` never sees.
The entry it does see is `folio-assistant.json`'s `beans`, at path `beans/` —
moved there by placement PR0 (bean `ejye`) because the directory belongs to the
checkout. So the flip target is the whole `beans/` tree, 1389 files, and **a
flip of just `defs` is not available at this layer.** It is all five
sub-directories or none.

### 2. The flip and the `git rm` are the SAME step. There is no revertible half

`mountTip` refuses a path the checkout still tracks — deliberately, and its
refusal says why:

```
$ bun cat-harness/scripts/branch-store.ts mount --id beans     # rc=5
branch-store: mount beans: refused: beans is still tracked on this checkout's
branch, so beans has not been cut over to cat/cat-harness/beans; mount it
elsewhere with --into
```

So "declaration flipped, files still on `main`" is not a halfway state the
machinery admits; it is a state it names as *not cut over*. The cutover is one
commit — declaration + `git rm` of 1389 files + `.gitignore` + `.beans.yml` —
and it is irreversible in the sense that matters: afterwards the only copy of
the work plan is the branch. **I am not doing it, and I will not propose doing
it, until the prerequisites below are green and the owner says go.**

### 3. On today's `main` the flip produces a FALSE GREEN in the session-start hook

Same flipped declaration, same commit, the two implementations `main` carries
disagree:

| command | verdict | exit |
|---|---|---|
| `branch-store.ts mount --id beans` (#1957) | `refused` — "has not been cut over" | **5** |
| `state-mount.ts` (#1982, what the hook calls) | "Mounted `state/` … mounted at e79e6f10" | **0** |

`state-mount.ts` mounts the **branch root** at `state/` — the pre-ruling D4(a)
shape — so it reports success having mounted a detached copy that no reader
reads, for a graph the per-directory mount correctly refuses. That is rule
`1xhc` exactly: a step that did not fire looks like one that passed. The
session-start sweep calls it with `|| true`, so the exit code is the only
carrier, and it is 0.

**On #2001's head (`db24e34602`) the same flip is honest** — rc=**1**, the graph
named, the reason carried through verbatim:

> 🛑 **THE STATE MOUNT FAILED FOR 1 OF 1 GRAPH(S) — do not trust an empty work-plan.**
> | `beans` | `cat/cat-harness/beans` | `beans` | 🛑 refused | beans is still tracked … |

So **#2001 is a hard prerequisite** of any flip, not a parallel nicety. #2001
says the flip "is Phase 3, bean `9ofm`" and declines to do it; this note is the
other half of that handshake, and the reason the order is #2001 **first**.

### 4. Flipping blinds two gates over 1389 files — and #1987 does not fix it

Both presence checks treat `storage.branch` as "stop looking":

- `check-declared-dirs.ts:134` — `if (e.storage?.branch) continue;`
- `audit-coverage.ts:342` — `if (d.storage?.branch) { stored++; continue; }`

Both reason **correctly for a commit-keyed `qa` directory**, where the checkout
copy is an artefact of whether `qa:fetch` ran, and counting it would make the
report "a measurement of the contributor's last command". That reasoning does
not carry to a **tip-keyed** graph: a tip-keyed mount is deterministic, so
absence is a *failed mount* (a finding) rather than the declared state, and
presence is 1389 real files rather than an unknown working copy. As written,
the flip would drop the entire work plan out of the presence check and the
coverage census silently.

#1987 generalises the skip to `contentIsOffCheckout(e)` for `source.kind:
"branch"` and the legacy `storage`. It is the right generalisation of the
predicate and **keeps it a skip**, so the blinding survives #1987 unchanged.
The fix composes with it rather than competing: the question becomes "off the
checkout *and* not determinable" versus "off the checkout and mounted".

## The ordering this replaces the #1850 plan with

| row | what | state |
|---|---|---|
| A | `state:mount` must not report success for a graph that is not cut over | **#2001**, open and RFR — not my work |
| B | presence check + coverage census **redirect** to the branch for a tip-keyed graph instead of going silent | unclaimed, unblocked, composes with #1987 — **this PR** |
| C | a drift gate: the branch's `beans/` subtree equals `main`'s, else the seed is stale and the cutover loses or resurrects work | unblocked — **this PR** |
| D… | the §4 readers resolve through the declaration, preferring a mount, falling back to the checkout, so the flip is a no-op for correctness | after A |
| last | the cutover (one commit, irreversible) | **owner's go** |

Row C is not bookkeeping. The seed I built for step 1 was **173 commits and 14
files stale** by the time I came back to it, and I refreshed it by hand; nothing
would have told me. A stale seed at cutover does not fail — it silently
resurrects 14 files' worth of superseded work plan and loses whatever landed
since.

## What this PR does NOT do

No declaration is flipped. `.beans.yml` is untouched. Nothing is `git rm`ed.
Every change here is a gate learning to tell "could not determine" from "pass",
which is worth having whether or not the cutover ever happens.
