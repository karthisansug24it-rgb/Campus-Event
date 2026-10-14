/**
 * emailParser.js
 * Utility to strictly parse and validate Francis Xavier Engineering College student emails.
 *
 * Pattern: <name>.<level>.<yy>.<dept>@francisxavier.ac.in
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

const EMAIL_REGEX = /^([a-z][a-z0-9]*)\.(ug|pg)\.(\d{2})\.([a-z]+)@francisxavier\.ac\.in$/i;

/**
 * Capitalizes a raw username string into a clean display name.
 * e.g. "karthisans" -> "Karthisans"
 * @param {string} rawName 
 * @returns {string}
 */
function formatDisplayName(rawName) {
  if (!rawName) return '';
  return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
}

/**
 * Strict parser for Francis Xavier Engineering College emails.
 * 
 * @param {string} email - The email string to parse.
 * @param {Date} [currentDate=new Date()] - Reference date for academic year calculation.
 * @returns {{
 *   valid: boolean,
 *   error?: string,
 *   name?: string,
 *   level?: 'ug' | 'pg',
 *   admissionYear?: number,
 *   yearOfStudy?: number,
 *   yearOfStudyRoman?: string,
 *   departmentCode?: string,
 *   departmentName?: string,
 *   isAlumni?: boolean
 * }}
 */
function parseCollegeEmail(email, currentDate = new Date()) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  const trimmed = email.trim().toLowerCase();

  // Strict check on the exact domain before regex to prevent any subtle bypasses
  const domainPart = trimmed.split('@')[1];
  if (domainPart !== 'francisxavier.ac.in') {
    return { valid: false, error: 'Only official @francisxavier.ac.in emails are accepted' };
  }

  const match = trimmed.match(EMAIL_REGEX);
  if (!match) {
    return {
      valid: false,
      error: 'Invalid college email format. Expected: <name>.<ug|pg>.<yy>.<dept>@francisxavier.ac.in'
    };
  }

  const [, rawName, level, yyStr, deptCode] = match;

  // Validate department code
  const departmentName = DEPARTMENT_MAP[deptCode];
  if (!departmentName) {
    return {
      valid: false,
      error: `Unknown department code: "${deptCode}". Valid codes are: ${Object.keys(DEPARTMENT_MAP).join(', ')}`
    };
  }

  // Calculate admission year (assuming 2000s)
  const yy = parseInt(yyStr, 10);
  const admissionYear = 2000 + yy;

  // Academic year starts in June (month 6, where month is 1-12)
  const refMonth = currentDate.getMonth() + 1; // 1-12
  const refYear = currentDate.getFullYear();
  const academicStartYear = refMonth >= 6 ? refYear : refYear - 1;

  // Year of study calculation
  const yearOfStudy = academicStartYear - admissionYear + 1;

  if (yearOfStudy < 1) {
    return {
      valid: false,
      error: `Invalid admission year: Year 20${yyStr} cannot be after the current academic start year (${academicStartYear})`
    };
  }

  const maxYears = level === 'ug' ? 4 : 2;
  if (yearOfStudy > maxYears) {
    return {
      valid: false,
      isAlumni: true,
      error: `Registration blocked: Student is an alumnus (Year of study ${yearOfStudy} exceeds maximum ${maxYears} years for ${level.toUpperCase()})`
    };
  }

  const romanYears = { 1: 'I Year', 2: 'II Year', 3: 'III Year', 4: 'IV Year' };

  return {
    valid: true,
    name: formatDisplayName(rawName),
    level: level.toLowerCase(),
    admissionYear,
    yearOfStudy,
    yearOfStudyRoman: romanYears[yearOfStudy] || `${yearOfStudy}th Year`,
    departmentCode: deptCode.toLowerCase(),
    departmentName,
    isAlumni: false
  };
}

module.exports = {
  DEPARTMENT_MAP,
  EMAIL_REGEX,
  parseCollegeEmail,
  formatDisplayName
};
