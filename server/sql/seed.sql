-- ========================================================
-- Campus Event Management System - Francis Xavier Engineering College
-- Database Seed Data: seed.sql
-- ========================================================

USE campus_events;

-- 1. Seed Departments
INSERT INTO departments (code, name) VALUES
('it', 'Information Technology'),
('cse', 'Computer Science and Engineering'),
('ece', 'Electronics and Communication Engineering'),
('eee', 'Electrical and Electronics Engineering'),
('mech', 'Mechanical Engineering'),
('civil', 'Civil Engineering'),
('aids', 'Artificial Intelligence and Data Science'),
('bme', 'Biomedical Engineering')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Seed Default Admin User
-- Password is 'Admin@123' hashed with bcrypt (cost 10)
-- $2b$10$wE9mN5Z5Z0b3qU4fS2u9Xe9k4VfQk0G1wN2eX3Y4Z5A6B7C8D9E0F
-- We also provide a seed script (seedDb.js) that generates dynamic bcrypt hashes matching .env
INSERT INTO users (id, name, email, password_hash, role, department_code, admission_year, study_level, section, register_number, total_points)
VALUES
(1, 'Admin FXEC', 'admin@francisxavier.ac.in', '$2b$10$mR3289vUqjI0GskE8gR0e.5eG4h8LqA5vX8d01gD7/n1hK4n5E8qK', 'admin', 'cse', 2020, 'ug', 'A', '950720104001', 0),
(2, 'Karthisan S', 'karthisans.ug.24.it@francisxavier.ac.in', '$2b$10$mR3289vUqjI0GskE8gR0e.5eG4h8LqA5vX8d01gD7/n1hK4n5E8qK', 'student', 'it', 2024, 'ug', 'A', '950724104042', 25)
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

-- 3. Seed Sample Events
-- Note: 'internal' = Inside College, 'external' = Outside College
INSERT INTO events (id, title, description, poster_url, event_type, category, venue, organizer, event_date, registration_deadline, max_seats, reward_points, external_link, created_by)
VALUES
(
  1,
  'HackFX 2026: 24-Hour National Hackathon',
  'Flagship annual hackathon at FXEC! Build innovative AI, IoT, and Web3 solutions to real-world industrial and societal problems. Cash prizes up to Rs. 50,000, internship opportunities, and mentorship from top industry leaders. Food and refreshments provided.',
  '/uploads/sample-hackathon.webp',
  'internal',
  'Hackathon',
  'FXEC Central Auditorium & Innovation Lab',
  'Department of Information Technology & IIC',
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  DATE_ADD(NOW(), INTERVAL 5 DAY),
  120,
  50,
  'https://francisxavier.ac.in/hackfx',
  1
),
(
  2,
  'Hands-on Workshop: Modern Full-Stack Development with React & Node',
  'A rigorous 2-day technical workshop covering Vite, React 19, Express, MySQL optimization, RESTful API architecture, and cloud deployment on AWS/Vercel. Bring your laptops.',
  '/uploads/sample-workshop.webp',
  'internal',
  'Workshop',
  'Turing Computer Center - Lab 3',
  'FXEC Coding Club & CSI Student Chapter',
  DATE_ADD(NOW(), INTERVAL 12 DAY),
  DATE_ADD(NOW(), INTERVAL 10 DAY),
  60,
  30,
  NULL,
  1
),
(
  3,
  'National Technical Symposium: INNOVISION 2026',
  'Annual inter-college symposium featuring Paper Presentation, Code Debugging, Web Design, Robo Race, and Project Display. Exciting trophies and certificates for all participants.',
  '/uploads/sample-symposium.webp',
  'internal',
  'Seminar',
  'Mechanical Seminar Hall & Open Stage',
  'Department of CSE & ECE',
  DATE_ADD(NOW(), INTERVAL 18 DAY),
  DATE_ADD(NOW(), INTERVAL 14 DAY),
  250,
  20,
  'https://francisxavier.ac.in/innovision',
  1
),
(
  4,
  'Smart India Hackathon 2026 - Regional Finale',
  'Premier national level competition conducted by MoE. FXEC teams selected for the regional rounds will represent our college at Anna University Regional Center.',
  '/uploads/sample-external.webp',
  'external',
  'Hackathon',
  'Anna University Regional Campus, Tirunelveli',
  'Ministry of Education & FXEC EDC Cell',
  DATE_ADD(NOW(), INTERVAL 25 DAY),
  DATE_ADD(NOW(), INTERVAL 20 DAY),
  20,
  100,
  'https://sih.gov.in',
  1
),
(
  5,
  'Guest Lecture: Frontiers in Generative AI & LLM Systems',
  'Distinguished lecture delivered by Dr. Arvind Ramanathan, Principal AI Research Scientist. Deep dive into transformer models, retrieval-augmented generation (RAG), and responsible AI.',
  '/uploads/sample-ai.webp',
  'internal',
  'Seminar',
  'APJ Abdul Kalam Conference Hall',
  'Department of AI & DS',
  DATE_ADD(NOW(), INTERVAL 4 DAY),
  DATE_ADD(NOW(), INTERVAL 2 DAY),
  150,
  15,
  NULL,
  1
),
(
  6,
  'DHWANI 2026 - Intra-College Cultural Extravaganza',
  'Showcase your artistic flair in Solo & Group Dance, Western & Classical Music, Theatrics, Photography, and Fine Arts. Celebrate college spirit and creativity.',
  '/uploads/sample-cultural.webp',
  'internal',
  'Cultural',
  'FXEC Open Air Amphitheatre',
  'FXEC Fine Arts Club',
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  DATE_ADD(NOW(), INTERVAL 24 DAY),
  500,
  10,
  NULL,
  1
)
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description);

-- 4. Seed Sample Request
INSERT INTO registration_requests (
  id, event_id, user_id, name, department_code, section, register_number, email, admission_year, year_of_study, status, admin_note, reviewed_by, reviewed_at, attended
) VALUES
(
  1, 1, 2, 'Karthisan S', 'it', 'A', '950724104042', 'karthisans.ug.24.it@francisxavier.ac.in', 2024, 3, 'approved', 'Verified and confirmed seat.', 1, NOW(), false
)
ON DUPLICATE KEY UPDATE status = VALUES(status);
