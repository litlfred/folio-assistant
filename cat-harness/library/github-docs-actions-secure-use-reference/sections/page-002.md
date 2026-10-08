---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
value to be treated as a secret and redacted from logs. For more information about
masking data, see Workflow commands for GitHub Actions.
Delete and rotate exposed secrets
Redacting of secrets is performed by your workflow runners. This means a secret will
only be redacted if it was used within a job and is accessible by the runner. If an
unredacted secret is sent to a workflow run log, you should delete the log and rotate the
secret. For information on deleting logs, see Using workflow run logs.
Never use structured data as a secret
Structured data can cause secret redaction within logs to fail, because redaction largely
relies on finding an exact match for the specific secret value. For example, do not use a
blob of JSON, XML, or YAML (or similar) to encapsulate a secret value, as this
significantly reduces the probability the secrets will be properly redacted. Instead, create
individual secrets for each sensitive value.
Register all secrets used within workflows
If a secret is used to generate another sensitive value within a workflow, that generated
value should be formally registered as a secret, so that it will be redacted if it ever
appears in the logs. For example, if using a private key to generate a signed JWT to
access a web API, be sure to register that JWT as a secret or else it won’t be redacted if
it ever enters the log output.
Registering secrets applies to any sort of transformation/encoding as well. If your secret
is transformed in some way (such as Base64 or URL-encoded), be sure to register the
new value as a secret too.
Audit how secrets are handled
Audit how secrets are used, to help ensure they’re being handled as expected. You can
do this by reviewing the source code of the repository executing the workflow, and
checking any actions used in the workflow. For example, check that they’re not sent to
unintended hosts, or explicitly being printed to log output.
View the run logs for your workflow after testing valid/invalid inputs, and check that
secrets are properly redacted, or not shown. It's not always obvious how a command or
tool you’re invoking will send errors to STDOUT and STDERR , and secrets might
subsequently end up in error logs. As a result, it is good practice to manually review the
workflow logs after testing valid and invalid inputs. For information on how to clean up
workflow logs that may unintentionally contain sensitive data, see Using workflow run
logs.
Audit and rotate registered secrets
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
2/17
