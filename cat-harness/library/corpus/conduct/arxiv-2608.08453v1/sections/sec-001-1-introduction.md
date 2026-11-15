---
doc_id: arxiv-2608.08453v1
doc_title: "What Keeps Agent Skills from Being Reusable? Evidence from 138K SKILL.md Files"
section_id: sec-001-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-2
source_pdf: 2608.08453v1.pdf
source_sha256: dd50ffb3d44d7a3c
---
Recently, AI skills have become a practical way to extend
Large Language Model (LLM) agents beyond the immediate
prompt [6]. Under the Agent Skills standard, a skill is pack-
aged as a SKILL.md file: frontmatter tells the agent when to
load it, the body gives instructions, and optional files provide
scripts, references, or assets [2]. In this form, skills turn task
experience into reusable software artifacts.
That promise depends on a basic assumption: a published
skill should still work outside the task, repository, platform,
or conversation that produced it. Our crawl contains 138,133
public SKILL.md files from 20,556 repositories, and its growth
has outpaced quality control. Many skills appear to be writ-
ten for a narrow local purpose and then shared as reusable
components. Some omit official routing or structure require-
ments; others inline too much code, include setup notes or
changelogs, leak local paths or credentials, or depend on
one model, platform, or operating system. These are not just
formatting issues. For a skill to be reusable, an agent must be
able to select it, load it, locate supporting resources, execute
it safely, and port it beyond the author’s original environ-
ment. Each stage corresponds to one or more categories in
our taxonomy, distinguishing our defects from generic style
or quality issues.
Existing work captures parts of this problem. SkillsBench [9]
shows that curated skills improve task completion by 16.2
percentage points while self-generated skills provide no mea-
surable benefit. SkillReducer [4] shows that non-actionable
content wastes context, Wang et al. [16] find malicious skills
in public registries, and Liu et al. [11] show that realistic skill
retrieval remains brittle. These studies make clear that skill
quality matters, but they leave a more basic question open:
when a public SKILL.md file fails to transfer across tasks or
platforms, what exactly has gone wrong? We answer this
question by characterizing whether public skills have the
artifact properties required for reuse.
We organize the study around four questions:
• RQ1: What reusability defects are prevalent in public
skills?
• RQ2: How do these defects limit skill reuse?
• RQ3: Which platform and provenance signals are associ-
ated with reusable skill quality?
• RQ4: What traits characterize reusable, high-quality Agent
Skills?
We make four contributions:
1. A reusable-skill quality model: a two-tier taxonomy
of 7 categories and 31 checks grounded in official require-
ments and best-practice guidance.
arXiv:2608.08453v1  [cs.AI]  9 Aug 2026
Agent Skills ’26, May 26, 2026, San Jose, CA, USA
Chi Zhang, Yimin Liu, Xinze Chen, and Ping Ji
2. An ecosystem-scale diagnosis: an analysis of 138,133
public skills showing that 89.3% violate the official speci-
fication and 91.8% contain at least one detected defect.
3. Functional evidence that defects matter: a routing
stress test showing that R1-clean skills are retrieved more
reliably than R1-defective skills from startup descriptions.
4. A path from diagnosis to intervention: platform, prove-
nance, exemplar, enforcement, and repair analyses that
motivate a quality-assured generation workflow and twelve
evidence-based authoring guidelines.
The remainder of the paper is organized as follows. Sec-
