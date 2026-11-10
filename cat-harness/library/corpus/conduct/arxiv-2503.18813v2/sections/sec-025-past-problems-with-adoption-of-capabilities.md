---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-025-past-problems-with-adoption-of-capabilities
section_title: "Past problems with adoption of capabilities"
section_number: null
pages: 23-24
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
While capability-based systems offer a robust security model, it is important to acknowledge their lim-
itations, particularly concerning their broader applicability, implementation, and adoption challenges.
One drawback is the high cost of implementation. Building a capability-based system requires
significant effort and resources, as it requires a fundamental shift in how security is managed and
enforced. This includes not just the development of the core system but also the integration and
adaptation of existing tools and infrastructure. CHERI serves as a good case study (Watson et al., 2015),
where incorporation of capabilities required a redesign of the full software-hardware stack (Zaliva
et al., 2024), changes to development practices (e.g. with compartmentalization of code (Gudka
et al., 2015)) as well as significant effort to raise awareness of the benefits (RSM UK Consulting LLP
for UK DSIT, 2025).
Furthermore, capability-based systems ideally require full participation from the entire ecosystem. For
the model to effectively enforce security policies, all external tools and services within the environment
must be designed to understand and utilize capabilities, otherwise utility degrades. This can be a
major obstacle, especially when dealing with third-party tools or services that may not have been
built with capability-based security in mind.
Having said that, in the context of agents operating within a controlled environment like workspace,
implementing a capability-based system may be feasible as long as all the tools and services are
under the control of the system developers. However, as soon as the agent needs to interact with
external, third-party tools, the challenge of ensuring capability support arises. So grow the risks from
side-channel attacks as we discuss further. Yet we believe that in some cases, it may be possible to
use capability-based systems even if third-party tools do not support capabilities. This is because the
agent can act as a central authority that manages capabilities for all objects in the system.
23
Defeating Prompt Injections by Design
9.2. De-classification and user fatigue
Another challenge lies in balancing security with user experience. While CaMeL can prevent many
prompt injection attacks, it may also require user intervention in situations where the security policy is
too restrictive or ambiguous. Access control problems often manifest in the process of de-classification
process or “downgrading” (Anderson, Stajano, and Lee, 2002). This can lead to user fatigue, where
users become desensitized to security prompts and may inadvertently approve malicious actions,
a practice that is often seen in other settings (Felt et al., 2012; Cao et al., 2021). Achieving the
optimal balance between system security and minimizing user fatigue will vary depending on the
specific application. Ultimately, however, it’s paramount for enabling effective security. In the end,
security will only be as strong as the capabilities the system supports, and the policies that the system
implements and enforces.
