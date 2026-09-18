---
name: getting-started
description: Triage what a person means when they ask to create a folio, and route them. Five requests share one sentence — a folio in a new repo, folio-assistant overlaid on an existing repo, a second folio in an instance that already has one, a content object they called a folio, or something the filesystem cannot tell apart. Reads the repository facts, runs them through the folio-intent decision table, asks a selectable question for what facts cannot settle, scaffolds, and reports the published URL. Use whenever a user asks to create, start, set up, or initialise a folio, a paper, a DAK, an IG, or "folio-assistant" itself.
roles: [reader, collaborator, owner]
user_invocable: true
---

# /getting-started — what did they actually ask for?

Process: [`skills/workflows/getting-started.bpmn`](../../skills/workflows/getting-started.bpmn).
Decision table: [`decisions/folio-intent.dmn`](../../skills/workflows/decisions/folio-intent.dmn).

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
