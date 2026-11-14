---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-005-21-agent-skills-and-the-skillmd-format
section_title: "Agent Skills and the SKILL.md Format"
section_number: 2.1
pages: 2-3
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
An Agent Skill is a directory containing a SKILL.md file with
two parts: YAML (Yet Another Markup Language) frontmat-
ter for structured metadata and a Markdown body for in-
structions. The frontmatter must include a name (max 64
characters, lowercase alphanumeric and hyphens) and a
description (max 1,024 characters) that specifies what the
skill does and when to use it [2]. The description serves as the
primary routing mechanism: agents load skill descriptions
at startup to decide which skill to activate for a given task.
The body contains instructions the agent follows when the
skill is invoked.
The specification recommends keeping the body under
500 lines and organizing supporting content into scripts/,
references/, and assets/ subdirectories [2]. This progres-
sive disclosure pattern loads metadata (∼100 tokens) at startup,
the body (<5,000 tokens) on activation, and resources only
when needed, minimizing context window consumption.
2.2
Related Work
The recent literature has largely established that skills can
help agents, but only under the right conditions. SkillsBench [9]
makes this contrast especially clear: curated skills improve
task completion by 16.2 percentage points, while self-generated
skills provide no measurable benefit. The same study finds
that focused skills with 2–3 modules outperform compre-
hensive documentation, suggesting that a useful skill is not
simply a longer prompt or a larger knowledge dump. Liu
et al. [11] reach a similar conclusion from a different angle:
when agents must retrieve from 34K real-world skills, the
benefit of skills becomes brittle. These findings move the
question upstream. Before asking whether a skill improves a
task, we need to ask whether the skill is written in a form
that can be selected, loaded, and reused outside the context
where it was created.
That upstream question turns skills into an artifact-quality
problem. A SKILL.md file sits between prompt engineering,
agent scaffolding, and software packaging: it must be concise
enough for progressive disclosure, precise enough for rout-
ing, and concrete enough to guide execution. SkillReducer [4]
studies one part of this artifact problem by showing that over
60% of body content in public skills is non-actionable and
that 26.4% of skills lack routing descriptions. Those results
explain why token efficiency and routing metadata matter,
but they also point beyond compression. Public skills can fail
through body bloat, weak descriptions, poor resource orga-
nization, local environment assumptions, unsafe commands,
or conflicts with the agent’s surrounding instructions. Our
work therefore treats skill quality as a multi-stage reusability
question rather than a single optimization target.
Agent harnesses make this question more consequential.
ClawsBench [10] evaluates LLM productivity agents across
realistic Gmail, Slack, Calendar, Docs, and Drive workflows,
where domain skills expose API knowledge through pro-
gressive disclosure and a meta prompt coordinates behavior
across services. In this setting, a skill is no longer a private
note saved from one conversation. It becomes part of the
interface between the agent, the harness, and external tools.
For such an interface to work, a skill needs routable metadata,
manageable instructions, organized supporting resources,
and enough portability to survive changes in platform, model,
or operating environment.
The same interface also raises safety concerns. Wang et
al. [16] analyze 150,108 skills from 7 registries and find 620
malicious skills, while Skill-Inject [14] shows that injected
skill files can reach up to 80% attack success. These works
study deliberately malicious skills, but their threat model
highlights a broader issue for public reuse: once a skill is
shared, the agent may treat its contents as operational in-
structions. Even benign skills can therefore be risky if they
preserve hardcoded credentials, unsafe shell commands, lo-
cal paths, or instructions that redefine the agent’s role. This
connects skill quality to general LLM-agent safety concerns,
including OWASP risks such as prompt injection and exces-
sive agency [13], as well as instruction-hierarchy failures
where lower-priority instructions can still override higher-
priority intent [5, 7, 15].
Tooling has started to address parts of this problem. The
agnix linter [1] implements 385 validation rules across 6
agent platforms, and the official skills-ref validator [2]
checks frontmatter syntax. What remains missing is an ecosystem-
level account of which defects are actually common, which
ones affect functional reuse, and which checks should be
enforced before repair or human review. Our study fills this
gap by characterizing 138,133 public SKILL.md files with
a two-tier taxonomy that spans routing, body design, re-
source organization, prohibited content, behavioral safety,
portability, and persona/scope conflicts.
What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files
Agent Skills ’26, May 26, 2026, San Jose, CA, USA
3
