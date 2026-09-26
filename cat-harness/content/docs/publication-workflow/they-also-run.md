Since bean `fq0b` these files are not only pictures. The MCP server interprets
them: `workflow_start` opens an instance for a subject, `workflow_next` reports
what is enabled *now* — with the lane that performs it and the skill that
implements it — and `workflow_complete` refuses a step the process has not
reached. `Commit into the corpus` cannot be reported done before the editor's
decision is recorded, because there is no token on it until then.

That is ordering, not enforcement: nothing yet stops an agent calling a
capability tool directly. The case for making it binding — and the argument
that the commit boundary is the right place — is in
[Proposal: workflow orchestration](proposals/workflow-orchestration.html).
