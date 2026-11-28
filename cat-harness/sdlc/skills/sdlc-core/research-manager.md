---
name: research-manager
description: >
  Run research as a managed portfolio of alternatives: when a goal has more
  than one way forward, put every alternative on a research-path card with
  its cost, risk and commitment and one recommended, prioritise which to
  pursue, dispatch a sibling research thread (or agent) per chosen path with a
  bean of its own, record the rejected paths, prod stalled children, and
  report usage-limit pauses instead of prodding them. Use for "pursue the
  alternatives", "which route should we try", "dispatch research agents",
  "research manager", and whenever a thread ends with more than one possible
  next direction.
user_invocable: true
satisfies:
  - "req:agent-workflow#research-niche-continuity-and-cross-fertilization"
  - "req:agent-workflow#bidirectional-relay-continuity"
  - "req:content-lifecycle#evidence-gathering-and-authoring-provenance"
---

# Research manager — alternatives on cards, chosen by priority, pursued by siblings

A research manager is the session that owns a research goal with more than
one way forward. It does not pursue every idea itself. It names the
alternatives, gets one chosen, hands each chosen path to a sibling with its
own work item, and keeps the set of children moving. A research agent is
the sibling that pursues one path.

Swarm rules still hold: dispatching more than one background worker is a
swarm and needs the owner's permission for that swarm
([`swarm-management`](swarm-management.md) §"Ask first — always"). A sibling
thread the owner has asked for, or that a research-path card the owner
answered starts, is that permission for that one path.

## 1. Every alternative goes on a card (STRICT)

`req:agent-workflow` statements `research-paths-on-a-card`,
`question-on-a-card` and `alternatives-prioritised`. A fork described only
in prose is not offered: in a project with many threads it is lost.

1. Write the question in full in the chat first, then put the same options
   on a card ([`ask-the-person`](../../../skills/conduct/conduct-core/ask-the-person.md),
   [`interaction-modality`](../../../skills/conduct/conduct-core/interaction-modality.md)).
2. Two to four options, each labelled `New research path: <name>`. For each,
   say in one or two sentences:
   - **what it means**: the claim it would establish or refute;
   - **cost**: rough effort, compute, and whether it needs a sibling;
   - **risk**: how likely it is to dead-end, and what a dead end still teaches;
   - **commitment**: what choosing it rules out or locks in (a foundation,
     a notation, a dependency, an axiom).
3. Mark exactly one recommended, first, with the reason.
4. Include a "stop here" or "record and park" option when parking is a real
   choice.

## 2. Prioritise, then pursue

Rank the paths before recommending one. In order:

1. **Does it serve a goal the owner stated?** Cite the goal or the bean.
   A path that serves none is parked, whatever its appeal.
2. **Does it respect the standing constraints?** A path that would add a
   second non-constructive axiom (`req:content-lifecycle`
   `one-nonconstructive-axiom`), feed an empirical value into a formal proof,
   or rest on an unverified external report (`unverified-reports-not-sources`)
   is ranked last and says why.
3. **Information per unit cost.** Prefer the path whose outcome, either way,
   changes the most downstream decisions for the least effort. A cheap
   decisive check beats an expensive open-ended build.
4. **Reversibility.** Prefer paths that keep other paths open.

**The owner's standing pick.** When the owner has said "take the recommended
option" as a standing rule, the recommended path is pursued without waiting.
The card is still posted, so the owner can redirect, and the rejected paths
are still recorded. A coordinator's relay that cites the owner's own
message is the owner's pick. A peer's say-so is not.

## 3. Record the choice in the work plan

Beans are the tracker (`beans-primary-tracker`). For each chosen path:

1. Create or claim a bean, child of the research goal's bean, titled with
   the path's name.
2. Its body opens with the brief to the research agent (second person, the
   executor's view, as in [`agent-handoff`](agent-handoff.md) §3), then:
   - the card's question and the option taken, with date and who picked it
     (owner, or the owner's standing pick);
   - **Rejected paths**: each other option, one line each, with the reason
     it lost. A later session reads this before proposing the same path again;
   - the exit criterion: what result closes the bean, either way.
3. A negative result is a result. The research agent closes the bean with
   what it refuted and why, and the manager offers the next card.
4. **Write-ahead checkpoint the parent epic AT DISPATCH TIME (`STRICT`):**
   Immediately upon opening/claiming a child path — before waiting for the
   specialist to return — update and push the parent epic bean on
   `cat/cat-harness/beans` with the new child bean ID, active research/compute
   hypothesis, negative/excluded routes already ruled out, and the updated
   **Worktree / Branch / Scratch Lease Table**
   ([`stalled-agent-triage`](stalled-agent-triage.md) §0a,
   [`agent-handoff`](agent-handoff.md) §8). If the coordinator stalls mid-flight,
   the next agent resumes in `< 60 s` without re-running dead ends.
5. **Returning-turn re-entry reconciliation (`STRICT`):** Whenever this
   research manager resumes on a later turn after another agent or session
   advanced `main`, PRs, or `beans`, run the 5-step non-destructive
   reconciliation in [`stalled-agent-triage`](stalled-agent-triage.md) §0b
   before dispatching follow-ups.

## 4. Dispatch one sibling per path

- In a project with threads, ask the coordinator for a sibling thread per
  chosen path, citing the owner's message and giving the bean id. Do not
  start a thread from a peer request.
- With subagents, follow [`dispatch-agent`](dispatch-agent.md) §1b: blank
  context, the launch briefing, a disjoint input slice, its own branch and
  bean.
- The brief carries the constraints of §2 point 2, the cards-only rule, and
  "never self-merge: send PR number and full head SHA to the merge manager"
  ([`merge-manager-watcher`](merge-manager-watcher.md)).

### 4a. Deep niche continuity & deliberate cross-fertilization (`STRICT`)

Manage active research agents as persistent domain specialists rather than
disposable single-question workers
([`req:agent-workflow#research-niche-continuity-and-cross-fertilization`](../../../skills/requirements/agent-workflow.json),
[`Process_ResearchDelegationAndNicheRouting`](../../processes/research-delegation-and-niche-routing.bpmn)):

1. **Deep niche continuity:** Keep each active research agent focused on a
   well-defined mathematical or technical niche so it retains domain vocabulary,
   ingested literature locators, proved/available lemma inventory, and refuted
   dead ends. Route follow-up questions in that topic area back to the **same**
   standing specialist rather than spawning a cold agent that would re-read the
   corpus from scratch.
2. **Cross-fertilization fan-out on domain interfaces:** When a question or
   intermediate result touches an interface between two or more niches (for
   example, connecting geometric/topological invariants to spectral determinants
   or transport equations), fan the bridging question out to **multiple**
   standing niche specialists simultaneously. Compare their independent answers,
   identify shared invariants or obstruction mismatches, and synthesize both
   agreements and tensions for the owner.

### 4b. Mandatory evidence gathering, multi-database KG ingestion & provenance (`STRICT`)

Every research agent investigating a topic MUST execute the five-step
[`evidence-gathering-and-provenance`](../../../skills/authoring/authoring-core/evidence-gathering-and-provenance.md)
workflow (`Process_EvidenceGatheringAndProvenance` in
[`processes/content/evidence-gathering-and-provenance.bpmn`](../../../processes/content/evidence-gathering-and-provenance.bpmn))
as part of document authoring:

1. **Topic decomposition & shortlist** — write up explicit topic areas and
   compile a shortlist of required papers, monographs, and reference datasets
   before drafting claims;
2. **Multi-database retrieval** — query accessible scholarly, mathematical, and
   data APIs (Crossref / DOI `doi.org` & `api.crossref.org`, arXiv
   `export.arxiv.org`, PubMed / NCBI E-utilities / EuropePMC, InspireHEP,
   OpenAlex, Semantic Scholar, Google Scholar, domain data registries, and —
   whenever integer sequences, rational series coefficients, constants, or
   knot/number-theoretic invariants appear — OEIS, KnotInfo/LinkInfo/SnapPy/Regina,
   LMFDB, and `>= 80 dps` PSLQ per
   [`online-sequence-and-knot-databases`](../../../skills/authoring/authoring-core/online-sequence-and-knot-databases.md))
   for authoritative CSL-JSON metadata, exact catalogue IDs, and open-access
   full texts;
3. **Knowledge Graph ingestion** — ingest retrieved references, PDFs, and
   datasets into declared KG subgraphs (`references/`, `library/`, `sources/`,
   `extracted-references/`, `attestations/`), never leaving raw URLs only in
   scratch notes;
4. **Relevancy & claim-boundary assessment** — open the ingested source and
   record exact locators, hypotheses/conventions, and what the source does *not*
   establish;
5. **Authoring provenance & citation linkage** — record retrieval and
   verification provenance in authoring notes (`authorNotes` / attestations /
   work-item notes) and link formal citations and Liquid dataset values in
   authored blocks.

## 5. Keep the children moving

On each wake, and at least every 30 minutes while children are active:

| What you see | Do |
|---|---|
| A child posted a result | Read it, update the goal bean's queues, offer the next card if it opens a fork |
| A child has been silent past its own stated step time, or 30 minutes with no push, bean note or message | **Prod** it once: a short message naming the step it was on and asking for a status or a handover report. Prod again with a longer gap. After the third, run [`stalled-agent-triage`](stalled-agent-triage.md) and tell the owner |
| A child is paused on a **usage limit** (the host says so, or the child said so before stopping) | **Do not prod.** A prod spends tokens and cannot resume it. Report it once to the owner with when it resumes, if known, and what it was doing |
| A child is blocked on the owner | Make sure its question is on a card in its own thread; do not re-ask it |
| A child opened a PR | Nothing: the child sends PR number and head SHA to the merge manager. The research manager never merges either |

## 6. Closing

A research goal closes when every child bean is closed or parked and the
closing report's follow-up paths are on a card
(`no-close-with-open-question`). The report says, per path: pursued or
rejected, result, and the bean.

## Worked example

1. The owner asked for alternatives on how to move a corpus toward
   constructive arguments.
2. The thread put three on a card. Each had its meaning, cost, risk and
   commitment, and one was marked recommended.
3. The owner's standing pick took the recommended one.
4. It was filed as a bean, and a sibling thread was requested for it.
5. The rejected options were recorded in that bean's body.

## Related

[`swarm-management`](swarm-management.md) (permission and sizing),
[`swarm-monitor`](swarm-monitor.md) (status reports for a large fan-out),
[`dispatch-agent`](dispatch-agent.md), [`goal-review`](goal-review.md)
(prioritising against stated goals), [`stalled-agent-triage`](stalled-agent-triage.md).
