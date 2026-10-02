---
title: "Merge gate reading list"
kind: proposal
summary: >-
  Thirty open-access sources behind the merge-gate proposal: code review
  evidence, keeping main green and merge queues, two-person review and supply
  chain, the risks of LLM-written code and LLM reviewers, adversarial
  oversight and judge bias, severity, formal-proof CI, FHIR IG CI and JSON-LD.
  Each has its URL's verification status, for uploading to the library.
---

# Merge gate reading list
{: .no_toc }

Companion to [Merge gate: adversarial review and compile gates](merge-gate-2026-10-02.html)
(epic bean `folio-assistant-nok9`). The `R` numbers are the ones the proposal
cites. Compiled 2026-10-02 for the owner to upload to the library.

## How each URL was checked, and what that does and does not prove

**Direct fetching was not possible from the agent container.** The egress
proxy denies arxiv.org, sback.it, slsa.dev, uwaterloo.ca and others by
organization policy (`connect_rejected`, 2026-10-02), and
`microsoft.com/en-us/research/wp-content/…` answered HTTP 403 to a scripted
request. Per the proxy's own rules this was reported, not routed around.

So each item carries one of two marks:

- **S** (*search-confirmed*): the exact URL came back from a web search as a
  result whose title matches the item. That shows the URL exists and is indexed
  under that title. **It does not show** that the file downloads as an
  open-access PDF today. Check that at upload time.
- **U** (*unverified*): the URL was not returned as a result itself. It is
  given from a citation and should be checked first.

All items are open access: arXiv, an author's or institution's own copy, or an
official specification or documentation page. **None is paywalled.** Where the
publisher's copy is paywalled, the author copy is the one listed.

**Count: 30 items. 29 S, 1 U.**

## Code review: what it finds and when it works

| R | item | URL | ✓ | why it matters here |
|---|---|---|---|---|
| R1 | Bacchelli, A. & Bird, C. (2013). *Expectations, Outcomes, and Challenges of Modern Code Review.* ICSE 2013 | <https://sback.it/publications/icse2013.pdf> | S | review finds fewer defects than its participants expect, so a review gate must say what it is for |
| R2 | Sadowski, C., Söderberg, E., Church, L., Sipko, M. & Bacchelli, A. (2018). *Modern Code Review: A Case Study at Google.* ICSE-SEIP 2018 | <https://sback.it/publications/icse2018seip.pdf> | S | the reference practice: small changes, ownership, near-universal review |
| R3 | McIntosh, S., Kamei, Y., Adams, B. & Hassan, A. E. (2014). *The Impact of Code Review Coverage and Code Review Participation on Software Quality.* MSR 2014 | <https://posl.ait.kyushu-u.ac.jp/~kamei/publications/McIntosh_MSR2014.pdf> | S | coverage AND participation predict defects; a review that engaged with nothing is close to none |

## Keeping main green: merge queues and trains

| R | item | URL | ✓ | why it matters here |
|---|---|---|---|---|
| R4 | Hoare, G. (2014). *Technicalities: "not rocket science" (the story of monotone and bors).* Blog post | <https://graydon2.dreamwidth.org/1597.html> | U | the founding rule: test the merge result before it lands |
| R5 | Ananthanarayanan, S., Ardekani, M. S., Haenikel, D., Varadarajan, B., Soriano, S., Patel, D. & Adl-Tabatabai, A.-R. (2019). *Keeping Master Green at Scale.* EuroSys 2019 (author copy) | <https://www.masoud.io/docs/eurosys19.pdf> | S | SubmitQueue: speculative merge queues and their cost model, which is the industrial form of a merge train |
| R6 | GitHub (current). *Managing a merge queue.* GitHub Docs | <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue> | S | `merge_group` must trigger required checks; also why this user-owned repo has no queue (bean `1hjm`) |
| R7 | Xiong, Z., Zhao, Q., Zhang, J., et al. (2026). *BulkPR-Bench: Benchmarking Queue-Level Governance of Interacting Pull Requests.* arXiv:2608.02685 | <https://arxiv.org/pdf/2608.02685> | S | measures agents ordering a queue of interacting PRs; low critical-relation recall is direct evidence for gating the train RESULT |

## Two-person review and the supply chain

| R | item | URL | ✓ | why it matters here |
|---|---|---|---|---|
| R8 | OpenSSF (2025). *SLSA v1.2: Source track requirements* (two-party review) | <https://slsa.dev/spec/v1.2/source-requirements> | S | two trusted persons, with approval bound to the final revision; it defines what agent-plus-agent review is NOT |
| R9 | OpenSSF (current). *Scorecard checks* (Code-Review, Branch-Protection) | <https://github.com/ossf/scorecard/blob/main/docs/checks.md> | S | how review and required checks are measured from repository history |
| R10 | NIST (2024). *SP 800-218A: Secure Software Development Practices for Generative AI and Dual-Use Foundation Models* | <https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218A.pdf> | S | an official profile for treating AI-produced code within SSDF review and testing |
| R11 | Lamb, C. & Zacchiroli, S. (2021). *Reproducible Builds: Increasing the Integrity of Software Supply Chains.* IEEE Software; arXiv:2104.06020 | <https://arxiv.org/pdf/2104.06020> | S | a gate is only evidence if a third party can re-run it and get the same answer |

## LLM-written code, and LLM and agent reviewers

| R | item | URL | ✓ | why it matters here |
|---|---|---|---|---|
| R12 | Pearce, H., Ahmad, B., Tan, B., Dolan-Gavitt, B. & Karri, R. (2022). *Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions.* IEEE S&P; arXiv:2108.09293 | <https://arxiv.org/pdf/2108.09293> | S | about 40 % of completions in security-relevant scenarios were vulnerable |
| R13 | Perry, N., Srivastava, M., Kumar, D. & Boneh, D. (2023). *Do Users Write More Insecure Code with AI Assistants?* ACM CCS; arXiv:2211.03622 | <https://arxiv.org/pdf/2211.03622> | S | less secure code, AND more confidence that it is secure: the case for an adversarial reader |
| R14 | Cihan, U., Haratian, V., İçöz, A., et al. (2024). *Automated Code Review In Practice.* arXiv:2412.18531 | <https://arxiv.org/pdf/2412.18531> | S | an industrial deployment of an LLM reviewer: what was adopted and what it cost |
| R15 | Chowdhury, K., Banik, D., Ferdous, K. M. & Shamim, S. I. (2026). *From Industry Claims to Empirical Reality: An Empirical Study of Code Review Agents in Pull Requests.* MSR 2026 Mining Challenge; arXiv:2604.03196 | <https://arxiv.org/pdf/2604.03196> | S | most review agents fall below 60 % actionable comments, so a blocking flag must carry evidence |
| R16 | Selvanayagam, N. & Ghaleb, T. A. (2026). *AI-to-AI Code Reviews of GitHub Pull Requests.* arXiv:2608.21311 | <https://arxiv.org/pdf/2608.21311> | S | same-product vs cross-product AI review differ, which bears on reviewer independence |
| R17 | Yu, H., Liu, L., Jiang, X., Jia, Y., Wang, S., Qian, P. & Chen, Y. (2026). *Habituation at the Gate: Rising Approval and Declining Scrutiny in Human Review of AI Agent Code.* arXiv:2606.22721 | <https://arxiv.org/pdf/2606.22721> | S | human reviewers of agent code rubber-stamp more over time, so a human gate alone decays |
| R18 | Kamalı, H. Ö., Tuna, E., Haratian, V. & Tüzün, E. (2026). *Rethinking Code Review in the Age of AI: A Vision for Agentic Code Review.* arXiv:2605.17548 | <https://arxiv.org/pdf/2605.17548> | S | a staged agentic review workflow with human-controlled gates; its open-challenge list |

## Adversarial oversight and judge bias

| R | item | URL | ✓ | why it matters here |
|---|---|---|---|---|
| R19 | Irving, G., Christiano, P. & Amodei, D. (2018). *AI Safety via Debate.* arXiv:1805.00899 | <https://arxiv.org/pdf/1805.00899> | S | adversarial argument lets a weaker judge decide, which is the basis for the rebuttal round |
| R20 | Greenblatt, R., Shlegeris, B., Sachan, K. & Roger, F. (2024). *AI Control: Improving Safety Despite Intentional Subversion.* ICML 2024; arXiv:2312.06942 | <https://arxiv.org/pdf/2312.06942> | S | trusted monitoring of an untrusted code author, the closest model to an agent-authored repo |
| R21 | Zheng, L., Chiang, W.-L., Sheng, Y., et al. (2023). *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.* NeurIPS D&B; arXiv:2306.05685 | <https://arxiv.org/pdf/2306.05685> | S | position, verbosity and self-enhancement bias in LLM judges |
| R22 | Panickssery, A., Bowman, S. R. & Feng, S. (2024). *LLM Evaluators Recognize and Favor Their Own Generations.* arXiv:2404.13076 | <https://arxiv.org/pdf/2404.13076> | S | self-preference grows with self-recognition, the argument for a different reviewer model |
| R23 | Liu, N. F., Lin, K., Hewitt, J., Paranjape, A., Bevilacqua, M., Petroni, F. & Liang, P. (2023). *Lost in the Middle: How Language Models Use Long Contexts.* TACL; arXiv:2307.03172 | <https://arxiv.org/pdf/2307.03172> | S | why a truncated or very long diff is `unknown`, not a pass |
| R24 | FIRST (2023, rev. 2024). *Common Vulnerability Scoring System v4.0: Specification* | <https://www.first.org/cvss/v4-0/cvss-v40-specification.pdf> | S | separate axes for base severity and context, the model for severity vs weight in a RED FLAG |

## Formal-proof CI (Lean / mathlib)

| R | item | URL | ✓ | why it matters here |
|---|---|---|---|---|
| R25 | The mathlib Community (2020). *The Lean Mathematical Library.* CPP 2020 | <https://leanprover-community.github.io/papers/mathlib-paper.pdf> | S | the reference formal library and its maintenance model |
| R26 | van Doorn, F., Ebner, G. & Lewis, R. Y. (2020). *Maintaining a Library of Formal Mathematics.* CICM 2020 (author copy; also arXiv:2004.03673) | <https://florisvandoorn.com/papers/maintenance.pdf> | S | mathlib's linters and per-PR CI as maintainers' leverage on a corpus too big to read |
| R27 | Xie, Z., Liu, X. & Zhang, S. (2026). *MathlibPR: Pull Request Merge-Readiness Benchmark for Formal Mathematical Libraries.* arXiv:2605.07147 | <https://arxiv.org/pdf/2605.07147> | S | LLMs and agents cannot reliably tell merge-ready from build-passing, so build gates and review are both needed |

## FHIR IG CI

| R | item | URL | ✓ | why it matters here |
|---|---|---|---|---|
| R28 | FSH School (current). *Running SUSHI* | <https://fshschool.org/docs/sushi/running/> | S | SUSHI's exit and error behaviour, which G6 reads |
| R29 | HL7 (current). *FHIR IG Quality Criteria* | <https://confluence.hl7.org/spaces/FHIR/pages/42994452/1.+FHIR+IG+Quality+Criteria> | S | "builds with no errors", with warnings managed through a suppression file: the blocking vs advisory split for A2 |

## Schema validation

| R | item | URL | ✓ | why it matters here |
|---|---|---|---|---|
| R30 | W3C (2020). *JSON-LD 1.1 Processing Algorithms and API.* W3C Recommendation | <https://www.w3.org/TR/json-ld11-api/> | S | the exact meaning of "the JSON-LD renders": expansion and compaction without dropped terms (G7) |

## Considered and left out

The list was cut to 30 items. The following were found but left out, and can be
added on request: Google's *eng-practices* review guide (R2 covers the same
practice with data); Tufano et al. 2021 and Li et al. 2022 *CodeReviewer*
(pre-LLM review automation); Perez et al. 2022 *Red Teaming Language Models with
Language Models* (R19 and R20 cover the adversarial stance for code); the OWASP
Top 10 for LLM Applications 2025 (about LLM *applications*, not LLM-written
code); W3C SHACL (this KG validates with JSON Schema/zod, not RDF shapes);
Bosu, Greiler & Bird 2015, *Characteristics of Useful Code Reviews* (no
open-access URL could be confirmed).
