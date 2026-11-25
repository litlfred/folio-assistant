---
doc_id: path-2012-common-requirements-mhis-crdm
doc_title: "Common Requirements for Maternal Health Information Systems"
section_id: sec-014-appendix-2-requirements
section_title: "Appendix 2: Requirements"
section_number: null
pages: 21-36
source_pdf: path-2012-common-requirements-mhis-crdm.pdf
source_sha256: 40dd61b6915da7fb
toc_source: outline
---
General Content Notes- there are a few broad themes which have been 
repeated throughout the requirements.  They are outlined here, rather than 
being expanded on each Business Process Requirement 
Theme/area 
System Requirement (the system must or should) 
Decision Support 
provide context specific information in response to the entry of clinical data 
provide a way to define rules for alerts 
provide more than one way to present an alert- for example- a pop up 
screen that requires acknowledgement at the time of entry, a highlighted 
value with message (value turns read and note displayed lab result above 
normal) that does not require acknowledgement 
provide a way to combine data from multiple sources (forms, lab) to 
generate alert 
offer context sensitive reference material on denamand 
provide a way to add and link reference material based on rules, categories, 
key words 
Record clinical data 
provide a data entry screen that supports the entry of discrete data 
allows a data entry screen to be set up to support a protocol - allowing 
multiple data types and configurations  
support multiple languages 
provide a way to attach codes to discrete data without requiring the user to 
these codes 
 
must be able to identify some fields as mandatory 
 
must be able to request additional data based on data given (for example- 
does the baby have any anomalies? If yes describe) 
Review clinical data 
allow for multiple configurations to display data  
 
provide graphing 
 
highlight abnormal values 
 
 
Mobile adaptations 
allow for simplified methods for data entry- such as voice recording for later 
transcription 
 
adjust display to fit small sceens (such as mobile phones) 
 
provide audio cues for alerts  
 
 
 
20 
 
Business process 1—Case Detection 
Objective: The identification of a pregnant woman so she can be followed by the 
appropriate health provider.  
ID 
Activity 
Entity/ 
Functional Role 
System Requirement (the system must or 
should) 
1.1.1 
Woman suspects she 
is pregnant 
Patient 
Provide general community education 
1.2.1 
Decides to seek 
advice from CHW 
Patient 
Provide a means for a patient to request specific 
information 
1.2.2 
Decides to seek 
advice from CHW 
Patient 
In response to a query : provide specific 
information on how to access the CHW in her area 
1.2.3 
Decides to seek 
advice from CHW 
Patient 
Allow a community user to self register for service 
(CHW service) 
1.3.1 
Woman goes directly 
to health center 
Patient 
Provide a means for a patient to request specific 
information 
1.3.2 
Woman goes directly 
to health center 
Patient 
In response to a query : provide specific 
information on how to access the Health Center in 
her area 
1.4.1 
Register into health 
system 
HCW 
See sub process for registration 
1.4.2 
Register into health 
system 
HCW 
Allow for specific registration into ANC  
1.5.1 
Community screening CHW 
Provide remote access to input, modify and view 
lists of women of childbearing age and their status 
1.5.2 
Community screening CHW 
Assist in the tracking and monitoring of potential 
pregnancies by sorting and reporting on specific 
attributes (such as last seen, noting pregnancy 
suspicions etc) 
1.6.1 
Woman counseled 
and advised to go to 
HC 
CHW 
provide a way to alert HC of potential patient 
1.7.1 
Woman agrees to go 
to HC 
CHW 
provide a way for the CHW to set a reminder to 
follow up with woman 
1.8.1 
Woman agrees to go 
to HC 
CHW 
provide a way for the woman to opt in to scheduled 
reminders or targeted pregnancy information 
 
 
21 
 
Business process 2—Routine antenatal care 
Objective: To provide antenatal care and screening according to best practices. 
ID 
Activity 
Entity/ 
Functional 
Role 
System Requirement (the system must or should) 
2.1.1 Woman arrives 
Nurse/Midwife None 
2.2.1 Registration 
Nurse/Midwife See subprocess for details 
2.3.1 Clinical and lab exam Nurse/Midwife Provide identification information for patient 
2.3.2 Clinical and lab exam Nurse/Midwife Provide a review of any past medical history previously entered 
2.3.3 Clinical and lab exam Nurse/Midwife Provide a standardized form for the entry of clinical data 
2.3.4 Clinical and lab exam Nurse/Midwife Provide a list of tests that the HCW can order 
2.3.5 Clinical and lab exam Nurse/Midwife Print a requisition for the lab test, which includes required 
information for performing the test2  
2.4.1 Pregnancy confirmed Nurse/Midwife Provide a place to document pregnancy (this should be accompanied 
by specific information such as last menstrual period [LMP] and 
estimated due date 
2.4.2 Pregnancy confirmed Nurse/Midwife Calculate gestational age (based on LMP) 
2.5.1 Family Planning (FP) 
and counseling 
Nurse/Midwife Provide a standardized form for the entry of FP information  
2.5.2 Family Planning and 
counseling 
Nurse/Midwife Provide information about resources and alternatives to allow for 
informed decisions 
2.6.1 Antenatal care (ANC) 
visit registration 
Nurse/Midwife Provide a standardized form for the entry of ANC information  
2.6.2 ANC visit registration Nurse/Midwife Provide a list or roster of all antenatal women 
2.6.3 ANC visit registration Nurse/Midwife Provide tools to search, sort, and filter the antenatal database 
2.6.4 ANC visit registration Nurse/Midwife Print a copy of the ANC information that replicates the paper 
antenatal register 
2.7.1 ANC assessment 
Nurse/Midwife Provide a standardized form for the entry of ANC information  
2.7.2 ANC assessment 
Nurse/Midwife Provide real-time range checks and data integrity checks on data 
2.8.1 Normal 
Nurse/Midwife Provide decision support as appropriate for users based on data 
entered 
2.8.2 Normal 
Nurse/Midwife Suggest appropriate treatments/investigations based on findings 
2.8.3 Normal 
Nurse/Midwife Provide access to context appropriate information to inform decisions 
2.9.1 Referral 
Nurse/Midwife See subprocess for details 
2.10.1 ANC case 
management 
Nurse/Midwife Provide decision support as appropriate for users based on data 
entered3 
2.10.2 ANC case 
management 
Nurse/Midwife Provide tools to promote care protocols 
2.11.1 Scheduling 
Nurse/Midwife Display a schedule of available days  
2.11.2 Scheduling 
Nurse/Midwife Allow for the input of custom schedules to allow for visits on specific 
days/times, account for holidays and vacations, etc. 
2.11.3 Scheduling 
Nurse/Midwife Display number of existing visits per day (to allow for balancing) 
2.11.4 Scheduling 
Nurse/Midwife Indicate (based on protocol) the preferred days for follow-up visit 
2.11.5 Scheduling 
Nurse/Midwife Record identification and tracking information (such as cell phone 
number) for patient in schedule 
2.12.1 Self care in the 
community 
Woman 
Provide a source of accurate health information accessible and 
appropriate for lay persons (this may include both pull and push 
options) 
2 This minimum data may vary by location and by test. 
3 The rules and specifics of this decision support will vary by area and by finding, and may take the form of alerts or information messages, flags 
on data, etc. 
22 
 
                                                 
ID 
Activity 
Entity/ 
Functional 
Role 
System Requirement (the system must or should) 
2.12.2 Self care in the 
community 
Woman 
Provide information messages in a way that ensures patient 
confidentiality 
2.13.1 Woman comes back? Woman 
provide a list of scheduled visits to allow for defaulters to be 
traced 
2.13.2 Woman comes back? Woman 
provide the ability to "check in" for a scheduled visit 
2.13.3 Woman comes back? Woman 
identify the date of the last attended visit 
 
 
 
23 
 
 
Business process 3—Registration 
Objective: Initiate record of patient visit and validate patient identification and 
insurance coverage. 
ID 
Activity 
Entity/ 
Functional 
Role 
System Requirement (the system must or should) 
3.1.1 Patient Arrives 
Patient 
None 
3.2.1 Search for patient 
name and record 
Registration clerk Search if patient is already in system (using at least 2 identifiers) 
3.2.2 Search for patient 
name and record 
Registration clerk Display sufficient data4 to confirm patient  
3.2.3 Search for patient 
name and record 
Registration clerk Require a user to search if a patient is already in the system prior 
to starting a new medical record entry5 
3.2.4 Search for patient 
name and record 
Registration clerk Read patient information from a bar code on a patient 
identification and pull up patient information6 
3.3.1 New Patient? 
Registration clerk Provide sufficient data to rule out this patient is already in the 
system 
3.4.1 Enter patient record 
Registration clerk If this is a returning visit, the visit should be added to the previous 
visit (to show they are related)7 
3.4.2 Enter patient record 
Registration clerk Must be able to enter identification information (demographics)8 
3.4.3 Enter patient record 
Registration clerk Indicate mandatory fields that must be filled out for registration to 
be valid 
3.4.4 Enter patient record 
Registration clerk Generate encounter number for visit9 
3.4.5 Enter patient record 
Registration clerk Generate or associate to existing hospital or clinic medical record   
number (MRN)10 
3.4.6 Enter patient record 
Registration clerk Allow edits to fields on screen before information is committed11 
3.4.7 Enter patient record 
Registration clerk Allow for a temporary identification in emergency situations when 
full identity unknown12 
3.5.1 
Validate/Update 
demographic 
information 
Registration clerk Display patient information for validation (and allow edits)13 
3.5.2 
Validate/Update 
demographic 
information 
Registration clerk Allow for updates to demographic information14  
3.5.3 
Validate/Update 
demographic 
information 
Registration clerk Retains previous history of updated information15 
3.5.4 Validate/Update 
demographic 
Registration clerk Allow attachment of a digital photograph to the patients record16 
4 Date of birth, gender, parents name, village, last visit/encounter. 
5 This should be a "smart search" that presents options as characters are typed. 
6 Could this also be a magnetic strip? 
7 This would be for follow up to receive lab results or something similar. 
8 What information should be captured, mandatory and desired, needs to be defined. The patient record should include community health 
worker’s name. 
9 System generated for encounter. 
10 System generated hospital or clinic MRN. 
11 The person entering data should be able to go backwards on screen to change information during the entry process. 
12 This could also be used for registration of babies after delivery. 
13 The system must allow for edits, although this can be in a separate action (such as by clicking the edit button). 
14 This should include community health worker as part of information. 
15 This is important for both audit and potential reconstruction of information (such as tracking disease outbreaks, recalls retrospectively). 
16 This may be entered or confirmed when the patient pays their annual dues (could be updated for children annually). 
24 
 
                                                 
information 
3.5.5 
Validate/Update 
demographic 
information 
Registration clerk Allow photo to be viewable to confirm patient identity 
3.6.1 Is payment required? Registration clerk Provide information regarding payment based on reason for visit 
or insurance information17 
3.7.1 Make payment 
Patient 
Provide sufficient information to calculate the amount of the 
payment18 
3.8.1 Enter encounter in 
patient record 
Registration clerk Indicate patient has arrived for scheduled visit19 
3.8.2 Enter encounter in 
patient record 
Registration clerk 
Certain activities, such as checking in a visit or entering a new 
patient should make the status of a patient something like 
"arrived" or waiting to be seen20 
3.8.3 Enter encounter in 
patient record 
Registration clerk Record a time/date-stamped new visit (encounter)  
3.8.4 Enter encounter in 
patient record 
Registration clerk Able to enter service patient is there to see/visit21 
3.9.1 Queue 
Registration clerk Create a patient queue by service or provider/area according to 
time stamp 
3.9.2 Queue 
Registration clerk Queue will need to be time stamped with arrival time 
3.9.3 Queue 
Registration clerk Queue should also indicate and sort according to arrival time or 
special needs22 
 
 
 
17 This should be based on specific rules for procedure costs /payment or co-pay. 
18 This sub process may vary by site and policy. 
19 This should be connected to the schedule system, and the registration clerk should be able to change the status of the visit to “arrived” or 
“waiting.” 
20 These statuses could be used to create the patient queues (a list of patients waiting to be seen that are physically present). 
21 This should be a drop-down list. 
22 The exact nature of this sequencing still needs to be further defined. 
25 
 
                                                 
Business process 4—Routine delivery in the community 
Objective: Safe delivery in the woman’s home/community. 
ID 
Activity 
Entity/ 
Functional 
Role 
System Requirement (the system must or should) 
4.1.1 Onset of labor 
family member NA 
4.2.1 Contact provider woman 
NA 
4.3.1 
Go to woman and 
bring necessary 
equipment 
Skilled Birth 
Attendant 
NA 
4.4.1 
Rapid initial 
assessment 
Skilled Birth 
Attendant 
see note - data entry, decision support  + mobile 
4.5.1 Real labor? 
Skilled Birth 
Attendant 
see note- decision support + mobile 
4.6.1 Provide advice 
Skilled Birth 
Attendant 
provide follow up access to information for the patient 
4.7.1 Normal 
Skilled Birth 
Attendant 
see note- decision support + mobile 
4.8.1 Manage labor 
Skilled Birth 
Attendant 
provide a graphic review of the data- in partograph form  
4.9.1 
Normal labor 
progress? 
Skilled Birth 
Attendant 
see note- decision support + mobile 
4.10.1 Delivery 
Skilled Birth 
Attendant 
create a separate but linked chart for each baby 
4.10.2 Delivery 
Skilled Birth 
Attendant 
allow initial data entry to be on a single screen- but can 
separate baby information if needed 
4.11.1 Stable newborn? 
Skilled Birth 
Attendant 
see note- decision support + mobile 
4.12.1 
Routine 
immediate 
newborn care 
Skilled Birth 
Attendant 
see note- data entry + mobile 
4.13.1 
Emergency 
newborn 
management in 
the home 
Skilled Birth 
Attendant 
see note - data entry, data review,  decision support + mobile 
4.14.1 Stable mother 
Skilled Birth 
Attendant 
see note- decision support + mobile 
4.15.1 
Routine 3rd stage 
and PP care 
Skilled Birth 
Attendant 
see note- data entry + mobile 
4.16.1 
Can be managed 
at home? 
Skilled Birth 
Attendant 
see note- decision support + mobile 
4.17.1 Referral by SBA 
Skilled Birth 
Attendant 
see referral process for further details 
4.18.1 
Emergency 
maternal 
management at 
home 
Skilled Birth 
Attendant 
see note - data entry, data review,  decision support + mobile 
26 
 
4.19.1 
Assess and 
decide next 
treatment 
Skilled Birth 
Attendant 
see note - data entry, data review,  decision support + mobile 
4.20.1 
Has she 
improved? 
Skilled Birth 
Attendant 
see note- decision support + mobile 
 
 
 
27 
 
Business process 5—Routine delivery in a health facility 
Objective: Safe delivery in a facility according to best practices. 
ID 
Activity 
Entity/ 
Functional 
Role 
System Requirement (the system must or should) 
5.1.1 
Woman in labor 
enters  
Nurse, midwife or 
physician 
NA 
5.2.1 
Rapid Initial 
Assessment 
Nurse, midwife or 
physician 
see note- data entry 
5.3.1 Normal? 
Nurse, midwife or 
physician 
see note- decision support 
5.4.1 
Emergency care 
at facility 
Nurse, midwife or 
physician 
see note - data entry, decision support and data review 
5.5.1 Registration 
Nurse, midwife or 
physician 
see registration subprocess 
5.6.1 Real labor? 
Nurse, midwife or 
physician 
see note- decision support 
5.7.1 
Counsel and send 
home 
Nurse, midwife or 
physician 
ability to print follow up instructions 
5.7.2 
Nurse, midwife or 
physician 
provide reminder to follow up with woman in set period of time 
5.8.1 mange labor 
Nurse, midwife or 
physician 
see note - data entry, decision support and data review 
5.9.1 
normal labor 
progress? 
Nurse, midwife or 
physician 
see note- decision support 
5.10.1 
able to manage 
this here? 
Nurse, midwife or 
physician 
see note- decision support 
5.11.1 referral 
Nurse, midwife or 
physician 
see referral subprocess 
5.12.1 delivery 
Nurse, midwife or 
physician 
create a separate but linked chart for each baby 
5.12.2 
Nurse, midwife or 
physician 
allow initial data entry to be on a single screen- but can separate 
baby information if needed 
5.13.1 stable mother? 
Nurse, midwife or 
physician 
see note- decision support 
5.14.1 
routine 3rd stage 
care 
Nurse, midwife or 
physician 
see note - data entry, decision support and data review 
5.15.1 stable newborn? 
Nurse, midwife or 
physician 
see note- decision support 
5.16.1 
routine immediate 
newborn care 
Nurse, midwife or 
physician 
see note - data entry, decision support and data review 
 
 
 
28 
 
Business process 6—Referral from primary to secondary facility 
Objective: The appropriate and timely referral of a woman with complications to a 
higher level of care. 
ID 
Activity 
Entity/ 
Functional Role 
System Requirement (the system must or 
should) 
6.1.1 
Woman requires 
referral 
HCW 
Provide context-sensitive, real-time decision support (alerts, 
advice, resources) 
6.1.2 
Woman requires 
referral 
HCW 
Display referral criteria 
6.2.1 
Transport 
planning 
HCW 
Display a checklist of activities to prepare for transport 
6.2.2 
Transport 
planning 
HCW 
Provide communication support to manage transport (such as 
short message service [SMS] to ambulance to check availability) 
6.2.3 
Transport 
planning 
HCW 
Support payment for transport if needed (such as a voucher to 
be paid at receiving facility) 
6.2.4 
Transport 
planning 
HCW 
Provide up-to-date list of transport providers with contact 
information 
6.3.1 
Woman stable 
enough to 
transport? 
HCW 
Provide context-sensitive, real-time decision support (alerts, 
advice, resources) 
6.4.1 
Documentation 
prepared 
HCW 
Provide a transfer report based on a predefined format 
6.4.2 
Documentation 
prepared 
HCW 
Populate the transport report from fields previously entered 
(providing a relevant history) 
6.4.3 
Documentation 
prepared 
HCW 
Print the transport report 
6.4.4 
Documentation 
prepared 
HCW 
Send the transport report via secure email to the receiving 
facility 
6.5.1 
Contact referral 
facility 
HCW 
Provide a list of referral facilities and their contact numbers 
6.5.2 
Contact referral 
facility 
HCW 
Maintain an up-to-date and accurate referral list that can be 
updated and viewed by multiple parties (web based) 
6.6.1 
Able to accept 
woman? 
HCW 
Provide sufficient information in referral request for referral site 
to determine if they can treat the woman 
6.6.2 
Able to accept 
woman? 
HCW 
Support an up-to-date call list  
6.6.3 
Able to accept 
woman? 
HCW 
Support a simple bed or referral management (identify available 
beds and pending transfers) 
6.7.1 
Another facility 
possible? 
HCW 
Support referral management across multiple facilities—shared 
bed or resource management 
6.7.2 
Another facility 
possible? 
HCW 
Identify the next referral option based on condition and 
capacity 
6.8.1 
Transport 
available? 
HCW 
See transport planning activity 
6.9.1 
Emergency Care 
at facility 
HCW 
Allow for data sharing to obtain remote advice (telemedicine) 
6.9.2 
Emergency Care 
at facility 
HCW 
Provide context-sensitive, real-time decision support (alerts, 
advice, resources) 
29 
 
6.10.1 
Clinical prep for 
accompanied 
transport 
HCW 
Provide checklist to assist clinician 
6.10.2 
Clinical prep for 
accompanied 
transport 
HCW 
Provide printable instructions to give to family or transport 
attendants 
6.11.1 Transport 
HCW 
None 
6.12.1 Arrival at referral 
facility 
Nurse/Midwife/Physician Notify sending facility that patient has arrived 
6.12.2 Arrival at referral 
facility 
Nurse/Midwife/Physician Provide access to medical and obstetrical information on patient 
(this may include a printed report or online access to history) 
6.13.1 Rapid initial 
assessment 
Nurse/Midwife/Physician Provide context-sensitive, real-time decision support (alerts, 
advice, resources) 
6.13.2 Rapid initial 
assessment 
Nurse/Midwife/Physician Provide standardized data entry for assessment data 
6.13.3 Rapid initial 
assessment 
Nurse/Midwife/Physician Allow the user to review past medical history and obstetrical 
history 
6.14.1 Able to accept 
woman? 
Nurse/Midwife/Physician Provide facility bed/resource information for decision-making 
6.14.2 Able to accept 
woman? 
Nurse/Midwife/Physician Support referral management across multiple facilities—shared 
bed or resource management 
6.14.3 Able to accept 
woman? 
Nurse/Midwife/Physician Provide context-sensitive, real-time decision support (alerts, 
advice, resources) 
6.15.1 Emergency 
obstetric care 
Nurse/Midwife/Physician See sub process for details 
6.16.1 
Transfer to 
higher level of 
care 
Nurse/Midwife/Physician Repeat of this sub process 
 
 
 
30 
 
Business process 7—Obstetric emergency management 
Objective: The care and delivery of a woman at risk for complications. 
ID 
Activity 
Entity/ 
Functional Role 
System Requirement (the system must or 
should) 
7.1.1 
Woman arrives  
Midwife or Physician NA 
7.2.1 
Registration 
Midwife or Physician See registration sub process 
7.3.1 
Rapid initial 
assessment 
Midwife or Physician see note- data entry 
7.4.1 
Stable? 
Midwife or Physician see note- decision support 
7.5.1 
routine facility delivery Midwife or Physician See routine facility delivery process 
7.6.1 
assessment 
Midwife or Physician 
see note - data entry, decision support and data 
review 
7.7.1 
able to manage here? Midwife or Physician see note- decision support 
7.8.1 
referral 
Midwife or Physician see referral process 
7.9.1 
plan, treat and 
monitor 
Midwife or Physician 
see note - data entry, decision support and data 
review 
7.9.2 
Midwife or Physician support the development of a treatment plan 
7.9.3 
Midwife or Physician support the update of a treatment plan 
7.9.4 
Midwife or Physician support the modification of treatment plan 
7.9.5 
Midwife or Physician 
access external resources for support (link to other 
systems or experts) 
7.10.1 
has she delivered 
Midwife or Physician NA 
7.11.1 
has fetus died? 
Midwife or Physician NA 
7.12.1 
Newborn 
management 
Midwife or Physician 
see note - data entry, decision support and data 
review 
7.13.1 
child death process 
Midwife or Physician link to external reporting system 
7.14.1 
responding correctly? Midwife or Physician see note- decision support 
7.15.1 
has she died? 
Midwife or Physician NA 
7.16.1 
Maternal death 
process 
Midwife or Physician link to external reporting system 
7.16.2 
system 
generate alert to trigger autopsy  
 
 
 
31 
 
 
Business process 8—Routine postnatal care 
Objective: The appropriate care of women during the immediate postpartum period.  
ID 
Activity 
Entity/ 
Functional Role 
System Requirement  
(the system must or should) 
8.1.1 
Routine care and 
assessment 
HCW/CHW 
see note - data entry, decision support and 
data review 
8.2.1 
Stable 
HCW/CHW 
see note- decision support 
8.3.1 
Complication 
maanagement 
HCW/CHW 
see note - data entry, decision support and 
data review 
8.4.1 
Time for discharge 
HCW/CHW 
see note- decision support 
8.5.1 
Pre-discharge 
assessment 
HCW/CHW 
see note - data entry  
8.6.1 
Meets discharge 
criteria? 
HCW/CHW 
see note- decision support 
8.7.1 
Counseling and 
dispensing 
HCW/CHW 
create a discharge summary 
8.7.2 
Counseling and 
dispensing 
HCW/CHW 
print any needed discharge instructions 
8.7.3 
Counseling and 
dispensing 
HCW/CHW 
order any necessary medication 
8.7.4 
Counseling and 
dispensing 
HCW/CHW 
provide a pick list of relevent medications for 
discharge 
8.7.5 
Counseling and 
dispensing 
HCW/CHW 
print script for medication so it may be filled 
in dispensary 
8.8.1 
Discharge 
HCW/CHW 
indicate a patient's status of discharged in 
the system 
8.8.2 
Discharge 
HCW/CHW 
indicate the date and time of discharge 
8.9.1 
Follow up in community HCW/CHW 
see process for community follow up 
8.10.1 
Counsel woman 
continue monitoring and 
care 
HCW/CHW 
see note - data entry, decision support and 
data review (mobile) 
 
 
 
32 
 
 
Business process 9—Community health support 
Objective: Provide routine support for the woman and child in the community (in addition 
to individual support, the CHW also provides ongoing health promotion and education). 
ID 
Activity 
Entity/ 
Functional Role 
System Requirement  
(the system must or should) 
9.1.1 
Needs support 
Mother or baby 
Provide a source of accurate health information 
accessible and appropriate for the community  
9.1.2 
Needs support 
Mother or baby 
Provide a means to connect directly to a CHW if 
needed (through an SMS?) 
9.2.1 
Plans for routine and targeted 
community support 
CHW 
Provide tools for case load management 
9.2.2 
Plans for routine and targeted 
community support 
CHW 
Allow for the maintenance of rosters of community 
members meeting specific criteria (such as women 
of childbearing age) 
9.2.3 
Plans for routine and targeted 
support 
CHW 
Provide planning tools to manage transport, 
commodities, etc. 
9.3.1 
Visits mother or baby 
CHW 
Reminders for visit schedule 
9.4.1 
Assess mother and baby 
CHW 
Allow the recording of key observations  
9.4.2 
Assess mother and baby 
CHW 
Provide information for common conditions and 
what to do (protocols) 
9.5.1 
Needs referral? 
CHW 
Provide guidelines and alerts to help identify 
complications 
9.6.1 
Provide advice and support 
CHW 
Provide sources for educational materials 
9.6.2 
Provide advice and support 
CHW 
Support remote advice and consultation 
9.7.1 
Arrange for follow-up as 
needed 
CHW 
Set reminder for follow-up 
9.8.1 
Refer to health center 
CHW 
Send a referral request to health center  
9.8.2 
Refer to health center 
CHW 
Means to monitor for the mother or baby to attend 
at the health center (complete the referral) 
9.8.3 
Refer to health center 
CHW 
Produce a list of all pending referrals 
9.8.4 
Refer to health center 
CHW 
Allow the health center to complete referrals; this 
triggers a message back to the CHW 
9.8.5 
Refer to health center 
CHW 
Set a reminder for follow-up if referral not 
completed in set amount of time 
 
 
 
33 
 
Business process 10—Community follow-up 
Objective: The follow-up for a woman or baby in the community (routine postpartum or 
when there is a known issue). 
ID 
Activity 
Entity/ 
Functional Role 
System Requirement  
(the system must or should) 
10.1.1 
Identifies issue requiring 
follow-up in community 
HCW 
Provide standard protocols for use in routine 
follow-up 
10.2.1 
Informs patient and CHW 
what to watch for 
CHW 
Provide printed follow-up instructions based on 
standard issues (discharge instructions) 
10.2.2 
Informs patient and CHW 
what to watch for 
CHW 
Provide online/SMS/voice access to instructions 
10.3.1 
Makes plan for follow-up 
CHW 
Provide alerts and reminders for visits or activities 
10.3.2 
Makes plan for follow-up 
CHW 
Provide tools to manage schedule and resources 
10.4.1 
Need to involve others? 
CHW 
None 
10.5.1 
Discuss and make plan to 
follow  
Community Agent/Family Allow for alerts and reminders to be sent to other 
community agents as appropriate 
10.5.2 
Discuss and make plan to 
follow  
Community Agent/Family Provide accessible community-appropriate 
information which is context sensitive 
10.6.1 
Check and assess 
Community Agent/Family Remote reporting by family members 
10.7.1 
Experiencing issue? 
Community Agent/Family Provide a simple way to contact the appropriate 
help 
10.8.1 
Visit and assess 
CHW 
Allow the CHW to record their findings and visits 
10.9.1 
Need to return to HC? 
CHW 
Visit reminders to patient, family, and HCW 
10.9.2 
Need to return to HC? 
CHW 
Decision support for abnormal symptoms 
10.10.1 
Assess 
HCW 
Ability to review past medical information 
10.10.2 
Assess 
HCW 
Ability to review updates from CHW or family 
10.11.1 
Further follow-up in 
community needed? 
HCW 
Ability to update treatment plan or protocol 
10.11.2 
Further follow-up in 
community needed? 
HCW 
Provide context-sensitive, real-time decision 
support (alerts, advice, resources) 
 
 
 
34 
 
General and nonfunctional requirements  
System Requirement (the system must or should) 
Provide a means to audit usage 
Have role-based security options 
Be reliable and robust 
Provide a means to ensure confidentiality and privacy of personal health information 
Have ability to easily back up information 
Warn user if no valid backup for more than x days 
Data entry screens must be configurable and must support the following data entry methods (pick list, radio buttons, 
smart search, free text, restricted data types) 
Must have the ability to store images or other "blob" type data 
Should have additional language support 
User should be able to navigate screens with both a mouse and keyboard 
Accept data from multiple input methods including paper, online web forms, PC asynchronously, PC synchronously, 
interactive voice response, bar code, RFID (Radio Frequency Identification) 
Support real-time quality control auditing of data entry  
Support real-time data entry feedback, preventing data entry errors from being recorded 
Have an ability to exchange data with other approved systems 
Provide flexible password control to align to national policy and standard operating procedure 
Store data centrally in a physically secure location 
Allow administrator(s) to maintain and update master tables 
Allow system administration by local staff 
Incorporate geocoding [GPS (global positioning system)] 
Have a report-generation tool that can allow administrators to produce routine and ad hoc reports 
 
 
35
