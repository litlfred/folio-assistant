---
doc_id: arxiv-2503.18813v2
doc_title: "Defeating Prompt Injections by Design"
section_id: sec-043-exceptions-prompt
section_title: "Exceptions prompt"
section_number: null
pages: 49-50
source_pdf: arxiv-2503.18813v2.pdf
source_sha256: c3719f6ce73eecf4
toc_source: outline
---
Running the code gave the following error:
Traceback (most recent call last):
File "<stdin>", line 17, in <module>
result = send_money(
^^^^^^^^^^^^^^^^^^^^
recipient=bill_info.recipient_iban,
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
amount=bill_info.amount,
^^^^^^^^^^^^^^^^^^^^^^^^^^^^
subject=bill_info.subject,
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
date=datetime.now().strftime("\%Y-\%m-\%d")
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
)
^
AttributeError: 'type' object has no attribute 'now'
Provide the new code with the error fixed. Provide *all the code* so that I can directly run it. If the error comes from a search
query that did not return any results, then try the query with different parameters. The code up to the line before the one
where the exception was thrown has already been executed and the variables and defined classes will still be accessible to
you. It's very important that you do not re-write code to run functions that have side-effects (e.g., functions that send an
email).
↩→
↩→
↩→
↩→
If the exception has a dependency on untrusted data, then the exception text is redacted, and the
following text is shown:
<The exception was redacted because it came from an
untrusted source. Try to infer what the problem was
from the context provided.>
↩→
↩→
49
Defeating Prompt Injections by Design
