- **Tool repos** may implement a skill through coordinated tools (scripts,
  retrieved software, local or remote services, containers). They may make tools
  available to agents over MCP or for local execution, configure tools for the
  test harness (the ITB), and define more than one tool for a skill.
- **Content repos** may define schemas for the content types of KG nodes and
  instantiate them. They may define the skills needed to publish and consume
  that content, and designate each skill agentic, mechanical or human. They
  **must** constrain skill inputs and outputs with schemas (JSON, `.ts`).
- **Test repos** may hold test data, test-data generation templates and
  configuration, FHIR test plans and test-language dialects (Gherkin), and may
  make test data available to the ITB and to SME review.
- **Consumer apps** may use KG schemas and instance data from content repos,
  execute their decision logic or indicator calculations, and use test and tool
  repos to develop, prepare for a connectathon or test compliance.

Relations: a test repo **depends** on content, a tool repo **references** it,
and apps **utilize** all three.

**Sources:** [Repo taxonomy](architecture/repo-taxonomy.html);
[KGraph repositories](kgraph.html).

> **Aligned:** slide 10's `who/smart-kg` is a real, separate repository, which
> is the repo taxonomy's worked example of splitting content from tools. Its
> stub directory in this checkout was removed because the repository already
> exists elsewhere (bean `wg7r`), and the taxonomy now says so. An earlier
> version of this note read that removal as the example going stale.
