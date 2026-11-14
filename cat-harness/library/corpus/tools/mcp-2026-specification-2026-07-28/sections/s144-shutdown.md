---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s144-shutdown
section_title: "Shutdown"
file: "docs/specification/2026-07-28/basic/transports/stdio.mdx"
lines: 87-108
source_sha256: 6fd49766c40dc093
granularity: heading
---
## Shutdown

The client **SHOULD** initiate shutdown by:

1. Closing the input stream to the child process (the server).
2. Waiting for the server to exit.
3. If the server does not exit within a reasonable time, forcibly terminating
   the process using the mechanism appropriate for the operating system.

On POSIX systems, forced termination typically escalates from
[`SIGTERM`][sigterm]
to `SIGKILL`. On Windows, where POSIX signals are not available, clients can
use [`TerminateProcess`][terminateprocess]
or [Job Objects][job-objects].

Servers **SHOULD** exit promptly when their standard input is closed or reads
return end-of-file. This is the primary graceful-shutdown signal and the only
portable one, so honoring it reduces the need for forced termination.

The server **MAY** initiate shutdown by closing its output stream to the
client and exiting.
