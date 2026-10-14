# Campus Event Management System
### Francis Xavier Engineering College (Autonomous), Tirunelveli

A full-stack, responsive event management system for Francis Xavier Engineering College (FXEC). Admins publish inside and outside campus events (hackathons, workshops, symposiums, etc.), while students browse and submit registration requests with strict server-side institutional email verification and seat validation.

---

## 1. Tech Stack

- **Frontend:** React.js (Vite), React Router v6, Axios (with JWT interceptors), Tailwind CSS (Francis Xavier College blue palette), Lucide React.
- **Backend:** Node.js, Express.js, `mysql2` (prepared statements only), JWT, bcryptjs, Multer (poster uploads with 2 MB limit), Express-Validator, Helmet, CORS, Dotenv, Express-Rate-Limit.
- **Database:** MySQL (InnoDB, UTF-8 mb4, foreign keys with cascade/restrict rules, indexes).

---

## 2. College Email Rules & Architecture

Francis Xavier Engineering College student emails follow a strict schema:
```
<name>.<level>.<yy>.<dept>@francisxavier.ac.in
```
**Example:** `karthisans.ug.24.it@francisxavier.ac.in`
- **Name:** `karthisans` &rarr; Auto-filled as `Karthisans` (editable)
- **Level:** `ug` (Undergraduate) or `pg` (Postgraduate)
- **Admission Year:** `24` &rarr; Admitted in `2024`
- **Department:** `it` &rarr; `Information Technology`

### Security & Parsing Features:
1. **Exact Domain Verification:** Strictly requires `@francisxavier.ac.in`. Prevents look-alike spoofing (e.g. `x@notfrancisxavier.ac.in` or `x@francisxavier.ac.in.fake.com`).
2. **Dynamic Year of Study Calculation:** The academic year starts in June:
   $$\text{academicStart} = (\text{month} \ge 6 \ ? \ \text{year} : \text{year} - 1)$$
   $$\text{yearOfStudy} = \text{academicStart} - \text{admissionYear} + 1$$
   *Example:* In October 2026, admission year 2024 evaluates dynamically to **III Year**.
3. **Alumni Block:** UG is capped at 4 years and PG at 2 years. Any email calculating past these limits is flagged as an alumnus and blocked from student registrations with a clear explanation.
4. **Server Re-derivation:** The server recalculates and enforces year of study and department from the verified email; it never trusts client-supplied academic metadata.
5. **Real-time Parsing Endpoint:** `POST /api/auth/parse-email` enables instant autofill on frontend sign-up and registration forms.

---

## 3. Database Setup & Seeding

### Schema (`server/sql/schema.sql`)
Includes foreign keys, indexes, and utf8mb4 tables:
- `departments`: Pre-seeded with `it`, `cse`, `ece`, `eee`, `mech`, `civil`, `aids`, `bme`.
- `users`: Stores admin and student credentials, dynamic fields, and reward points.
- `events`: Tracks title, description, poster upload URL, `event_type` (`internal`/`external`), category, venue, organizer, deadline, `max_seats`, and `reward_points`.
- `registration_requests`: Enforces `UNIQUE KEY (event_id, user_id)`. Rejected requests can be re-applied by students, updating the record back to `pending`.
- `points_log`: Logs points awarded upon attendance verification.

### Automated Database Initialization
Make sure MySQL server is running, then inside `server/`:
```bash
npm run db:setup
```
This script creates the `campus_events` database if it doesn't exist, executes `schema.sql`, dynamically hashes the admin password from `.env`, and seeds sample departments, events, and accounts.

---

## 4. Default Seed Credentials

### Administrator Account
- **Role:** Administrator
- **Email:** `admin@francisxavier.ac.in`
- **Password:** `Admin@123`
*(Admin accounts cannot sign up via the UI; they are provisioned through seed/env)*

### Sample Student Account
- **Role:** Student
- **Email:** `karthisans.ug.24.it@francisxavier.ac.in`
- **Password:** `Student@123`
- **Department:** Information Technology (III Year, Section A)

---

## 5. How to Run Locally

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+ or MariaDB)

### Step 1: Backend Setup
```bash
cd server
npm install
# Ensure MySQL is running on localhost:3306, then initialize database:
npm run db:setup
# Start backend API (Port 5000):
npm run dev
```

### Step 2: Frontend Setup
In a new terminal window:
```bash
cd client
npm install
# Start Vite development server (Port 5173):
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. Running Unit Tests

The backend includes test coverage for the college email parser, verifying valid UG/PG patterns, domain look-alike rejections, invalid formats, unknown department codes, alumni rules, and academic year boundary transitions:
```bash
cd server
npm test
```
All 10 test suites pass with 0 failures.

---

## 7. Key Features & Flow

### Student Flow
1. **Browse Events:** Responsive grid of event poster cards with date badges, inside/outside tags, categories, seats left, and reward points.
2. **Event Details Modal:** Detailed popup showing schedule, venue, organizer, seats left, and dynamic action buttons:
   - `Register` (enabled)
   - `Request Pending` (disabled)
   - `Registered ✓` (approved)
   - `Register Again` (after rejection)
   - `Registration Closed` or `Seats Full` (disabled)
3. **Centered Registration Modal:** Centered over a dimmed backdrop with auto-filled email (read-only), auto-filled name (editable), auto-filled department (read-only), derived year chip, section dropdown (A–D), and register number.
4. **Top Toast Banner:** Displays `"Request sent to admin"` at the top of the screen (auto-hides after 3 seconds).
5. **My Requests:** Track pending requests, approved registrations, and view admin rejection feedback notes with one-click re-application.

### Admin Flow
1. **Admin Dashboard:** Real-time KPI cards for total events, pending applications, approved registrations, and awarded points.
2. **Event Management:** Full CRUD operations with file uploads for event posters (JPG, PNG, WebP up to 2 MB), seat capacity limits, and external problem statement links.
3. **Student Requests Review:** Status tabs (`Pending`, `Approved`, `Rejected`), event filter dropdown, email discrepancy warning badges, and seat-safe approval inside database transactions.
4. **Phase 2 Attendance & Points:** One-click attendance marking that increments the student's `total_points` and creates an audit record in `points_log`.
