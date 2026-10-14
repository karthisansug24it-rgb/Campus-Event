-- ====================================================================
-- Campus Event Management System - Francis Xavier Engineering College
-- Database Schema (schema.sql)
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `campus_events` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `campus_events`;

-- Drop existing tables in reverse dependency order if rebuilding
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `points_log`;
DROP TABLE IF EXISTS `registration_requests`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Departments Table
CREATE TABLE `departments` (
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'student') NOT NULL DEFAULT 'student',
  `department_code` VARCHAR(10) NULL,
  `admission_year` INT NULL,
  `study_level` ENUM('ug', 'pg') NULL,
  `section` VARCHAR(5) NULL,
  `register_number` VARCHAR(20) NULL,
  `total_points` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_role` (`role`),
  CONSTRAINT `fk_users_department` FOREIGN KEY (`department_code`) 
    REFERENCES `departments` (`code`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Events Table
CREATE TABLE `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `poster_url` VARCHAR(255) NULL,
  `event_type` ENUM('internal', 'external') NOT NULL COMMENT 'internal: Inside College, external: Outside College',
  `category` VARCHAR(50) NOT NULL COMMENT 'Hackathon, Workshop, Seminar, Cultural, Sports, Other',
  `venue` VARCHAR(150) NOT NULL,
  `organizer` VARCHAR(150) NOT NULL,
  `event_date` DATETIME NOT NULL,
  `registration_deadline` DATETIME NOT NULL,
  `max_seats` INT NULL,
  `reward_points` INT NOT NULL DEFAULT 0,
  `external_link` VARCHAR(255) NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_event_type` (`event_type`),
  INDEX `idx_event_category` (`category`),
  INDEX `idx_event_date` (`event_date`),
  CONSTRAINT `fk_events_created_by` FOREIGN KEY (`created_by`) 
    REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Registration Requests Table
CREATE TABLE `registration_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `department_code` VARCHAR(10) NOT NULL,
  `section` VARCHAR(5) NOT NULL,
  `register_number` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `admission_year` INT NOT NULL,
  `year_of_study` INT NOT NULL COMMENT 'Calculated snapshot at the time of request',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `admin_note` TEXT NULL,
  `reviewed_by` INT NULL,
  `reviewed_at` DATETIME NULL,
  `attended` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_event_user` (`event_id`, `user_id`),
  INDEX `idx_request_status` (`status`),
  INDEX `idx_request_event` (`event_id`),
  INDEX `idx_request_user` (`user_id`),
  CONSTRAINT `fk_requests_event` FOREIGN KEY (`event_id`) 
    REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_requests_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_requests_department` FOREIGN KEY (`department_code`) 
    REFERENCES `departments` (`code`) ON UPDATE CASCADE,
  CONSTRAINT `fk_requests_reviewer` FOREIGN KEY (`reviewed_by`) 
    REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Points Log Table
CREATE TABLE `points_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `event_id` INT NOT NULL,
  `points` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_points_user` (`user_id`),
  CONSTRAINT `fk_points_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_points_event` FOREIGN KEY (`event_id`) 
    REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
