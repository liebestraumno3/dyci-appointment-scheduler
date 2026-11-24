# Appointment Scheduler — Final Project Documentation

**Course:** Web Development / Angular Finals Project  
**Group:** Group 7  
**Application Name:** Appointment Scheduler  
**Tech Stack:** Angular 22 (Standalone Components, Zoneless Change Detection), TypeScript 6 (Strict Mode), Angular Reactive Forms, RxJS Observables, Angular HttpClient, `json-server` Mock REST API, Vitest 4  
**Date:** November 24, 2026  

---

## 1. Project Overview

### 1.1 Problem Statement
Students, faculty advisors, and small office coordinators frequently rely on ad-hoc chat messages or static spreadsheets to track consultations and review meetings. Manual tracking introduces three recurring operational issues:
1. **Invalid time ranges:** Users accidentally enter an end time earlier than or identical to a start time, resulting in zero-length or negative-duration bookings.
2. **Scattered status visibility:** It is difficult to determine at a glance which sessions are still `Pending`, `Confirmed`, `Completed`, or `Cancelled`, or to inspect all meetings scheduled for a specific date.
3. **Lack of persistent CRUD workflows:** Front-end prototypes without a REST layer lose edits on browser refresh and provide no error recovery when a backend service becomes unavailable.

### 1.2 Intended Users
- **Academic advisors and project mentors** managing scheduled consultations, architecture reviews, and defense dry runs.
- **Student project coordinators** organizing team checkpoints and tracking attendance/status updates.
- **Small service desks or clinic receptionists** needing a fast, high-density dark-mode interface to create, filter, update, and retire appointment records.

### 1.3 Objectives
1. Build a modular, standalone Angular 22 web application with at least four dedicated UI components (`NavbarComponent`, `DashboardComponent`, `AppointmentListComponent`, `AppointmentFormComponent`) and an injectable REST service (`AppointmentService`).
2. Implement and thoroughly investigate **Cross-field Validation** in Angular Reactive Forms using a custom `FormGroup`-level validator (`timeRangeValidator`) that enforces `endTime > startTime`.
3. Provide complete CRUD functionality (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and date-based filtering backed by a persistent local `json-server` API (`db.json`).
4. Deliver resilient user feedback across all interface states: loading skeletons, contextual empty states, success banners, API failure alerts with retry actions, and real-time inline form validation errors.
5. Maintain a high-contrast, utilitarian dark-mode interface compliant with WCAG AA contrast and keyboard accessibility standards.

### 1.4 Scope
- **Schedule Dashboard:** Live status totals computed directly from API records, date-focused agenda filtering, status distribution bars, and inline status switching.
- **Appointment Directory:** Tabular view supporting API-level date filtering (`GET /appointments?date=YYYY-MM-DD`), client-side keyword search, status filtering, inline `PATCH` status updates, navigation to edit records, and two-step inline delete confirmation.
- **Create and Edit Form:** Reactive Form supporting both creating new records (`POST`) and editing existing records (`PUT`), featuring strict field-level validation and real-time form-group cross-field time validation.
- **Mock Persistence Layer:** Local REST API served via `json-server` on `http://localhost:3000/appointments` persisting changes directly to `db.json`.

### 1.5 Limitations
- **No authentication or multi-user access control:** All records belong to a single shared workspace suitable for local academic demonstration.
- **Same-day time windows only:** `timeRangeValidator` enforces 24-hour clock ordering within a single calendar date (`00:00` to `23:59`) and does not model overnight appointments spanning midnight.
- **No overlap detection across separate records:** The application validates chronological integrity within each appointment rather than cross-checking double-booked room conflicts across all appointments.
- **Local mock backend:** `json-server` writes to a local JSON file (`db.json`) and is intended for development and demonstration rather than concurrent multi-client production traffic.

---

## 2. Application Structure

### 2.1 Directory Layout

```text
appointment-scheduler/
├── db.json
├── package.json
├── angular.json
├── PROJECT_DOCUMENTATION.md
└── src/
    ├── index.html
    ├── main.ts
    ├── styles.css
    └── app/
        ├── app.config.ts
        ├── app.routes.ts
        ├── app.component.ts / .html / .css / .spec.ts
        ├── models/
        │   └── appointment.model.ts
        ├── validators/
        │   ├── time-range.validator.ts
        │   └── time-range.validator.spec.ts
        ├── services/
        │   ├── appointment.service.ts
        │   └── appointment.service.spec.ts
        └── components/
            ├── navbar/
            │   └── navbar.component.ts / .html / .css / .spec.ts
            ├── dashboard/
            │   └── dashboard.component.ts / .html / .css / .spec.ts
            ├── appointment-list/
            │   └── appointment-list.component.ts / .html / .css / .spec.ts
            └── appointment-form/
                └── appointment-form.component.ts / .html / .css / .spec.ts
```

### 2.2 File Responsibilities

| Layer | Actual Filename | Symbol / Class | Responsibility |
| --- | --- | --- | --- |
| Root Config | `src/app/app.config.ts` | `appConfig` | Registers `provideRouter(routes)`, `provideHttpClient(withFetch())`, and global browser error listeners. |
| Routing | `src/app/app.routes.ts` | `routes` | Maps `/`, `/appointments`, `/appointments/new`, `/appointments/:id/edit`, and wildcard fallback `**`. |
| Root Shell | `src/app/app.component.ts` | `App` | Renders the persistent `<app-navbar />` header and `<router-outlet />` main content region. |
| Data Model | `src/app/models/appointment.model.ts` | `Appointment`, `AppointmentPayload`, `AppointmentStatus` | Defines strict TypeScript interfaces and the canonical 4-status union (`Pending`, `Confirmed`, `Cancelled`, `Completed`). |
| Validator | `src/app/validators/time-range.validator.ts` | `timeRangeValidator`, `parseTimeToMinutes`, `formatDuration` | FormGroup-level cross-field validator verifying `endTime > startTime`, plus 24-hour parsing and duration formatting utilities. |
| Service | `src/app/services/appointment.service.ts` | `AppointmentService` | Root-injected HTTP service executing `GET`, `GET ?date=`, `GET /:id`, `POST`, `PUT`, `PATCH`, and `DELETE` against `http://localhost:3000/appointments`, sorting records chronologically and normalizing HTTP errors. |
| Component 1 | `src/app/components/navbar/navbar.component.ts` | `NavbarComponent` | Top navigation bar with brand mark, active route links, primary create CTA, skip-to-content link, and responsive mobile drawer toggle. |
| Component 2 | `src/app/components/dashboard/dashboard.component.ts` | `DashboardComponent` | High-density overview showing live status counts, interactive date agenda filter, status distribution bars, quick date jump buttons, and inline status updates. |
| Component 3 | `src/app/components/appointment-list/appointment-list.component.ts` | `AppointmentListComponent` | Full CRUD management table with API date filtering (`?date=`), keyword search, status dropdown filter, inline `PATCH` status selector, edit links, and two-step delete confirmation. |
| Component 4 | `src/app/components/appointment-form/appointment-form.component.ts` | `AppointmentFormComponent` | Reactive Form handling Create and Edit modes, field-level error prompts, live duration preview, and prominent inline cross-field time validation alerts. |
| Global Styles | `src/styles.css` | CSS Custom Properties & Primitives | Defines the Linear/Raycast-inspired neutral dark zinc palette, single cobalt accent (`#2563eb` / `#60a5fa`), WCAG AA contrast tokens, focus rings, skeletons, and banners. |
| Mock Database | `db.json` | JSON Collection | Persists 5 initial appointments across multiple dates and all 4 statuses for `json-server`. |

### 2.3 Route Map

| Path | Component | Purpose |
| --- | --- | --- |
| `/` | `DashboardComponent` | Schedule overview, summary counts, and date-focused agenda. |
| `/appointments` | `AppointmentListComponent` | Full appointment directory with API date filtering, search, status update, and delete. |
| `/appointments/new` | `AppointmentFormComponent` | Create a new appointment with Reactive Forms and cross-field validation. |
| `/appointments/:id/edit` | `AppointmentFormComponent` | Load and update an existing appointment record by ID. |
| `**` | Redirect to `/` | Prevents broken URLs by falling back to the Dashboard. |

---

## 3. Topic Mapping

| Angular Topic | Where Applied (Files) | How It Was Applied |
| --- | --- | --- |
| **Interpolation (`{{ ... }}`)** | `navbar.component.html`, `dashboard.component.html`, `appointment-list.component.html`, `appointment-form.component.html` | Renders dynamic brand labels (`{{ brandName }}`, `{{ groupLabel }}`), live metric counts (`{{ totalCount() }}`, `{{ statusCounts().Confirmed }}`), formatted schedules (`{{ appointment.startTime }} - {{ appointment.endTime }}`), active API filter hints (`GET /appointments?date={{ selectedDate() }}`), note character counter (`{{ notesLength() }} / 300`), and cross-field error text (`{{ rangeErr.message }}`). |
| **Property Binding (`[...]`)** | All 4 component templates | Controls interactive availability (`[disabled]="isSubmitting() || showTimeRangeError()"`), dynamic error states (`[class.control-error]`, `[attr.aria-invalid]`, `[attr.aria-describedby]`), active date chips (`[class.date-chip--active]`), dynamic links (`[routerLink]="['/appointments', appointment.id, 'edit']"`), status bar widths (`[style.width.%]="item.percent"`), and native select values (`[value]="appointment.status"`). |
| **Event Binding (`(...)`)** | All 4 component templates | Captures user interactions via `(click)` (refresh, retry, clear filters, mobile menu toggle, two-step delete confirm/cancel), `(change)` (inline status `PATCH`), `(blur)` (cross-field touch sync), `(ngModelChange)` (triggering server-side date query), and `(ngSubmit)` (Reactive Form submission). |
| **Two-Way Binding (`[(ngModel)]`)** | `dashboard.component.html`, `appointment-list.component.html` | Syncs filter inputs directly with writable Angular Signals: `[(ngModel)]="selectedDate"` on Dashboard and Directory date pickers, `[(ngModel)]="searchQuery"` on the search field, and `[(ngModel)]="selectedStatus"` on the status filter dropdown. |
| **Modern Control Flow: `@if` / `@else if` / `@else`** | All 4 component templates | Switches cleanly between loading skeletons (`@if (isLoading())`), contextual empty states (`@else if (filteredAppointments().length === 0)`), populated data views (`@else`), mobile menu rendering, dismissible banners, edit vs. create headings, inline delete confirmation buttons, and cross-field validation alert vs. duration preview. |
| **Modern Control Flow: `@for ... track`** | All 4 component templates | Renders navigation items (`track item.route`), skeleton rows (`track row`), status `<option>` lists (`track status`), dashboard date chips (`track summary.date`), status distribution meters (`track item.status`), and appointment table/agenda rows (`track appointment.id`). |
| **Modern Control Flow: `@switch` / `@case`** | `dashboard.component.html`, `appointment-list.component.html` | Maps each appointment's `AppointmentStatus` (`'Confirmed'`, `'Pending'`, `'Completed'`, `'Cancelled'`) to its dedicated semantic status indicator dot without cluttering the layout with verbose badge markup. |
| **Reactive Forms & Custom Cross-Field Validator** | `time-range.validator.ts`, `appointment-form.component.ts`, `appointment-form.component.html` | Uses `FormBuilder.nonNullable.group(..., { validators: [timeRangeValidator] })` to combine field-level validators (`Validators.required`, `Validators.email`, `Validators.minLength`, `Validators.maxLength`) with a form-group validator comparing `startTime` and `endTime`. |
| **RxJS Observables & `subscribe()`** | `appointment.service.ts`, `dashboard.component.ts`, `appointment-list.component.ts`, `appointment-form.component.ts` | `AppointmentService` returns typed `Observable<T>` streams piped through `map()` (chronological sorting) and `catchError()` (HTTP error normalization). Components consume streams with `takeUntilDestroyed(this.destroyRef)` and `.subscribe({ next, error })` to update UI signals, loading flags, and feedback banners. `AppointmentFormComponent` also uses `merge(valueChanges, statusChanges)` to synchronize reactive validation state in zoneless Angular 22. |
| **Dependency Injection & Services** | `app.config.ts`, `appointment.service.ts`, all feature components | Uses `providedIn: 'root'` on `AppointmentService` and modern functional `inject()` for `HttpClient`, `AppointmentService`, `FormBuilder`, `ActivatedRoute`, and `DestroyRef`. |

---

## 4. API Documentation

### 4.1 Server Configuration
- **Mock API Tool:** `json-server` v1 (installed as a project devDependency)
- **Start Command:** `npm run api` (`json-server db.json --port 3000`)
- **Base URL:** `http://localhost:3000`
- **Primary Resource Endpoint:** `http://localhost:3000/appointments`
- **Content-Type:** `application/json`

### 4.2 Appointment Resource Schema

| Field | Type | Required | Format / Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Auto-generated on `POST` | Unique identifier (e.g., `"1"`, `"OsKPIxLphuc"`) | Primary key managed by `json-server`. |
| `title` | `string` | Yes | 3 to 100 characters | Concise label describing the meeting or consultation. |
| `clientName` | `string` | Yes | 2 to 80 characters | Attendee or client full name. |
| `clientEmail` | `string` | Yes | Valid email syntax | Attendee contact email address. |
| `date` | `string` | Yes | ISO date `YYYY-MM-DD` | Scheduled calendar date (also used for `?date=` filtering). |
| `startTime` | `string` | Yes | 24-hour clock `HH:mm` | Scheduled start time. |
| `endTime` | `string` | Yes | 24-hour clock `HH:mm`; must satisfy `endTime > startTime` | Scheduled end time validated against `startTime`. |
| `status` | `string` | Yes | `'Pending' \| 'Confirmed' \| 'Cancelled' \| 'Completed'` | Current lifecycle status of the appointment. |
| `notes` | `string` | No | 0 to 300 characters | Optional agenda, location, or follow-up notes. |

### 4.3 Endpoints & HTTP Methods

| Action | HTTP Method | Endpoint | Description |
| --- | --- | --- | --- |
| List all appointments | `GET` | `/appointments` | Returns all persisted appointment records. |
| Filter appointments by date | `GET` | `/appointments?date=YYYY-MM-DD` | Returns only appointments matching the exact ISO date string. |
| Get single appointment | `GET` | `/appointments/:id` | Retrieves a specific record by ID for the Edit form. |
| Create appointment | `POST` | `/appointments` | Appends a new appointment record to `db.json` and returns it with an assigned `id`. |
| Replace appointment | `PUT` | `/appointments/:id` | Replaces all fields of an existing appointment record. |
| Update appointment status | `PATCH` | `/appointments/:id` | Partially updates only the `status` field without altering other attributes. |
| Delete appointment | `DELETE` | `/appointments/:id` | Permanently removes the appointment record from `db.json`. |

### 4.4 Sample Requests and Responses

#### A. Retrieve Appointments Filtered by Date (`GET /appointments?date=2026-11-24`)
**Request:**
```http
GET http://localhost:3000/appointments?date=2026-11-24 HTTP/1.1
Accept: application/json
```

**Response (`200 OK`):**
```json
[
  {
    "id": "1",
    "title": "Capstone System Architecture Review",
    "clientName": "Elena Navarro",
    "clientEmail": "elena.navarro@university.edu",
    "date": "2026-11-24",
    "startTime": "09:00",
    "endTime": "10:00",
    "status": "Completed",
    "notes": "Finalized standalone Angular 22 component boundaries and REST API contract."
  },
  {
    "id": "2",
    "title": "Database Schema and Persistence Check",
    "clientName": "Marcus Reyes",
    "clientEmail": "marcus.reyes@university.edu",
    "date": "2026-11-24",
    "startTime": "13:30",
    "endTime": "14:45",
    "status": "Confirmed",
    "notes": "Verify json-server write persistence and PATCH status payload structure."
  }
]
```

#### B. Create Appointment (`POST /appointments`)
**Request:**
```http
POST http://localhost:3000/appointments HTTP/1.1
Content-Type: application/json

{
  "title": "Sprint Retrospective",
  "clientName": "Group 7 Panel",
  "clientEmail": "panel@university.edu",
  "date": "2026-11-30",
  "startTime": "13:00",
  "endTime": "14:00",
  "status": "Confirmed",
  "notes": "Review final verification test logs."
}
```

**Response (`201 Created`):**
```json
{
  "id": "OsKPIxLphuc",
  "title": "Sprint Retrospective",
  "clientName": "Group 7 Panel",
  "clientEmail": "panel@university.edu",
  "date": "2026-11-30",
  "startTime": "13:00",
  "endTime": "14:00",
  "status": "Confirmed",
  "notes": "Review final verification test logs."
}
```

#### C. Update Status Inline (`PATCH /appointments/2`)
**Request:**
```http
PATCH http://localhost:3000/appointments/2 HTTP/1.1
Content-Type: application/json

{
  "status": "Completed"
}
```

**Response (`200 OK`):**
```json
{
  "id": "2",
  "title": "Database Schema and Persistence Check",
  "clientName": "Marcus Reyes",
  "clientEmail": "marcus.reyes@university.edu",
  "date": "2026-11-24",
  "startTime": "13:30",
  "endTime": "14:45",
  "status": "Completed",
  "notes": "Verify json-server write persistence and PATCH status payload structure."
}
```

#### D. Full Update (`PUT /appointments/2`)
**Request:**
```http
PUT http://localhost:3000/appointments/2 HTTP/1.1
Content-Type: application/json

{
  "id": "2",
  "title": "Database Schema and Persistence Check",
  "clientName": "Marcus Reyes",
  "clientEmail": "marcus.reyes@university.edu",
  "date": "2026-11-24",
  "startTime": "13:30",
  "endTime": "15:00",
  "status": "Completed",
  "notes": "Extended session by 15 minutes."
}
```

**Response (`200 OK`):** Returns the replaced JSON object.

#### E. Delete Appointment (`DELETE /appointments/5`)
**Request:**
```http
DELETE http://localhost:3000/appointments/5 HTTP/1.1
```

**Response (`200 OK`):** Returns the deleted record object and removes it permanently from `db.json`.

#### F. Error Handling Behavior
- **Record Not Found (`HTTP 404`):** `AppointmentService.handleError()` transforms the response into `"The requested appointment record was not found (HTTP 404)."`
- **Offline Mock Server (`HTTP Status 0`):** When `json-server` is stopped or unreachable, `AppointmentService.handleError()` returns `"Unable to reach the Appointment API at http://localhost:3000. Verify that json-server is running."` and the UI displays an error banner with a **Retry** button.

---

## 5. Exploration Report: Cross-Field Validation in Angular Reactive Forms

### 5.1 Why Cross-Field Validation Is Useful
Standard built-in Angular validators (`Validators.required`, `Validators.email`, `Validators.minLength`) operate on a single `FormControl` in isolation. However, many real-world business rules depend on the relationship between two or more sibling inputs:
- **Scheduling time ranges:** `endTime` must be strictly later than `startTime`.
- **Password confirmation:** `confirmPassword` must match `password`.
- **Date range queries:** `checkOutDate` must follow `checkInDate`.

Without cross-field validation, a form can report `VALID` even when `startTime = "14:30"` and `endTime = "13:00"`, allowing corrupted records to reach the REST API. Evaluating the rule at the parent `FormGroup` level treats the pair of fields as one atomic invariant: whenever either field changes, Angular automatically recalculates group validity and blocks submission until the time window is logically sound.

### 5.2 Sources Consulted
1. **Angular Official Documentation — Validating Form Input (Cross-Field Validation):** https://angular.dev/guide/forms/form-validation#cross-field-validation (Reference for attaching a `ValidatorFn` to a `FormGroup` options object and checking group-level errors in templates).
2. **Angular Official API Reference — `ValidatorFn`, `AbstractControl`, and `FormBuilder`:** https://angular.dev/api/forms/ValidatorFn and https://angular.dev/api/forms/FormGroup (Reference for typed non-nullable form groups, `getError()`, and `statusChanges` / `valueChanges` streams).
3. **Angular Zoneless Change Detection Guide:** https://angular.dev/guide/zoneless (Reference for ensuring UI bindings stay reactive without `zone.js` by syncing RxJS observables into Signals).
4. **W3C WAI-ARIA Authoring Practices — Accessible Form Validation:** https://www.w3.org/WAI/tutorials/forms/notifications/ (Reference for pairing `aria-invalid`, `aria-describedby`, and `role="alert"` so screen readers announce cross-field validation failures immediately).

### 5.3 Experiment Performed
To determine the cleanest and most reliable design for Angular 22, Group 7 ran a comparative experiment with two implementations and six boundary scenarios:

1. **Approach A (Control-Level Sibling Lookup):** Attaching a validator directly onto the `endTime` `FormControl` that navigates upward via `control.parent?.get('startTime')`.
2. **Approach B (FormGroup-Level Cross-Field Validator):** Attaching `timeRangeValidator` directly to the parent `FormGroup` via `this.fb.nonNullable.group({ ... }, { validators: [timeRangeValidator] })`.

Both implementations were tested against six cases:
- Valid interval (`09:00` to `10:30`)
- Minimum 1-minute interval (`09:59` to `10:00`)
- Equal timestamps (`10:00` to `10:00`)
- Inverted timestamps (`14:30` to `13:00`)
- Reverse edit order (valid `09:00` to `10:00`, then modifying `startTime` to `11:00` without touching `endTime`)
- Partial entry (`09:00` entered, `endTime` still empty)

**Observation:** Approach A failed the reverse edit order test unless manual `endTime.updateValueAndValidity()` hooks were wired onto `startTime.valueChanges`, creating fragile circular update risks. Approach B passed all six cases automatically because Angular's Reactive Forms engine re-runs parent `FormGroup` validators whenever any child control emits a value change.

### 5.4 Problems Encountered and How They Were Resolved

| # | Problem Encountered | Root Cause | Resolution Implemented |
| --- | --- | --- | --- |
| 1 | **Stale validation error when editing `startTime` after `endTime`** | Control-level validators attached only to `endTime` do not re-execute when sibling `startTime` changes. | Promoted `timeRangeValidator` to the parent `FormGroup` options (`{ validators: [timeRangeValidator] }`) so Angular re-evaluates automatically on any change to either field. |
| 2 | **Premature cross-field error before both times were filled** | Comparing empty string `""` against `"09:00"` triggered an invalid-range alert while the user was still typing the first field. | Added an early guard in `timeRangeValidator` returning `null` if either `startTime` or `endTime` is empty, delegating blank checks strictly to `Validators.required`. |
| 3 | **Zoneless Angular 22 reactivity & strict TypeScript index signature checks** | Angular 22 defaults to zoneless change detection (no `zone.js`), and `tsconfig.json` enforces `noPropertyAccessFromIndexSignature: true`, rejecting `errors.timeRangeInvalid` dot notation and risking stale template reads on programmatic form updates. | Subscribed to `merge(appointmentForm.valueChanges, appointmentForm.statusChanges)` (cleaned up via `takeUntilDestroyed`) to update dedicated `timeRangeError` and `durationLabel` signals; used `getError('timeRangeInvalid')` and bracket notation `control.errors['required']`. |
| 4 | **Fragile lexical string comparison of time values** | Comparing raw time strings lexicographically fails if non-padded values (`"9:00"` vs `"10:00"`) or invalid strings ever enter the validator. | Built `parseTimeToMinutes()` using strict regex `^([01]\d\|2[0-3]):([0-5]\d)$` to convert `HH:mm` into integer minutes from midnight (`hours * 60 + minutes`), comparing numeric totals cleanly and computing accurate duration previews. |

### 5.5 How the Final Implementation Works
1. **Validator (`src/app/validators/time-range.validator.ts`):**
   - Reads `group.get('startTime')` and `group.get('endTime')`.
   - Returns `null` if either control is absent, empty, or malformed.
   - Converts both values to integer minutes via `parseTimeToMinutes()`.
   - When `endMinutes <= startMinutes`, returns a structured error object `{ timeRangeInvalid: { startTime, endTime, reason: 'same' | 'before', message } }` explaining whether the end time equals or precedes the start time.
2. **Component Integration (`src/app/components/appointment-form/appointment-form.component.ts`):**
   - Registers `{ validators: [timeRangeValidator] }` on `appointmentForm`.
   - Synchronizes `timeRangeError`, `durationLabel`, and `isTimeTouchedOrDirty` signals on every `valueChanges` / `statusChanges` emission and `(blur)` event.
   - Computes `showTimeRangeError` so the inline cross-field error appears immediately once either time field is interacted with or after submit is attempted.
3. **Template & Accessibility (`src/app/components/appointment-form/appointment-form.component.html`):**
   - Applies `[class.control-error]` and `[attr.aria-invalid]` to **both** `startTime` and `endTime` inputs when `showTimeRangeError()` is true, linking both inputs to `#time-range-error` via `aria-describedby`.
   - Renders the high-contrast `#time-range-error` alert (`role="alert"`) directly beneath the time grid, or renders the calculated duration preview (`Valid window: 09:00 to 10:30 (1h 30m)`) when valid.
   - Disables the submit button via `[disabled]="isSubmitting() || showTimeRangeError()"` and blocks invalid submissions inside `onSubmit()`.

---

## 6. Testing Results

### 6.1 Automated Verification Summary
All verification checks were executed against the compiled Angular 22 codebase and live `json-server` instance:
- **Production Build (`npx ng build`):** PASSED with **0 errors and 0 warnings** (Initial bundle: `378.86 kB` raw / `94.51 kB` estimated transfer; all component CSS bundles under the `4.00 kB` budget).
- **Strict TypeScript Check (`npx tsc --noEmit -p tsconfig.app.json`):** PASSED with **0 errors**.
- **Unit & Component Tests (`npx ng test --watch=false` / Vitest 4.1.12):** **7 test files passed, 23 of 23 tests passed**:
  - `src/app/validators/time-range.validator.spec.ts` (7 tests)
  - `src/app/services/appointment.service.spec.ts` (6 tests)
  - `src/app/components/appointment-form/appointment-form.component.spec.ts` (3 tests)
  - `src/app/components/dashboard/dashboard.component.spec.ts` (2 tests)
  - `src/app/components/appointment-list/appointment-list.component.spec.ts` (2 tests)
  - `src/app/app.component.spec.ts` (2 tests)
  - `src/app/components/navbar/navbar.component.spec.ts` (1 test)
- **Live REST Persistence Check (`json-server db.json --port 3000`):** Verified `GET` (5 records), `GET ?date=2026-11-24` (2 records), `POST` (created ID `OsKPIxLphuc`, `db.json` count increased from 5 to 6), `PATCH` (status updated to `Confirmed`), `PUT` (title, endTime, status updated), and `DELETE` (`db.json` count returned to 5).

### 6.2 Detailed Test Case Matrix (12 Test Cases)

| Test ID | Category | Test Scenario & Steps | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- | --- |
| **TC-01** | Normal Action | Open `/` (Dashboard) while `json-server` runs with 5 mock records in `db.json`. | Skeleton rows display during load, then 5 appointments render sorted chronologically; metric strip displays Total `5`, Confirmed `2`, Pending `1`, Completed `1`, Cancelled `1`. | Verified in `DashboardComponent` spec and live `GET /appointments` (`GET_ALL_COUNT=5`). All counts and distribution bars match real data. | **PASS** |
| **TC-02** | Normal Action (Create) | Navigate to `/appointments/new`. Enter Title `"Sprint Retrospective"`, Client `"Group 7 Panel"`, Email `"panel@university.edu"`, Date `"2026-11-30"`, Start `"13:00"`, End `"14:00"`, Status `"Confirmed"`, Notes `"Review test logs."`. Submit form. | Duration preview displays `Valid window: 13:00 to 14:00 (1h)`; `POST /appointments` executes; success banner confirms creation and resets form cleanly. | Verified via `AppointmentFormComponent` spec (`POST` payload asserted, `.banner--success` rendered) and live `json-server` `POST` returning `id`. | **PASS** |
| **TC-03** | Invalid Input (Cross-Field: Before) | On `/appointments/new`, set Start Time to `15:00` and End Time to `14:00`. | `timeRangeValidator` returns `{ timeRangeInvalid: { reason: 'before' } }`; both time inputs show red error border and `aria-invalid="true"`; `#time-range-error` displays `"End time (14:00) must be strictly later than start time (15:00)."`; Submit button disables. | Verified in `time-range.validator.spec.ts` and `appointment-form.component.spec.ts` (`#time-range-error` visible, `submitBtn.disabled === true`). | **PASS** |
| **TC-04** | Invalid Input (Cross-Field: Equal) | On `/appointments/new`, set Start Time to `10:00` and End Time to `10:00`. | `timeRangeValidator` returns `{ timeRangeInvalid: { reason: 'same' } }`; inline alert displays `"End time (10:00) cannot equal start time (10:00)."`; Submit button disables. | Verified in `time-range.validator.spec.ts` (`error.reason === 'same'`, message contains `"cannot equal"`). | **PASS** |
| **TC-05** | Invalid Input (Cross-Field: Reverse Edit) | Enter valid times (`09:00` to `10:00`), then modify Start Time to `11:00` without touching End Time; next update End Time to `12:00`. | Form immediately becomes invalid (`timeRangeInvalid`) when Start Time rises to `11:00`, then clears the error and re-enables submission when End Time changes to `12:00`. | Verified in `time-range.validator.spec.ts` (`hasError('timeRangeInvalid')` transitions `false -> true -> false`). | **PASS** |
| **TC-06** | Invalid Input (Field-Level) | Click **Create Appointment** with blank required fields and enter an invalid email `"not-an-email"`. | Submission is blocked; inline field errors render below each required field (`"This field is required."`) and email (`"Enter a valid email address..."`); cross-field validator stays silent until both time values are filled. | Verified via `timeRangeValidator` empty-field guard unit test and Reactive Form `Validators.required` / `Validators.email` rules. | **PASS** |
| **TC-07** | Normal Action (Date Filter API) | Open `/appointments` and select `2026-11-24` in **Filter by Date (API)**. | Service issues `GET http://localhost:3000/appointments?date=2026-11-24`; toolbar shows active query readout; table renders only the 2 appointments scheduled for `2026-11-24`. | Verified in `appointment-list.component.spec.ts`, `appointment.service.spec.ts`, and live `json-server` (`GET_BY_DATE_COUNT=2`). | **PASS** |
| **TC-08** | Normal Action (Search & Empty State) | On `/appointments`, type `"nonexistent-client"` in Search or select a date with no records (e.g., `2026-12-31`). | Table displays contextual empty state `"No matching appointments"` with a **Clear All Filters** button; clicking it restores all records. | Verified via `filteredAppointments` computed signal and `clearFilters()` implementation. | **PASS** |
| **TC-09** | Normal Action (Status Update) | On Dashboard or Appointments table, change record `#2` status dropdown from `Confirmed` to `Completed`. | Service sends `PATCH /appointments/2` with `{ "status": "Completed" }`; dropdown disables while in flight; status dot switches via `@switch` to blue; success banner confirms update. | Verified in `appointment.service.spec.ts` (`PATCH` body asserted) and live `json-server` (`PATCH_STATUS=Confirmed`). | **PASS** |
| **TC-10** | Normal Action (Edit Record) | Click **Edit** on an existing appointment (`/appointments/:id/edit`), extend End Time by 30 minutes, and click **Save Changes**. | Existing record loads into form; `PUT /appointments/:id` persists changes; success banner confirms `"Saved changes to ..."` and updated fields appear in directory. | Verified via `AppointmentFormComponent` edit route handling and live `json-server` `PUT` (`PUT_TITLE=... END=12:00 STATUS=Completed`). | **PASS** |
| **TC-11** | Persistence & Delete | Create a new record via `POST`, verify `db.json` file on disk, then trigger two-step Delete (**Delete** -> **Confirm**) via `DELETE`. | `db.json` appointment array grows from 5 to 6 immediately after `POST` (surviving full page reload), and returns cleanly to 5 after `DELETE` confirmation with success feedback banner. | Verified in live `json-server` check (`DB_JSON_COUNT_AFTER_POST=6`, `DB_JSON_COUNT_AFTER_DELETE=5`) and `appointment-list.component.spec.ts`. | **PASS** |
| **TC-12** | API Failure & Recovery | Stop `json-server` (or simulate HTTP status `0` network failure) and load Dashboard or submit a form, then click **Retry** once server restarts. | Application does not crash; error banner (`role="alert"`) displays `"Unable to reach the Appointment API at http://localhost:3000. Verify that json-server is running."` with a functional **Retry** button; failed inline status changes revert to previous status. | Verified in `appointment.service.spec.ts` and `dashboard.component.spec.ts` (HTTP status `0` renders `.banner--error` containing `json-server`). | **PASS** |
