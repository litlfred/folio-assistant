---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-032-access-and-information-flow-controls
section_title: "Access and Information Flow Controls"
section_number: null
pages: 31-31
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Ensuring program integrity, i.e. that the program was not modified since last authorised modification,
and confidentiality, i.e. that the program preserves the promise of secrecy, are fundamental challenges
in computer security. One prominent threat to integrity is the buffer overflow attack (Aleph One, 1996),
which exploits memory vulnerabilities to execute malicious code, usually violating the intended control
flow of the program. Control Flow Integrity (CFI), as proposed by Abadi et al. (2009), addresses this
by instrumenting binaries to enforce adherence to a pre-defined Control Flow Graph (CFG), thereby
restricting execution only to legitimate paths, reducing attack surface, but not fully eliminating
it (Carlini and Wagner, 2014). Beyond integrity, controlling access to sensitive information is crucial.
Access Control mechanisms (Anderson, 2010), broadly categorised into Mandatory Access Control
(MAC) and Discretionary Access Control (DAC), govern how resources are accessed. Furthermore,
Information Flow Control (IFC) (Denning, 1976; Myers and Liskov, 1997) provides confidentiality
by tracking information, preventing leaks of sensitive data into unauthorized contexts. This can
be achieved through various methods, including static code analysis to formally verify program
properties (Denning and Denning, 1977) and language-based security mechanisms, such as specialized
type systems (Sabelfeld and Myers, 2003).
