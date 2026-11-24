# Appointment Scheduler (Group 7)

An Angular 22 standalone web application for scheduling, filtering, and managing appointments with a local `json-server` mock REST API and **FormGroup-level Cross-Field Validation** (`endTime > startTime`).

## Tech Stack
- **Angular 22** (Standalone Components, Zoneless Change Detection, `@if` / `@for` / `@switch`)
- **Angular Reactive Forms** with custom `FormGroup` cross-field validator (`timeRangeValidator`)
- **RxJS Observables** & `HttpClient` via injected `AppointmentService`
- **`json-server`** persisting records to `db.json` on `http://localhost:3000/appointments`
- **Vitest** unit & component tests

## Running Locally

Open two terminals in this folder:

### 1. Start the Mock REST API (`http://localhost:3000`)
```bash
npm run api
```

### 2. Start the Angular Development Server (`http://localhost:4200`)
```bash
npm start
```

## Build & Test Commands
```bash
npm run build
npm test -- --watch=false
```

## Documentation
Complete project documentation ready for PDF export is available in [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).
