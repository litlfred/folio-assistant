---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Voice editorial review'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/voice-editorial-review.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/voice-editorial-review.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/voice-editorial-review.md){: .fa-edit-source }

{% raw %}
# Voice editorial review

## The axis you are adjudicating

Six criteria in `content/pipeline/qa-criteria-registry.ts` describe one house
voice:

| criterion | what it matches | severity |
|---|---|---|
| `voice-status-leak` | status markers and derivation-status speech in body prose | critical |
| `voice-scholarly-default` | second-person address, lecturer-cadence openers, paper-past-tense narration | major |
| `voice-author-notes-pollution` | status banners, PR/commit refs, agent names, ISO dates | major |
| `voice-emoji-content` | emoji as content outside tables | major |
| `voice-first-person-work` | first-person work tone — "we'll add", "let me", "needs more work" | major |
| `voice-editorializing` | "surprisingly", "it is worth noting that", "rather than merely …" | minor |

They are **heuristics over phrase lists**. A match is a question, not a
verdict, which is why every one of them can be confirmed or overruled by a
reviewer entry on the same sidecar.

## The scoping question comes first, and it is usually the answer

Every criterion above was written for a **paper**: a scholarly artefact in
third person, where a status marker really is a leak of the work tracker into
the published text.

None of them carries `profiles` scoping today. So they also run over
`content/docs/` — documentation, where the genre's whole register is to address
the reader: *"you need `bun`, `latexmk` and Lean"* is a correct sentence in a
prerequisites page and a `voice-scholarly-default` match at the same time.

**Ask which is true before touching the prose:**

1. **The register is wrong for this genre.** Fix the passage.
2. **The criterion does not belong in this genre.** Add `profiles: ["paper"]`
   to it in the registry. One edit clears the finding for every document folio,
   now and in future, instead of one block at a time — and, unlike editing the
   prose, it leaves a record of *why* nobody should see it again.
3. **The criterion belongs and this block is an exception.** Record a reviewer
   entry on the sidecar saying why. It leads the criterion, so the block reads
   `pass` with the reasoning attached, and nothing is silently rewritten.

Option 2 is not a way of dodging a finding. Ten instances of one criterion
across ten guide pages is evidence about the criterion's scope, not about ten
authors.

## What the criterion cannot know

The checkers match text. They do not know what the page is *about*, and the
three highest-severity false positives in this repo all come from that:

- `voice-status-leak` on `what-is-not-built-yet.md:36` — `**Not yet
  implemented:**`. The page is a deliberate inventory of gaps; the phrase is
  its subject, not a leak.
- `voice-status-leak` on `how-to-read-them.md` and
  `the-work-plan-tasks-as-beans.md` — both describe the *work-plan lane of a
  BPMN diagram*. Prose about a to-do store contains the words of a to-do store.
- `voice-emoji-content` in `a-mock-session.md` and `step-4-formalize-in-lean.md`
  — the emoji sit inside a transcript of an agent session, quoted as data.

None of these is a writing defect. Each is a criterion reading a quotation as
an assertion, and the reviewer entry should say so in those words.

## Adjudicating one finding

1. **Open the block, not just the evidence line.** The sidecar quotes one line;
   the register is a property of the passage around it.
2. **Name the genre.** Paper, guide, reference, transcript. That decides which
   of the three outcomes applies before you read another word.
3. **Record the outcome where the next reader will find it** — a prose edit, a
   registry edit with `profiles`, or a reviewer entry. A finding that is simply
   left open teaches nobody anything, and it comes back on the next sweep.
4. **Re-run the sweep** — `bun run content/pipeline/qa-sweep.ts --root
   content/docs` — so the sidecar, the icon and the panel agree with what you
   decided.

## Where the open findings are

Tracked in the work plan, one bean per criterion, each carrying its blocks with
file, line and the matched text:

```sh
beans list | grep "Voice axis"
```

The evidence itself lives in `<block>.qa.json` beside each block, and is
published per block on the docs site: the `QA` icon opens the criterion, and
the criterion opens the witness that ruled on it — which checker, at which
`script_hash`, and whether the verdict still matches the file on disk.

## Do not

- **Do not edit prose to silence a criterion you believe is out of scope.**
  That hides the scoping defect and costs the next folio the same argument.
- **Do not mass-apply one finding's resolution across its siblings** without
  reading them. `voice-scholarly-default` fires ten times here on at least two
  different causes.
- **Do not treat `critical` as "fix first".** Severity ranks the criterion's
  authors' concern, not the confidence of this match; three of the four
  criticals in `content/docs/` are quotations.
- **Do not delete a finding from a sidecar.** The sweep rewrites its own
  entries; a hand-removed one comes back with no record that anyone looked.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Narrative review](../../processes/review-narrative.html) | Adjudicate the voice findings (calls a sub-process) |

