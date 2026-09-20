---
layout: default
title: The platform's own gates
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/platform-gates.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/platform-gates.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/platform-gates.md){: .fa-edit-source }

{% raw %}
# The platform's own gates — run what CI will run

**One command:**

```sh
bun run gates          # the fast set
bun run gates --all    # plus the jobs that need a browser
bun run gates:list     # see them without running them
```

Run it **before you push**, not after CI tells you.

---

## Why this skill does not contain a list of gates

Because a list here would be wrong within a week, and a wrong list is worse
than none: it reads as authoritative, so nobody checks it.

`bun run gates` derives the set from `.github/workflows/code-quality-gates.yml`
at the moment you run it. Add a gate to CI and it is in your next local sweep
with nothing to update here.

**This is not a hypothetical drift.** The agent who wrote this skill had spent
that session running **17** gates by hand, repeatedly, and reporting them as
"the gate sweep" in commit messages and PR bodies. The workflow runs about
**thirty**. The hand-list was a guess that read as coverage — and the
difference included `check:tools`, `check:voices`, `kg:schema:check`,
`readme:audit` and `agent-memory:check`, none of which had been run once.

---

## Why the CI workflow is the authority, and `package.json` is not

The failure being prevented is specifically **green here, red in CI**. So the
question is not *"what checks exist"* — it is *"what will CI run against my
change"*. Only the workflow knows that.

`package.json` over-answers it. Measured 2026-09-19: of 33 `check:` / `:check`
scripts, **21 appeared in no workflow at all**. Running everything registered
would fail you on things CI does not gate. The workflow's own comments name
six it deliberately excludes, each with a reason — `check:ci-health` is a
report rather than a gate and describes `main` rather than your diff;
`check:corpus-gate` needs a folio the platform does not carry;
`check:upstream-pins` runs weekly on its own schedule.

Those reasons live in the workflow, next to the exclusion. Read them there.

---

## `bun test` green is not the gates green

They come apart in practice, and the gap is the whole reason this exists.
Measured 2026-09-19 on one change:

| what ran | result |
|---|---|
| `bun test` | 2891 pass, 0 fail |
| `tsc --noEmit` | **failed** — a readonly array from `as const` |
| `check:schema-nodes` | **failed** — a new module with no `@graphNode` tag |

The third also broke a QA sidecar comparison, so **one cause produced two
symptoms in different gates**. An agent running only the test suite would have
pushed all three and learned about them from a red PR.

---

## ...and the gates green is not the PUBLISHED PAGE green

The section above is one step of a ladder, and the step after it is the one that
ships a broken site. Measured 2026-09-20 on a single change:

| what ran | result |
|---|---|
| `bun test` | 3517 pass, 0 fail |
| `eslint`, `tsc --noEmit` | clean |
| twelve `*:check` gates | all green |
| e2e **and** accessibility suites | pass |
| the actual published `index.html` | **3 escaped `<article>` tags, 0 real** |

A Liquid `{% endif -%}` in `docs/_includes/landing.html` right-stripped the
newline before the next attribute. The emitted tag had two attributes with no
separator between them, `index.md` is markdown, so Kramdown refused the block as
HTML and escaped the whole of it — the live landing page printed
`&lt;article class="fa-sticky …"` as visible words and every sticky rule was
dead.

**Not one of those gates was wrong.** They all read a **source**, and the source
was valid HTML. The defect exists only in the markdown converter's output, so
nothing readable from a checkout could see it.

Two things follow, and the second is the one to act on:

- **Gate coverage is bounded by what a gate can look at.** A repository can have
  a dense wall of green checks and no check at all on the artefact a reader
  loads. Ask what the gates *read*, not how many there are.
- **When your change alters a rendered page, build the page.** The site build is
  not in the fast loop and there is no `*:check` twin for "the output is
  well-formed" — `check:escaped-markup` now asks one narrow version of that
  question, and only in `docs-site.yml`, where `_site/` exists. If the real build
  will not run locally (the `just-the-docs` remote theme 403s through the agent
  proxy), stub the **theme** and build anyway; never substitute the thing under
  test. `continual-progress` §"A template is not a page" carries the discipline.

---

## Fast versus full, and why the split is not a judgement call

It is job membership in the workflow, read at run time.

- **fast** — the `typescript` job. No browser. This is the inner loop.
- **`--all`** — adds the jobs that install Chromium. `render:bpmn:check` is
  there because bpmn-js renders through a browser.

That last one is worth knowing about: it once passed "locally" only because a
browser had been staged earlier in the same session. Green on that machine,
red on a clean runner — the exact gap these gates close, inside the gate
tooling itself.

---

## What a `*:check` failure is telling you

Most of these gates compare a **committed artefact** against what its
**generator** would produce now. A red one almost never means "the artefact is
wrong". It means **you changed an input and did not regenerate**.

So the fix is to run the generator and commit its output — never to hand-edit
the artefact into agreement. Hand-editing makes this run green and the next
regeneration noisy, and it silently detaches the artefact from its source.

Each `*:check` script has a generator beside it under the same stem; `bun run
gates:list` shows the check, and the script it checks is named in the check's
own output when it fails.

---

## Three things this skill will not do for you

**It does not replace reading the failure.** The runner names the failing
command and the CI step it belongs to, so a local failure and a red PR are
findable by the same string. Read what the gate printed.

**It does not tell you a gate is wrong.** A gate whose purpose you cannot state
gets "fixed" by being made to pass, which is how a check becomes decoration.
Every gate in that workflow carries a comment saying what it caught and when.
If you think one is wrong, that comment is what you are arguing with.

**It does not make `--all` optional before a push that touches a diagram.**
Anything under `skills/workflows/` changes a rendered SVG, and the check for
that is in the browser job.

---

## If `bun run gates` reports no gates

It **fails** rather than exiting clean, and that is deliberate. An empty sweep
that exits 0 is indistinguishable from a passing one — the defect this
repository has paid for three separate times: a `grep` over zero Lean files
printing OK, a `ruff` scan of missing paths reporting a clean baseline it had
never computed, and `readme:sync:check` passing over a README with no markers.

A filter over nothing passes. If you see that refusal, the workflow was
renamed or restructured and the reader needs fixing — not the gate list.

---

## Related

| | |
|---|---|
| `.github/workflows/code-quality-gates.yml` | the authority, with a comment per gate saying what it caught |
| `scripts/gates.ts` | the reader, and the vacuity guard |
| [`continual-progress`](continual-progress.md) | commit early, open the PR at the first commit — this is the step before the push |
| [`prepare-merge`](prepare-merge.md) | the pre-merge recipe, which runs these plus content-type gates |
| [`ci-health`](ci-health.md) | whether the workflows themselves are working — a different question |
{% endraw %}
