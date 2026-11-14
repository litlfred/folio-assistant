---
doc_id: 9789240116191-eng
doc_title: "9789240116191-eng"
section_id: page-047
section_title: "Page 47"
pages: 47-47
pdf_page: 47
source_pdf: 9789240116191-eng.pdf
source_sha256: 9cc9ca42d30db9eb
text_source: embedded
granularity: page
---
38
Leveraging the WHO-hosted PCMT 
The PCMT will implement appropriate data access and 
security controls to support product catalogues for 
multiple countries and organizations. Each country’s or 
organization’s catalogue will be maintained as a separate 
dataset through access permissions based on specific 
user categories.
Illustrative details of catalogue setup and 
access structure:
In PCMT, users can be grouped into User Groups, which 
are assigned to Categories that define their level of 
access (view, edit, or own). Permissions are assigned to 
product records by linking them to categories.
Example access model:
•	
Global Catalogue
-	
Managed by: WHOGroup
-	
Category: Catalogues → WHO
-	
Permissions:
-	 View: All users
-	 Edit: WHOGroup
-	 Own (approve/reject): WHOGroup
•	
Country A Catalogue
-	
Managed by: CAGroup
-	
Category: Catalogues → CA
-	
Permissions:
-	 View: CAGroup
-	 Edit: CAGroup
-	 Own (approve/reject): CAGroup
•	
Country B Catalogue
-	
Managed by: CBGroup
-	
Category: Catalogues → CB
-	
Permissions:
-	 View: CBGroup
-	 Edit: CBGroup
-	 Own (approve/reject): CBGroup
•	
Although each catalogue is distinct, user groups may 
categorize products using any category system 
available in the platform. However, a reserved category 
tree labeled “Catalogues” is used specifically to 
separate catalogues and assign user-level access.
•	
When importing, creating, or editing products, users 
must ensure that their designated Catalogue Category 
is selected.
•	
Cross-catalogue associations are also supported. 
For example, a user from Country A may associate a 
product in the Country A Catalogue with a product 
from the Global Catalogue, thereby enabling linkages 
between national and global product information 
(e.g., for regulatory or market authorization purposes).
•	
Products may also be copied from one catalogue to 
another manually or via automated copy rules, 
allowing, for instance, a country user to replicate trade 
item data from the Global Catalogue into their own 
national catalogue.
