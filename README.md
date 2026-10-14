# Campus Event Management System (EMS)
### Francis Xavier Engineering College (Autonomous), Tirunelveli

A full-stack, production-ready web application built for Francis Xavier Engineering College to manage, publish, and register for campus events held inside and outside the college (hackathons, workshops, symposiums, cultural fests, sports, etc.).

---

## 🌟 Key Highlights

- **Strict College Email Rules**:
  - Enforces `@francisxavier.ac.in` domain (regex: `^([a-z][a-z0-9]*)\.(ug|pg)\.(\d{2})\.([a-z]+)@francisxavier\.ac\.in$`).
  - Auto-derives Student Display Name, Degree Level (`UG`/`PG`), Admission Year, Department, and dynamic **Year of Study** based on the June academic calendar boundary.
  - Blocks alumni from registration when study duration exceeds allowed limits (UG: 4 years, PG: 2 years).
  - Server re-derives and validates all fields; never trusts client-sent year or department.
- **Student Flow**:
  - Responsive event grid with live search, filters (All, Inside College, Outside College, Category chips, Upcoming Only).
  - Detailed popup modal with real-time seat availability calculation and event specifications.
  - Centered popup registration modal over dimmed backdrop with pre-filled, read-only verified college email, auto-filled editable name, read-only department, and verified study year chip.
  - Top toast banner: *"Request sent to admin"* (auto-dismisses after 3 seconds).
  - Real-time event button states: `Register`, `Request Pending`, `Registered ✓`, `Register Again` (with admin rejection feedback), `Registration Closed`, `Seats Full`.
  - Dedicated **My Requests** tracking page.
- **Admin Flow**:
  - Unified login with role toggle (`Student Login` vs `Admin Login`).
  - Dashboard with key metrics (Total Events, Pending Queue, Confirmed Registrations, Student Accounts).
  - Events Manager with Add / Edit / Delete and multi-part poster uploads (JPG, PNG, WebP, max 2 MB).
  - Registration Requests console with tabbed views (`Pending`, `Approved`, `Rejected`), event dropdown filter, department mismatch warnings, and optional rejection feedback.
  - Concurrency-safe seat allotment using MySQL database transactions (`SELECT ... FOR UPDATE`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, Axios, Tailwind CSS v3, Lucide Icons |
| **Backend** | Node.js, Express, `mysql2` (prepared statements), JWT, `bcryptjs`, `multer`, `helmet`, `cors`, `express-rate-limit`, `express-validator` |
| **Database** | MySQL 8.0 (InnoDB, `utf8mb4`, foreign key cascades, transaction isolation) |

---

## 🗄️ Database Architecture

The system database is named `campus_events` and consists of 5 relational tables:
1. `departments` (`code` PK, `name`)
2. `users` (`id`, `name`, `email` UNIQUE, `password_hash`, `role`, `department_code`, `admission_year`, `study_level`, `section`, `register_number`, `total_points`, `created_at`)
3. `events` (`id`, `title`, `description`, `poster_url`, `event_type`, `category`, `venue`, `organizer`, `event_date`, `registration_deadline`, `max_seats`, `reward_points`, `external_link`, `created_by`, `created_at`, `updated_at`)
4. `registration_requests` (`id`, `event_id`, `user_id`, `name`, `department_code`, `section`, `register_number`, `email`, `admission_year`, `year_of_study`, `status`, `admin_note`, `reviewed_by`, `reviewed_at`, `attended`, `created_at`, `UNIQUE(event_id, user_id)`)
5. `points_log` (`id`, `user_id`, `event_id`, `points`, `reason`, `created_at`)

---

## 🔑 Default Credentials & Sample Accounts

### 1. Administrator Account
- **Role**: Admin
- **Email**: `admin@francisxavier.ac.in`
- **Password**: `Admin@123`
- **Landing URL**: `/admin`

### 2. Sample Student Account
- **Role**: Student
- **Email**: `karthisans.ug.24.it@francisxavier.ac.in`
- **Password**: `Student@123`
- **Landing URL**: `/events`
- **Parsed Details**:
  - Name: `Karthisans`
  - Degree: `UG` (Undergraduate)
  - Admission Year: `2024`
  - Year of Study: `III Year` (in academic year 2026)
  - Department: `Information Technology` (`it`)
  - Section: `A`
  - Register Number: `953624104001`

*(Students can also self-register on the Login page with any valid `@francisxavier.ac.in` student address).*

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- MySQL Server (v8.0+) running locally on port `3306`

### 1. Configure Server Environment
Create or verify `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=admin123
DB_NAME=campus_events

JWT_SECRET=fxec_campus_event_jwt_super_secret_key_2026_x89!secure
JWT_EXPIRES_IN=1d

ADMIN_NAME=FXEC Event Admin
ADMIN_EMAIL=admin@francisxavier.ac.in
ADMIN_PASSWORD=Admin@123
```

### 2. Initialize Database & Seed Sample Events
From the root directory or inside `server`:
```bash
cd server
npm install
npm run init-db
```
This runs `schema.sql`, seeds departments (`it`, `cse`, `ece`, `eee`, `mech`, `civil`, `aids`, `bme`), creates the admin and student accounts, seeds 5 rich sample events, and generates visual SVG poster assets in `server/uploads`.

### 3. Run Unit Tests (Email Parser)
```bash
npm test
```
Executes all 10 test suites covering valid emails, wrong domains, look-alikes (`notfrancisxavier.ac.in`), wrong patterns, unknown departments, alumni bounds, and June academic calendar calculations.

### 4. Start the Backend API Server
```bash
npm start
# or for hot-reload development:
npm run dev
```
*API Base URL*: `http://localhost:5000/api`

### 5. Start the React Frontend Client
Open a new terminal window:
```bash
cd client
npm install
npm run dev
```
*Client URL*: `http://localhost:5173/`

---

## 📅 Seeded Sample Events

1. **Smart City Hackathon 2026** (Internal · Hackathon · 80 Seats · 100 Points)
   - *Venue*: Campus Auditorium & FX Innovation Hub
   - *Organizer*: Department of Information Technology & IEEE Student Branch
2. **Hands-on GenAI & Full-Stack Workshop** (Internal · Workshop · 50 Seats · 50 Points)
   - *Venue*: Lab 3, Department of CSE & IT
   - *Organizer*: CSI Student Chapter & FXEC Centre for Applied AI
3. **National Robotics & Automation Symposium** (External · Seminar · 40 Seats · 75 Points)
   - *Venue*: Anna University Regional Campus Conference Hall
   - *Organizer*: State Board of Technical Education & Robotics Guild
4. **Dhwani 2026 - Cultural Fest** (Internal · Cultural · 250 Seats · 30 Points)
   - *Venue*: Open Air Amphitheatre, FXEC Campus
   - *Organizer*: FXEC Student Council & Fine Arts Club
5. **South Zone Inter-University Basketball Tournament** (External · Sports · 25 Seats · 60 Points)
   - *Venue*: District Indoor Sports Complex
   - *Organizer*: Tirunelveli District Basketball Association

---

## 📡 REST API Specifications

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/parse-email` | Public | Real-time derivation of student name, year, level & department |
| `POST` | `/api/auth/signup` | Public | Student self-registration with college email verification |
| `POST` | `/api/auth/login` | Public | Unified login supporting Student and Admin toggles |
| `GET` | `/api/auth/me` | Authenticated | Current user profile |
| `GET` | `/api/events` | Public / Optional Auth | List events with search, category, upcoming, and student status |
| `GET` | `/api/events/:id` | Public / Optional Auth | Single event specifications and seat availability |
| `POST` | `/api/events` | Admin | Create event with poster image upload |
| `PUT` | `/api/events/:id` | Admin | Update event details & replace poster |
| `DELETE` | `/api/events/:id` | Admin | Delete event |
| `POST` | `/api/events/:id/requests` | Student | Submit registration request with email verification |
| `GET` | `/api/my/requests` | Student | Retrieve student's registration history & status |
| `GET` | `/api/admin/requests` | Admin | View requests by status (`pending`, `approved`, `rejected`) |
| `PATCH`| `/api/admin/requests/:id/approve` | Admin | Concurrency-safe seat reservation & approval |
| `PATCH`| `/api/admin/requests/:id/reject` | Admin | Reject application with optional administrative feedback |
| `GET` | `/api/admin/stats` | Admin | Executive summary KPIs & dashboard metrics |

---

## 🚀 Phase 2 Roadmap
- [ ] Attendance QR-code scanner linking directly to `points_log` credits.
- [ ] Student Leaderboard page based on cumulative points.
- [ ] CSV Export for approved participants list per event.
- [ ] Email notifications on request approval/rejection.
- [ ] College Email OTP verification during student signup.
