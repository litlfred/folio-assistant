---
layout: default
title: Skill instructions
nav_order: 6
has_children: true
---

# Skill instructions

The prose **instruction bodies** the LLM loads (via `skill_fetch`) when it
runs a skill. These are generated from the skill source markdowns, so the
published reference always matches what the agent actually reads.

For each skill's *typed input/output contract*, see the
[Skill schema reference](../skills/); for the conceptual overview of skills,
roles, and how they compose with the LLM, see [Skills & roles](../../skills.html).

## Lifecycle skills

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Content Authoring](content-author.html) | `content-author` | [schema](../skills/content-author.html) | Create and develop content artifacts according to the project plan. |
| [Content Feedback Collection](content-feedback.html) | `content-feedback` | [schema](../skills/content-feedback.html) | Gather and triage feedback on published content for future iterations. |
| [Content Planning](content-plan.html) | `content-plan` | [schema](../skills/content-plan.html) | Plan content development by defining scope, team, timeline, and sprint cadence. |
| [Content Publication](content-publish.html) | `content-publish` | [schema](../skills/content-publish.html) | Package, version, and publish approved content. |
| [Content Retirement](content-retire.html) | `content-retire` | — | Deprecate and retire content that is no longer current or needed. |
| [Content Review](content-review.html) | `content-review` | [schema](../skills/content-review.html) | Formal review and approval of validated content before publication. |
| [Content Testing](content-test.html) | `content-test` | [schema](../skills/content-test.html) | End-to-end testing of content artifacts in realistic scenarios. |
| [Content Validation](content-validate.html) | `content-validate` | [schema](../skills/content-validate.html) | Validate authored content against schemas, standards, and clinical accuracy. |

## Agent skills

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Corpus-Grep](corpus-grep.html) | `corpus-grep` | — | > **Disambiguation.** This skill formalizes the **backward** check |
| [Deployment & Auth](deployment-auth.html) | `deployment-auth` | — |  |
| [Editor](editor.html) | `editor` | — | git diff --name-only main...HEAD -- 'content/**/*.ts' 'content/**/*.md' 'content/**/*.lean' |
| [Readability Editing](readability-editing.html) | `readability-editing` | — |  |
| [symbiotic-interaction](symbiotic-interaction.html) | `symbiotic-interaction` | — |  |
| [Todo Review](todo-review.html) | `todo-review` | — | > **Disambiguation:** |

> The `authoring-math` and `authoring-who-smart-guidelines` packages ship
> skill *definitions* + typed schemas today; their prose instruction bodies
> will appear here as they are authored.
