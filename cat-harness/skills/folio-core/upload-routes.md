---
name: upload-routes
description: >
  How a file actually REACHES `uploads/` — the two mechanisms that write bytes
  into a declared queue, the persona that performs one of them on somebody's
  behalf, and what each writer owes that the route does not do for them. The
  step before intake and after acquisition.
---

# Two mechanisms and a persona

[`content-acquisition`](content-acquisition.md) decides *what channel* a
resource comes in on — a file, a link, or a description somebody gives in
their own words. This skill starts one step later, where the answer was **a
file**, and asks the question nothing here answered until 2026-09-30: **what
writes the bytes into the declared queue, and what does the writer owe?**

It ends the moment the file is in the queue. [`uploads-watch`](uploads-watch.md)
notices it arrived; [`library-ingestion`](library-ingestion.md) and
`document-intake` take it from there.

## The answer is two, not three, and the third is a persona

The routes look like three because that is how they are described: *a git
commit*, *a file handed to an agent in a conversation*, *the GitHub web UI*.
Measured against how files have actually reached a queue in this repository,
**two of those write bytes and the middle one does not**. An agent handed a
file in a conversation makes a git commit; it is route 1 performed by a
different actor.

Saying so is not a tidying-up. It changes what you check: a persona inherits
every obligation of the mechanism it performs, so the question about an agent
is never *"what are the agent's rules"* but *"did the agent discharge the git
route's, and what does it owe on top?"* Treating it as a third route invites
a third, shorter list.

**What the persona owes on top is real, and it is the one thing the other two
carry for free.** A commit records its own author and message; a web upload
records the account that made it. Neither records *"this arrived in a
conversation, from this person, for this reason"* — that fact exists nowhere
but the session, and the session is ephemeral. If the agent does not write it
down at the moment of placing the file, it is gone.

**Measured, and the measurement is the argument for the obligation rather than
against it:** across both declared queues on `origin/main` (2026-09-30), **0 of
56** files carry an intake record — 49 in `uploads/`, 7 in
`cat-harness/uploads/`, `0` files named `intake.json`, `0` per-document
subdirectories, against the `uploads/<document-id>/intake.json` convention
`document-intake` documents. So the provenance gap is not the agent route's
alone; it is every route's. What is specific to the agent is that **for the
other two a commit exists to go back to, and for a conversation nothing does.**

## Route 1 — a git commit from a working tree

`git add` the file under the queue, commit, push, open a PR.

**What the route does for you: nothing automatically, and everything you run.**
A working tree is where the pre-commit hook runs and where `bun run gates`
runs. That is the whole of route 1's advantage and it is entirely conditional
on your running them.

**What you owe.**

| | |
|---|---|
| put it in the **declared** queue of the instance that will own it | see §"Which queue" — there are two, and they are different instances' |
| run the generators the file stales | `uploads/README.md` is generated and lists **every file**, so any addition stales it. `bun run readme:subgraphs`, then `bun run gates` for the rest |
| open a PR | so CI judges it, and so a sibling session can see the queue grew |
| record where it came from | the commit message is the only place this route has for it |

**You do not owe ingestion.** Placing and ingesting are different acts by
different skills, and `uploads-watch` is explicit that a drop is somebody
handing over a file, not an instruction to publish it.

## Route 2 — the forge's web UI

GitHub's **"Add files via upload"**. Never write the URL by hand — run
`bun run cat-harness/scripts/upload-url.ts [branch]`, which composes it from
the declaration. A hand-written one 404'd for the owner on 2026-09-20, because
the declared path `uploads/` is relative to the *instance* and a forge URL
needs it relative to the *repository*.

**What the route does for you: strictly less than route 1, and the difference
is not a matter of care.** There is no working tree, so there is **no
pre-commit hook and no generator run** — not "you might forget", but *there is
nowhere for them to run*. The commit is minted server-side from the bytes you
selected and nothing else.

**Two hazards, both measured over this repository's whole history on
`origin/main`, 2026-09-30.**

**It commits to the path you are LOOKING at.** Of **16** `Add files via upload`
commits, **10** put their files at the repository root — outside any declared
queue — and one landed in `schemas/`. Only 5 reached a queue. A file outside the
declared queue is not "nearly there": every consumer resolves the queue from the
declaration, so it reads as absent while sitting on disk. This is bean `eq01`,
which tidied one batch and said in its last line that the habit was not fixed.

**It lets you commit to any branch, including the default one.** **3 of the 16**
did — `c8349950fa5`, `f4ddfc65c8d`, `b8549160bb1`, each a single-parent commit
on `main`'s first-parent line, each authored `Carl Leitner` and committed by
`GitHub`. The other 13 went to a branch and reached `main` through a merge,
where CI ran. A commit straight to `main` skips the PR, which is the only place
CI would have run — so on that route the two bypasses compound: no hook
*locally*, and no CI *remotely*.

**What that costs, measured on the most recent one.** `c8349950fa5` added three
PDFs to `uploads/` at 00:17. `uploads/README.md` lists every file in the queue
and is generated, so those three rows were missing from it the moment the
commit landed, and `readme:subgraphs:check` — a blocking step in
`code-quality-gates.yml` — was red on the default branch. It was repaired 27
minutes later by `606dc86d883`, *"Regenerate after merging main …"*, a commit
about something else entirely, whose diff to that README is exactly the three
missing rows. **The repair landed on somebody else's change**, which is the
same shape `skill-registration` describes: the author who sees the failure is
whoever opens the next pull request.

**What you owe.** Everything route 1 owes, discharged afterwards from a
checkout, because the web UI cannot discharge any of it:

1. choose the **branch**, not `main`, unless you are also going to run the
   generators immediately;
2. navigate to the **declared queue directory** before uploading, not to the
   repository root;
3. pull, run `bun run readme:subgraphs` and `bun run gates`, and push the
   result — or ask an agent to, which is the persona below.

## The persona — a file handed to an agent in a conversation

This is route 1, performed by an agent. It inherits every obligation above.
Three things are the agent's own:

**Materialise the bytes before anything else.** A file that exists only in the
conversation exists nowhere the repository can see. Write it into the declared
queue under a name that will still mean something — the filenames that arrived
through the web UI include `ChatGPT Image Sep 20, 2026, 08_26_47 AM.png` and
`d1a26515-9bde-455d-84bc-2e5fc196b004.png`, and two files with names like those
turned out to be byte-identical (bean `eq01`, sha256 `30dad51dfc691587…`).

**Write down what the conversation knows and the commit does not** — who
provided it, when, what they said it was, and why it was wanted. Put it in the
commit message at minimum. This is the obligation the other two routes do not
have, and it is the reason to keep the persona named even though it is not a
mechanism.

**Do not ingest on your own say-so, and do not delete.** Both are other
skills' decisions — [`library-ingestion`](library-ingestion.md) and
[`deletion-requires-confirmation`](deletion-requires-confirmation.md). A
processed upload still looks spent and still is not.

## What the routes are NOT responsible for

The same three for every route, stated once so no route's section can quietly
shorten the list:

- **deciding the file belongs in the corpus.** That is acquisition's question,
  answered before this step.
- **ingestion.** A file in the queue is a file in the queue; `library/` is a
  judgement call somebody else owns.
- **cleaning the queue.** `uploads/` is the raw record of what was handed over
  and a derived `library/` entry does not replace it.

## Which queue — there are two, and they belong to different instances

`origin/main` carries **`uploads/`** (declared by the `folio-assistant`
instance at the repository root, 49 files) and **`cat-harness/uploads/`**
(declared by the `cat-harness` instance, 7 files). They are not one directory
declared twice: they are two instances' queues that share an id, and the
generated `uploads/README.md` says so in its own first paragraph.

So **"put it in `uploads/`" is not an instruction** — it does not say whose.
Resolve the queue from the declaration of the instance that will own the
material, which is what `queueRepoRelative` in `scripts/upload-url.ts` does and
what the `upload-url` Tool exposes. Pass that instance's root; do not paste a
path.

## Unsettled, and stated rather than decided

**Which instance owns a given file.** Two declared queues exist and nothing
states the rule for choosing between them. Bean `eq01` was closed on the
owner's *"only one uploads/ needed"* (2026-09-20) and the repository now has
two — the root one is declared, so it is legitimate by declaration, and the
decision it contradicts was never revisited. Today the honest answer is: ask,
or follow whatever the surrounding work already uses.

**Whether an arrival should be refused when it carries no intake record.** 0 of
56 files carry one. A gate would redden `main` on arrival, which is the
opposite of accepting what somebody offers ([`content-acquisition`](content-acquisition.md):
*"do not make them follow a process to hand you something they already
have"*). Whether the record is owed by the placer or minted by intake is
undecided here, deliberately — it is a rule with a cost and the owner has not
been asked.
