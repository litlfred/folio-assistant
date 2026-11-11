---
doc_id: arxiv-2507.23348v1
doc_title: "SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution"
section_id: sec-003-33-multi-agent-debate
section_title: "Multi-Agent Debate"
section_number: 3.3
pages: 3-3
source_pdf: arxiv-2507.23348v1.pdf
source_sha256: 141ba926efb2b113
toc_source: outline
---
Conference’17, July 2017, Washington, DC, USA
Individual 
Exploration
***stage 1***
instruction:  
Enhance the _get_FIELD_display method in 
django/db/models/base.py to support custom display 
methods by checking for a user-defined get_FOO_display 
method (where FOO is the field name) before falling back to 
the default display logic.
context: 
django/db/models/base.py:Model._get_FIELD_display, lines 
939-944
Competitive 
Debate
***stage 1***
instruction: 
Modify the contribute_to_class method in 
db/models/fields/__init__.py to check for existing 
get_FIELD_display method before setting the default 
implementation
context: 
db/models/fields/__init__.py:Field.contribute_to_class, lines 
765-767
Debate
Localization Chains
Wrong place!
Correct place!
Localization Chain
Modification Plan
Modification Plan
Cannot override get_FOO_display() in 
Django 2.2+.
Description
I cannot override the get_FIELD_display function on 
models since version 2.2. It works in version 2.1.
Example:
class FooBar(models.Model):
foo_bar = models.CharField(_(“foo”), choices=[(1, 
'foo'), (2, 'bar')])
def __str__(self):
return self.get_foo_bar_display() 
# This returns 'foo' or 'bar' in 2.2, but 'something' in 
2.1
def get_foo_bar_display(self):
return "something"
What I expect is that I should be able to override this 
function.
--- a/django/db/models/fields/__init__.py
+++ b/django/db/models/fields/__init__.py
@@ -763,8 +763,12 @@
def contribute_to_class(self, cls, name, 
private_only=False)
…
-
setattr(cls, 'get_%s_display' % self.name,
-
partialmethod(cls._get_FIELD_display, 
field=self))
+            if not hasattr(cls, 'get_%s_display' % 
self.name):
+                setattr(cls,
+                    'get_%s_display' % self.name,
+                    partialmethod(cls._get_FIELD_display, 
field=self),
+                )
Golden Patch：
Issue django-11999：
Figure 1: Motivating example of multi-agent debate.
method overwriting at the source rather than attempting runtime
workarounds, requires minimal code changes at lines 765-767 in
django/db/models/fields/__init__.py with a simple existence
check using if not hasattr(cls,method_name), and maintains
backward compatibility while enabling user method preservation.
This debate dynamic creates productive analytical tension where
agents must defend their approaches against alternatives [19, 50],
transforming issue resolution from individual exploration to struc-
tured multi-perspective reasoning that enables precise architectural
understanding and modification plans that individual agents cannot
achieve [31, 53].
3
