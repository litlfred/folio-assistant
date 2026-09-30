---
# folio-assistant-tlj9
title: 'PARENT INTEGRITY: a bean''s body names a parent its front matter does not carry (4ccr), so a goal''s open count is wrong'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T11:33:55Z
updated_at: 2026-09-30T15:07:40Z
parent: folio-assistant-ahvw
---

## The finding, and how it was measured

`beans/defs/folio-assistant-4ccr--*.md` is an epic — *"WIREFRAME FINDINGS:
usability and accessibility defects the as-is wireframes observed (#1023)"*. Its
front matter carries **no `parent` field**. Its body, line 19, says in prose:

> It belongs to the rendered-surface stream, `folio-assistant-10uc` (navbar,
> visualisers, stickies).

`10uc` is *"STREAM 2/3: GOAL 2 — the rendered surface"*, itself parented to
`p5wm`, which is GOAL 2. So the bean states its own placement in a sentence and
declares nothing, which means every consumer that walks `parent` — a goal's open
count, a roadmap, this review's own queue — omits `4ccr` and everything under
it from GOAL 2.

Provenance: read out of the two files on `claude/cool-fermi-htir5p` at parity
with `origin/main`, 2026-09-30. Nothing here is inferred from a count printed by
a tool.

## Why it is not just a typo in one bean

The same shape has now been paid for three times in three days, each time with a
different carrier and the same mechanism — **a declaration and its subject
drift, and nothing compares them**:

| carrier | declares | subject | caught by |
|---|---|---|---|
| bean front matter | `parent` | the body's own prose | nothing |
| script docblock | `@covers <kind>` | the directories the script resolves | nothing (bean `z6xd`) |
| script docblock | *"nothing runs `--check` in CI"* | `code-quality-gates.yml` | nothing (bean `q885`) |
| `AGENTS.md` | claims about code | the code | `check:agents-claims` |

The last row is the precedent: bean `77ex` established exactly this for
`AGENTS.md` and shipped a checker. The three above are the same defect one layer
in, on carriers that checker does not read.

**What this bean does NOT claim.** The three carriers need three different
parsers — front matter is YAML, `@covers` is a docblock tag, the CI claim is
prose. They share the *shape*, not the mechanism, so this is not a request for
one check over all three. Rolling them into one would be the
over-generalisation `generalise-the-fix` warns about.

## Done when

1. `4ccr` carries `parent: folio-assistant-10uc`, or a recorded reason why the
   prose is wrong and the empty parent is right. **This changes GOAL 2's open
   count, so it is the owner's call, not this bean's** — see the review that
   opened it.
2. A check fails on a bean whose body names `folio-assistant-<id>` as its parent
   in prose while its front matter carries a different parent or none. Scoped to
   that one phrasing, because a detector recognising one form and calling the
   corpus clean is the `vq8g` defect.
3. The check is falsified before it ships: plant the defect on a scratch bean,
   watch it fire, restore, watch it pass.


---

## 2026-09-30 — Done-when #1 done, by the owner's ruling

The owner chose, from four options: *"Reparent 4ccr, then gate ob3m + generalise
v8n5"*. So `4ccr` now carries `parent: folio-assistant-10uc`.

**Measured before and after, not asserted.** GOAL 2 (`p5wm`) went from
**38 descendants / 28 open** to **68 / 52** — the +24 predicted from `4ccr`'s
own subtree (29 descendants, 23 open, plus `4ccr` itself). The prediction and
the result agree, which is the only reason to trust either.

`10uc`'s title still reads *"39 open beans"*, matching neither figure. That is a
count in prose, which is a claim rather than evidence — left for whoever owns
`10uc` rather than edited here.

Done-when #2 (a check for a bean whose body names a parent its front matter does
not carry) and #3 (its falsification) remain open.


---

## 2026-09-30, later — the reparent is BLOCKED, and the blocker is a second instance of this bean's own defect

The owner ruled "reparent 4ccr". I did, CI went red, and the reason is
`check:bean-parents`:

    ✗ folio-assistant-4ccr: `parent: folio-assistant-10uc` is a task,
      not a milestone, epic or feature

Reverted, and `check:bean-parents` is back to exit 0. **The ruling is not
carried out** and must not be recorded as done.

### Why no target works, measured

`check-bean-parents.ts` permits a parent of type `milestone`, `epic` or
`feature`, and adds one rule for epics: *"AN EPIC HANGS FROM A GOAL, and from
nothing else"* — `b.type === "epic"` requires `p.type === "milestone"`.

| bean | type | usable as `4ccr`'s parent? |
|---|---|---|
| `4ccr` | **epic** | — its parent must be a `milestone` |
| `10uc` | **task** | no: `task` is not a permitted parent type at all |
| `p5wm` (GOAL 2) | **bug** | no |
| `yg29` (GOAL 3) | **bug** | no |
| `vuip` (GOAL 1) | `milestone` | yes by type, wrong goal |

So GOAL 2 has **no milestone anywhere in its line**, and an epic cannot hang
from anything else.

### The finding, and it is this bean's own class again

`todo-manager` §"A GOAL is a `milestone` bean" is quoted by the check's own
error message. `p5wm` is titled *"GOAL 2: ..."* and typed **`bug`**; `yg29` is
titled *"GOAL 3: ..."* and typed **`bug`**. Only `vuip` is a `milestone`.

That is exactly this bean's subject — **a declaration and its subject drift, and
nothing compares them** — one level up: the title says GOAL, the type says bug,
and `check:bean-parents` only notices when something tries to hang off it. Two
of the three goals this session's review was organised around are not, to the
store, goals at all.

### Not fixed here, deliberately

Every route requires retyping a bean that is not mine and reshapes the roadmap:
retype `p5wm` to `milestone` (then `4ccr` hangs off it directly), or retype
`4ccr` to `feature` **and** `10uc` to `epic`. The owner's ruling authorised a
reparent, not a retype, and `bean-coordination` does not let an agent decide
another bean's type on its own initiative. Put to the owner instead.

---

## 2026-09-30, third pass — CORRECTION: the table above is wrong, and the reparent is done

**Done-when #1 is done.** `4ccr` carries `parent: folio-assistant-p5wm` and
`check:bean-parents` exits 0.

### The table in the section above is wrong, and so was the reason I reverted

It said `p5wm` (GOAL 2) is `type: bug` with `parent: folio-assistant-ahvw`, and
concluded GOAL 2 had no milestone in its line. Read by exact path, every goal is
a milestone with no parent:

| bean | type | parent |
|---|---|---|
| `p5wm` (GOAL 2) | **milestone** | — |
| `yg29` (GOAL 3) | **milestone** | — |
| `vuip` (GOAL 1) | **milestone** | — |
| `10uc` | `task` | `p5wm` |

So an epic could hang from `p5wm` all along. **No retype of anything was
needed**, and the owner's ruling was never blocked by the store's shape.

### How the wrong table was produced

`glob("beans/defs/*p5wm*.md")[0]` matched
`folio-assistant-k59d--milestone-critical-paths-go-stale-p5wm-and-yg29-bo.md`
— a bean whose TITLE mentions `p5wm` and `yg29`, sorted before the real file.
Every "p5wm" fact in that table is `k59d`'s front matter: `type: bug`,
`parent: ahvw`. The same glob then RETYPED `k59d` to `milestone`, which
`check:bean-parents` caught immediately (*"a `milestone` hangs below a `epic`"*)
— the check found my edit before I did. `k59d` is restored to `bug`.

**Fifth wrong-instrument error in this session, and the same shape every time:**
a plausible-looking accessor substituted for the exact one — `get_status` for
CI (returns `total_count: 0` here), a `<dir>/<dir>.json` glob for instances,
`graphs` for `graphKinds`, the `images` namespace for the glyph registry, and
now a substring glob for a bean id. Four of the five produced a *confident
wrong number* rather than an error, which is what makes the class dangerous.

The one true part of the earlier diagnosis survives: **`10uc` is a `task`**, and
a task is not a permitted parent type. That is why `parent: 10uc` failed. The
remedy was simply the goal itself.

### Measured now

GOAL 2: **69 descendants, 49 open.** Not the 52 quoted earlier — that was
computed before merging main, which has since landed more beans and completed
others. The figure moves with main; 49 is what it is on this head.

`check:bean-parents`, `check:bean-bodies`, `check:bean-front-matter`,
`readme:subgraphs:check`, `check:navbar-consistency:check` and
`audit:coverage:require-all` all pass.

---

## 2026-09-30 — Done-when #2 and #3 delivered, and the check found a defect I had just created

`bun run check:bean-parent-prose`, wired as `check:bean-parent-prose:check`.

### The scope is a MEASUREMENT, not a preference

Bean bodies cross-reference each other constantly, so the risk was never
missing a defect — it was a detector that fires across the store:

| | |
|---|---|
| beans read | 496 |
| bodies naming at least one bean id | **113** (22 %) |
| id mentions in bodies | **338** |
| ...inside a placement phrase | **1** |

That last ratio is the check's justification and is printed on every run, with a
test that fails if placement claims ever reach a tenth of all mentions — the
signal the phrase set has stopped discriminating, whose remedy is to narrow the
phrases rather than accept the noise. The phrases are the ones that ASSERT
placement: *belongs to/under*, *parent is*, *should hang from*, *parented to*,
*sits under*, each requiring the id within ~60 characters.

### Quotations are not claims, and that was not hypothetical

The raw phrase set found **2** sites. The second was **this bean**, whose body
quotes `4ccr`'s sentence as evidence — so without the blockquote skip the bean
reporting the defect reports itself. Blockquote and fenced lines are dropped
first, which takes the candidate set to 1.

### It immediately found a live defect, and the defect was mine

With the skip in place the one remaining finding was:

    ✗ folio-assistant-4ccr: body says it belongs to/under folio-assistant-10uc
        front matter declares folio-assistant-p5wm

**My own reparent created it.** The owner's ruling moved `4ccr` to `p5wm`; I
changed the front matter and left the prose saying `10uc`. The bean about
prose-vs-front-matter drift produced prose-vs-front-matter drift within hours.
`4ccr`'s sentence now states its real parent, why it hangs from `p5wm` rather
than the `10uc` stream it belongs to by subject (`check:bean-parents` requires
an epic to hang from a `milestone`, and `10uc` is a `task`), and points at this
check.

### One reader of the store

It uses `readBeans` from `scripts/beans.ts`. `check-bean-parents.ts`'s own
import comment records why that matters: every other script had grown its own
front-matter parser and its own `beanDefsDir`. `BeanNode` already carries `id`,
`parent` **and** `body`, so nothing is re-parsed — and `beansIn` is
deliberately non-recursive, so `beans/defs/archive/` (631 terminal beans, its
own declaration, its own reader) cannot fold into the count. A directory walk
here would have swept them in; a test asserts the import and the absence of
`readdirSync`.

**A first draft imported `beanDefsDirs` from `schemas/bean-graph.ts`. No such
export exists** — invented, and caught before running. That is the same
wrong-instrument class as the six earlier in this session, and the fix was the
same: find the one answer and call it.

### Falsified four ways

| planted | verdict |
|---|---|
| prose disagreeing with the front matter | exit **1**, naming both values |
| prose AGREEING | exit **0**, still counted as a claim checked |
| the same claim inside a blockquote | not counted at all |
| the corrected store | exit **0** |

An empty domain is reported as a **determined empty rather than a clean sweep**
— the distinction `check:instance-themes` draws, and it matters here because the
corrected store now has zero placement claims, so "0 disagreements" is a fact
about the domain and not about the store.

## Done when
- [x] `4ccr` carries a parent — `p5wm`, by the owner's ruling, merged in #1623
- [x] a check fails on a bean whose body names a parent its front matter does
      not carry, scoped to one phrasing family with the ratio to justify it
- [x] falsified before shipping — four directions, above
