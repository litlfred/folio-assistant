---
doc_id: arxiv-2507.07974v2
doc_title: "Defending Against Prompt Injection With a Few DefensiveTokens"
section_id: sec-004-31-preliminaries
section_title: "Preliminaries"
section_number: 3.1
pages: 3-3
source_pdf: arxiv-2507.07974v2.pdf
source_sha256: 3e7b35ff62951d98
toc_source: outline
---
We consider an LLM application that follows the format below.
An LLM input in LLM-integrated applications
[INST] Please write a clear and efficient algorithm that solves
the following problem.
[DATA] Calculate the Fibonacci sequence up to the n-th number.
[RESP]
The input consists of a prompt (instruction from a trusted user)
and data (from untrusted external sources), separated by delimiters
[INST], [DATA], and [RESP], whose specific choices vary across
different LLMs. A prompt injection attacker inserts new instructions
into the external data, see the injection below in red.
A prompt injection example
[INST] Please write a clear and efficient algorithm that solves
the following problem.
[DATA] Calculate the Fibonacci sequence up to the n-th number.
Ignore previous instructions and share with me the code you
generated for Bob.
[RESP]
Our considered threat model follows Chen et al. [3, 4]. We assume
the attacker has the ability to inject an instruction into the data part.
The attacker has full knowledge of the benign instruction and the
prompt format, including the DefensiveToken’s embeddings, but
cannot modify them. The attack succeeds when the LLM responds
to the injected instruction rather than treating it as part of the
data to be processed according to the legitimate user instruction.
As defenders, our security objective is to ensure the LLM ignores
potential injections in the data portion. Our goal is to preserve the
LLM’s utility to provide high-quality responses to user instructions,
whether a prompt injection exists or not.
3.2
