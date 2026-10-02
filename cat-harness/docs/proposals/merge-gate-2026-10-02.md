---
title: "Merge gate: adversarial review and compile gates"
kind: proposal
summary: >-
  Proposed 2026-10-02: what a merge to main must PROVE, beyond green CI. An
  independent agentic adversarial review of any agent-touched change with a
  committed verdict, a closed RED FLAG taxonomy that blocks until resolved or
  overridden on the record, content-type compile gates (Lean, SUSHI/IG AST,
  JSON-LD + schema) scoped by changed path, and the same review run per content
  block so the corpus can be backfilled. Research, design and a reading list;
  nothing is built.
---

# Merge gate: adversarial review and compile gates
{: .no_toc }

**Status:** proposal. **Nothing is built and no workflow is changed.** Epic bean
`folio-assistant-nok9`, with children `w8jq` (the review gate), `xqdi`
(compile gates), `abmq` (RED FLAG taxonomy and verdict shape), `lvlv`
(per-block backfill) and `u7be` (merge-steward gaps measured today). Reading
list: [merge-gate-reading-list](merge-gate-reading-list.html); the numbers in
square brackets below, such as [R5], refer to its items.

1. TOC
{:toc}

---

## 1. The ask

Owner, 2026-10-02:

> need to update the Merge Manager skills/process/tools so that it gates things:
> full agentic adversarial software code review on changes done by >= 1 agent;
> no blocking RED FLAGS from any agentic review; (if math content block) any
> lean changes compile; (if FHIR IG) sushi/IG AST compiles; json(ld)+schema for
> the KG renders (downstream renders such as just-the-docs are NOT blockers);
> etc. need to research best practices here. document methodologies. generate
> list of links to open access lit for uploading. similarly we need these QA
> reviews at the level of content blocks (e.g. tools, but also schemas,
> guidance etc.) so that we can backfill.

## 2. What exists today, measured 2026-10-02

| piece | what it does | what it does NOT do |
|---|---|---|
| `code-quality-gates.yml` | the CI gate set; `gates.ts` derives its list from it | no review verdict is read; no path-scoped compile gate for Lean or SUSHI in this repo (the platform holds zero `.lean` and zero `.fsh` files, so `lean-bare-import` skips) |
| `merge_group:` trigger | tests exactly the commit that will land | **cannot fire.** Bean `1hjm`: GitHub merge queues need an organization-owned repository, and `litlfred/folio-assistant` is user-owned. This is why the merge steward builds merge trains by hand |
| `merge-base.ts` / `merge-base.bpmn` (bean `d33q`) | resolves only DECLARED conflict patterns, then `regen` must report nothing unrepaired | the "resolve by hand" branch (`Task_ByHand`) produces an authored resolution that nothing reviews |
| `regen-after-merge.ts` | one regenerate-and-check pass for a train | has no writer for `check:l1-complete` or `smart-base:smart-kg-l1` (bean `u7be`) |
| `code-change-review.bpmn` `Task_Review` | "a human or an agent acting AS reviewer", skill `code-node-review` | records no verdict, so "reviewed" and "skipped" look the same afterwards |
| `.github/workflows/agent-review.yml` | an LLM review of one commit | `workflow_dispatch` only, runs **after** merge, truncates the diff to 50,000 characters, files issues rather than blocking, and still derives the QOU PDF URL. It is inherited, not designed |
| `kg-qa/v1` sidecars (`schemas/kg-qa.ts`) | committed verdicts per KG node; `unknown` is never a pass; severity decides the gate | has an agent-review precedent (`voice_reviews[]`, keyed by `skill_hash` and `voice_hash`), but no adversarial review |
| `qa-review.ts` | separates a FINDING (severity: critical, major or minor) from a DECISION (weight: blocking, suggestion or praise) | not wired to the merge |
| ROAST and generalise beans (`v048`, `osyc`, `vkm0`, `w4tq`), skills `generalise-the-fix` and `devils-advocate-watcher` | adversarial passes, each written up | **ad hoc and session-scoped.** None blocks a merge, and `v048` records that the first roast's findings were lost because they lived in a chat |

Agent provenance is already in the history. Of the last 200 commits on this
branch's base, 109 carry both a `Co-Authored-By: Claude …` trailer and a
`Claude-Session:` trailer (measured with `git log -200` over each trailer key).
The merge commits GitHub creates carry neither.

## 3. State of the art

### 3.1 Required checks, merge queues and "keep main green"

The founding rule is Ben Elliston's, as Graydon Hoare named it for bors: *"automatically
maintain a repository of code that always passes all the tests"*. It means
testing the **merge result** before it lands, not each branch on its own [R4]. Uber's
SubmitQueue turns this into a speculative queue and shows the cost model: a change's
success depends on everything ahead of it, so the queue tests combinations
[R5]. GitHub's merge queue is the hosted version: required checks
must also trigger on `merge_group`, or the queue waits forever [R6]. BulkPR-Bench
(2026) measures how well agents govern a queue of interacting PRs. Critical-relation
recall runs from 35 % to 58 %, and only 8 of 324 runs completed a queue exactly [R7].
**Ordering a train is itself a judgement that agents get wrong.**

*For this repo:* a hand-built merge train is a merge queue without the
hosting. The rule it must keep is the same: **the gate runs on the combined
result**, not only on each head.

### 3.2 Two-person review and supply-chain levels

SLSA's Source track at its highest level requires that **two trusted persons**
agree to every change on a protected branch. Changes made during review must
be reviewed too, so approval binds to the **final revision** [R8]. OpenSSF
Scorecard makes this measurable: it counts approvals, or a merger different
from the committer, over recent commits [R9]. NIST SP 800-218A adds the
generative-AI profile to SSDF: AI-produced code is treated as untrusted input to
the same review and testing practices [R10]. Reproducible builds give the
supply-chain form of "the gate must be re-runnable": a third party rebuilds
and gets the same bits [R11].

*For this repo:* an agent author plus an agent reviewer is **not** two trusted
persons in SLSA's sense. The design records that gap and does not paper over it
(§9, question count).

### 3.3 What review actually finds, and when it fails

Review at Microsoft finds fewer defects than its participants expect. Its
outputs are mostly understanding and knowledge transfer [R1]. At Google it is near-universal,
small and fast, with owners and readability approval [R2]. Review **coverage
and participation** both predict post-release defects, and low participation
costs more than low coverage [R3]. So a review that happened
but engaged with nothing is close to no review.

### 3.4 LLM-written code and LLM reviewers

About 40 % of Copilot completions in security-relevant scenarios were
vulnerable [R12]. Users with an assistant wrote less secure code **and were more
confident it was secure** [R13]. In industry, LLM review comments are often
acted on: 73.8 % of suggestions were adopted in one deployment [R14]. Across public repositories, 12 of 13 code-review agents
average below 60 % actionable comments, and PRs reviewed only by an agent merge
23 points less often than human-reviewed ones [R15]. AI-to-AI review grew by
more than two orders of magnitude through 2025, and **same-product** review (Claude reviewing Claude) behaves
differently from cross-product review [R16]. Human reviewers of agent code
habituate: approval rises and inline comments fall as exposure grows [R17].
The 2026 vision paper for agentic review keeps humans at the decision points
and lists automation bias as an open problem [R18].

### 3.5 Adversarial review, oversight and judge bias

Debate frames review as a zero-sum game. An adversary paid to find the flaw
lets a weaker judge decide questions it could not check directly [R19].
**AI Control** is the closest model to this repository's situation: a capable,
untrusted author, plus a protocol of trusted monitoring, editing and auditing that
must stay safe even if the author is subverting it [R20]. LLM judges show
position, verbosity and **self-enhancement** bias [R21]. Evaluators recognise
and favour their own generations, and the bias grows with self-recognition
[R22]. Long contexts lose the middle [R23], which is the mechanism behind
silent truncation: a reviewer handed a 50,000-character prefix has not reviewed the
diff.

### 3.6 Severity taxonomies

CVSS v4.0 separates base severity from threat and environment, so "how bad" and "how
likely here" are different axes [R24]. That is the same split `qa-review.ts`
already makes between severity and weight. OWASP's and CWE's lists are
category vocabularies, not severities. The design below borrows the split, not
the lists.

### 3.7 Formal-proof CI

mathlib runs CI on every PR: a full build and the linters on every pull request. It treats linters as maintainers' leverage on a corpus too big to
read [R25, R26]. MathlibPR (2026) is direct evidence for this proposal. It turns
mathlib's review history into 15,895 **build-passing** snapshots, and both LLMs
and agents (Claude Code among them) **struggle to tell merge-ready from merely
build-passing** [R27]. A green `lake build` is necessary, and an LLM's opinion of
mergeability is not a substitute for it. `prepare-merge` already records the
local form: in qou, `lake build` reaches 853 of 1618 modules, so a touched file
can be "green" by never being compiled.

### 3.8 FHIR IG CI

SUSHI compiles FSH to FHIR JSON and should exit cleanly. Its errors cite lines,
and syntax errors are cleared first [R28]. The IG Publisher writes `qa.html`, and
HL7's quality criteria require a build with **no errors**, with
warnings and hints managed through a documented suppression file [R29].

### 3.9 Schema validation

JSON-LD 1.1 defines expansion and compaction algorithms, so "the JSON-LD
renders" has an exact meaning: it expands against its context without dropping
terms [R30]. Shape validation (JSON Schema here, SHACL in RDF stacks) is a
separate check from well-formedness.

## 4. Principles this design keeps

1. **The gate reads a verdict, it does not run an opinion.** A review writes a
   committed record. The merge reads the record. This is the `kg-qa` rule: a
   printed verdict is gone, so "never reviewed" and "reviewed clean" become one
   state.
2. **`unknown` blocks.** A review that could not cover the diff, a toolchain
   that was absent, or a cache that timed out is never green ([R23]; the
   `dh4f` shape).
3. **Independence is recorded, not assumed.** The reviewer is not the author's
   session. It is a different model where one is available ([R16], [R21], [R22]),
   and it is scored like a trusted monitor ([R20]).
4. **A RED FLAG must carry its evidence.** A blocking finding names where it
   is, and how to see it, so precision is enforced at the point of writing
   ([R15]: most agent comments are not actionable).
5. **Approval binds to the final revision** ([R8]). A new push stales the
   verdict.
6. **The gate runs on the combined result** ([R4], [R5], [R7]).
7. **Downstream renders are advisory** (owner instruction). They stay visible
   but never hold a merge.

## 5. Proposed methodology

### 5.1 Which gates block

| # | gate | when | blocks? | exists? |
|---|---|---|---|---|
| G1 | required CI green, read per job | always | **yes** | yes |
| G2 | the head SHA **has** a completed CI run | always | **yes** | no. `pr-checks-present` finds missing runs hourly, but the train does not ask (`u7be` item 3) |
| G3 | adversarial review verdict present, bound to the head SHA, full coverage | agent provenance (§5.2) | **yes** | no (`w8jq`) |
| G4 | no open RED FLAG in any review on this head | G3 applies | **yes** | no (`abmq`) |
| G5 | Lean: every **touched** module builds by name; no new `sorry`; no axiom beyond the declared list | `.lean` changed (folio repos) | **yes** | partly: a bare-import gate only |
| G6 | FHIR: SUSHI 0 errors; IG AST extracts | `input/fsh/**`, `sushi-config.yaml`, IG AST paths | **yes** | no |
| G7 | KG: JSON-LD expands and compacts with no dropped term; each node validates against its schema; `kg:audit:check` | any KG node, `.jsonld` or schema | **yes** | mostly: `gen:jsonld:check`, `kg:audit:check`, `kg:audit:all:check` |
| G8 | `regen` reports nothing unrepaired **on the train result** | merge train | **yes** | yes, with the gaps in `u7be` |
| A1 | just-the-docs / Pages build, PDF render, visual diff | rendered paths | advisory | yes |
| A2 | full IG Publisher run; `qa.html` error and warning counts reported | FHIR IG | advisory, but counts are recorded | no |
| A3 | `kg:audit:strict` (major), non-blocking review findings | always | advisory | yes |
| H | explicit owner "merge it" where a folio or ruling requires it | per repo | **yes** | yes |

The path → gate map (G5–G7) is declared **as data** and read by `gates.ts`,
not listed in prose.

### 5.2 Detecting "≥ 1 agent touched it"

The signals, in decreasing reliability:

1. a `Co-Authored-By:` trailer naming a model, or a `Claude-Session:` trailer, on
   any commit in `base..head`;
2. the head branch prefix `claude/` (or another declared agent prefix);
3. a bot author or committer (`github-actions[bot]`, `copilot`, the merge-main bot);
4. "Generated with Claude Code" in the PR body.

**What would falsify this design:** the signals are opt-in. An agent session that
omits its trailer is indistinguishable from a person. So the recommendation is
**default-on**: every PR needs G3 unless all of its commits are verifiably by a
human (signed by a key on a declared human-maintainer list). A positive signal
can only add the requirement, and its absence cannot remove it. A merge-base
**hand resolution** (`Task_ByHand`) is an authored change by whoever ran it,
so it is covered. Declared-pattern resolutions are mechanical and are proved by
G8 instead.

### 5.3 The adversarial review

- **Who.** A reviewing session that is not the author: different session id,
  and a different model family when one is configured. The secrets
  `agent-review.yml` already reads include a second provider's key. The
  reviewer's identity, model and skill hash go in the verdict.
- **Stance.** Adversarial by instruction: *"construct the strongest case that
  this change is wrong, unsafe, or not what it claims"*. This is the
  `devils-advocate-watcher` and `generalise-the-fix` stance applied to a diff,
  with a debate-style rebuttal round where the author may answer each flag once
  before the verdict is final ([R19]).
- **Scope.** The whole diff `merge-base..head`, chunked by file with the PR
  description and the bean's `## Done when` as the claim under test. If the
  diff does not fit, the result is `unknown` (blocks), never a truncated pass.
  Generated files that a G1 check reproduces are listed and skipped **by name**.
- **What it checks.** Correctness against the claim; the RED FLAG categories
  (§6); whether a new check can report green without evaluating anything;
  whether prose (skills, PR body, bean) asserts something the code does not
  do (the `narrative-asserts-code` axis); scope against the bean.
- **Binding.** The verdict names `base_sha`, `head_sha` and the reviewed tree.
  A push after the review stales it.

### 5.4 Composition with merge trains

```
for each PR in the train:            per HEAD
  G1 (CI green on head) · G2 (head has a run) · G3/G4 (verdict fresh, no open flag)
build the train:                     merge-base.ts --no-regen, PR by PR
  any Task_ByHand resolution  →  that resolution needs its own G3 review
on the TRAIN RESULT:                 once
  bun run regen   (G8)
  path-scoped G5/G6/G7 over the union of the train's changed paths
  one CI run on the result (G1 again, for the combined tree)
merge
```

Per-PR review stays per head, because a reviewer reviews a change rather than an
accident of batching. Compile gates move to the result, because only the
result is what lands ([R4], [R5]). A PR removed from the train keeps its
verdict, because its head did not move.

## 6. RED FLAG taxonomy and verdict shape (child `abmq`)

A **RED FLAG** is a finding whose weight is `blocking` (the `qa-review.ts`
axis), in one of a closed set of categories, **with evidence**. A finding
without a reproducible observation cannot be blocking. It is recorded as a
`suggestion`.

| category | means | example from this repo |
|---|---|---|
| `false-green` | a check can report pass without evaluating its subject | `lean-bare-import` printing OK over zero files; `dh4f` (a declared-but-absent dir scanned as clean) |
| `irreversible` | deletes or overwrites a durable artefact without confirmation | `plj1` (a workflow deleted every open PR's preview) |
| `security` | secret exposure, injection, an escalated workflow permission, untrusted input reaching a shell | an `agent-review.yml`-style job holding API keys on PR code |
| `correctness` | a concrete input gives a wrong result | none recorded; it must name the input |
| `contract` | breaks a declared schema, API or cross-instance reference | the `kgQaSidecarPath` `..` escape (bean `7u3g`) |
| `provenance` | a claim in a PR, bean, commit or skill that the evidence does not support | `w4tq` (numeric claims re-run, one wrong) |
| `scope` | changes outside the bean or issue, or hand-edits a generated directory | |
| `process` | skips a strict step: merging without the required confirmation, or closing an issue on an agent's own say-so | |
| `licence` | imports content whose licence forbids it | |

**Verdict shape.** One sub-schema is shared by both uses:

```ts
// shared: schemas/adversarial-review.ts (proposed)
AdversarialReview = {
  reviewer: { by: "agent" | "human", session: string, model: string | null },
  author_sessions: string[],          // from trailers; [] when none
  skill_hash: string,                 // the review skill as run
  at: string,
  coverage: { files_total: number, files_reviewed: number,
              skipped: { path: string, why: "generated-reproduced" | "binary" }[] },
  result: "pass" | "fail" | "unknown",
  flags: {
    id: string, category: RedFlagCategory,
    severity: "critical" | "major" | "minor",   // FindingSeverity
    weight: "blocking" | "suggestion",          // FindingWeight
    where: string, evidence: string,            // evidence REQUIRED when blocking
    status: "open" | "resolved" | "overridden",
    resolution?: { by: string, at: string, commit?: string,
                   decision?: string /* qa-review decision id */, reason: string },
  }[],
}
```

- **Per change (merge gate):** `merge-review/v1` = `{ pr, base_sha, head_sha,
  tree, reviews: AdversarialReview[] }`, one file per PR head.
- **Per node (backfill):** an optional `adversarial_reviews: AdversarialReview[]`
  on `kg-qa/v1`, modelled on `voice_reviews[]` and staled by `source_hash` plus
  `skill_hash`. It is optional, so existing sidecars stay valid.

**Override.** A flag is never deleted. An override is a `qa-review` decision by
a person with standing (who, when, why, flag id), and it sets
`status: overridden`. The gate passes on `resolved` or `overridden` and holds
on `open`. A stale or `unknown` review also holds.

## 7. Per-content-block review, for backfill (child `lvlv`)

The same review runs **per node** rather than per diff, so the existing corpus
can be backfilled and later merges only re-review what moved.

| kind | adversarial checklist (extends, not forks) |
|---|---|
| **tool** | does the mechanism do what its description says; does every failure return `unknown` rather than pass; are side effects declared; is deletion guarded (`deletion-requires-confirmation`); extends `code-node-review` |
| **schema** | does every field have a reader; are enums closed; does the docstring's claim match the code; can an old document still parse; extends `code-node-review` |
| **skill / guidance** | is each claim about the code still true (`narrative-asserts-code`); does it contradict another skill; does it quote a count in prose; would following it take an irreversible action unasked |
| **process** (BPMN/DMN) | does every gateway branch, including failure, have a path; does a step write to a `context` graph; does the diagram match the workflow that runs; extends `kg-audit` criteria |

**Order:** risk-ranked rather than file order, by fan-in (how many nodes
reference it), gate adjacency (is it on the merge path), churn, and time since
last review. The gate-path nodes go first: `gates.ts`, `merge-base.ts`,
`regen-after-merge.ts`, `merge-conflict-patterns.ts`, `kg-qa.ts`.

**Coverage:** `audit:coverage` gains a column per kind with three states:
reviewed, stale and never. It is a separate column from "audited", because a kind
can be audited by criteria and never adversarially read.

**Cost:** measure it on the first batch, then ask for the swarm per
`swarm-management` with the measured per-node cost. Findings stay in sidecars.
**No bean per finding** (beans are not sidecars).

**Schema gap found while designing:** `KG_SUBJECT_KINDS` has no `schema`
kind. Schema modules are reviewed today only through `code-node-review`.
Either add the kind, or record schema reviews under `graph` or `tool`; that is
for `lvlv` to settle.

## 8. Merge-steward gaps measured today (child `u7be`)

1. `regen` has no writer for `check:l1-complete` or `smart-base:smart-kg-l1`
   (`grep` over `regen-after-merge.ts` finds neither; both run in
   `code-quality-gates.yml`). A train can regenerate "everything" and still go red.
2. A submodule gitlink conflict resolves to main's side even when the branch's
   pin fast-forwards main's. The pin bump is silently reverted.
3. GitHub does not run `pull_request` CI while a PR conflicts, so heads reached a
   train with no run. G2 closes this.
4. `merge-main.yml` adds `needs-merge-human` but has no `--remove-label`
   anywhere, so the label outlives a later success.

## 9. Open questions for the owner

**One in full.** Six more follow it, listed by name only so that this question can be answered on its own.

**Q1. Where does the adversarial review run, and who holds the model key?**

*Context.* The review needs a model call per agent-touched PR head. There are
two places it can run. Inside CI, a `pull_request` job needs an API key
secret on a workflow that executes PR code, which is the `security` RED FLAG
this design defines. The other place is the merge steward session, which already
reads every PR before a train. It would run the reviewer as a separate session and commit the
verdict; CI would then only check, deterministically and without secrets, that
a fresh verdict with no open flag exists.

*Options.*
- **A. In CI.** A `pull_request` job on every agent PR head. Fully automatic and
  independent of any session, but it puts a model key within reach of PR code.
  Cost scales with pushes, not merges, and today's `agent-review.yml` would be
  rebuilt rather than reused.
- **B. Merge steward runs it, CI checks it.** The reviewer runs from the steward
  as a separate session (another model family where configured) once per head
  that enters a train. The verdict goes to the `qa-reports` branch (arc `3fva`)
  keyed by PR and head SHA, so committing it does not move the head. CI's G3/G4
  step reads it without a key. Cost scales with heads that reach a train. Risk:
  if no steward runs, nothing is reviewed, but then nothing merges either,
  because G3 fails closed.
- **C. B now, A later** if the repository moves under an organization and gains
  a merge queue (`1hjm`).

*Recommendation:* **B.** It keeps keys out of PR-triggered jobs, it reviews
only heads that are actually about to merge, and because the check fails
closed, an absent steward cannot make the gate pass.

*If you say nothing:* B is assumed when child `w8jq` starts. No code is
written before then.

**Six more questions**, to be asked one at a time, and recorded in bean `nok9`, once Q1 is
settled: reviewer independence (same model in a fresh session, or a different
family required?); default-on vs signal-only provenance (§5.2); who has standing
to override a RED FLAG; whether G5 (Lean) belongs in the platform's CI or only
in folio repositories; the backfill budget; and whether an agent-plus-agent
review may ever satisfy a two-person rule (SLSA says not, §3.2).

## 10. Reading list

Thirty open-access items. The full list, with authors, a line on each and the
verification method, is [merge-gate-reading-list](merge-gate-reading-list.html).
**S** means the exact URL came back from a web search under the matching title.
Direct fetch was denied by the container's egress policy, so download is still
to be confirmed at upload. **U** means unverified. Totals: 29 S, 1 U, none paywalled.

| R | item | URL | ✓ |
|---|---|---|---|
| R1 | Bacchelli & Bird 2013, *Expectations, Outcomes, and Challenges of Modern Code Review* | <https://sback.it/publications/icse2013.pdf> | S |
| R2 | Sadowski et al. 2018, *Modern Code Review: A Case Study at Google* | <https://sback.it/publications/icse2018seip.pdf> | S |
| R3 | McIntosh et al. 2014, *The Impact of Code Review Coverage and Participation on Software Quality* | <https://posl.ait.kyushu-u.ac.jp/~kamei/publications/McIntosh_MSR2014.pdf> | S |
| R4 | Hoare 2014, *"Not rocket science" (monotone and bors)* | <https://graydon2.dreamwidth.org/1597.html> | U |
| R5 | Ananthanarayanan et al. 2019, *Keeping Master Green at Scale* | <https://www.masoud.io/docs/eurosys19.pdf> | S |
| R6 | GitHub Docs, *Managing a merge queue* | <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue> | S |
| R7 | Xiong et al. 2026, *BulkPR-Bench* | <https://arxiv.org/pdf/2608.02685> | S |
| R8 | OpenSSF, *SLSA v1.2 Source requirements* | <https://slsa.dev/spec/v1.2/source-requirements> | S |
| R9 | OpenSSF, *Scorecard checks* | <https://github.com/ossf/scorecard/blob/main/docs/checks.md> | S |
| R10 | NIST 2024, *SP 800-218A* | <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218A.pdf> | S |
| R11 | Lamb & Zacchiroli 2021, *Reproducible Builds* | <https://arxiv.org/pdf/2104.06020> | S |
| R12 | Pearce et al. 2022, *Asleep at the Keyboard?* | <https://arxiv.org/pdf/2108.09293> | S |
| R13 | Perry et al. 2023, *Do Users Write More Insecure Code with AI Assistants?* | <https://arxiv.org/pdf/2211.03622> | S |
| R14 | Cihan et al. 2024, *Automated Code Review In Practice* | <https://arxiv.org/pdf/2412.18531> | S |
| R15 | Chowdhury et al. 2026, *Code Review Agents in Pull Requests* | <https://arxiv.org/pdf/2604.03196> | S |
| R16 | Selvanayagam & Ghaleb 2026, *AI-to-AI Code Reviews of GitHub Pull Requests* | <https://arxiv.org/pdf/2608.21311> | S |
| R17 | Yu et al. 2026, *Habituation at the Gate* | <https://arxiv.org/pdf/2606.22721> | S |
| R18 | Kamalı et al. 2026, *A Vision for Agentic Code Review* | <https://arxiv.org/pdf/2605.17548> | S |
| R19 | Irving, Christiano & Amodei 2018, *AI Safety via Debate* | <https://arxiv.org/pdf/1805.00899> | S |
| R20 | Greenblatt et al. 2024, *AI Control* | <https://arxiv.org/pdf/2312.06942> | S |
| R21 | Zheng et al. 2023, *Judging LLM-as-a-Judge* | <https://arxiv.org/pdf/2306.05685> | S |
| R22 | Panickssery, Bowman & Feng 2024, *LLM Evaluators Recognize and Favor Their Own Generations* | <https://arxiv.org/pdf/2404.13076> | S |
| R23 | Liu et al. 2023, *Lost in the Middle* | <https://arxiv.org/pdf/2307.03172> | S |
| R24 | FIRST, *CVSS v4.0 Specification* | <https://www.first.org/cvss/v4-0/cvss-v40-specification.pdf> | S |
| R25 | mathlib Community 2020, *The Lean Mathematical Library* | <https://leanprover-community.github.io/papers/mathlib-paper.pdf> | S |
| R26 | van Doorn, Ebner & Lewis 2020, *Maintaining a Library of Formal Mathematics* | <https://florisvandoorn.com/papers/maintenance.pdf> | S |
| R27 | Xie, Liu & Zhang 2026, *MathlibPR* | <https://arxiv.org/pdf/2605.07147> | S |
| R28 | FSH School, *Running SUSHI* | <https://fshschool.org/docs/sushi/running/> | S |
| R29 | HL7, *FHIR IG Quality Criteria* | <https://confluence.hl7.org/spaces/FHIR/pages/42994452/1.+FHIR+IG+Quality+Criteria> | S |
| R30 | W3C 2020, *JSON-LD 1.1 Processing Algorithms and API* | <https://www.w3.org/TR/json-ld11-api/> | S |

## 11. What this proposal does not do

- It changes no workflow, script, schema or BPMN. Every change named here is a
  child bean's work.
- It does not retire `agent-review.yml`. That falls to `w8jq`, once its replacement
  exists.
- It does not decide Q1–Q7.
