---
doc_id: ihe-iti-vhl-1-0-0-comment
doc_title: "IHE IT Infrastructure Technical Framework Supplement — Verifiable Health Links (VHL)"
section_id: s009-operationdefinition-generate-vhl-generate-vhl-it
section_title: "OperationDefinition: Generate VHL (`$generate-vhl`, `[ITI-YY3]`)"
file: "ihe-iti-vhl-1-0-0-comment.md"
lines: 54-57
source_sha256: e2775b089a9763ff
granularity: heading
---
### OperationDefinition: Generate VHL (`$generate-vhl`, `[ITI-YY3]`)

The `GenerateVHL` operation (`https://profiles.ihe.net/ITI/VHL/OperationDefinition/GenerateVHL`, code `generate-vhl`) is invoked on a **VHL Sharer** at the system level (`POST [base]/$generate-vhl`). It accepts subject identification, optional document selection or folder references, expiration / passcode parameters, and consent directive references, and returns the signed VHL payload for storage on the VHL Holder's Personal Health Wallet.
