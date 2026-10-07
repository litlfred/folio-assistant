---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-026-so-are-prompt-injections-solved-now
section_title: "So, Are Prompt Injections Solved Now?"
section_number: null
pages: 24-24
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
No, prompt injection attacks are not fully solved. While CaMeL significantly improves the security
of LLM agents against prompt injection attacks and allows for fine-grained policy enforcement, it
is not without limitations. Importantly, CaMeL suffers from users needing to codify and specify
security policies and maintain them. CaMeL also comes with a user burden. At the same time, it is
well known that balancing security with user experience, especially with de-classification and user
fatigue, is challenging. We also explicitly acknowledge the potential for side-channel vulnerabilities in
CaMeL; however, we do note that their successful exploitation is significantly hindered by bandwidth
limitations and the involved attack complexity.
Similarly, in traditional software security, Control Flow Integrity (CFI) (Abadi et al., 2009) was
developed to prevent control flow hijacking but remained vulnerable to return-oriented programming
(ROP) attacks (Shacham, 2007; Carlini and Wagner, 2014). ROP is an exploitation technique where
attackers chain together existing code fragments (called "gadgets") to execute malicious operations
while following individually valid control flows. We suspect attacks that are similar in spirit could
work against CaMeL – an attacker might be able to create a malicious control flow by approximating
it with the smaller control flow blocks that are allowed by the security policy similar to what we
demonstrate in Section 6.4.
And is AgentDojo fully solved now? Not exactly. While CaMeL offers robust security guarantees
and demonstrates resilience against existing prompt injection attacks within AgentDojo benchmark, it
would be inaccurate to claim a complete resolution. Rather, our approach diverges from prior efforts,
focusing on building model scaffolding rather than improving the model. Furthermore, existing
research predominantly aims to optimize utility while mitigating attack success rates. In contrast,
our focus is on establishing verifiable security guarantees while concurrently maximizing utility. We
firmly believe that by adopting CaMeL as a fundamental design paradigm, future research will unlock
substantial enhancements in utility.
