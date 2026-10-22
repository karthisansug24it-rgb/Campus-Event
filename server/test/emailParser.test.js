const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCollegeEmail, parseStudentEmail, isStudentEmail, isFacultyEmail } = require('../src/utils/emailParser');

test('Email Parser - Valid UG student email in October 2026', () => {
  // Reference date: October 14, 2026
  const refDate = new Date(2026, 9, 14); // month is 0-indexed (9 = October)
  const result = parseCollegeEmail('karthisans.ug.24.it@francisxavier.ac.in', refDate);

  assert.equal(result.valid, true);
  assert.equal(result.accountType, 'student');
  assert.equal(result.role, 'student');
  assert.equal(result.name, 'Karthisans');
  assert.equal(result.level, 'ug');
  assert.equal(result.admissionYear, 2024);
  assert.equal(result.yearOfStudy, 3);
  assert.equal(result.yearOfStudyRoman, 'III Year');
  assert.equal(result.departmentCode, 'it');
  assert.equal(result.departmentName, 'Information Technology');
  assert.equal(result.isAlumni, false);
  assert.equal(isStudentEmail('karthisans.ug.24.it@francisxavier.ac.in'), true);
  assert.equal(isFacultyEmail('karthisans.ug.24.it@francisxavier.ac.in'), false);
});

test('Email Parser - Valid PG student email in October 2026', () => {
  const refDate = new Date(2026, 9, 14);
  const result = parseCollegeEmail('priya.pg.25.cse@francisxavier.ac.in', refDate);

  assert.equal(result.valid, true);
  assert.equal(result.accountType, 'student');
  assert.equal(result.name, 'Priya');
  assert.equal(result.level, 'pg');
  assert.equal(result.admissionYear, 2025);
  assert.equal(result.yearOfStudy, 2);
  assert.equal(result.yearOfStudyRoman, 'II Year');
  assert.equal(result.departmentCode, 'cse');
  assert.equal(result.departmentName, 'Computer Science and Engineering');
});

test('Email Parser - Valid Faculty Email: davidayling@francisxavier.ac.in', () => {
  const result = parseCollegeEmail('davidayling@francisxavier.ac.in');
  assert.equal(result.valid, true);
  assert.equal(result.accountType, 'faculty');
  assert.equal(result.role, 'admin');
  assert.equal(result.name, 'Dr. David Ayling');
  assert.equal(result.level, null);
  assert.equal(result.yearOfStudy, null);
  assert.equal(isFacultyEmail('davidayling@francisxavier.ac.in'), true);
  assert.equal(isStudentEmail('davidayling@francisxavier.ac.in'), false);
});

test('Email Parser - Valid Faculty Email: ithod@francisxavier.ac.in', () => {
  const result = parseCollegeEmail('ithod@francisxavier.ac.in');
  assert.equal(result.valid, true);
  assert.equal(result.accountType, 'faculty');
  assert.equal(result.role, 'admin');
  assert.equal(result.name, 'HOD - Information Technology');
  assert.equal(result.departmentCode, 'it');
  assert.equal(result.departmentName, 'Information Technology');
  assert.equal(isFacultyEmail('ithod@francisxavier.ac.in'), true);
});

test('Email Parser - Valid Admin Email: admin@francisxavier.ac.in', () => {
  const result = parseCollegeEmail('admin@francisxavier.ac.in');
  assert.equal(result.valid, true);
  assert.equal(result.accountType, 'faculty');
  assert.equal(result.role, 'admin');
  assert.equal(result.name, 'FXEC Event Admin');
});

test('Email Parser - parseStudentEmail rejects faculty accounts from student signup', () => {
  const result = parseStudentEmail('davidayling@francisxavier.ac.in');
  assert.equal(result.valid, false);
  assert.equal(result.accountType, 'faculty');
  assert.match(result.error, /Faculty\/Admin/);
});

test('Email Parser - Rejects wrong domain (e.g. gmail.com)', () => {
  const result1 = parseCollegeEmail('karthisans.ug.24.it@gmail.com');
  assert.equal(result1.valid, false);
  assert.match(result1.error, /Only official @francisxavier\.ac\.in emails are accepted/);

  const result2 = parseCollegeEmail('davidayling@gmail.com');
  assert.equal(result2.valid, false);
  assert.match(result2.error, /Only official @francisxavier\.ac\.in emails are accepted/);
});

test('Email Parser - Rejects look-alike domain (notfrancisxavier.ac.in)', () => {
  const result = parseCollegeEmail('karthisans.ug.24.it@notfrancisxavier.ac.in');
  assert.equal(result.valid, false);
  assert.match(result.error, /Only official @francisxavier\.ac\.in emails are accepted/);
});

test('Email Parser - Rejects look-alike subdomain or suffix (francisxavier.ac.in.fake.com)', () => {
  const result = parseCollegeEmail('karthisans.ug.24.it@francisxavier.ac.in.fake.com');
  assert.equal(result.valid, false);
  assert.match(result.error, /Only official @francisxavier\.ac\.in emails are accepted/);
});

test('Email Parser - Rejects malformed student email with invalid year or tokens', () => {
  const result = parseCollegeEmail('karthisans.ug.twentyfour.it@francisxavier.ac.in');
  assert.equal(result.valid, false);
});

test('Email Parser - Rejects unknown department code for student', () => {
  const result = parseCollegeEmail('karthisans.ug.24.xyz@francisxavier.ac.in');
  assert.equal(result.valid, false);
  assert.match(result.error, /Unknown department code/);
});

test('Email Parser - Blocks UG Alumni (> 4 years of study)', () => {
  // In October 2026, admission year 2020 means 2026 - 2020 + 1 = 7 years (Alumni)
  const refDate = new Date(2026, 9, 14);
  const result = parseCollegeEmail('alumnus.ug.20.mech@francisxavier.ac.in', refDate);

  assert.equal(result.valid, false);
  assert.equal(result.isAlumni, true);
  assert.match(result.error, /Student is an alumnus/);
});

test('Email Parser - Blocks PG Alumni (> 2 years of study)', () => {
  // In October 2026, admission year 2023 for PG means 2026 - 2023 + 1 = 4 years (> 2 years)
  const refDate = new Date(2026, 9, 14);
  const result = parseCollegeEmail('pgsenior.pg.23.ece@francisxavier.ac.in', refDate);

  assert.equal(result.valid, false);
  assert.equal(result.isAlumni, true);
  assert.match(result.error, /Student is an alumnus/);
});

test('Email Parser - Handles pre-June academic boundary correctly', () => {
  // In April 2026 (month index 3), academic year is 2025.
  // For admission year 2024: 2025 - 2024 + 1 = 2 (II Year)
  const aprilDate = new Date(2026, 3, 15);
  const result = parseCollegeEmail('student.ug.24.civil@francisxavier.ac.in', aprilDate);

  assert.equal(result.valid, true);
  assert.equal(result.yearOfStudy, 2);
  assert.equal(result.yearOfStudyRoman, 'II Year');
});
