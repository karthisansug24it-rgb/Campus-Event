# Campus Event Management System (EMS)
### Francis Xavier Engineering College (Autonomous), Tirunelveli

A full-stack, production-grade event management, publication, and student credentialing platform tailored for Francis Xavier Engineering College. Designed to streamline campus hackathons, technical symposiums, hands-on workshops, cultural fests, and sports meets inside and outside the college campus.

---

## 🌟 Key Highlights & Modern Features

### 1. 🎠 Upcoming Events Blue Card Carousel
- **Gesture-Driven Touchpad Horizontal Scroll**: Two-finger swipe left-to-right on touchpads advances to the next upcoming event; swipe right-to-left navigates backwards. Includes an inertial accumulator and cooldown to prevent runaway slide skipping while preserving vertical page scrolling.
- **Physical Drag & Swipe Support**: Natural click-and-drag on desktop and smooth touch gestures on mobile devices with sub-pixel CSS translation and easing curves.
- **Keyboard & Button Navigation**: Arrow key controls and circular glassmorphic arrow buttons with active slide indicators.
- **Intelligent Countdown Badge**: Dynamic indicators displaying `"Happening Today!"`, `"Happening Tomorrow!"`, or `"Happening in X days"`.
- **Live Registration Awareness**: Replaces the "Register Now" button with the student's real-time stage badge and a direct `"Track Status"` shortcut if they have already registered.

### 2. 🏅 4-Stage Verification & Recognition Lifecycle
Replaces legacy binary attendance checking with a genuine four-stage verification and reward pipeline:
- **Stage 1: Registered (Pending Review)**
  - Student registers and uploads their registration confirmation screenshot (especially useful for external Google Forms or hackathon portals).
  - Enforces duplicate prevention (strictly 1 registration per event per student).
- **Stage 2: Registration Approved (Seat Confirmed)**
  - Admin inspects the student's registration proof in the lightbox viewer and confirms the seat.
  - Concurrency-safe seat allotment using MySQL row-level locking (`SELECT ... FOR UPDATE`).
- **Stage 3: Participated (Certificate Uploaded)**
  - After attending the event, the student uploads their official participation or winner certificate (PDF/JPG/PNG).
  - Built-in countdown alerts warn students before certificate upload deadlines expire.
- **Stage 4: Ranked & Awarded (Points Credited)**
  - Admin reviews the certificate and assigns an official achievement rank:
    - 🥇 **Rank 1 (Gold)** + Bonus Points
    - 🥈 **Rank 2 (Silver)** + Bonus Points
    - 🥉 **Rank 3 (Bronze)** + Bonus Points
    - 🎖️ **Participated** + Base Reward Points
  - Reward points are atomically credited to the student's balance and logged in `points_log`.

### 3. 🛡️ Strict Institutional Email Parser & Academic Rules
- **Domain Verification**: Enforces strictly institutional emails (`@francisxavier.ac.in`).
- **Deterministic Regex Extraction**:
  ```regex
  ^([a-z][a-z0-9]*)\.(ug|pg)\.(\d{2})\.([a-z]+)@francisxavier\.ac\.in$
  ```
- **Auto-Derivation**: Extracts display name, degree level (`UG` / `PG`), admission year, and department (`it`, `cse`, `ece`, `eee`, `mech`, `civil`, `aids`, `bme`).
- **Dynamic Year of Study**: Dynamically evaluated based on the June academic calendar threshold:
  - If current month $\ge$ June: $\text{Year} = \text{Current Year} - \text{Admission Year} + 1$
  - If before June: $\text{Year} = \text{Current Year} - \text{Admission Year}$
- **Alumni Protection**: Blocks registrations if student has exceeded standard degree tenure (UG > 4 years, PG > 2 years).
- **Server-Side Authority**: The server re-derives and validates all identity parameters on every transaction—never trusting client-submitted payloads.

### 4. 🎨 Bespoke Editorial UI & Typography
- **Merriweather Serif Font System**: Refined typography across headings, metadata, badges, and body content for an editorial, academic aesthetic.
- **Interactive Modals**: Detailed Event Specifications modal with uncropped poster view, seat capacity indicators, structured guidelines, and schedule breakdowns.
- **Lightbox Proof Viewer**: Instant full-screen preview modal for registration screenshots and achievement certificates.
- **Clean Attendees & CSV Export**: Admin modal featuring stage filters, department filters, and clean CSV export (without redundant attendance checkboxes).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Tailwind CSS v3, Merriweather Typography, Lucide Icons, Axios |
| **Backend** | Node.js (v18+), Express.js REST API, JSON Web Tokens (JWT), `bcryptjs`, `multer`, `helmet`, `cors`, `express-rate-limit` |
| **Database** | MySQL 8.0 (InnoDB engine, `utf8mb4` charset, prepared statements with `mysql2`, connection pooling, row transactions) |
| **File Storage** | Synchronized local uploads (`server/uploads` & `client/public/uploads`) supporting posters, proofs, and certificates |

---

## 🗄️ Database Architecture

The application runs on the `campus_events` MySQL database with 6 relational tables:

```
  ┌───────────────┐          ┌───────────────────────┐
  │  departments  │◄───┐      │         users         │
  └───────────────┘    │      └──────────┬────────────┘
                       │                 │ 1
                       │                 │
                       │                 ▼ *
                       │      ┌───────────────────────┐          ┌───────────────┐
                       └──────┤ registration_requests ├─────────►│    events     │
                              └──────────┬────────────┘ *      1 └───────┬───────┘
                                         │                               │
                                         ▼                               ▼
                              ┌───────────────────────┐          ┌───────────────┐
                              │      points_log       │          │ external_regs │
                              └───────────────────────┘          └───────────────┘
```

1. **`departments`**: Institutional branches (`code` PK, `name`).
2. **`users`**: Students and administrators (`id`, `name`, `email` UNIQUE, `password_hash`, `role`, `department_code`, `admission_year`, `study_level`, `section`, `register_number`, `total_points`, `created_at`).
3. **`events`**: Events catalog (`id`, `title`, `description`, `poster_url`, `event_type`, `category`, `venue`, `organizer`, `event_date`, `start_time`, `end_time`, `registration_deadline`, `registration_open_date`, `certificate_deadline`, `max_seats`, `reward_points`, `external_link`, `registration_url`, `status`, `is_visible_on_dashboard`).
4. **`registration_requests`**: 4-stage registration lifecycle (`id`, `event_id`, `user_id`, `name`, `department_code`, `section`, `register_number`, `email`, `admission_year`, `year_of_study`, `status`, `registration_screenshot`, `certificate_url`, `rank_position`, `rank_points_awarded`, `admin_note`, `reviewed_by`, `reviewed_at`, `ranked_by`, `ranked_at`, `UNIQUE(event_id, user_id)`).
5. **`external_registrations`**: Audit trail for external hackathon / Google Form portal clicks.
6. **`points_log`**: Transparent audit ledger of points awarded to students.

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
- **Derived Info**: Karthisans · UG · Joined 2024 · Information Technology (`it`) · III Year

*(Students can also self-register on the Login/Register page with any valid `@francisxavier.ac.in` email).*

---

## 🚀 Setup & Execution Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or newer)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.0+) running locally on port `3306`

### 1. Configure Server Environment
Create or verify `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_events

JWT_SECRET=fxec_campus_event_jwt_super_secret_key_2026_x89!secure
JWT_EXPIRES_IN=1d

ADMIN_NAME=FXEC Event Admin
ADMIN_EMAIL=admin@francisxavier.ac.in
ADMIN_PASSWORD=Admin@123
```

### 2. Initialize Database & Run Migrations
From the `server` directory:
```bash
cd server
npm install
npm run init-db
```
*Optional: If updating an existing database to support the 4-stage lifecycle and external hackathon registrations:*
```bash
node src/scripts/migrateProgressStages.js
node src/scripts/migrateHackathonRegistration.js
```

### 3. Run Automated Tests
```bash
npm test
```
Executes comprehensive test suites validating institutional email parsing, year derivations, domain security, boundary months, and alumni restrictions.

### 4. Start Applications

#### Option A: One-Click Windows Launcher
Double-click `start.bat` in the project root to spin up both server and client concurrently in separate terminal windows.

#### Option B: Manual Command Line
- **Backend API**:
  ```bash
  cd server
  npm run dev
  # Running at http://localhost:5000
  ```
- **Frontend Client**:
  ```bash
  cd client
  npm install
  npm run dev
  # Running at http://localhost:5173
  ```

---

## 📡 REST API Reference

### Authentication & Identification
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/parse-email` | Real-time derivation of student name, degree, department, and academic year |
| `POST` | `/api/auth/signup` | Student registration with institutional email verification |
| `POST` | `/api/auth/login` | Unified authentication supporting Student and Admin roles |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile and live reward points |

### Events Catalog
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | List all visible events with search, category filters, and student stage status |
| `GET` | `/api/events/:id` | Detailed event specifications and real-time seat availability |
| `POST` | `/api/events` | Admin: Create new event with multi-part poster upload |
| `PUT` | `/api/events/:id` | Admin: Update event information, schedule, or poster image |
| `DELETE` | `/api/events/:id` | Admin: Remove event from catalog |
| `POST` | `/api/events/:id/track-external` | Track external Google Form / Hackathon registration click |

### Registration & Lifecycle
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/events/:id/requests` | Student: Submit Stage 1 registration with screenshot proof upload |
| `GET` | `/api/my/requests` | Student: View applied events and real-time stage statuses |
| `POST` | `/api/requests/:id/certificate` | Student: Upload Stage 3 participation/winner certificate |
| `GET` | `/api/admin/requests` | Admin: Fetch requests filtered by stage (`registered`, `approved`, `participated`, `ranked`, `rejected`) |
| `PATCH` | `/api/admin/requests/:id/approve` | Admin: Approve Stage 1 registration with concurrency-safe seat reservation |
| `PATCH` | `/api/admin/requests/:id/reject` | Admin: Reject registration with optional feedback |
| `POST` | `/api/admin/requests/:id/rank` | Admin: Verify certificate, award rank (`1`, `2`, `3`, `participated`), and credit points |
| `GET` | `/api/admin/events/:id/attendees` | Admin: Retrieve filtered attendee list for an event |
| `GET` | `/api/admin/stats` | Admin: Dashboard metrics (Total Events, Confirmed Participants, Pending Reviews, Points) |

---

## 📂 Project Directory Structure

```
Campus-Event/
├── client/                          # React + Vite Frontend
│   ├── public/                      # Static assets & synchronized upload previews
│   ├── src/
│   │   ├── components/              # EventCard, EventModal, RegisterModal, Navbar, Footer
│   │   │   └── admin/               # EventAttendeesModal, etc.
│   │   ├── context/                 # AuthContext, ToastContext
│   │   ├── pages/
│   │   │   ├── student/             # Home (Slider + Grid), MyRequests (4-stage tracker)
│   │   │   └── admin/               # Dashboard, Events Manager, Requests Console
│   │   ├── App.jsx                  # Route configurations and layout wrappers
│   │   ├── main.jsx                 # React root mounting
│   │   └── index.css                # Merriweather typography & Tailwind styles
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                          # Node.js + Express Backend
│   ├── sql/
│   │   └── schema.sql               # Relational DDL definitions & sample seeds
│   ├── src/
│   │   ├── controllers/             # authController, eventController, requestController
│   │   ├── middleware/              # auth.js (JWT), upload.js (Multer)
│   │   ├── routes/                  # authRoutes, eventRoutes, requestRoutes, adminRoutes
│   │   ├── scripts/                 # initDb.js, migrateProgressStages.js, seedTestData.js
│   │   └── utils/                   # emailParser.js
│   ├── test/                        # api.test.js, emailParser.test.js
│   └── server.js                    # Express entry point
│
├── HOW_THE_PROJECT_WORKS.txt        # Detailed technical and operational guide
├── start.bat                        # Windows launch script for client + server
└── README.md                        # Documentation
```

---

## 🏛️ Institution
**Francis Xavier Engineering College (Autonomous)**  
*Affiliated to Anna University, Approved by AICTE, Accredited by NBA & NAAC 'A' Grade*  
Vannarpettai, Tirunelveli - 627 003, Tamil Nadu, India.
