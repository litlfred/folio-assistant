Ask the agent to draft prose and statements; review and refine conversationally.

> **You:** Draft the introduction and the divergence theorem statement.
>
> **Assistant:** *(loads `content-author`, edits the blocks)* Done. The theorem
> reads: *"The sequence $(H_n)$ is unbounded; equivalently $\sum 1/k$ diverges."*
> I kept the statement Lean-friendly so it maps cleanly to `Filter.Tendsto`.

A mock of the chat-driven authoring session:

![Mock chat: the author and the assistant drafting blocks](../assets/img/mock-chat.svg)
