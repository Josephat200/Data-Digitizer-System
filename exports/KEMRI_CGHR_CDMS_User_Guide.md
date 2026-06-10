# KEMRI-CGHR Clinical Data Management System (CDMS)
## User Reference Guide — Influenza Research Program

**Document Version:** 1.0 | **Date:** June 2026 | **Classification:** Authorized Personnel Only

---

## 1. SYSTEM OVERVIEW

The KEMRI-CGHR CDMS is a web-based clinical research data management system built for the Kenya Medical Research Institute (KEMRI) Centre for Global Health Research influenza surveillance program. It tracks pregnant women enrolled in the study from initial screening through to study closeout.

**System URL:** Accessible from any web browser — no installation required.
**Supported browsers:** Google Chrome, Mozilla Firefox, Microsoft Edge, Safari
**Device compatibility:** Desktop, laptop, tablet

---

## 2. LOGIN

### 2.1 Accessing the System

Navigate to the system URL. You will be directed to the login page automatically if you are not signed in.

### 2.2 User Accounts

| Username | Password | Role | Access Level |
|---|---|---|---|
| admin | Admin@2024 | Data Manager | Full access — create, edit, delete, export, audit |
| datamanager | Data@2024 | Data Manager | Full access — create, edit, delete, export, audit |
| fieldtech | Field@2024 | Field Technician | Read-only — view, print, export CSV |

### 2.3 Session Management

- Sessions expire automatically after **30 minutes of inactivity**.
- You will see an alert and be returned to the login page when the session expires.
- Any unsaved form data will be lost — save regularly.
- Your name and role appear in the bottom-left corner of the sidebar during your session.

### 2.4 Security Notes

- Do not share login credentials with unauthorized personnel.
- Always log out when leaving your workstation unattended (Logout button, bottom-left sidebar).
- All actions are recorded in the Audit Log, including the username, action type, and timestamp.

---

## 3. NAVIGATION

### 3.1 Sidebar Menu

The left sidebar is the primary navigation. All sections are accessible with a single click.

| Menu Item | Description | Accessible By |
|---|---|---|
| Dashboard | Summary statistics, pipeline chart, monthly trends, site performance, reminders | All users |
| Screening | List of all screened participants — search, view, create, edit | All users |
| Enrolment | List of all enrolled participants | All users |
| ANC Visits | Antenatal care visit records for all enrolled participants | All users |
| Deliveries | Delivery records for enrolled participants | All users |
| Closeouts | End-of-study records | All users |
| Audit Log | Full activity log — who did what and when | Data Managers only |
| Data Quality | Automated data quality flags and reports | Data Managers only |

### 3.2 Participant Profile

Each participant has a single profile page containing all their records across five tabs:

| Tab | Contents |
|---|---|
| Screening | Demographics, vitals, eligibility criteria, consent status |
| Enrolment | Enrolment date, gestational age, study arm, clinical data |
| ANC Visits | All antenatal visits — multiple visits per participant supported |
| Delivery | Birth outcome, delivery date, neonatal details |
| Closeout | Reason for closeout, final status, outcome |

**To open a participant profile:** Click any row in any list page.

### 3.3 Header Breadcrumb

The top header shows your current location within the system (e.g., KEMRI-CGHR › Screening) for quick orientation.

---

## 4. DATA ENTRY — STEP-BY-STEP WORKFLOW

> **Important:** The system enforces a strict data entry order. You cannot enrol a participant who has not been screened and marked eligible. You cannot record ANC visits or delivery for a participant who has not been enrolled.

### 4.1 Workflow Order

```
STEP 1: SCREENING  →  STEP 2: ENROLMENT  →  STEP 3: ANC VISITS  →  STEP 4: DELIVERY  →  STEP 5: CLOSEOUT
```

---

### STEP 1 — SCREENING

**Purpose:** First contact with a potential study participant. Establishes identity, eligibility, and consent.

**How to screen a new participant:**
1. Go to Sidebar → **Screening**
2. Click **New Screening** (top-right button)
3. Fill in all required fields:
   - **Screening ID** — your study identifier for this participant
   - **Health Facility** — the site where screening took place
   - **Interview Date** — date of screening
   - **Date of Birth / Age** — must be between 15 and 49 years (system validates automatically)
   - **Residence / Village / Sub-location / County**
   - **Vitals:** Height (cm), Weight (kg), MUAC (cm), Blood Pressure, BMI (auto-calculated)
   - **Eligibility Criteria:** Pregnancy status, gestational age, exclusion criteria responses
   - **Eligible:** Yes / No
   - **Consented:** Yes / No
4. Click **Save**

**Note:** Only participants with Eligible = Yes AND Consented = Yes can proceed to enrolment.

---

### STEP 2 — ENROLMENT

**Purpose:** Formally enrolls an eligible, consented participant into the study.

**How to enrol a participant:**
1. Go to Sidebar → **Enrolment**
2. Click **New Enrolment** (top-right button)
3. A dialog opens showing all eligible, consented, not-yet-enrolled participants
4. Search by Screening ID or facility name — click the participant to select them
5. You are taken to their profile on the **Enrolment tab**
6. Click **Enrol Participant** and fill in the enrolment form
7. Click **Save**

---

### STEP 3 — ANC VISITS (repeat for each visit)

**Purpose:** Records antenatal care visit data over the course of pregnancy. Multiple visits per participant are supported.

**How to record an ANC visit:**
1. Go to Sidebar → **ANC Visits**
2. Click **New ANC Visit**
3. Select the enrolled participant from the dialog
4. On the ANC tab, click **New ANC Visit**
5. Fill in visit data: visit date, gestational age at visit, clinical findings, next appointment
6. Click **Save**
7. Repeat for each subsequent visit

---

### STEP 4 — DELIVERY

**Purpose:** Records birth outcome and delivery details.

**How to record delivery:**
1. Go to Sidebar → **Deliveries**
2. Click **New Delivery**
3. Select the enrolled participant
4. On the Delivery tab, click **Record Delivery**
5. Fill in: delivery date, mode of delivery, birth outcome, birth weight, neonate details
6. Click **Save**

---

### STEP 5 — CLOSEOUT

**Purpose:** Marks the end of the participant's involvement in the study.

**How to record closeout:**
1. Go to Sidebar → **Closeouts**
2. Click **New Closeout**
3. Select the enrolled participant
4. On the Closeout tab, click **Record Closeout**
5. Fill in: reason for closeout (completed / lost to follow-up / withdrawal / other), final status
6. Click **Save**

---

## 5. INTEGRATIONS

### 5.1 System Architecture

The KEMRI-CGHR CDMS is a fully self-contained system. All data is stored in its own secure database. There are no external integrations with third-party platforms.

| Component | Technology |
|---|---|
| User Interface | React + Vite (runs in the browser) |
| Application Server | Node.js / Express REST API |
| Database | PostgreSQL (managed, cloud-hosted) |
| Hosting | Replit cloud — persistent, always-on deployment |
| Authentication | JWT bearer token, stored in browser session |

### 5.2 Network Requirements

- Internet connection required (the system is cloud-hosted)
- No VPN required
- Works on any standard network (hospital WiFi, mobile data, ethernet)

### 5.3 Data Security

- All communication is encrypted over HTTPS
- Authentication tokens expire after 30 minutes of inactivity
- Every data modification is logged with user identity and timestamp
- Role-based access control prevents unauthorized data modification or access to administrative features

---

## 6. OUTPUTS

### 6.1 Dashboard (real-time)

The dashboard updates automatically every time you navigate to it.

| Output | Description |
|---|---|
| Summary Cards | Total counts for each stage: Screened, Enrolled, ANC Visits, Deliveries, Closeouts |
| Participant Pipeline | Visual funnel showing how many participants are at each stage, with % conversion rate from screening |
| Monthly Trend Chart | Area chart showing new screenings and enrolments by month for the past 12 months |
| Site Performance Table | Per-facility breakdown: health facility vs. screened / enrolled / deliveries |
| Action Required (Reminders) | Participants with overdue or upcoming ANC appointments, and those expected to deliver soon |

### 6.2 Data Quality Report *(Data Managers only)*

The system automatically scans all records and flags the following issues:

| Flag | Description |
|---|---|
| Missing Date of Birth | Screening records with no DOB entered |
| Missing Weight | Screening records with no weight recorded |
| Missing Blood Pressure | Screening records with no BP recorded |
| BMI Below 15 | Potentially erroneous very low BMI value |
| BMI Above 45 | Potentially erroneous very high BMI value |
| Missing Consent Status | Screening records with no consent decision |
| Missing Delivery Date | Delivery records without a recorded delivery date |

Each flag lists the affected Screening IDs — click any ID to navigate to that participant's profile.

### 6.3 Audit Log *(Data Managers only)*

The audit log records every action taken in the system:

- **Who:** Username of the person who performed the action
- **What:** Action type (Create, Edit, Delete) and the record affected
- **When:** Exact date and time (timestamp)
- Searchable and filterable by user, action type, and date
- Cannot be modified or deleted — it is a permanent record

---

## 7. EXPORTS

### 7.1 Print

Available on: all list pages (Screening, Enrolment, ANC Visits, Deliveries, Closeouts) and individual participant profiles.

**How to print:**
1. Navigate to the desired list page or participant profile
2. Click the **Print** button (top-right)
3. Your browser's print dialog opens
4. Select your printer or choose "Save as PDF"
5. Click Print / Save

**Print features:**
- Sidebar and action buttons are automatically hidden from the printed output
- A **KEMRI CGHR watermark** (blue diagonal text) appears on every printed page automatically — no setup required
- Page headers show the section name and print date/time
- Available to both Data Managers and Field Technicians

### 7.2 Export to CSV

Available on: all list pages (Screening, Enrolment, ANC Visits, Deliveries, Closeouts).

**How to export:**
1. Navigate to the desired list page
2. (Optional) Use the search bar to filter the list — the export will only include visible/filtered records
3. Click the **Export CSV** button (top-right)
4. A `.csv` file downloads automatically to your computer

**File naming convention:**
- `KEMRI_CGHR_Screenings_YYYY-MM-DD.csv`
- `KEMRI_CGHR_Enrolments_YYYY-MM-DD.csv`
- `KEMRI_CGHR_ANC_Visits_YYYY-MM-DD.csv`
- `KEMRI_CGHR_Deliveries_YYYY-MM-DD.csv`
- `KEMRI_CGHR_Closeouts_YYYY-MM-DD.csv`

**Opening the CSV file:**
- **Microsoft Excel:** Double-click the file — it opens directly
- **Google Sheets:** File → Import → Upload → select the file
- **SPSS / Stata:** Use File → Read Text Data (SPSS) or import delimiters (Stata)
- **R:** `read.csv("filename.csv")`

**CSV content:** All columns visible in the list are included — Screening ID, health facility, dates, all clinical and demographic fields, and status.

### 7.3 Export Permissions Summary

| Feature | Data Manager | Field Technician |
|---|---|---|
| Print — any list page | ✅ | ✅ |
| Print — participant profile | ✅ | ✅ |
| Export CSV — any list | ✅ | ✅ |
| Audit Log (view only) | ✅ | ❌ |
| Data Quality report | ✅ | ❌ |
| Create / Edit records | ✅ | ❌ |
| Delete records | ✅ | ❌ |

---

## 8. QUICK REFERENCE CARD

### Key Buttons at a Glance

| Button | Location | Action |
|---|---|---|
| New Screening | Screening list page | Opens the screening form for a new participant |
| New Enrolment | Enrolment list page | Opens participant picker → then enrolment form |
| New ANC Visit | ANC Visits list page | Opens participant picker → then ANC form |
| New Delivery | Deliveries list page | Opens participant picker → then delivery form |
| New Closeout | Closeouts list page | Opens participant picker → then closeout form |
| Print | Any list or profile page | Opens browser print dialog with watermark |
| Export CSV | Any list page | Downloads filtered data as a .csv file |
| Logout | Bottom-left sidebar | Ends the session immediately |

### Troubleshooting

| Problem | Solution |
|---|---|
| Cannot see Audit Log or Data Quality in the menu | You are logged in as Field Technician — these sections require a Data Manager account |
| Cannot create or edit records | You are logged in as Field Technician — switch to a Data Manager account |
| "New Enrolment" dialog shows no participants | No eligible + consented screenings exist yet — screen and mark participants eligible first |
| "New ANC/Delivery/Closeout" shows no participants | No enrolled participants exist yet — enrol participants first |
| Session expired alert | Normal behaviour after 30 minutes of inactivity — log in again |
| Page shows "No data available" | The section has no records yet — begin data entry from Screening |

---

*KEMRI-CGHR Influenza Research Program — Clinical Data Management System*
*This document is confidential and intended for authorized study personnel only.*
*For technical support, contact the system administrator.*
