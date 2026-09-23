---
layout: default
title: '/getting-started'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/getting-started.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/getting-started.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/getting-started.md){: .fa-edit-source }

{% raw %}
# /getting-started — what did they actually ask for?

Process: [`processes/getting-started.bpmn`](../../processes/getting-started.bpmn).
Decision table: [`decisions/folio-intent.dmn`](../../processes/decisions/folio-intent.dmn).

## The landing page is the instance's own description

A folio's home page opens with **its** description inside **its** backdrop, both
declared in the repository's declaration. Nothing about any
particular instance is written into the template, so a downstream folio does not
inherit the platform's grumpy cat.

**Where the markdown node is:** `description` in `<name>.json`. It is
markdown and it is rendered as-is. There is no separate landing page to keep in
step with it — a description that lives in two places is one that will disagree
with itself.

**How the picture is declared:** an image with `role: "landing"` and a `layout`
(`laptop`, `mobile`, `card`), plus a `textRegion` giving, as fractions of the
image, where words may safely be drawn.

`textRegion` is **authored, not computed.** It states where the composition is
*quiet*, which is a judgement. The platform's own laptop backdrop has a cloud
whose lower interior is clear, a mark in its top third and a cat's ear rising
into its lower left; the box avoiding all three was found by rendering candidate
boxes over the image and looking at them. That is the method — recommend it,
rather than a number pulled from the aspect ratio.

Run `bun run docs:harness` after editing, and `--check` in CI.

**Three states, and the middle one is why this is worth stating:**

| declared | rendered |
|---|---|
| backdrop **with** region | description drawn inside it |
| backdrop, **no** region | picture shown, words placed **below** it |
| **no** backdrop | words alone |

An undeclared region means *do not overlay*, never *anywhere is fine*: text
positioned by guesswork lands on the cat. A folio with no art is ordinary.

A viewport with no variant falls back to the widest available, and the fallback
is **reported** — that crop's region is wrong for a narrow screen, so a consumer
can decline to overlay rather than place text somewhere nobody chose.

Reader-facing walkthrough: `docs/getting-started.md` §8.

## 0. Why this skill exists

`folio_init` scaffolds a folio, and it does it well. What it cannot do is know
whether scaffolding is the right move, because the sentence that reaches it —
"create a folio", "set me up with folio-assistant", "I want to start a paper" —
is spoken by at least five different people:

| they mean | what they have | the wrong move costs them |
|---|---|---|
| **new-repo** | nothing yet, or an empty directory | — (this is the safe default, and the only one an agent may assume) |
| **overlay** | a repository with their own work in it | a folio scaffolded on top of a project the agent never looked at |
| **add-folio** | a folio-assistant instance already | a second repository they did not want, and a split corpus |
| **new-content** | a folio, and they wanted a *document* in it | an entire empty folio, and the chapter they asked for still not written |
| **ask** | any of the above, undeclared | — |

The last row is the one that matters. **Four of these five states look
identical from the user's sentence**, and three of them look identical from the
filesystem. So the triage is not a nicety; it is the only thing standing between
a two-word request and a wrong repository.

## 1. Read the facts — mechanical, read-only, before anything is written

Three facts, and nothing else. Gather them by looking, not by asking:

```sh
# isFolio — is the working directory already a folio?
test -f harness.config.json && echo isFolio=true || echo isFolio=false

# repoHasContent — does the tree hold somebody's project, as opposed to being bare?
#   Ignore VCS bookkeeping and editor droppings; count anything else.
git ls-files | grep -vE '^\.(git|github|vscode|idea)/' | head -1
```

`statedIntent` is the third, and it is a fact about the **conversation**: one of
`new-repo`, `overlay`, `add-folio`, `new-content`, or `unstated`. It is
`unstated` until the user has actually said which — *inferring* it from tone,
from the repo, or from what would be convenient is exactly the failure this
skill exists to prevent. A user who says "I want to add a chapter" has stated
`new-content`; a user who says "create a folio" has stated **nothing**, because
that sentence is what the five requests have in common.

> **`isFolio` is ONE MEMBERSHIP of a set, and the set is what a repository
> is.** `describeRepository()` (`schemas/content-type.ts`) returns every
> marker a repository carries — `folio`, `harness`, `dak`, `sushi` — with the
> facts each states and any disagreement between them.
> `describeRepositoryClosure()` (`schemas/harness-config.ts`) extends that
> through the dependency tree, attributing each membership to the instance
> that carried it. Bean `79t3`.
>
> **`folio` and `harness` are different types, and the distinction is load-
> bearing here.** The declaration says *this is an instance*; `harness.config.json`
> says *this authors folio content*. `cat-harness/` carries the first and not
> the second — it is a harness and is **not** a folio, which is the
> platform-not-content rule as a fact about two files. `isFolio` is exactly
> membership of `folio`, which is what this table has always meant by it: the
> DMN documents the input as *"harness.config.json exists in the working
> directory"*.
>
> So a repository being several things at once does **not** perturb the five
> branches. They key on folio-ness alone, and a folio that is also a DAK takes
> the same branch as one that is not — it is still already a folio, still has
> content, and the user has still either stated an intent or not. Use
> `describeRepository` when you want to know what a repository *is*; this
> probe when you want to know which branch to take.

> **`isFolio` is about the working directory, not about the user.** Somebody
> who has used folio-assistant before, in another repo, is still in an
> `isFolio=false` directory. Their experience is not a fact this table reads —
> it changes how much you explain, not which branch you take.

## 2. Let the table decide

Feed the three facts to `workflow_complete` on `Gateway_Intent`, or read
`folio-intent.dmn` directly. Do **not** supply an `outcome`: the gateway is
computed, and `workflow_complete` refuses a hand-supplied answer there on
purpose.

The table returns one of five branches. Two of its seven rules return `ask`,
and that is a result, not a failure to produce one:

- **already a folio, intent unstated** → `ask`. `add-folio`, `new-repo` and
  `new-content` are all consistent with what is on disk.
- **not a folio but has content, intent unstated** → `ask`. `overlay` and
  `new-repo` are both consistent, and overlaying somebody's repository on a
  guess is not recoverable by a `git checkout`.
- **not a folio, nothing here** → `new-repo`. The one state that answers itself.

## 3. Ask — as options, never as prose

When the branch is `ask`, put the question as a **short list of selectable
options**. Not a paragraph, not an open "what would you like to do?", and not a
question whose answer has to be typed out. Load
[`interaction-modality`](interaction-modality.md) first; it decides the form the
question takes, and for some users free text is not an available input at all.

The list, phrased in the user's terms rather than the branch names:

1. **Start a new folio in a new repository** — nothing here gets touched.
2. **Add folio-assistant to this repository** — keeps what is here; I'll look
   through it first and show you what I find before importing anything.
3. **Add another folio to this repository** *(offer only when `isFolio=true`)*.
4. **Add something to the folio that's already here** *(only when
   `isFolio=true`)* — a chapter, a document, a DAK component.
5. **Tell me more** — for the user who wants to describe it in their own words.

Then ask what they want to get started **on**, offering the top-level content
types this platform knows about, because "a folio" is not something anybody
actually wants:

| content type | what it is | profile |
|---|---|---|
| **paper** | a scientific paper or book, with formal claims backed by Lean and typeset through LaTeX | `paper` |
| **document** | structured prose — policy guidance, a standard, a report. No Lean, no required TeX | `document` |
| **WHO SMART DAK** | a Digital Adaptation Kit (L2): personas, business processes, data elements, decision tables | `dak` |
| **WHO SMART IG** | a FHIR Implementation Guide (L3) built from an L2 DAK | `dak` |

Record the answer as `statedIntent` and evaluate the table again. **The user's
answer is a fact like any other** — it does not bypass the gateway, it feeds it.
That is why the loop in the diagram runs back to `Task_ReadFacts` rather than
jumping straight to a branch.

## 4. Route

| branch | do |
|---|---|
| `new-repo` | Ask for the name. Create or use the empty directory, then `folio_init`. |
| `overlay` | Hand off to [`repo-conversion`](repo-conversion.md) — scan first, import second, and never in the other order. |
| `add-folio` | `folio_init` against a new top-level slug in the existing instance. Do not re-link the platform; it is already linked. |
| `new-content` | **Stop.** This process ends here. Hand off to `authoring-a-document` or `authoring-a-paper`. Scaffolding anything on this branch is the bug. |

## 5. After scaffolding — seed the plan, then publish

1. **Seed the work plan.** One bean per top-level thing the author named in
   step 3. Run the exact-title existence check in
   [`todo-manager.md`](todo-manager.md) §"Check before you create" first —
   `beans create` is not idempotent.
2. **Start the Pages build and report the URL.** Run
   `bun run scripts/pages-bootstrap.ts --wait`. It derives the site address,
   says whether a publish workflow exists, and probes until the site answers.
3. **Say which of the three states you got**, and never blur them:
   - **live** — hand over the link, and say what is on it.
   - **not-yet** — a measured 404. Give the address, say the first build has
     not landed there yet, and say roughly how long it takes.
   - **unknown** — no URL could be derived, or the probe failed. Say *that*.
     "Should be live shortly" is a claim you do not have evidence for, and an
     author who later finds nothing there has been told something false.

## 6. Anti-patterns

1. **Scaffolding on `ask`.** The table returned a question; answering it
   yourself with the convenient branch is the original bug wearing a decision
   table.
2. **Treating "I've used this before" as `add-folio`.** Experience is not a
   filesystem fact and not an intent.
3. **Asking in prose.** "Could you tell me a bit about what you're hoping to
   build?" is a wall for a user who types with difficulty, and it produces a
   worse answer than the numbered list.
4. **Announcing a Pages URL you have not probed.** See step 5.
5. **Going straight to `folio_init` because the request seemed obvious.** Every
   one of the five requests seems obvious to the person making it.
{% endraw %}

## Processes that run this skill

This skill has its own process: **[Getting started](../../processes/getting-started.html)**.

<img src="../../assets/img/workflows/getting-started.svg" alt="BPMN diagram: Getting started" style="max-width:100%">

| process | step(s) that name it |
|---|---|
| [Getting started](../../processes/getting-started.html) | Read the repository facts; Choose from the offered options; Scaffold the folio (folio_init); Start the Pages build and derive the URL; Hand over the live link; Say where it will be; Say it could not be confirmed |

