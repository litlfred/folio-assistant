---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s009-key-principles
section_title: "Key Principles"
file: "docs/specification/2026-07-28/index.mdx"
lines: 95-114
source_sha256: c8151ab8d7f26ab4
granularity: heading
---
### Key Principles

1. **User Consent and Control**
   - Users must explicitly consent to and understand all data access and operations
   - Users must retain control over what data is shared and what actions are taken
   - Implementors should provide clear UIs for reviewing and authorizing activities

2. **Data Privacy**
   - Hosts must obtain explicit user consent before exposing user data to servers
   - Hosts must not transmit resource data elsewhere without user consent
   - User data should be protected with appropriate access controls

3. **Tool Safety**
   - Tools represent arbitrary code execution and must be treated with appropriate
     caution.
     - In particular, descriptions of tool behavior such as annotations should be
       considered untrusted, unless obtained from a trusted server.
   - Hosts must obtain explicit user consent before invoking any tool
   - Users should understand what each tool does before authorizing its use
