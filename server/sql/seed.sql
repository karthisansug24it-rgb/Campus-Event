-- ====================================================================
-- Campus Event Management System - Francis Xavier Engineering College
-- Seed Data (seed.sql)
-- ====================================================================

USE `campus_events`;

-- 1. Seed Departments (code -> name)
INSERT INTO `departments` (`code`, `name`) VALUES
('it', 'Information Technology'),
('cse', 'Computer Science and Engineering'),
('ece', 'Electronics and Communication Engineering'),
('eee', 'Electrical and Electronics Engineering'),
('mech', 'Mechanical Engineering'),
('civil', 'Civil Engineering'),
('aids', 'Artificial Intelligence and Data Science'),
('bme', 'Biomedical Engineering')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Seed Default Admin User
-- Email: admin@francisxavier.ac.in
-- Password: Admin@123 (hashed with bcryptjs, 10 rounds)
-- Note: initDb.js also verifies and seeds this programmatically.
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `department_code`, `total_points`)
VALUES (
  1, 
  'FXEC Event Admin', 
  'admin@francisxavier.ac.in', 
  '$2a$10$s8oYvF4zH2k2zM9Ym99OaeVq5s91jJ3sC8M3/7jB6X2w0N1dD5E6u', 
  'admin', 
  'it', 
  0
)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 3. Seed Sample Student User
-- Email: karthisans.ug.24.it@francisxavier.ac.in (Name: Karthisans, UG, 2024, IT)
-- Password: Student@123
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `department_code`, `admission_year`, `study_level`, `section`, `register_number`, `total_points`)
VALUES (
  2,
  'Karthisans',
  'karthisans.ug.24.it@francisxavier.ac.in',
  '$2a$10$tJ0sXvP5uF6lP3gV9qVlOu3F0s56lM8uC9M4/8jD7Y3w1O2eE6F7v',
  'student',
  'it',
  2024,
  'ug',
  'A',
  '953624104001',
  50
)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 4. Seed Sample Events
INSERT INTO `events` (
  `id`, `title`, `description`, `poster_url`, `event_type`, `category`, 
  `venue`, `organizer`, `event_date`, `registration_deadline`, `max_seats`, 
  `reward_points`, `external_link`, `created_by`
) VALUES
(
  1,
  'Smart City Hackathon 2026',
  'A 24-hour flagship hackathon designed to solve urban mobility, clean energy, and smart campus challenges. Build real-time IoT and AI prototypes with industry mentorship.',
  '/uploads/sample-hackathon.webp',
  'internal',
  'Hackathon',
  'Francis Xavier Campus Auditorium & Innovation Hub',
  'FXEC Department of Information Technology & IEEE Student Branch',
  '2026-11-15 09:00:00',
  '2026-11-10 23:59:59',
  80,
  100,
  'https://francisxavier.ac.in/events/hackathon2026',
  1
),
(
  2,
  'Hands-on GenAI & Full-Stack Workshop',
  'Deep dive into Large Language Models, prompt engineering, vector databases, and modern full-stack deployment with React and Node.js. Hands-on coding exercises with certificates for attendees.',
  '/uploads/sample-workshop.webp',
  'internal',
  'Workshop',
  'Lab 3, Department of CSE & IT',
  'CSI Student Chapter & FXEC Centre for Applied AI',
  '2026-11-05 10:00:00',
  '2026-11-02 18:00:00',
  50,
  50,
  NULL,
  1
),
(
  3,
  'National Robotics & Automation Symposium',
  'Premier state-level symposium featuring bot races, drone obstacle courses, CAD design sprints, and paper presentations evaluated by leading industry experts.',
  '/uploads/sample-symposium.webp',
  'external',
  'Seminar',
  'Anna University Regional Campus Conference Hall',
  'State Board of Technical Education & Robotics Guild',
  '2026-11-20 09:30:00',
  '2026-11-12 17:00:00',
  40,
  75,
  'https://symposium.techconnect.org',
  1
),
(
  4,
  'Dhwani 2026 - Inter-Collegiate Cultural Fest',
  'Annual mega cultural celebration bringing together dance, classical and western music, theatre, literary debates, and digital arts across colleges.',
  '/uploads/sample-cultural.webp',
  'internal',
  'Cultural',
  'Open Air Amphitheatre, FXEC Campus',
  'FXEC Student Council & Fine Arts Club',
  '2026-11-28 17:00:00',
  '2026-11-22 23:59:59',
  250,
  30,
  NULL,
  1
),
(
  5,
  'South Zone Inter-University Basketball Tournament',
  'Compete with elite collegiate basketball teams in tournament brackets. Trophies, cash prizes, and physical activity certificates awarded.',
  '/uploads/sample-sports.webp',
  'external',
  'Sports',
  'District Indoor Sports Complex',
  'Tirunelveli District Basketball Association',
  '2026-12-02 08:00:00',
  '2026-11-25 18:00:00',
  25,
  60,
  'https://sports.fxec.ac.in',
  1
)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
