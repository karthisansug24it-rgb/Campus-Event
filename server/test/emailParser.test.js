const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCollegeEmail } = require('../src/utils/emailParser');

test('Email Parser - Valid UG student email in October 2026', () => {
  // Reference date: October 14, 2026
  const refDate = new Date(2026, 9, 14); // month is 0-indexed (9 = October)
  const result = parseCollegeEmail('karthisans.ug.24.it@francisxavier.ac.in', refDate);

  assert.equal(result.valid, true);
  assert.equal(result.name, 'Karthisans');
  assert.equal(result.level, 'ug');
  assert.equal(result.admissionYear, 2024);
  assert.equal(result.yearOfStudy, 3);
  assert.equal(result.yearOfStudyRoman, 'III Year');
  assert.equal(result.departmentCode, 'it');
  assert.equal(result.departmentName, 'Information Technology');
  assert.equal(result.isAlumni, false);
});

test('Email Parser - Valid PG student email in October 2026', () => {
  const refDate = new Date(2026, 9, 14);
  const result = parseCollegeEmail('priya.pg.25.cse@francisxavier.ac.in', refDate);

  assert.equal(result.valid, true);
  assert.equal(result.name, 'Priya');
  assert.equal(result.level, 'pg');
  assert.equal(result.admissionYear, 2025);
  assert.equal(result.yearOfStudy, 2);
  assert.equal(result.yearOfStudyRoman, 'II Year');
  assert.equal(result.departmentCode, 'cse');
  assert.equal(result.departmentName, 'Computer Science and Engineering');
});

test('Email Parser - Rejects wrong domain (e.g. gmail.com)', () => {
  const result = parseCollegeEmail('karthisans.ug.24.it@gmail.com');
  assert.equal(result.valid, false);
  assert.match(result.error, /Only official @francisxavier\.ac\.in emails are accepted/);
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

test('Email Parser - Rejects invalid pattern (missing level or year)', () => {
  const result1 = parseCollegeEmail('karthisans@francisxavier.ac.in');
  assert.equal(result1.valid, false);

  const result2 = parseCollegeEmail('karthisans.it@francisxavier.ac.in');
  assert.equal(result2.valid, false);

  const result3 = parseCollegeEmail('karthisans.ug.twentyfour.it@francisxavier.ac.in');
  assert.equal(result3.valid, false);
});

test('Email Parser - Rejects unknown department code', () => {
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
