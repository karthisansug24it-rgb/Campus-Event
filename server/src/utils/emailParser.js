/**
 * Email Parser & Validation Utility for Francis Xavier Engineering College (FXEC)
 * Format: <name>.<level>.<yy>.<dept>@francisxavier.ac.in
 * Example: karthisans.ug.24.it@francisxavier.ac.in
 */

const DEPARTMENT_MAP = {
  it: 'Information Technology',
  cse: 'Computer Science and Engineering',
  ece: 'Electronics and Communication Engineering',
  eee: 'Electrical and Electronics Engineering',
  mech: 'Mechanical Engineering',
  civil: 'Civil Engineering',
  aids: 'Artificial Intelligence and Data Science',
  bme: 'Biomedical Engineering'
};

// Strict email regex matching exact domain @francisxavier.ac.in
const FXEC_EMAIL_REGEX = /^([a-z][a-z0-9]*)\.(ug|pg)\.(\d{2})\.([a-z]+)@francisxavier\.ac\.in$/i;

// Register number regex: alphanumeric, 8-15 characters
const REGISTER_NUMBER_REGEX = /^[A-Za-z0-9]{8,15}$/;

// Allowed student section values
const VALID_SECTIONS = ['A', 'B', 'C', 'D'];

const ROMAN_YEARS = {
  1: 'I Year',
  2: 'II Year',
  3: 'III Year',
  4: 'IV Year'
};

/**
 * Parses and validates an FXEC student email address.
 *
 * @param {string} email - The college email to parse
 * @param {Date|string|null} referenceDate - Optional override for date testing (defaults to now)
 * @param {Object} customDepartmentMap - Optional department dictionary override
 * @returns {Object} {
 *   valid: boolean,
 *   error?: string,
 *   isAlumni?: boolean,
 *   name?: string,
 *   level?: 'ug'|'pg',
 *   admissionYear?: number,
 *   academicStart?: number,
 *   yearOfStudy?: number,
 *   yearLabel?: string,
 *   departmentCode?: string,
 *   departmentName?: string
 * }
 */
function parseCollegeEmail(email, referenceDate = null, customDepartmentMap = DEPARTMENT_MAP) {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email address is required.'
    };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Guard against look-alike domains or missing parts
  const atParts = cleanEmail.split('@');
  if (atParts.length !== 2 || atParts[1] !== 'francisxavier.ac.in') {
    return {
      valid: false,
      error: 'Email domain must be exactly @francisxavier.ac.in (look-alike domains are not permitted).'
    };
  }

  const match = cleanEmail.match(FXEC_EMAIL_REGEX);
  if (!match) {
    return {
      valid: false,
      error: 'Invalid college email format. Expected format: <name>.<level>.<yy>.<dept>@francisxavier.ac.in (e.g. karthisans.ug.24.it@francisxavier.ac.in)'
    };
  }

  const [, rawName, rawLevel, rawYy, rawDept] = match;

  // 1. Name: Capitalize first letter (e.g. "karthisans" -> "Karthisans")
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  // 2. Level: 'ug' or 'pg'
  const level = rawLevel.toLowerCase();

  // 3. Admission Year: e.g. '24' -> 2024
  const admissionYear = 2000 + parseInt(rawYy, 10);

  // 4. Department validation
  const departmentCode = rawDept.toLowerCase();
  const departmentName = customDepartmentMap[departmentCode];

  if (!departmentName) {
    return {
      valid: false,
      error: `Unknown department code '${departmentCode}'. Valid codes: ${Object.keys(customDepartmentMap).join(', ')}`
    };
  }

  // 5. Dynamic Year of Study calculation
  // Academic year starts in June (month 6 in 1-12 range)
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const academicStart = currentMonth >= 6 ? currentYear : currentYear - 1;
  const yearOfStudy = academicStart - admissionYear + 1;

  if (yearOfStudy < 1) {
    return {
      valid: false,
      error: `Invalid admission year (${admissionYear}). The academic session has not begun yet.`
    };
  }

  // 6. Alumni check: UG max 4 years, PG max 2 years
  const maxYears = level === 'ug' ? 4 : 2;
  if (yearOfStudy > maxYears) {
    return {
      valid: false,
      isAlumni: true,
      error: `Alumni accounts are not eligible for active student event registration (${level.toUpperCase()} max study duration is ${maxYears} years).`
    };
  }

  return {
    valid: true,
    email: cleanEmail,
    name: displayName,
    level,
    admissionYear,
    academicStart,
    yearOfStudy,
    yearLabel: ROMAN_YEARS[yearOfStudy] || `Year ${yearOfStudy}`,
    departmentCode,
    departmentName
  };
}

module.exports = {
  parseCollegeEmail,
  DEPARTMENT_MAP,
  FXEC_EMAIL_REGEX,
  REGISTER_NUMBER_REGEX,
  VALID_SECTIONS,
  ROMAN_YEARS
};
