/**
 * emailParser.js
 * Utility to strictly parse and validate Francis Xavier Engineering College emails.
 *
 * 1. Student Email Pattern:
 *    <name>.<level>.<yy>.<dept>@francisxavier.ac.in
 *    Example: karthisans.ug.24.it@francisxavier.ac.in
 *    - Has academic level ('ug' | 'pg'), 2-digit admission year ('24'), and department code ('it').
 *
 * 2. Faculty / Administrative Email Pattern:
 *    <handle>@francisxavier.ac.in
 *    Examples: davidayling@francisxavier.ac.in, ithod@francisxavier.ac.in, admin@francisxavier.ac.in
 *    - Direct name or role handle with NO 'ug', 'pg', admission year, or department tokens.
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

// Student pattern: <name>.<ug|pg>.<yy>.<dept>@francisxavier.ac.in
const STUDENT_EMAIL_REGEX = /^([a-z][a-z0-9]*)\.(ug|pg)\.(\d{2})\.([a-z]+)@francisxavier\.ac\.in$/i;

// Faculty / Admin pattern: direct handle without ug/pg academic tokens
const FACULTY_HANDLE_REGEX = /^[a-z][a-z0-9._-]*$/i;

const KNOWN_FACULTY = {
  davidayling: { name: 'Dr. David Ayling', departmentCode: 'cse' },
  ithod: { name: 'HOD - Information Technology', departmentCode: 'it' },
  it_hod: { name: 'HOD - Information Technology', departmentCode: 'it' },
  csehod: { name: 'HOD - Computer Science', departmentCode: 'cse' },
  cse_hod: { name: 'HOD - Computer Science', departmentCode: 'cse' },
  ecehod: { name: 'HOD - Electronics & Communication', departmentCode: 'ece' },
  eeehod: { name: 'HOD - Electrical & Electronics', departmentCode: 'eee' },
  mechhod: { name: 'HOD - Mechanical Engineering', departmentCode: 'mech' },
  civilhod: { name: 'HOD - Civil Engineering', departmentCode: 'civil' },
  admin: { name: 'FXEC Event Admin', departmentCode: 'it' },
  principal: { name: 'Principal - FXEC', departmentCode: null }
};

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
 * Formats a faculty handle into a readable name.
 * e.g. "davidayling" -> "Dr. David Ayling" or "David Ayling"
 * e.g. "david.ayling" -> "David Ayling"
 * @param {string} handle 
 * @returns {string}
 */
function formatFacultyDisplayName(handle) {
  if (!handle) return 'Faculty';
  const lower = handle.toLowerCase();
  if (KNOWN_FACULTY[lower]?.name) {
    return KNOWN_FACULTY[lower].name;
  }

  // If dotted, underscored, or hyphenated: "david.ayling" -> "David Ayling"
  if (handle.includes('.') || handle.includes('_') || handle.includes('-')) {
    return handle
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => formatDisplayName(part))
      .join(' ');
  }

  // Title case the handle: "davidayling" -> "Davidayling"
  return formatDisplayName(handle);
}

/**
 * Derives faculty department if available from handle
 */
function deriveFacultyDepartment(handle) {
  const lower = handle.toLowerCase();
  if (KNOWN_FACULTY[lower]?.departmentCode) {
    return KNOWN_FACULTY[lower].departmentCode;
  }
  for (const dept of Object.keys(DEPARTMENT_MAP)) {
    if (lower.startsWith(dept) || lower.endsWith(dept) || lower.includes(`${dept}hod`)) {
      return dept;
    }
  }
  return null;
}

/**
 * Checks whether an email is a student email
 */
function isStudentEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return STUDENT_EMAIL_REGEX.test(email.trim());
}

/**
 * Checks whether an email is a faculty/admin email
 */
function isFacultyEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2 || parts[1] !== 'francisxavier.ac.in') return false;
  const handle = parts[0];
  if (/\.(ug|pg)\.\d{2}\.[a-z]+$/i.test(handle)) return false;
  return FACULTY_HANDLE_REGEX.test(handle);
}

/**
 * Strict parser for Francis Xavier Engineering College emails.
 * Supports both Student (with academic tokens) and Faculty/Admin (direct handles).
 * 
 * @param {string} email - The email string to parse.
 * @param {Date} [currentDate=new Date()] - Reference date for academic year calculation.
 * @returns {{
 *   valid: boolean,
 *   accountType?: 'student' | 'faculty',
 *   role?: 'student' | 'admin',
 *   error?: string,
 *   name?: string,
 *   email?: string,
 *   level?: 'ug' | 'pg' | null,
 *   admissionYear?: number | null,
 *   yearOfStudy?: number | null,
 *   yearOfStudyRoman?: string | null,
 *   departmentCode?: string | null,
 *   departmentName?: string | null,
 *   isAlumni?: boolean
 * }}
 */
function parseCollegeEmail(email, currentDate = new Date()) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  const trimmed = email.trim().toLowerCase();

  // Strict domain check
  const domainPart = trimmed.split('@')[1];
  if (domainPart !== 'francisxavier.ac.in') {
    return { valid: false, error: 'Only official @francisxavier.ac.in emails are accepted' };
  }

  const localPart = trimmed.split('@')[0];

  // 1. Check if email matches Student format (contains .ug. or .pg. or starts with ug./pg.)
  const hasAcademicToken = /\.(ug|pg)\./i.test(localPart) || /^(ug|pg)\./i.test(localPart);

  if (hasAcademicToken) {
    const match = trimmed.match(STUDENT_EMAIL_REGEX);
    if (!match) {
      return {
        valid: false,
        accountType: 'student',
        error: 'Invalid student email format. Expected: <name>.<ug|pg>.<yy>.<dept>@francisxavier.ac.in'
      };
    }

    const [, rawName, level, yyStr, deptCode] = match;

    // Validate department code
    const departmentName = DEPARTMENT_MAP[deptCode.toLowerCase()];
    if (!departmentName) {
      return {
        valid: false,
        accountType: 'student',
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
        accountType: 'student',
        error: `Invalid admission year: Year 20${yyStr} cannot be after the current academic start year (${academicStartYear})`
      };
    }

    const maxYears = level.toLowerCase() === 'ug' ? 4 : 2;
    if (yearOfStudy > maxYears) {
      return {
        valid: false,
        accountType: 'student',
        isAlumni: true,
        error: `Registration blocked: Student is an alumnus (Year of study ${yearOfStudy} exceeds maximum ${maxYears} years for ${level.toUpperCase()})`
      };
    }

    const romanYears = { 1: 'I Year', 2: 'II Year', 3: 'III Year', 4: 'IV Year' };

    return {
      valid: true,
      accountType: 'student',
      role: 'student',
      name: formatDisplayName(rawName),
      email: trimmed,
      level: level.toLowerCase(),
      admissionYear,
      yearOfStudy,
      yearOfStudyRoman: romanYears[yearOfStudy] || `${yearOfStudy}th Year`,
      departmentCode: deptCode.toLowerCase(),
      departmentName,
      isAlumni: false
    };
  }

  // 2. Faculty / Administrative Account Format:
  // Direct handle without academic tokens (e.g. davidayling@francisxavier.ac.in, ithod@francisxavier.ac.in)
  if (!FACULTY_HANDLE_REGEX.test(localPart)) {
    return {
      valid: false,
      error: 'Invalid institutional email address format.'
    };
  }

  const deptCode = deriveFacultyDepartment(localPart);
  const deptName = deptCode ? DEPARTMENT_MAP[deptCode] : null;

  return {
    valid: true,
    accountType: 'faculty',
    role: 'admin',
    name: formatFacultyDisplayName(localPart),
    email: trimmed,
    level: null,
    admissionYear: null,
    yearOfStudy: null,
    yearOfStudyRoman: null,
    departmentCode: deptCode,
    departmentName: deptName,
    isAlumni: false
  };
}

/**
 * Strict parser specifically for student operations (e.g. student signup, event registration)
 */
function parseStudentEmail(email, currentDate = new Date()) {
  const res = parseCollegeEmail(email, currentDate);
  if (!res.valid) return res;
  if (res.accountType !== 'student') {
    return {
      valid: false,
      accountType: 'faculty',
      error: 'This is a Faculty/Admin email. Student accounts must follow: <name>.<ug|pg>.<yy>.<dept>@francisxavier.ac.in'
    };
  }
  return res;
}

module.exports = {
  DEPARTMENT_MAP,
  EMAIL_REGEX: STUDENT_EMAIL_REGEX,
  STUDENT_EMAIL_REGEX,
  FACULTY_HANDLE_REGEX,
  KNOWN_FACULTY,
  parseCollegeEmail,
  parseStudentEmail,
  formatDisplayName,
  formatFacultyDisplayName,
  isStudentEmail,
  isFacultyEmail
};
