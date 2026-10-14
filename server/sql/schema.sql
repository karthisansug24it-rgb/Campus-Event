-- ========================================================
-- Campus Event Management System - Francis Xavier Engineering College
-- Database Schema: schema.sql
-- ========================================================

CREATE DATABASE IF NOT EXISTS campus_events
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_events;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
  code VARCHAR(20) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student') NOT NULL DEFAULT 'student',
  department_code VARCHAR(20) NULL,
  admission_year INT NULL,
  study_level ENUM('ug', 'pg') NULL,
  section VARCHAR(5) NULL,
  register_number VARCHAR(30) NULL,
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_dept (department_code),
  CONSTRAINT fk_users_department FOREIGN KEY (department_code)
    REFERENCES departments (code)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  poster_url VARCHAR(500) NULL,
  event_type ENUM('internal', 'external') NOT NULL DEFAULT 'internal', -- 'internal' (Inside College) or 'external' (Outside College)
  category ENUM('Hackathon', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Other') NOT NULL DEFAULT 'Workshop',
  venue VARCHAR(200) NOT NULL,
  organizer VARCHAR(150) NOT NULL,
  event_date DATETIME NOT NULL,
  registration_deadline DATETIME NOT NULL,
  max_seats INT NULL,
  reward_points INT NOT NULL DEFAULT 0,
  external_link VARCHAR(500) NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_events_date (event_date),
  INDEX idx_events_deadline (registration_deadline),
  INDEX idx_events_type (event_type),
  INDEX idx_events_category (category),
  CONSTRAINT fk_events_creator FOREIGN KEY (created_by)
    REFERENCES users (id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Registration Requests Table
CREATE TABLE IF NOT EXISTS registration_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  department_code VARCHAR(20) NOT NULL,
  section VARCHAR(5) NOT NULL,
  register_number VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL,
  admission_year INT NOT NULL,
  year_of_study INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  admin_note TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  attended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_user (event_id, user_id),
  INDEX idx_req_event_status (event_id, status),
  INDEX idx_req_user (user_id),
  INDEX idx_req_status (status),
  CONSTRAINT fk_req_event FOREIGN KEY (event_id)
    REFERENCES events (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_req_user FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_req_dept FOREIGN KEY (department_code)
    REFERENCES departments (code)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_req_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Points Log Table
CREATE TABLE IF NOT EXISTS points_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NULL,
  points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_points_user (user_id),
  CONSTRAINT fk_points_user FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_points_event FOREIGN KEY (event_id)
    REFERENCES events (id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
