import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Users, 
  Award, 
  ShieldCheck, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  FileText,
  ChevronRight,
  Laptop,
  ExternalLink,
  Tag
} from 'lucide-react';

/**
 * Renders inline markdown links [text](url) into clickable anchor elements
 */
function renderFormattedLine(line = '') {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  if (!linkRegex.test(line)) {
    return line;
  }
  const parts = [];
  let lastIndex = 0;
  linkRegex.lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }
    const [_, text, href] = match;
    const isEmail = href.startsWith('mailto:') || text.includes('@');
    parts.push(
      <a
        key={match.index}
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 transition-colors"
      >
        {isEmail && <Mail className="w-3 h-3 inline shrink-0" />}
        <span>{text}</span>
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }
  return parts;
}

/**
 * Parses markdown-style sections (e.g. ### 🎯 Overview) into structured cards
 */
function parseDescriptionSections(description = '') {
  if (!description || typeof description !== 'string') return [];

  const lines = description.split('\n');
  const sections = [];
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Standalone email link at the end or standalone line (e.g. [pointers.csedept@gmail.com](mailto:...))
    // Automatically make it a separate card!
    const isStandaloneEmail = /^\[?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\]?(?:\(mailto:[^)]+\))?$/i.test(trimmed);

    const headerMatch = line.match(/^#{2,4}\s*(.*)$/);

    if (headerMatch || isStandaloneEmail) {
      if (currentSection) {
        sections.push({
          ...currentSection,
          body: currentSection.lines.join('\n').trim()
        });
      }

      if (isStandaloneEmail) {
        // Create a dedicated separate card for the email
        const emailAddress = trimmed.replace(/^\[/, '').split(']')[0];
        currentSection = {
          title: '✉️ Official Contact Email',
          icon: Mail,
          color: 'rose',
          lines: [`Official Inquiries: [${emailAddress}](mailto:${emailAddress})`]
        };
        continue;
      }

      const rawTitle = headerMatch[1].trim();
      let icon = Sparkles;
      let color = 'blue';

      const lower = rawTitle.toLowerCase();
      if (lower.includes('mail') || lower.includes('email') || lower.includes('support') || lower.includes('enquir') || lower.includes('inquir')) {
        icon = Mail;
        color = 'rose';
      } else if (lower.includes('timing') || lower.includes('time') || lower.includes('schedule') || lower.includes('agenda')) {
        icon = Clock;
        color = 'indigo';
      } else if (lower.includes('guest') || lower.includes('keynote') || lower.includes('speaker') || lower.includes('dignitar')) {
        icon = Award;
        color = 'amber';
      } else if (lower.includes('eligib') || lower.includes('require') || lower.includes('team') || lower.includes('who')) {
        icon = Users;
        color = 'emerald';
      } else if (lower.includes('prize') || lower.includes('reward') || lower.includes('point') || lower.includes('award')) {
        icon = Award;
        color = 'amber';
      } else if (lower.includes('rule') || lower.includes('bring') || lower.includes('instruction') || lower.includes('dress')) {
        icon = ShieldCheck;
        color = 'cyan';
      } else if (lower.includes('contact') || lower.includes('coordinator') || lower.includes('faculty') || lower.includes('convener')) {
        icon = Phone;
        color = 'blue';
      } else if (lower.includes('prerequisite') || lower.includes('tool') || lower.includes('laptop')) {
        icon = Laptop;
        color = 'indigo';
      } else if (lower.includes('theme') || lower.includes('track')) {
        icon = Layers;
        color = 'indigo';
      } else {
        icon = Tag;
        color = 'blue';
      }

      currentSection = {
        title: rawTitle,
        icon,
        color,
        lines: []
      };
    } else {
      if (currentSection) {
        currentSection.lines.push(line);
      } else if (line.trim().length > 0) {
        // Fallback initial section
        currentSection = {
          title: '🎯 Overview',
          icon: Sparkles,
          color: 'blue',
          lines: [line]
        };
      }
    }
  }

  if (currentSection) {
    sections.push({
      ...currentSection,
      body: currentSection.lines.join('\n').trim()
    });
  }

  return sections;
}

const colorMap = {
  blue: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-100 text-blue-700',
    border: 'border-blue-100',
    bg: 'bg-gradient-to-br from-blue-50/40 via-white to-transparent'
  },
  indigo: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconBg: 'bg-indigo-100 text-indigo-700',
    border: 'border-indigo-100',
    bg: 'bg-gradient-to-br from-indigo-50/40 via-white to-transparent'
  },
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-100',
    bg: 'bg-gradient-to-br from-emerald-50/40 via-white to-transparent'
  },
  amber: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    iconBg: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100',
    bg: 'bg-gradient-to-br from-amber-50/40 via-white to-transparent'
  },
  cyan: {
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    iconBg: 'bg-cyan-100 text-cyan-700',
    border: 'border-cyan-100',
    bg: 'bg-gradient-to-br from-cyan-50/40 via-white to-transparent'
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    iconBg: 'bg-rose-100 text-rose-700',
    border: 'border-rose-100',
    bg: 'bg-gradient-to-br from-rose-50/40 via-white to-transparent'
  }
};

const StructuredEventGuide = ({ description = '' }) => {
  const sections = parseDescriptionSections(description);
  const [activeTab, setActiveTab] = useState('all');

  if (!description || description.trim().length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs italic">
        No additional specifications provided for this event.
      </div>
    );
  }

  // If no markdown sections detected, render as nicely formatted paragraphs
  if (sections.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line shadow-xs">
        {description}
      </div>
    );
  }

  const visibleSections = activeTab === 'all' 
    ? sections 
    : sections.filter((_, idx) => String(idx) === activeTab);

  return (
    <div className="space-y-4">
      {/* Student Navigation Pill Bar */}
      {sections.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Cards ({sections.length})
          </button>
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            const isSelected = activeTab === String(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTab(String(idx))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.title.replace(/^[^a-zA-Z0-9]+/, '').trim().split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Structured Cards Display - Each is its own distinct card */}
      <div className="space-y-3.5">
        {visibleSections.map((sec, idx) => {
          const Icon = sec.icon;
          const styles = colorMap[sec.color] || colorMap.blue;

          // Detect phone or email inside body
          const phoneMatches = sec.body.match(/(?:\+91[\s-]?)?[6-9]\d{9}/g) || [];
          const emailMatches = sec.body.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

          // Split body into lines and check for bullets
          const bodyLines = sec.body.split('\n').filter(Boolean);

          return (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-2xl border ${styles.border} ${styles.bg} shadow-xs transition-all hover:shadow-md`}
            >
              {/* Section Header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${styles.iconBg} shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold font-display text-slate-900 tracking-tight">
                  {sec.title}
                </h4>
              </div>

              {/* Section Body with Markdown Link Support */}
              <div className="space-y-1.5 pl-1 sm:pl-2">
                {bodyLines.map((line, lIdx) => {
                  const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•') || /^\d+\.\s/.test(line.trim());
                  const cleanLine = line.replace(/^[-*•]\s*/, '').trim();

                  return (
                    <div key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                      {isBullet ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      ) : null}
                      <span className="flex-1">{renderFormattedLine(cleanLine)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Dedicated Clickable Action Pills for Contacts / Mail */}
              {(phoneMatches.length > 0 || emailMatches.length > 0) && (
                <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-wrap gap-2">
                  {phoneMatches.map((phone, pIdx) => (
                    <a
                      key={pIdx}
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span>Call {phone}</span>
                    </a>
                  ))}
                  {emailMatches.map((email, eIdx) => (
                    <a
                      key={eIdx}
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-mono font-bold border border-rose-200 hover:bg-rose-100 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-rose-600" />
                      <span>✉️ Send Email to {email}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StructuredEventGuide;
