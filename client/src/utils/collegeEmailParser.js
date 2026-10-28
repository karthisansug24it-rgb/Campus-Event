/**
 * collegeEmailParser.js
 * Client-side parser for Francis Xavier Engineering College emails.
 * Supports both Student (with academic tokens) and Faculty/Admin (direct handles).
 * Enables instant offline preview, auto-fill, and validation without network latency.
 */

export const DEPARTMENT_MAP = {
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
export const STUDENT_EMAIL_REGEX = /^([a-z][a-z0-9]*)\.(ug|pg)\.(\d{2})\.([a-z]+)@francisxavier\.ac\.in$/i;

// Faculty / Admin pattern: direct handle without ug/pg academic tokens
export const FACULTY_HANDLE_REGEX = /^[a-z][a-z0-9._-]*$/i;

export const KNOWN_FACULTY = {
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

export function formatDisplayName(rawName) {
  if (!rawName) return '';
  return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
}

export function formatFacultyDisplayName(handle) {
  if (!handle) return 'Faculty';
  const lower = handle.toLowerCase();
  if (KNOWN_FACULTY[lower]?.name) {
    return KNOWN_FACULTY[lower].name;
  }

  if (handle.includes('.') || handle.includes('_') || handle.includes('-')) {
    return handle
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => formatDisplayName(part))
      .join(' ');
  }

  return formatDisplayName(handle);
}

export function deriveFacultyDepartment(handle) {
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

export function parseCollegeEmail(email, currentDate = new Date()) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }

  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  const domainPart = trimmed.slice(atIndex + 1);
  if (domainPart !== 'francisxavier.ac.in') {
    return { valid: false, error: 'Only official @francisxavier.ac.in emails are accepted' };
  }

  const localPart = trimmed.slice(0, atIndex);

  // 1. Student Email Format
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
    const departmentName = DEPARTMENT_MAP[deptCode.toLowerCase()];
    if (!departmentName) {
      return {
        valid: false,
        accountType: 'student',
        error: `Unknown department code: "${deptCode}". Valid codes are: ${Object.keys(DEPARTMENT_MAP).join(', ')}`
      };
    }

    const yy = parseInt(yyStr, 10);
    const admissionYear = 2000 + yy;
    const refMonth = currentDate.getMonth() + 1;
    const refYear = currentDate.getFullYear();
    const academicStartYear = refMonth >= 6 ? refYear : refYear - 1;
    const yearOfStudy = Math.max(1, academicStartYear - admissionYear + 1);

    const maxYears = level.toLowerCase() === 'ug' ? 4 : 2;
    const isAlumni = yearOfStudy > maxYears;

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
      isAlumni
    };
  }

  // 2. Faculty / Admin Email Format
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
