const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCollegeEmail } = require('../src/utils/emailParser');

// Fixed test reference date: October 14, 2026
const TEST_DATE_OCT_2026 = new Date('2026-10-14T10:00:00Z');

// Reference date before June: May 15, 2026 (2025-2026 academic cycle)
const TEST_DATE_MAY_2026 = new Date('2026-05-15T10:00:00Z');

test('1. Valid UG student email parsing', () => {
  const result = parseCollegeEmail('karthisans.ug.24.it@francisxavier.ac.in', TEST_DATE_OCT_2026);
  assert.equal(result.valid, true);
  assert.equal(result.name, 'Karthisans');
  assert.equal(result.level, 'ug');
  assert.equal(result.admissionYear, 2024);
  assert.equal(result.academicStart, 2026);
  assert.equal(result.yearOfStudy, 3);
  assert.equal(result.yearLabel, 'III Year');
  assert.equal(result.departmentCode, 'it');
  assert.equal(result.departmentName, 'Information Technology');
});

test('2. Valid PG student email parsing', () => {
  const result = parseCollegeEmail('ramesh.pg.25.cse@francisxavier.ac.in', TEST_DATE_OCT_2026);
  assert.equal(result.valid, true);
  assert.equal(result.name, 'Ramesh');
  assert.equal(result.level, 'pg');
  assert.equal(result.admissionYear, 2025);
  assert.equal(result.yearOfStudy, 2);
  assert.equal(result.yearLabel, 'II Year');
  assert.equal(result.departmentCode, 'cse');
  assert.equal(result.departmentName, 'Computer Science and Engineering');
});

test('3. Rejection of look-alike domain (notfrancisxavier.ac.in)', () => {
  const result = parseCollegeEmail('karthisans.ug.24.it@notfrancisxavier.ac.in', TEST_DATE_OCT_2026);
  assert.equal(result.valid, false);
  assert.match(result.error, /domain must be exactly @francisxavier\.ac\.in/i);
});

test('4. Rejection of subdomain look-alike spoofing', () => {
  const result = parseCollegeEmail('karthisans.ug.24.it@francisxavier.ac.in.fakedomain.org', TEST_DATE_OCT_2026);
  assert.equal(result.valid, false);
});

test('5. Rejection of standard non-college email', () => {
  const result = parseCollegeEmail('student@gmail.com', TEST_DATE_OCT_2026);
  assert.equal(result.valid, false);
});

test('6. Rejection of wrong email pattern within correct domain', () => {
  const result = parseCollegeEmail('john.doe@francisxavier.ac.in', TEST_DATE_OCT_2026);
  assert.equal(result.valid, false);
  assert.match(result.error, /Invalid college email format/i);
});

test('7. Rejection of unknown department code', () => {
  const result = parseCollegeEmail('karthisans.ug.24.xyz@francisxavier.ac.in', TEST_DATE_OCT_2026);
  assert.equal(result.valid, false);
  assert.match(result.error, /Unknown department code 'xyz'/i);
});

test('8. Alumni detection for UG (exceeds 4 years)', () => {
  // Enrolled in 2020: in Oct 2026, yearOfStudy = 2026 - 2020 + 1 = 7 > 4
  const result = parseCollegeEmail('rajesh.ug.20.mech@francisxavier.ac.in', TEST_DATE_OCT_2026);
  assert.equal(result.valid, false);
  assert.equal(result.isAlumni, true);
  assert.match(result.error, /Alumni accounts are not eligible/i);
});

test('9. Alumni detection for PG (exceeds 2 years)', () => {
  // Enrolled in 2023: in Oct 2026, yearOfStudy = 2026 - 2023 + 1 = 4 > 2
  const result = parseCollegeEmail('anitha.pg.23.ece@francisxavier.ac.in', TEST_DATE_OCT_2026);
  assert.equal(result.valid, false);
  assert.equal(result.isAlumni, true);
  assert.match(result.error, /Alumni accounts are not eligible/i);
});

test('10. Academic year transition before June (May 2026)', () => {
  // In May 2026 (month 5 < 6), academicStart is 2025.
  // Student admitted in 2024 is in yearOfStudy: 2025 - 2024 + 1 = 2 (II Year).
  const result = parseCollegeEmail('karthisans.ug.24.it@francisxavier.ac.in', TEST_DATE_MAY_2026);
  assert.equal(result.valid, true);
  assert.equal(result.academicStart, 2025);
  assert.equal(result.yearOfStudy, 2);
  assert.equal(result.yearLabel, 'II Year');
});
