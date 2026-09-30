Knowledge graphs are managed in git repositories, made of self-documenting JSON
and JSON-LD. Content is rendered in several formats for downstream knowledge
products and for public, clinical and personal health applications.

| kind | the question it answers | examples on the slide |
|---|---|---|
| **Tool** repos | how can we compare deterministic and agentic workflows in well-defined processes? | `who/smart-kg-tools`, `ohs/folio-asst-tools`, `ohs/harness` |
| **Content** repos | how can agentic workflows support quality-assured, evidence-based authoring and publication, and how can agentic access to knowledge assets keep trusted provenance without overloading existing systems? | `who/smart-hiv`, `kenya/smart-hiv`, `who/iris`, `who/data-hub`, `who/ref-arch`, `ohs/folio-asst` |
| **Test** repos | how can we adjudicate, quality-control and compliance-test model performance in several modalities? | `who/smart-imz-test`, `kenya/smart-hiv-test` |
| **Consumer apps** | how can they be assured in agentic public-health and clinical workflows? | `app:ohs-*`, `app:anthropic-mcp`, `app:turn.io` |

**Source:** [Repo taxonomy](architecture/repo-taxonomy.html).

> **Misaligned — target, not current:** none of these repositories exists under
> these names. Today it is one monorepo, `litlfred/folio-assistant`, with
> instance directories (`cat-harness`, `folio-assistant-core`, `smart-base`,
> `smart-immunizations`, `who-iris`, …).
> [Current state](architecture/current-state.html) is the measured picture, and
> the slide is the [future state](architecture/future-state.html).
