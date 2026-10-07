---
doc_id: github-docs-actions-secure-use-reference
doc_title: "github-docs-actions-secure-use-reference"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: github-docs-actions-secure-use-reference.pdf
source_sha256: 01998138855e6c3f
text_source: embedded
granularity: page
---
Periodically review the registered secrets to confirm they are still required. Remove
those that are no longer needed.
Rotate secrets periodically to reduce the window of time during which a compromised
secret is valid.
Consider requiring review for access to secrets
You can use required reviewers to protect environment secrets. A workflow job cannot
access environment secrets until approval is granted by a reviewer. For more information
about storing secrets in environments or requiring reviews for environments, see Using
secrets in GitHub Actions and Managing environments for deployment.
Good practices for mitigating script injection attacks
Recommended approaches for mitigating the risk of script injection in your workflows:
Use an action instead of an inline script
The recommended approach is to create a JavaScript action that processes the context value
as an argument. This approach is not vulnerable to the injection attack, since the context value
is not used to generate a shell script, but is instead passed to the action as an argument:
uses: fakeaction/checktitle@v3
with:
title: ${{ github.event.pull_request.title }}
Use an intermediate environment variable
For inline scripts, the preferred approach to handling untrusted input is to set the value of the
expression to an intermediate environment variable. The following example uses Bash to
process the github.event.pull_request.title value as an environment variable:
- name: Check PR title
env:
TITLE: ${{ github.event.pull_request.title }}
run: |
if [[ "$TITLE" =~ ^octocat ]]; then
echo "PR title starts with 'octocat'"
exit 0
else
echo "PR title did not start with 'octocat'"
10/7/26, 7:49 AM
Secure use reference - GitHub Docs
https://docs.github.com/en/actions/reference/security/secure-use
3/17
