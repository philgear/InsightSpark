/**
 * ClinicalTriageGuard & HipaaSafeHarborGuard
 * Deterministic pre-flight safety interceptors for medical triage, suicide prevention,
 * and HIPAA Safe Harbor de-identification.
 */

export interface AcuteTriageAlert {
  isEmergency: boolean;
  type: 'medical' | 'crisis';
  reason: string;
  hotline: string;
  phoneUrl: string;
  actionTitle: string;
  guidance: string;
}

export interface PoliticalNeutralityAlert {
  isPoliticalViolation: boolean;
  category: 'campaigning' | 'disinformation' | 'radicalization' | 'astroturfing';
  reason: string;
  guidance: string;
}

// 1. Acute Medical Emergency Regex Patterns
const STROKE_REGEX = /\b(?:face\s+(?:droop|drooping)|slurred\s+speech|arm\s+(?:weakness|numbness)|sudden\s+(?:numbness|paralysis)|loss\s+of\s+balance)\b/i;
const CARDIAC_RESP_REGEX = /\b(?:chest\s+(?:pain|pressure|tightness)|can['’]?t\s+breathe|shortness\s+of\s+breath|severe\s+allergic\s+reaction|anaphylaxis|loss\s+of\s+consciousness|unconscious)\b/i;
const TRAUMA_POISON_REGEX = /\b(?:profuse\s+bleeding|severe\s+burn|swallowed\s+poison|suspected\s+overdose)\b/i;

// 2. Mental Health & Suicide Crisis Regex Patterns
const CRISIS_SUICIDE_REGEX = /\b(?:suicid(?:e|al)|want\s+to\s+(?:die|end\s+(?:it\s+all|my\s+life))|kill\s+myself|hurting\s+myself|self[- ]harm)\b/i;

/**
 * Deterministic pre-flight triage scanner for acute emergencies.
 * Halts AI generation and directs the user to emergency services.
 */
export function scanForAcuteTriage(rawText: string | null | undefined): AcuteTriageAlert | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.length > 2000 ? rawText.slice(0, 2000) : rawText;

  // Check 1: Acute Mental Health / Suicide Crisis (988)
  if (CRISIS_SUICIDE_REGEX.test(text)) {
    return {
      isEmergency: true,
      type: 'crisis',
      reason: 'Caregiver Support & 988 Lifeline Available',
      hotline: '988',
      phoneUrl: 'tel:988',
      actionTitle: 'Call or Text 988 (Confidential Lifeline)',
      guidance: 'Caregiving and life challenges can be deeply overwhelming. You do not have to carry this alone. Free, confidential support and caregiver respite guidance is available 24/7 via the 988 Suicide & Crisis Lifeline.'
    };
  }

  // Check 2: Acute Medical Emergency (911)
  if (STROKE_REGEX.test(text) || CARDIAC_RESP_REGEX.test(text) || TRAUMA_POISON_REGEX.test(text)) {
    let specificReason = 'Signs that could indicate an urgent medical situation';
    if (STROKE_REGEX.test(text)) specificReason = 'Noticed signs of potential stroke (FAST indicators)';
    else if (CARDIAC_RESP_REGEX.test(text)) specificReason = 'Noticed signs of potential acute cardiac or respiratory distress';

    return {
      isEmergency: true,
      type: 'medical',
      reason: specificReason,
      hotline: '911',
      phoneUrl: 'tel:911',
      actionTitle: 'Call 911 for Urgent Help',
      guidance: 'If someone is experiencing sudden symptoms right now, please call 911 or reach emergency medical care immediately. If this note describes a past event, ongoing rehabilitation, or recovery care, you can safely continue.'
    };
  }

  return null;
}

// 3. Political Motivations, Partisan Agendas, Disinformation, & Astroturfing Regex Patterns
const POLITICAL_CAMPAIGN_REGEX = /\b(?:smear\s+campaign|attack\s+ad|voter\s+suppression|rig\s+(?:the\s+)?election|discredit\s+the\s+(?:democrats|republicans|tories|labour|party|opposition)|political\s+hit[- ]piece|partisan\s+(?:attack|propaganda|smear)|defeat\s+(?:the\s+)?(?:gop|dnc|liberals|conservatives))\b/i;
const ASTROTURFING_DISINFO_REGEX = /\b(?:astroturf(?:ing)?|manufacture\s+(?:false\s+)?grassroots|manufactured\s+outrage|coordinated\s+inauthentic|fake\s+grassroots\s+movement|bot\s+farm|deepfake\s+campaign|disinformation\s+campaign|influence\s+operation)\b/i;
const RADICALIZATION_SUBVERSION_REGEX = /\b(?:overthrow\s+(?:the\s+)?government|civil\s+war\s+insurrection|subvert\s+(?:the\s+)?election|political\s+violence|weaponize\s+(?:political\s+)?division|radicalize\s+voters)\b/i;

/**
 * Deterministic pre-flight scanner for dark political motivations, propaganda, and partisan weaponization.
 * Enforces strict civic neutrality and protects the platform's wellness/care focus.
 */
export function scanForPoliticalAgendas(rawText: string | null | undefined): PoliticalNeutralityAlert | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.length > 2000 ? rawText.slice(0, 2000) : rawText;

  if (ASTROTURFING_DISINFO_REGEX.test(text)) {
    return {
      isPoliticalViolation: true,
      category: 'astroturfing',
      reason: 'Disinformation & Astroturfing Detected',
      guidance: 'InsightSpark is an apolitical workbench dedicated strictly to intergenerational care, positive psychology (PERMA+H), and lateral creative problem-solving. Astroturfing, artificial grassroots manipulation, and disinformation operations are strictly prohibited.'
    };
  }

  if (RADICALIZATION_SUBVERSION_REGEX.test(text)) {
    return {
      isPoliticalViolation: true,
      category: 'radicalization',
      reason: 'Political Subversion & Radicalization Detected',
      guidance: 'InsightSpark cannot be used to coordinate political subversion, insurrection, election tampering, or partisan radicalization.'
    };
  }

  if (POLITICAL_CAMPAIGN_REGEX.test(text)) {
    return {
      isPoliticalViolation: true,
      category: 'campaigning',
      reason: 'Partisan Political Campaigning Detected',
      guidance: 'InsightSpark is an apolitical workbench designed for family caregiving sustainability, personal well-being, and constructive creative ideation. Partisan political campaigns, opposition hit pieces, and election attack strategies are out of scope.'
    };
  }

  return null;
}

// 4. Deep HIPAA Safe Harbor PII/PHI Regexes
const EMAIL_REGEX = /(?:\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}\b|\b[a-zA-Z0-9._%+-]+\s*(?:\[at\]|\(at\)|@)\s*[a-zA-Z0-9.-]+\s*(?:\[dot\]|\(dot\)|\.)\s*[a-zA-Z]{2,10}\b)/gi;
const PHONE_REGEX = /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SSN_REGEX = /\b\d{3}[-\s.]\d{2}[-\s.]\d{4}\b/g;
const IP_REGEX = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const DOB_REGEX = /\b(?:DOB|Date of Birth|Birthdate|Born on)\s*[:=]?\s*\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b/gi;
const MRN_REGEX = /\b(?:MRN|Medical Record Number|Patient ID)\s*[:=]\s*[A-Z0-9-]+\b/gi;
const STREET_ADDRESS_REGEX = /\b\d{1,5}\s+[A-Za-z0-9\s.,]{2,30}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl|Suite|Apt)\b/gi;

/**
 * Comprehensive HIPAA Safe Harbor scanner covering 7 key direct identifiers.
 */
export function scanForPII(rawText: string | null | undefined): string[] {
  if (!rawText || typeof rawText !== 'string') return [];
  const text = rawText.length > 2000 ? rawText.slice(0, 2000) : rawText;

  const found: string[] = [];
  if (EMAIL_REGEX.test(text)) found.push('Email Address');
  if (PHONE_REGEX.test(text)) found.push('Phone Number');
  if (SSN_REGEX.test(text)) found.push('Social Security Number');
  if (IP_REGEX.test(text)) found.push('IP Address');
  if (DOB_REGEX.test(text)) found.push('Date of Birth');
  if (MRN_REGEX.test(text)) found.push('Medical Record Number');
  if (STREET_ADDRESS_REGEX.test(text)) found.push('Street Address');

  // Reset regex state
  EMAIL_REGEX.lastIndex = 0;
  PHONE_REGEX.lastIndex = 0;
  SSN_REGEX.lastIndex = 0;
  IP_REGEX.lastIndex = 0;
  DOB_REGEX.lastIndex = 0;
  MRN_REGEX.lastIndex = 0;
  STREET_ADDRESS_REGEX.lastIndex = 0;

  return found;
}

/**
 * Client warning message builder.
 */
export function getClientPiiWarning(rawText: string | null | undefined): string | null {
  const found = scanForPII(rawText);
  if (found.length > 0) {
    return `To protect family privacy, please tidy detected personal details (${found.map(f => f.toLowerCase()).join(', ')}) before continuing.`;
  }
  return null;
}

/**
 * Deterministically replaces identified PII tokens with sanitized placeholders.
 */
export function autoScrubPII(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(EMAIL_REGEX, '[email]')
    .replace(PHONE_REGEX, '[phone]')
    .replace(SSN_REGEX, '[ssn]')
    .replace(IP_REGEX, '[ip]')
    .replace(DOB_REGEX, '[date of birth]')
    .replace(MRN_REGEX, '[medical record number]')
    .replace(STREET_ADDRESS_REGEX, '[street address]');
}
