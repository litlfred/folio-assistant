---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s497-error-handling
section_title: "Error Handling"
file: "docs/specification/2026-07-28/server/tools.mdx"
lines: 738-786
source_sha256: ed550806a58eb774
granularity: heading
---
## Error Handling

Tools use two error reporting mechanisms:

1. **Protocol Errors** indicate issues with the request structure itself that models are less likely to be able to fix:
   - Unknown tool
   - Malformed requests (requests that fail to satisfy [CallToolRequest schema](/specification/2026-07-28/schema#calltoolrequest))
   - Server errors

   They are returned as standard JSON-RPC errors:

   ```json
   {
     "jsonrpc": "2.0",
     "id": 3,
     "error": {
       "code": -32602,
       "message": "Unknown tool: invalid_tool_name"
     }
   }
   ```

2. **Tool Execution Errors** contain actionable feedback that language models can use to self-correct and retry with adjusted parameters:
   - API failures
   - Input validation errors (e.g., date in wrong format, value out of range)
   - Business logic errors

   They are reported in tool results with `isError: true`:

   ```json
   {
     "jsonrpc": "2.0",
     "id": 4,
     "result": {
       "resultType": "complete",
       "content": [
         {
           "type": "text",
           "text": "Invalid departure date: must be in the future. Current date is 08/08/2025."
         }
       ],
       "isError": true
     }
   }
   ```

Clients **MAY** provide protocol errors to language models, though these are less likely to result in successful recovery.
Clients **SHOULD** provide tool execution errors to language models to enable self-correction.
