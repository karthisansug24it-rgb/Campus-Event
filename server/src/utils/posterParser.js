const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const https = require('https');

let sharedWorker = null;

/**
 * Gets or initializes a singleton Tesseract worker
 */
async function getOCRWorker() {
  if (!sharedWorker) {
    sharedWorker = await createWorker('eng');
  }
  return sharedWorker;
}

const KNOWN_DEPARTMENTS = [
  { match: /information\s*tech|inf\s*tech|\bit\b/i, name: 'Department of Information Technology' },
  { match: /computer\s*science|\bcse\b/i, name: 'Department of Computer Science and Engineering' },
  { match: /artificial\s*intelligence|\baids\b|\bai\b/i, name: 'Department of AI & Data Science' },
  { match: /electronics\s*(?:&|and)?\s*comm|\bece\b/i, name: 'Department of Electronics and Communication Engineering' },
  { match: /electrical|\beee\b/i, name: 'Department of Electrical and Electronics Engineering' },
  { match: /mechanical|\bmech\b/i, name: 'Department of Mechanical Engineering' },
  { match: /civil/i, name: 'Department of Civil Engineering' },
  { match: /biomedical|\bbme\b/i, name: 'Department of Biomedical Engineering' }
];

const KNOWN_CLUBS = [
  { match: /ieee/i, name: 'IEEE Student Branch' },
  { match: /csi\b|computer\s*society/i, name: 'CSI Student Chapter' },
  { match: /fine\s*arts|cultural\s*club/i, name: 'FXEC Fine Arts Club' },
  { match: /student\s*council/i, name: 'FXEC Student Council' },
  { match: /robotics/i, name: 'FXEC Robotics Club' },
  { match: /innovation\s*hub|iedc/i, name: 'FXEC Centre for Applied AI & Innovation' }
];

const MONTH_MAP = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
  aug: '08', august: '08', sep: '09', sept: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12'
};

/**
 * Parses raw OCR text into structured event form fields using heuristic pattern matching
 */
function parsePosterText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      title: '',
      description: '',
      category: 'Hackathon',
      event_type: 'internal',
      venue: '',
      organizer: '',
      event_date: '',
      registration_deadline: '',
      max_seats: '',
      reward_points: '50',
      external_link: '',
      raw_text: ''
    };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const fullText = rawText.replace(/\s+/g, ' ');

  // 1. Category Detection
  let category = 'Other';
  if (/hackathon|hack\s*the|codeathon|coding\s*contest/i.test(fullText)) {
    category = 'Hackathon';
  } else if (/workshop|hands-on|bootcamp|masterclass/i.test(fullText)) {
    category = 'Workshop';
  } else if (/symposium|seminar|conference|webinar|guest\s*lecture/i.test(fullText)) {
    category = 'Seminar';
  } else if (/cultural|dance|music|drama|arts|theatre|mono-acting|singing|fest/i.test(fullText)) {
    category = 'Cultural';
  } else if (/sports|tournament|cricket|football|basketball|volleyball|badminton|athletics/i.test(fullText)) {
    category = 'Sports';
  }

  // 2. Event Type (internal vs external)
  let event_type = 'internal';
  if (/inter-collegiate|inter-university|external|anna\s*university|state\s*level|national\s*level/i.test(fullText) && 
      !/fxec\s*campus|francis\s*xavier\s*campus/i.test(fullText) &&
      /outside|regional|district/i.test(fullText)) {
    event_type = 'external';
  }

  // 3. Title Extraction
  let title = '';
  for (const line of lines) {
    const cleaned = line.replace(/^[|~—\-_=+\s]+|[|~—\-_=+\s]+$/g, '').trim();
    if (cleaned.length < 5 || cleaned.length > 80) continue;
    if (/francis\s*xavier|engineering\s*college|department\s*of|presents/i.test(cleaned)) continue;

    if (/(?:mega\s+)?hackathon|workshop|symposium|conference|summit|tournament|fest|challenge/i.test(cleaned)) {
      title = cleaned;
      break;
    }
  }

  if (!title) {
    for (const line of lines.slice(0, 10)) {
      const cleaned = line.replace(/^[|~—\-_=+\s]+|[|~—\-_=+\s]+$/g, '').trim();
      if (cleaned.length >= 6 && cleaned.length <= 60 &&
          !/francis\s*xavier|engineering\s*college|presents|department\s*of|welcome/i.test(cleaned)) {
        title = cleaned;
        break;
      }
    }
  }
  if (!title) {
    title = category !== 'Other' ? `${category} 2026` : 'Campus Event';
  }

  // 4. Dates & Times Extraction
  const foundDates = [];
  
  // Pattern A: Day-Day Month Year e.g. "29 - 30 OCTOBER 2026", "10 OCTOBER 2026", "15 NOV 2024"
  const pA = /(?:(\d{1,2})\s*(?:-|to)\s*)?(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(?:,?\s*(\d{4}))?/gi;
  let mA;
  while ((mA = pA.exec(fullText)) !== null) {
    const startDay = mA[1] ? parseInt(mA[1], 10) : parseInt(mA[2], 10);
    const endDay = parseInt(mA[2], 10);
    const mStr = mA[3].toLowerCase();
    const month = MONTH_MAP[mStr];
    const year = mA[4] ? parseInt(mA[4], 10) : new Date().getFullYear();
    foundDates.push({
      startDay,
      endDay,
      month,
      year,
      isoStart: `${year}-${month}-${String(startDay).padStart(2, '0')}`,
      isoEnd: `${year}-${month}-${String(endDay).padStart(2, '0')}`,
      raw: mA[0]
    });
  }

  // Pattern B: Month Day-Day Year e.g. "OCT 26-27", "NOV 15-17, 2024"
  const pB = /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\b(\d{1,2})\b(?:st|nd|rd|th)?(?:\s*(?:-|to)\s*\b(\d{1,2})\b)?(?:,?\s*(\d{4}))?/gi;
  let mB;
  while ((mB = pB.exec(fullText)) !== null) {
    const mStr = mB[1].toLowerCase();
    const month = MONTH_MAP[mStr];
    const startDay = parseInt(mB[2], 10);
    const endDay = mB[3] ? parseInt(mB[3], 10) : startDay;
    const year = mB[4] ? parseInt(mB[4], 10) : new Date().getFullYear();
    foundDates.push({
      startDay,
      endDay,
      month,
      year,
      isoStart: `${year}-${month}-${String(startDay).padStart(2, '0')}`,
      isoEnd: `${year}-${month}-${String(endDay).padStart(2, '0')}`,
      raw: mB[0]
    });
  }

  // Time extraction
  let timeStr = '09:00';
  const timeMatch = fullText.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? timeMatch[2] : '00';
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    timeStr = `${String(hour).padStart(2, '0')}:${minute}`;
  }

  let event_date = '';
  let registration_deadline = '';

  // Check specifically for Round 1 / Registration deadline in text
  const deadlineMatch = fullText.match(/(?:round\s*1|deadline|last\s*date|register\s*before|reg(?:istration)?\s*ends?)[:\s]+.*?(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s*,?\s*(\d{4}))?/i);

  if (deadlineMatch) {
    const dDay = String(deadlineMatch[1]).padStart(2, '0');
    const dMonth = MONTH_MAP[deadlineMatch[2].toLowerCase()];
    const dYear = deadlineMatch[3] || (foundDates[0] ? foundDates[0].year : new Date().getFullYear());
    registration_deadline = `${dYear}-${dMonth}-${dDay}T23:59`;
  }

  if (foundDates.length > 0) {
    const mainDate = foundDates[foundDates.length - 1];
    event_date = `${mainDate.isoStart}T${timeStr}`;

    if (!registration_deadline && foundDates.length > 1) {
      registration_deadline = `${foundDates[0].isoStart}T23:59`;
    }
  }

  if (!event_date) {
    const future = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    event_date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}T09:00`;
  }

  if (!registration_deadline) {
    const ev = new Date(event_date);
    ev.setDate(ev.getDate() - 2);
    registration_deadline = `${ev.getFullYear()}-${String(ev.getMonth() + 1).padStart(2, '0')}-${String(ev.getDate()).padStart(2, '0')}T23:59`;
  }

  // 5. Venue Extraction
  let venue = '';
  for (const line of lines) {
    const vMatch = line.match(/(?:venue|location|place)[:\s]+([^|\n;]+)/i);
    if (vMatch) {
      const candidate = vMatch[1].replace(/^[^\w]+|[^\w]+$/g, '').trim();
      if (candidate.length > 2 && candidate.length < 70 && !/open\s*to/i.test(candidate)) {
        venue = candidate;
        break;
      }
    }
  }

  if (!venue) {
    if (/online/i.test(fullText) && /on-campus/i.test(fullText)) {
      venue = 'Online / FXEC Campus';
    } else if (/online/i.test(fullText)) {
      venue = 'Online / Virtual';
    } else if (/auditorium/i.test(fullText)) {
      venue = 'Campus Auditorium, FXEC';
    } else if (/lab\s*\d+/i.test(fullText)) {
      const lm = fullText.match(/lab\s*\d+/i);
      venue = `${lm[0].toUpperCase()}, Department Lab`;
    } else if (/amphitheatre/i.test(fullText)) {
      venue = 'Open Air Amphitheatre, FXEC Campus';
    } else if (/innovation\s*hub/i.test(fullText)) {
      venue = 'Campus Auditorium & FX Innovation Hub';
    } else if (/tirunelveli/i.test(fullText)) {
      venue = 'FXEC Campus, Tirunelveli';
    } else {
      venue = 'FXEC Campus, Tirunelveli';
    }
  }

  // 6. Organizer Extraction
  let organizer = '';
  for (const dep of KNOWN_DEPARTMENTS) {
    if (dep.match.test(fullText)) {
      organizer = dep.name;
      break;
    }
  }

  for (const club of KNOWN_CLUBS) {
    if (club.match.test(fullText)) {
      organizer = organizer ? `${organizer} & ${club.name}` : club.name;
      break;
    }
  }

  if (!organizer) {
    const orgMatch = fullText.match(/(?:organized\s*by|in\s*association\s*with|hosted\s*by|presented\s*by)[:\s]+([^|\n,;]+)/i);
    if (orgMatch) {
      organizer = orgMatch[1].replace(/^[^\w]+|[^\w]+$/g, '').trim();
    }
  }

  if (!organizer) {
    organizer = 'Francis Xavier Engineering College';
  }

  // 7. External Link / Website
  let external_link = '';
  const urlMatch = fullText.match(/(?:https?:\/\/)?((?:[a-zA-Z0-9][-a-zA-Z0-9]*\.)+(?:in|com|org|io|dev|ac\.in|edu|net)(?:\/[^\s]*)?)/i);
  if (urlMatch) {
    let cleanUrl = urlMatch[0].replace(/[.,;:)>\]]+$/, '').trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    if (!/@/.test(cleanUrl)) {
      external_link = cleanUrl;
    }
  }

  // 8. Reward Points & Max Seats
  let reward_points = 50;
  if (category === 'Hackathon') reward_points = 100;
  else if (category === 'Workshop') reward_points = 50;
  else if (category === 'Seminar') reward_points = 75;
  else if (category === 'Cultural') reward_points = 30;
  else if (category === 'Sports') reward_points = 60;

  const pointsMatch = fullText.match(/(\d+)\s*(?:points|pts)/i);
  if (pointsMatch) {
    reward_points = parseInt(pointsMatch[1], 10);
  }

  let max_seats = 60;
  if (category === 'Hackathon') max_seats = 80;
  else if (category === 'Workshop') max_seats = 50;
  else if (category === 'Seminar') max_seats = 40;
  else if (category === 'Cultural') max_seats = 200;
  else if (category === 'Sports') max_seats = 30;

  const seatsMatch = fullText.match(/(?:seats?|capacity|limit(?:ed\s*to)?|slots?)[:\s]+(\d+)/i);
  if (seatsMatch) {
    max_seats = parseInt(seatsMatch[1], 10);
  }

  // 9. Description
  let description = '';
  const topicsMatch = fullText.match(/(?:topics?|themes?|challenges?|problems?|about\s*the\s*event)[:\s]+([^.]+?\.)/i);
  if (topicsMatch && topicsMatch[1].length > 20) {
    description = topicsMatch[1].trim();
  } else {
    const pointsText = reward_points ? ` Earn ${reward_points} activity reward points upon participation.` : '';
    description = `${title} organized by ${organizer}. Join us for hands-on experience, exciting challenges, expert mentorship, and official certificates.${pointsText}`;
  }

  return {
    title,
    description,
    category,
    event_type,
    venue,
    organizer,
    event_date,
    registration_deadline,
    max_seats,
    reward_points: String(reward_points),
    external_link,
    raw_text: rawText
  };
}

/**
 * Optional Gemini Vision API call for high-accuracy multimodal extraction
 */
async function extractWithGeminiVision(filePath, apiKey) {
  return new Promise((resolve, reject) => {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

      const prompt = `Analyze this college event poster and extract all event details into strict JSON format with exactly these keys:
{
  "title": "Clear event title",
  "description": "Comprehensive 2-3 sentence overview of themes, topics, or eligibility",
  "category": "Hackathon | Workshop | Seminar | Cultural | Sports | Other",
  "event_type": "internal | external",
  "venue": "Venue location or Online",
  "organizer": "Organizing department, club, or institution",
  "event_date": "YYYY-MM-DDTHH:mm (ISO datetime-local string)",
  "registration_deadline": "YYYY-MM-DDTHH:mm (ISO datetime-local string)",
  "max_seats": 60,
  "reward_points": 50,
  "external_link": "https://..."
}
Only output pure JSON.`;

      const requestBody = JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      });

      const req = https.request(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
          },
          timeout: 10000
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const textOutput = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textOutput) {
                const jsonResult = JSON.parse(textOutput);
                resolve(jsonResult);
              } else {
                reject(new Error('No text candidate from Gemini'));
              }
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Gemini API request timed out'));
      });

      req.write(requestBody);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Main OCR & Extraction runner on a local file path
 */
async function extractDetailsFromPoster(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Poster file not found at: ${filePath}`);
  }

  // Check if Gemini API Key is available
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiApiKey) {
    try {
      console.log('[PosterParser] Attempting Gemini Multimodal extraction...');
      const geminiResult = await extractWithGeminiVision(filePath, geminiApiKey);
      if (geminiResult && geminiResult.title) {
        return {
          ...geminiResult,
          reward_points: String(geminiResult.reward_points || 50),
          source: 'gemini'
        };
      }
    } catch (err) {
      console.warn('[PosterParser] Gemini Vision failed or timed out, falling back to local OCR:', err.message);
    }
  }

  // Fallback / Default: Local Tesseract OCR
  console.log('[PosterParser] Running local Tesseract OCR & heuristic parser...');
  const worker = await getOCRWorker();
  const ocrResult = await worker.recognize(filePath);
  const rawText = ocrResult?.data?.text || '';

  const parsedData = parsePosterText(rawText);
  return {
    ...parsedData,
    source: 'tesseract-ocr'
  };
}

module.exports = {
  extractDetailsFromPoster,
  parsePosterText
};
