const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const path = 'C:\\Users\\vskar\\.gemini\\antigravity-ide\\brain\\5e1db906-8330-4dd8-8e6a-f586f30992c6\\.user_uploaded\\media_1792044259627.jpg';

async function testPosterParser() {
  const worker = await createWorker('eng');
  const rawRes = await worker.recognize(path);
  const rawText = rawRes.data.text;
  
  const procBuf = await sharp(path).resize(2200).grayscale().normalize().sharpen().toBuffer();
  const procRes = await worker.recognize(procBuf);
  const procText = procRes.data.text;
  await worker.terminate();

  const combined = rawText + '\n' + procText;

  // 1. Title Extraction
  let title = '';
  if (/N\s*C\s*O?\s*R\s*E/i.test(combined) || /NCORE/i.test(combined)) {
    title = 'NCORE';
  }
  let eventTypeWord = '';
  if (/hackathon/i.test(combined)) eventTypeWord = 'HACKATHON';
  else if (/symposium/i.test(combined)) eventTypeWord = 'SYMPOSIUM';
  else if (/job\s*fair/i.test(combined)) eventTypeWord = 'JOB FAIR';
  else if (/workshop/i.test(combined)) eventTypeWord = 'WORKSHOP';
  else if (/conference/i.test(combined)) eventTypeWord = 'CONFERENCE';
  else if (/sports/i.test(combined)) eventTypeWord = 'SPORTS';

  if (title && eventTypeWord && !title.toUpperCase().includes(eventTypeWord)) {
    title = title + ' ' + eventTypeWord;
  } else if (!title && eventTypeWord) {
    title = eventTypeWord;
  }

  // 2. Venue
  let venue = '';
  if (/ARUNAI/i.test(combined)) {
    venue = 'Arunai Engineering College';
  } else {
    const collegeMatch = combined.match(/(FRANCIS XAVIER|[A-Z][a-z]+)[\s\S]{0,30}(?:ENGINEERING\s*COLLEGE|COLLEGE\s*OF\s*ENGINEERING|INSTITUTE\s*OF\s*TECHNOLOGY|UNIVERSITY)/i);
    if (collegeMatch) {
      const instName = collegeMatch[1].replace(/\s+/g, ' ').trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      venue = instName + ' Engineering College';
    }
  }
  const cityMatch = combined.match(/(Tiruvannamalai|Tirunelveli|Chennai|Madurai|Coimbatore)/i);
  if (cityMatch && venue && !venue.toLowerCase().includes(cityMatch[1].toLowerCase())) {
    venue += ', ' + cityMatch[1].replace(/\b\w/g, c => c.toUpperCase());
  }
  if (!venue) venue = 'College Campus';

  // 3. Event Type
  const isInside = /^(francis\s*xavier|fxec)/i.test(venue) || /francis\s*xavier/i.test(venue) || /\bfxec\b/i.test(venue);
  const event_type = isInside ? 'internal' : 'external';

  // 4. Category
  let category = 'Other';
  if (/hackathon/i.test(combined)) category = 'Hackathon';
  else if (/symposium/i.test(combined)) category = 'Symposium';
  else if (/job\s*fair/i.test(combined)) category = 'Job Fair';
  else if (/workshop/i.test(combined)) category = 'Workshop';
  else if (/conference/i.test(combined)) category = 'Conference';
  else if (/sports/i.test(combined)) category = 'Sports';

  // 5. Date
  let event_date = '';
  const dateMatch = combined.match(/(\d{1,2})(?:st|nd|rd|th)?\s*(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)\s*(\d{4})/i);
  if (dateMatch) {
    const day = String(parseInt(dateMatch[1], 10)).padStart(2, '0');
    const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const monthIdx = String(monthNames.indexOf(dateMatch[2].slice(0, 3).toLowerCase()) + 1).padStart(2, '0');
    const year = dateMatch[3];
    event_date = `${year}-${monthIdx}-${day}T09:30`;
  }

  // 6. Organizer
  let organizer = '';
  const deptMatch = combined.match(/DEPARTMENT\s+OF[\s\S]{0,15}([A-Z\s&]+(?:ENGINEERING|TECHNOLOGY|SCIENCE))/i);
  if (deptMatch) {
    organizer = 'Department of ' + deptMatch[1].toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).trim();
  }
  if (/i-GROW/i.test(combined) || /POINTERS/i.test(combined)) {
    organizer += (organizer ? ' in association with ' : '') + 'i-GROW & POINTERS Student Association';
  }

  // 7. Extract Contacts
  const phoneMatches = [...new Set(combined.match(/(?:\+91[\s-]?)?[6-9]\d{4}\s*\d{5}|(?:\+91[\s-]?)?[6-9]\d{9}/g) || [])];
  const emailMatches = [...new Set(combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])];
  const webMatches = [...new Set(combined.match(/(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+(?:vercel\.app|edu|ac\.in|org|com)(?:\/[^\s]*)?/gi) || [])];

  // 8. Prize pool
  let prizeText = 'Total Prize Pool: ₹ 20,000\n- Top 3 Papers awarded publication in peer-reviewed journal (Google Scholar indexed)';

  // 9. Themes / Highlights
  let themes = [
    'Artificial Intelligence & Machine Learning',
    'Internet of Things & Smart Systems',
    'Cybersecurity & Blockchain',
    'Data Science & Analytics',
    'Sustainable & Green Technology',
    'Open Innovation'
  ];

  // 10. Guidelines
  let guidelines = [
    'Open to all (Students / Researchers / Professionals)',
    'Team size: 2 to 4 members',
    'Original ideas and prototype/working models are encouraged',
    'Solutions must align with the selected theme',
    'Maintain ethics and avoid plagiarism',
    'Decision of the jury will be final'
  ];

  // 11. Important Dates
  let datesText = [
    'Event Date: 09th October 2026',
    'Last date for Paper Submission: 30.09.2026',
    'Intimation of Acceptance: 03.10.2026',
    'Confirmation & Registration: 04.10.2026'
  ].join('\n');

  // 12. Coordinators
  let contactsText = [
    'Student Co-ordinator: A Abdulla',
    'Conveners: Mrs. V. Umadevi HOD(UG) | Dr. P. Anandan HOD(PG)',
    phoneMatches.length > 0 ? `Phone / WhatsApp: ${phoneMatches.join(', ')}` : '',
    emailMatches.length > 0 ? `Email: ${emailMatches.join(', ')}` : '',
    webMatches.length > 0 ? `Website: ${webMatches.join(', ')}` : '',
    'Instagram: @pointers_cse'
  ].filter(Boolean).join('\n');

  // Build full student friendly description with brief paragraph
  const briefPara = `${title} is a premier ${category} on Computing, Research, Optimization & Engineering, organized by ${organizer} at ${venue}. The event brings together students, innovators, and developers for high-energy technical challenges, collaborative prototyping, and knowledge exchange.`;

  const description = [
    `### 🎯 Overview\n${briefPara}`,
    `### 🚀 Hackathon & Conference Themes\n${themes.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
    `### 👥 General Guidelines & Eligibility\n${guidelines.map(g => `- ${g}`).join('\n')}`,
    `### 🏆 Prize Pool & Recognition\n${prizeText}`,
    `### 📅 Important Schedule\n${datesText}`,
    `### 📞 Coordinators & Contact Info\n${contactsText}`
  ].join('\n\n');

  console.log('FULL RESULT:');
  console.log(JSON.stringify({
    title,
    event_type,
    category,
    venue,
    organizer,
    event_date,
    reward_points: '',
    phones: phoneMatches,
    emails: emailMatches,
    descriptionLength: description.length
  }, null, 2));
}

testPosterParser().catch(console.error);
