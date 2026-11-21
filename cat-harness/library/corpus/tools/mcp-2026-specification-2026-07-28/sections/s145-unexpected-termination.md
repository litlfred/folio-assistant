---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s145-unexpected-termination
section_title: "Unexpected Termination"
file: "docs/specification/2026-07-28/basic/transports/stdio.mdx"
lines: 109-120
source_sha256: 6fd49766c40dc093
granularity: heading
---
## Unexpected Termination

If the server process exits unexpectedly, the client **SHOULD** restart it.
Because the protocol is stateless, any in-flight requests are simply lost and
the client can retry them against the fresh process. Active
[`subscriptions/listen`][subscriptions-listen] streams must also be
re-established after restart.

[sigterm]: https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/signal.h.html
[terminateprocess]: https://learn.microsoft.com/windows/win32/api/processthreadsapi/nf-processthreadsapi-terminateprocess
[job-objects]: https://learn.microsoft.com/windows/win32/procthread/job-objects
