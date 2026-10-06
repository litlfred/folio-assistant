---
doc_id: 9789240093362-eng
doc_title: "Digital transformation handbook for primary health care Optimizing person-centred point of service systems"
section_id: sec-042-aggregate-indicator-mapping-guide
section_title: "Aggregate indicator mapping guide"
section_number: null
pages: 90-92
source_pdf: 9789240093362-eng.pdf
source_sha256: 0d47d98390b1451d
toc_source: outline
---
A spreadsheet should be created to document the indicators that can be calculated from the individual level data that is 
collected from the PCPOSS. This guide provides a way to consolidate and organize this list of indicators.
What to note
Description
Indicator ID
The Indicator ID should be a running number or letter that would facilitate organization and 
references. 
Indicator name
Brief name of the indicator. 
Definition
Provide a narrative description of the indicator to provide additional context.
Numerator 
description
Note the narrative definition of the numerator used to calculate the indicator here. 
Numerator 
computation
Note how the numerator is calculated in a formula format.
 Any specific data elements noted here should align directly with the individual-level Data element 
label in the data dictionary to realize the benefit of one-time data entry. Using the same Data element 
labels that are listed in the data dictionary will help with the linkage of primary data elements to the 
generation of aggregate indicators for reporting.
Denominator 
description
Note the narrative definition of the denominator used to calculate the indicator here.
Denominator 
computation 
Note how the denominator is calculated in a formula format. 
Any specific data elements noted here should align directly with the individual-level Data element 
label to realize the benefit of one-time data entry. Using the same data element labels that are 
listed in the data dictionary will help with the linkage of primary data elements to the generation of 
aggregate indicators for reporting.
Frequency of 
reporting
Indicate how often is this indicator reported. Is it reported daily, weekly, monthly, annually?
Disaggregation
What are the dis-aggregations needed for analysis? E.g. geography (district, country, province), age, 
socioeconomic status, level of education. 
Alerts or 
targets
Are there targets that this indicator needs to meet? Is there a threshold for the indicator in which 
escalation is needed or for when the public health authority needs to be alerted?
References
If there are any national or global guidelines (e.g. WHO guidelines) that dictate how and why 
this indicator should be calculated or reported, it should be noted here. If any guidelines or 
recommendations change, having a clear reference listed would help in updating or restructuring 
data and indicators.
Introduction
How to use 
this handbook
User 
 requirements
Design and  
adaptation
Training, testing  
and roll-out
Scale-up
Annexes
Annexes
79
ANNEX 10. 
Decision-support logic and scheduling 
matrix guide
This table should provide an overview and inventory of all the decision-support logic that will be elaborated in decision trees 
and/or decision-support tables. Each decision-support logic should be noted in a separate row in a table. For each row, the 
following columns should be filled out.
What to note
Description
Activity ID and 
activity name
What is the associated “Activity” from your workflow diagram for which this decision is necessary? For 
example, during the family planning counselling process, one decision that needs to be made is the 
family planning method.
Decision-
support table 
ID
This should be a running number of decision-support logic that needs to be documented. This helps 
ensure linkages and facilitated cross references to the data dictionary.
Decision name
Briefly describes the decision for which the decision table provides the decision logic
Description
Give a description of what decision needs to be made.
References
What global and/or national guidelines inform this decision-making process?
This table should provide an overview and inventory of all the service schedules that will be elaborated in a scheduling logic 
table. Each health service schedule should be noted in a separate row in a table. For each row, the following columns should be 
filled out. 
What to note
Description
Scheduling 
logic ID
This should be a running number of health service schedules. This helps ensure linkages and 
facilitated cross references to the data dictionary.
Scheduling 
logic 
description
Provide the description of the health service or care plan being outlined, e.g. measles vaccination 
schedule, antenatal care schedule.
References
What global and/or national guidelines inform this?
An example of this can be found in the following resources: 
•	 Digital adaptation kit for antenatal care: operational requirements for implementing WHO recommendations in digital systems. 
Geneva: World Health Organization; 2021 (https://iris.who.int/handle/10665/339745).
•	 Digital adaptation kit for family planning: operational requirements for implementing WHO recommendations in digital systems. 
Geneva: World Health Organization; 2021 (https://iris.who.int/handle/10665/341997).
•	 Digital adaptation kit for HIV: operational requirements for implementing WHO recommendations and standards within digital 
systems, 2nd edition. Geneva: World Health Organization; 2023 (https://iris.who.int/handle/10665/375230).
•	 Digital adaptation kit for tuberculosis: operational requirements for implementing WHO recommendations in digital systems. 
Geneva: World Health Organization; 2024 (https://iris.who.int/handle/10665/376631).
•	 Digital adaptation kit for child health (0-59 months) in humanitarian emergencies: operational requirements for implementing 
WHO recommendations in digital systems. Geneva: World Health Organization; 2024 (https://iris.who.int/handle/10665/376626).
Introduction
How to use 
this handbook
User 
 requirements
Design and  
adaptation
Training, testing  
and roll-out
Scale-up
Annexes
Digital transformation handbook for primary health care
80
The decision-support table template provides a structured way of parsing out the logic into clear “if/then” statements with a 
clear list of inputs and action, and outputs. It has been adapted from the Decision Model and Notation (DMN) standard.
Decision-support 
table ID
The Decision support table ID should correspond to the number in the overview matrix (Annex 10).
Decision name
The name of the “decision” describing what algorithm or logic is represented (e.g. pre-eclampsia risk 
counselling).
Business rule
The description of the decision that needs to be made based on IF/THEN statements with the appropriate 
data element name for the variables. The rule demonstrates the relationship between the input variables 
and the expected outputs and actions within the decision-support logic, for example, if blood pressure is 
higher than 140 SBP/90 DBP for a pregnant client, then the client is flagged as a high-risk pregnancy
Trigger
The event that would indicate when this decision-support logic should appear within the workflow, such as 
the activity that would trigger this decision to be made
Hit Policy Indicator
Displays the hit policy selected for the table. The hit policy determines how to interpret the output of a 
decision-support table.
•	
Unique (U): a “Unique” hit policy indicator applies, where no overlap is possible and all “rules” are 
mutually exclusive. Only a single rule can be applied, and only the outputs of one rule would be relevant.
•	
Rule order (R): a “Rule order” hit policy indicator applies when multiple “rules” can apply at the same 
time, and the “rules” are not mutually exclusive. The result of the decision-support table depends on the 
sequence in which these rules are presented. The first rule in which conditions are met will be executed, 
then the following rules in which conditions are met would be executed in sequential order.
•	
First (F): a “First” hit policy indicator applies when multiple “rules” can apply at the same time, and the 
“rules” are not mutually exclusive. However, unlike “Rule order”, only the first rule in which conditions 
are met will be executed, and the following rules in which conditions are met would not be executed. The 
result of the decision-support table depends on the sequence in which these rules are presented. 
ANNEX 11.
