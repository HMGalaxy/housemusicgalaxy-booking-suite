# Galaxy Cue Business ↔ Client Workflow

## Source of truth

One Event is shared by GCOS Business and the GC Client app. The applications do not create separate event or form copies.

```text
Event
├── Consultation / Full Event Workbook
├── Quote
├── Contract
├── Deposit
├── Event Planning
├── Timeline
├── Documents
├── Messages
└── Financials
```

Business users can see client-facing and business-only fields. Clients can see and submit only client-facing fields. Form fields prefixed `business_` or `internal_`, or contained by `data-business-only`, are never accepted from the Client app.

## Visible stages

```text
Consultation
→ Quote & Contract
→ Deposit
→ Event Planning
→ Day of Event
→ Financials
→ Completed
```

Each stage may be Not Started, Sent to Client, Viewed by Client, In Progress, Submitted by Client, Business Review, Completed, or Action Required.

## 1. Consultation

GCOS Business sends the appropriate Full Event Workbook to the client. The client saves drafts and submits the client-facing workbook. The submitted workbook remains available under Documents. Submission advances the Event exactly once to Quote Preparation.

## 2. Quote and Contract

GCOS Business reviews the workbook, creates the Quote, attaches or generates the Contract, and sends both to the Client app. The client accepts or declines the Quote and signs the Contract. The Event advances only when the Quote is accepted and Contract is signed.

## 3. Deposit

GCOS Business sends the deposit request. The Client app displays the amount and payment instructions. Confirmed online payment or a manually verified cash, bank-transfer, Venmo, or external payment records Deposit Paid and advances the Event to Event Planning.

## 4. Event Planning

GCOS Business sends the appropriate Wedding, Corporate, Private, or future planning form. The client may save progress and submit. Business reviews the client submission, adds private production details, completes Music and the Timeline, and approves Planning.

## 5. Day of Event

The operational workspace contains the date, venue, timeline, contacts, vendors, music, production requirements, documents, tasks, balance, and internal notes. Business marks the Event completed after delivery.

## 6. Financials

Business reviews the Quote total, deposit, adjustments, payment history, remaining balance, and final payment. A zero verified balance marks Paid in Full.

## 7. Completed

Completed requires the Consultation, accepted Quote, signed Contract, paid Deposit, approved Planning, completed Event, and resolved final balance. The Event and all document snapshots remain searchable.
