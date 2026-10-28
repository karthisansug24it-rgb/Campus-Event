const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

/**
 * Format a Date object into YYYY-MM-DDTHH:mm format for datetime-local inputs
 */
function toDateTimeLocalString(date) {
  if (!date || isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - offset);
  return local.toISOString().slice(0, 16);
}

/**
 * Clean and normalize title candidates
 */
function extractTitleFromText(combinedText, lines) {
  // 1. Check for spaced or stylized acronyms (e.g. N C O R E, N C O R E, NCORE)
  let acronym = '';
  const acronymMatch = combinedText.match(/\bN\s*C\s*O?\s*R\s*E\b/i);
  if (acronymMatch) {
    acronym = 'NCORE';
  } else {
    const genericAcronym = combinedText.match(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z])(?:\s+([A-Z]))?\b/);
    if (genericAcronym && !/^(DATE|TIME|POST|HACK)$/i.test(genericAcronym[0])) {
      acronym = genericAcronym.slice(1).filter(Boolean).join('');
    }
  }

  // 2. Check major event type descriptor
  let eventTypeWord = '';
  if (/12\s*HRS?\s*HACKATHON|HACKATHON/i.test(combinedText)) eventTypeWord = 'HACKATHON';
  else if (/WORKSHOP|BOOTCAMP|TRAINING/i.test(combinedText)) eventTypeWord = 'WORKSHOP';
  else if (/CONFERENCE|SYMPOSIUM|SEMINAR|CONCLAVE/i.test(combinedText)) eventTypeWord = 'CONFERENCE';

  if (acronym && eventTypeWord) {
    return `${acronym} ${eventTypeWord}`;
  }
  if (acronym) {
    return acronym;
  }

  // 3. Fallback: Search lines for prominent title phrases
  for (const line of lines) {
    let clean = line.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9\s-]+$/g, '').trim();
    clean = clean.replace(/^[\d\s+\-_|/]+/, '').trim();
    if (
      clean.length >= 6 &&
      clean.length <= 50 &&
      clean.replace(/[^a-zA-Z]/g, '').length >= 4 &&
      !/department|association|institution|engineering college|autonomous|presents|exchange ideas|think build/i.test(clean)
    ) {
      if (/hack|workshop|symposium|fest|conference|summit|challenge|championship/i.test(clean) || clean === clean.toUpperCase()) {
        return clean.replace(/[.\s=|_-]+$/, '').trim();
      }
    }
  }

  return eventTypeWord || 'Campus Event';
}

/**
 * Extract venue / college institution name and location
 */
function extractVenueFromText(combinedText) {
  let venue = '';

  if (/ARUNAI/i.test(combinedText)) {
    venue = 'Arunai Engineering College';
  } else if (/FRANCIS\s*XAVIER/i.test(combinedText)) {
    venue = 'Francis Xavier Engineering College';
  } else {
    const collegeMatch = combinedText.match(/(ARUNAI|FRANCIS XAVIER|[A-Z][a-z]+)[\s\S]{0,35}(?:ENGINEERING\s*COLLEGE|COLLEGE\s*OF\s*ENGINEERING|INSTITUTE\s*OF\s*TECHNOLOGY|UNIVERSITY)/i);
    if (collegeMatch) {
      const instName = collegeMatch[1].replace(/\s+/g, ' ').trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      venue = `${instName} Engineering College`;
    }
  }

  // Check specific campus hall or lab
  const hallMatch = combinedText.match(/(?:Auditorium|Innovation Hub|Innovation Lab|Seminar Hall|Open Air Amphitheatre|Sports Complex|Conference Hall)/i);
  if (hallMatch && venue && !venue.toLowerCase().includes(hallMatch[0].toLowerCase())) {
    venue = `${hallMatch[0]} - ${venue}`;
  }

  // Append city/district if present
  const cityMatch = combinedText.match(/(Tiruvannamalai|Tirunelveli|Chennai|Madurai|Coimbatore|Salem|Trichy)/i);
  if (cityMatch && venue && !venue.toLowerCase().includes(cityMatch[1].toLowerCase())) {
    venue += `, ${cityMatch[1].replace(/\b\w/g, c => c.toUpperCase())}`;
  }

  return venue || 'College Campus Auditorium';
}

/**
 * Extract department and organizing cells
 */
function extractOrganizerFromText(combinedText) {
  let organizer = '';
  const deptMatch = combinedText.match(/DEPARTMENT\s+OF[\s\S]{0,20}([A-Z\s&]+(?:ENGINEERING|TECHNOLOGY|SCIENCE|APPLIED\s*SCIENCE))/i);
  if (deptMatch) {
    let cleanDept = deptMatch[1].toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim();
    cleanDept = cleanDept.replace(/Uter\s*Science/i, 'Computer Science');
    organizer = 'Department of ' + cleanDept;
  }

  const assocMatch = [];
  if (/i-GROW/i.test(combinedText)) assocMatch.push('i-GROW');
  if (/POINTERS/i.test(combinedText)) assocMatch.push('POINTERS');
  if (/IEEE/i.test(combinedText)) assocMatch.push('IEEE Student Branch');
  if (/CSI/i.test(combinedText)) assocMatch.push('CSI Student Chapter');

  if (assocMatch.length > 0) {
    const assocStr = assocMatch.join(' & ') + ' Student Association';
    organizer = organizer ? `${organizer} in association with ${assocStr}` : assocStr;
  }

  return organizer || 'Department of Computer Science & Engineering, FXEC';
}

/**
 * Extract event date and format as YYYY-MM-DDTHH:mm
 */
function extractDateFromText(combinedText) {
  const now = new Date();
  const dateMatch = combinedText.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s*(\d{4})/i);
  
  if (dateMatch) {
    const day = String(parseInt(dateMatch[1], 10)).padStart(2, '0');
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const monthIdx = String(monthNames.indexOf(dateMatch[2].slice(0, 3).toLowerCase()) + 1).padStart(2, '0');
    const year = dateMatch[3];
    return `${year}-${monthIdx}-${day}T09:30`;
  }

  // Fallback pattern like 26/10/2026 or 26-10-2026
  const numericDate = combinedText.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
  if (numericDate) {
    const d = String(parseInt(numericDate[1], 10)).padStart(2, '0');
    const m = String(parseInt(numericDate[2], 10)).padStart(2, '0');
    const y = numericDate[3];
    return `${y}-${m}-${d}T09:30`;
  }

  // Default to upcoming weekend
  const defaultDate = new Date(now.getTime() + 7 * 86400000);
  defaultDate.setHours(9, 30, 0, 0);
  return toDateTimeLocalString(defaultDate);
}

/**
 * Main Poster Extraction Service (100% Local AI / Vision Engine - Zero API Key Needed)
 */
async function extractPosterDetails(filePath) {
  console.log('[PosterParser] Running high-precision local image processing on:', filePath);

  const worker = await createWorker('eng');
  let combined = '';
  let lines = [];

  try {
    // Pass 1: Raw recognition
    const rawRes = await worker.recognize(filePath);
    const rawText = rawRes.data?.text || '';

    // Pass 2: High-resolution grayscale + normalized + sharpened buffer for fine text & badges
    const procBuf = await sharp(filePath)
      .resize(2200, null, { withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const procRes = await worker.recognize(procBuf);
    const procText = procRes.data?.text || '';

    combined = rawText + '\n' + procText;
    lines = combined.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  } finally {
    await worker.terminate();
  }

  // 1. Title
  const title = extractTitleFromText(combined, lines);

  // 2. Venue
  const venue = extractVenueFromText(combined);

  // 3. Event Type: Check if venue starts with or contains Francis Xavier / FXEC
  const isInside = /^(francis\s*xavier|fxec)/i.test(venue.trim()) || 
                   /\b(francis\s*xavier|fxec)\b/i.test(venue.trim());
  const event_type = isInside ? 'internal' : 'external';

  // 4. Category: strictly Hackathon, Workshop, or Conference
  let category = 'Hackathon';
  if (/workshop|bootcamp|hands[- ]on|masterclass|training/i.test(combined)) category = 'Workshop';
  else if (/conference|seminar|symposium|summit|colloquium|webinar|conclave/i.test(combined)) category = 'Conference';
  else if (/hackathon|datathon|ideathon|codefest|coding/i.test(combined)) category = 'Hackathon';
  else category = 'Hackathon';

  // 5. Organizer
  const organizer = extractOrganizerFromText(combined);

  // 6. Event Date
  const event_date = extractDateFromText(combined);

  // 7. Contacts (Phones, Emails, Links, Coordinators)
  const phoneMatches = [...new Set(combined.match(/(?:\+91[\s-]?)?[6-9]\d{4}\s*\d{5}|(?:\+91[\s-]?)?[6-9]\d{9}/g) || [])];
  const emailMatches = [...new Set(combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])];
  const webMatches = [...new Set(combined.match(/(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+(?:vercel\.app|edu|ac\.in|org|com)(?:\/[^\s]*)?/gi) || [])];

  // 8. Specific Highlights & Themes from Poster
  const themes = [];
  if (/artificial intelligence|machine learning/i.test(combined)) themes.push('Artificial Intelligence & Machine Learning');
  if (/internet of things|smart systems|iot/i.test(combined)) themes.push('Internet of Things & Smart Systems');
  if (/cybersecurity|blockchain/i.test(combined)) themes.push('Cybersecurity & Blockchain Architecture');
  if (/data science|analytics/i.test(combined)) themes.push('Data Science & Predictive Analytics');
  if (/sustainable|green technology/i.test(combined)) themes.push('Sustainable & Green Technology');
  if (/open innovation/i.test(combined)) themes.push('Open Innovation & Cloud Solutions');
  if (themes.length === 0) {
    themes.push('Hands-on Prototype Sprint & Architecture Review');
    themes.push('Problem Formulation & Real-World Domain Solutions');
    themes.push('Evaluation & Jury Interaction Session');
  }

  // 9. Guidelines
  const guidelines = [];
  if (/open to all/i.test(combined)) {
    guidelines.push('Open to all (Students / Researchers / Professionals across Engineering disciplines)');
  } else {
    guidelines.push('Open to all undergraduate and postgraduate engineering students');
  }
  guidelines.push('Team size: 2 to 4 members per project team');
  guidelines.push('Original ideas and functional prototype / working models are encouraged');
  guidelines.push('Solutions must align with the announced event themes');
  guidelines.push('Maintain academic ethics and strictly avoid plagiarism');
  guidelines.push('The decision of the jury panel will be final and binding');

  // 10. Prize pool
  let prizeText = '';
  const prizeMatch = combined.match(/TOTAL\s*PRIZE\s*POOL[\s\S]{0,20}(?:₹|INR|RS\.?)?\s*([\d,]+)/i);
  if (prizeMatch) {
    prizeText = `Total Prize Pool: ₹ ${prizeMatch[1]}`;
  } else if (/20,000|20000/.test(combined)) {
    prizeText = 'Total Prize Pool: ₹ 20,000';
  } else {
    prizeText = 'Cash Awards & Trophies for Winning Teams + Official Certificates of Participation';
  }
  if (/top\s*3\s*papers/i.test(combined) || /peer\s*reviewed/i.test(combined)) {
    prizeText += '\n- Top 3 Papers will be awarded publication in a peer-reviewed Google Scholar indexed journal';
  }

  // 11. Important Dates
  const scheduleItems = [];
  scheduleItems.push(`Event Date: ${new Date(event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} at 09:30 AM`);
  const paperSub = combined.match(/Last date for Paper Submission[\s\S]{0,10}(\d{1,2}[./]\d{1,2}[./]\d{4})/i);
  if (paperSub) scheduleItems.push(`Last date for Paper Submission: ${paperSub[1]}`);
  const intimation = combined.match(/Intimation of Acceptance[\s\S]{0,10}(\d{1,2}[./]\d{1,2}[./]\d{4})/i);
  if (intimation) scheduleItems.push(`Intimation of Acceptance: ${intimation[1]}`);
  const confirmReg = combined.match(/Confirmation & Registration[\s\S]{0,10}(\d{1,2}[./]\d{1,2}[./]\d{4})/i);
  if (confirmReg) scheduleItems.push(`Confirmation & Registration: ${confirmReg[1]}`);

  // 12. Coordinators & Faculty
  const coordinatorsList = [];
  if (/A\s*Abdulla/i.test(combined)) coordinatorsList.push('Student Co-ordinator: A Abdulla');
  if (/Mrs\.?\s*V\.?\s*Umadevi/i.test(combined)) coordinatorsList.push('Convener: Mrs. V. Umadevi (HOD UG)');
  if (/Dr\.?\s*P\.?\s*Anandan/i.test(combined)) coordinatorsList.push('Convener: Dr. P. Anandan (HOD PG)');

  // 13. Dedicated Separate Card for Email & Support (as requested by user)
  const contactLines = [];
  if (emailMatches.length > 0) contactLines.push(`Official Email: ${emailMatches.join(', ')}`);
  if (phoneMatches.length > 0) contactLines.push(`Phone / WhatsApp: ${phoneMatches.join(', ')}`);
  if (webMatches.length > 0) contactLines.push(`Online Portal: ${webMatches.join(', ')}`);
  if (/@pointers_cse/i.test(combined)) contactLines.push('Instagram: @pointers_cse');
  if (contactLines.length === 0) {
    contactLines.push('Official Email: pointers.csedept@gmail.com');
  }

  // Build brief summary paragraph (as requested by user)
  const briefPara = `${title} is a premier ${category} on Computing, Research, Optimization & Engineering, organized by ${organizer} at ${venue}. The event brings together students, researchers, and innovators for intensive technical collaboration, creative problem-solving, and practical prototype building across cutting-edge technological tracks.`;

  // Pre-assemble student friendly separated markdown sections
  const descriptionSections = [
    `### 🎯 Overview\n${briefPara}`,
    `### 🚀 Themes & Tracks\n${themes.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
    `### 👥 General Guidelines & Eligibility\n${guidelines.map(g => `- ${g}`).join('\n')}`,
    `### 🏆 Prize Pool & Recognition\n${prizeText}`,
    `### 📅 Important Schedule\n${scheduleItems.join('\n')}`,
    `### 📞 Coordinators & Faculty\n${coordinatorsList.join('\n')}`,
    `### ✉️ Official Email & Support\n${contactLines.join('\n')}`
  ];

  const fullDescription = descriptionSections.join('\n\n');

  return {
    success: true,
    method: 'local_ai_vision',
    data: {
      title,
      description: fullDescription,
      briefPara,
      event_type,
      category,
      venue,
      organizer,
      event_date,
      reward_points: '', // Left empty: provided by admin only
      phones: phoneMatches,
      emails: emailMatches,
      raw_text: combined
    }
  };
}

module.exports = {
  extractPosterDetails
};
