---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-027-future-work
section_title: "Future work"
section_number: null
pages: 24-25
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
CaMeL makes a significant step forward in providing security for LLM agents. However, there is some
further work that can be done to improve both security and utility.
Using a different programming language. While basic features of Python are easy to implement,
especially when using Python as the host language for the interpreter, this language quickly grows
very complex and harder to make secure. For example, program termination caused by exceptions
can be a security issue, as pointed out in Section 7. Programming languages that handle errors
24
Defeating Prompt Injections by Design
and I/O more explicitly, such as Haskell, might be a more secure choice for deploying CaMeL to
real-world applications. This complexity also has ramifications for security policies, since policy
conflict resolution becomes hard to manage.
Towards formal verification. A crucial direction for future work is the formal verification of CaMeL
and its security properties. While our current implementation provides strong empirical evidence of
CaMeL’s effectiveness in both benign and security LLM evaluations, verification can provide a formal
proof that CaMeL’s interpreter itself is without faults and that it resolves conflicts and enforces the
intended security policies, even in the presence of complex code and potential vulnerabilities in the
underlying LLMs.
Contextual integrity and security policy automation. The effectiveness of CaMeL also depends
on the availability of sufficient context for making security decisions. In some cases, the system
may not have enough information to determine whether a particular action is safe, requiring user
intervention. To address this, CaMeL can potentially integrate with contextual integrity tools like
AirGap (Bagdasaryan et al., 2024; Ghalebikesabi et al., 2024), which can automate aspects of security
policy enforcement based on context-specific policies; however this might come with some degradation
in either security or model utility. CaMeL can also potentially be integrated with concurrent work by
Shi et al. (2025), who use a DSL for security policies and leverage LLMs to generate them.
