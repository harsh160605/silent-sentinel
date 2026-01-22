/**
 * AI Service for natural language processing and moderation
 * Uses Google Gemini AI directly for smart report processing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let genAI = null;
let model = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
}

/**
 * Parse natural language safety report using Gemini AI
 * Extracts: risk level, safety reason, category
 */
export const parseNaturalLanguageReport = async (text, language = 'en') => {
  if (!model) {
    console.warn('Gemini API not configured, using fallback parser');
    return fallbackParser(text);
  }

  try {
    const prompt = `You are a safety analyst for a community safety platform. Analyze this safety report and extract structured information.

Report: "${text}"

Extract the following:
1. Risk Level: Classify as "low", "medium", or "high"
   - High: Immediate danger, assault, weapons, active threats
   - Medium: Harassment, suspicious activity, uncomfortable situations
   - Low: Minor concerns, general unease
2. Reason: A clear, concise summary (max 150 characters)
3. Category: One of [harassment, theft, assault, suspicious-activity, unsafe-infrastructure, other]

Respond ONLY with a JSON object, no other text:
{"riskLevel": "low|medium|high", "reason": "brief summary", "category": "category", "aiParsed": true}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      riskLevel: parsed.riskLevel || 'low',
      reason: parsed.reason || text.substring(0, 150),
      category: parsed.category || 'other',
      aiParsed: true,
    };
  } catch (error) {
    console.error('Error parsing report with Gemini:', error);
    return fallbackParser(text);
  }
};

/**
 * Moderate content for safety violations using Gemini AI
 * Blocks: hate speech, doxxing, false accusations, vigilante language
 */
export const moderateContent = async (text) => {
  if (!model) {
    console.warn('Gemini API not configured, using fallback moderation');
    return fallbackModeration(text);
  }

  try {
    const prompt = `You are a content moderator for a community safety platform. Analyze this content for policy violations.

Content: "${text}"

Check for:
1. Personal Identifiable Information (names, addresses, phone numbers, emails)
2. Hate speech or discriminatory language
3. Calls for violence or vigilantism
4. False accusations or defamation
5. Doxxing attempts

Respond ONLY with a JSON object, no other text:
{"approved": true/false, "reason": "explanation if not approved"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const moderation = JSON.parse(jsonMatch[0]);
    return {
      approved: moderation.approved !== false,
      reason: moderation.reason || null,
    };
  } catch (error) {
    console.error('Error moderating content with Gemini:', error);
    return fallbackModeration(text);
  }
};

/**
 * Fallback parser if AI fails
 */
const fallbackParser = (text) => {
  const lowerText = text.toLowerCase();

  let riskLevel = 'low';
  let category = 'other';

  if (
    lowerText.includes('assault') ||
    lowerText.includes('robbery') ||
    lowerText.includes('attack') ||
    lowerText.includes('weapon') ||
    lowerText.includes('gun') ||
    lowerText.includes('knife')
  ) {
    riskLevel = 'high';
    category = 'assault';
  } else if (
    lowerText.includes('theft') ||
    lowerText.includes('stole') ||
    lowerText.includes('stolen')
  ) {
    riskLevel = 'medium';
    category = 'theft';
  } else if (
    lowerText.includes('suspicious') ||
    lowerText.includes('uncomfortable') ||
    lowerText.includes('harass') ||
    lowerText.includes('follow')
  ) {
    riskLevel = 'medium';
    category = 'suspicious-activity';
  } else if (
    lowerText.includes('light') ||
    lowerText.includes('broken') ||
    lowerText.includes('road') ||
    lowerText.includes('pothole')
  ) {
    riskLevel = 'low';
    category = 'unsafe-infrastructure';
  }

  return {
    riskLevel,
    reason: text.substring(0, 200),
    category,
    aiParsed: false,
  };
};

/**
 * Fallback moderation if AI fails
 */
const fallbackModeration = (text) => {
  const lowerText = text.toLowerCase();

  const blacklist = ['kill', 'murder', 'bomb', 'terrorist'];

  // Check for PII patterns
  const hasPII = /\b\d{3}-\d{2}-\d{4}\b|\b\d{10}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);

  if (hasPII) {
    return {
      approved: false,
      reason: 'Content contains personal identifiable information',
    };
  }

  for (const word of blacklist) {
    if (lowerText.includes(word)) {
      return {
        approved: false,
        reason: 'Content contains prohibited language',
      };
    }
  }

  return { approved: true };
};
