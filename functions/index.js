import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Parse natural language safety report using Google Gemini
 */
export const parseReport = onRequest(
  { 
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { text, language = 'en' } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `You are a safety analyst for a community safety platform. Analyze this safety report and extract structured information.

Report: "${text}"

Extract the following:
1. Risk Level: Classify as "low", "medium", or "high"
   - High: Immediate danger, assault, weapons, active threats
   - Medium: Harassment, suspicious activity, uncomfortable situations
   - Low: Minor concerns, general unease
2. Reason: A clear, concise summary (max 150 characters)
3. Category: One of [harassment, theft, assault, suspicious-activity, unsafe-infrastructure, other]

Respond in JSON format:
{
  "riskLevel": "low|medium|high",
  "reason": "brief summary",
  "category": "category",
  "aiParsed": true
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      res.json(parsed);
    } catch (error) {
      console.error('Error parsing report:', error);
      
      // Fallback: basic keyword analysis
      const lowerText = text.toLowerCase();
      let riskLevel = 'low';
      
      if (
        lowerText.includes('assault') ||
        lowerText.includes('weapon') ||
        lowerText.includes('attack') ||
        lowerText.includes('robbery')
      ) {
        riskLevel = 'high';
      } else if (
        lowerText.includes('suspicious') ||
        lowerText.includes('uncomfortable') ||
        lowerText.includes('harass') ||
        lowerText.includes('follow')
      ) {
        riskLevel = 'medium';
      }

      res.json({
        riskLevel,
        reason: text.substring(0, 150),
        category: 'other',
        aiParsed: false,
      });
    }
  }
);

/**
 * Moderate content for safety violations using Google Gemini
 */
export const moderateContent = onRequest(
  {
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `You are a content moderator for a community safety platform. Analyze this content for policy violations.

Content: "${text}"

Check for:
1. Personal Identifiable Information (names, addresses, phone numbers, emails)
2. Hate speech or discriminatory language
3. Calls for violence or vigilantism
4. False accusations or defamation
5. Doxxing attempts

Respond in JSON format:
{
  "approved": true/false,
  "reason": "explanation if not approved"
}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const moderation = JSON.parse(jsonMatch[0]);
      res.json(moderation);
    } catch (error) {
      console.error('Error moderating content:', error);
      
      // Fallback: basic checks
      const lowerText = text.toLowerCase();
      
      // Check for PII patterns
      const hasPII = /\b\d{3}-\d{2}-\d{4}\b|\b\d{10}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);
      
      if (hasPII) {
        res.json({
          approved: false,
          reason: 'Content contains personal identifiable information',
        });
        return;
      }

      // Basic blacklist
      const blacklist = ['kill', 'murder', 'bomb', 'terrorist'];
      for (const word of blacklist) {
        if (lowerText.includes(word)) {
          res.json({
            approved: false,
            reason: 'Content contains prohibited language',
          });
          return;
        }
      }

      res.json({ approved: true });
    }
  }
);

/**
 * Pattern Detection - Runs hourly to detect clusters of similar reports
 */
export const detectPatterns = onSchedule(
  {
    schedule: 'every 1 hours',
    region: 'us-central1',
    timeZone: 'America/Los_Angeles'
  },
  async () => {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch recent reports
      const reportsSnapshot = await db
        .collection('reports')
        .where('timestamp', '>=', sevenDaysAgo)
        .get();

      const reports = [];
      reportsSnapshot.forEach((doc) => {
        reports.push({ id: doc.id, ...doc.data() });
      });

      // Group reports by geohash prefix (4 chars = ~20km)
      const clusters = {};
      reports.forEach((report) => {
        const prefix = report.location.geohash.substring(0, 4);
        if (!clusters[prefix]) {
          clusters[prefix] = [];
        }
        clusters[prefix].push(report);
      });

      // Detect patterns in clusters with 3+ reports
      const patterns = [];
      for (const [geohash, clusterReports] of Object.entries(clusters)) {
        if (clusterReports.length >= 3) {
          // Calculate average location
          const avgLat =
            clusterReports.reduce((sum, r) => sum + r.location.lat, 0) /
            clusterReports.length;
          const avgLng =
            clusterReports.reduce((sum, r) => sum + r.location.lng, 0) /
            clusterReports.length;

          // Calculate confidence based on report count and recency
          const confidence = Math.min(clusterReports.length / 10, 1);

          patterns.push({
            location: {
              lat: avgLat,
              lng: avgLng,
              geohash: geohash,
            },
            reportCount: clusterReports.length,
            confidence,
            lastUpdate: FieldValue.serverTimestamp(),
            reportIds: clusterReports.map((r) => r.id),
          });
        }
      }

      // Clear old patterns and write new ones
      const patternsCollection = db.collection('patterns');
      const oldPatternsSnapshot = await patternsCollection.get();
      
      const batch = db.batch();
      oldPatternsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      patterns.forEach((pattern) => {
        const ref = patternsCollection.doc();
        batch.set(ref, pattern);
      });

      await batch.commit();
      console.log(`Detected ${patterns.length} patterns`);
    } catch (error) {
      console.error('Error detecting patterns:', error);
    }
  }
);

/**
 * Cleanup expired reports - Runs daily
 */
export const cleanupExpiredReports = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1',
    timeZone: 'America/Los_Angeles'
  },
  async () => {
    try {
      const now = new Date();
      const expiredReports = await db
        .collection('reports')
        .where('expiresAt', '<=', now)
        .get();

      const batch = db.batch();
      expiredReports.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${expiredReports.size} expired reports`);
    } catch (error) {
      console.error('Error cleaning up expired reports:', error);
    }
  }
);

/**
 * Generate authority report - Aggregates anonymous data for law enforcement
 */
export const generateAuthorityReport = onRequest(
  {
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { geohash, days = 7 } = req.body;

    if (!geohash) {
      res.status(400).json({ error: 'Geohash required' });
      return;
    }

    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Fetch reports in the area
      const reportsSnapshot = await db
        .collection('reports')
        .where('location.geohash', '>=', geohash)
        .where('location.geohash', '<=', geohash + '\uf8ff')
        .where('timestamp', '>=', startDate)
        .get();

      const reports = [];
      reportsSnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          timestamp: data.timestamp.toDate(),
          riskLevel: data.riskLevel,
          reportType: data.reportType,
          reason: data.reason,
          location: {
            lat: data.location.lat,
            lng: data.location.lng,
          },
        });
      });

      // Generate neutral summary using Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const summaryPrompt = `Generate a neutral, factual summary of these safety reports for local authorities.

Reports: ${JSON.stringify(reports.map(r => ({
  date: r.timestamp.toISOString().split('T')[0],
  risk: r.riskLevel,
  description: r.reason
})))}

Create a professional summary that:
1. States the number of reports and timeframe
2. Identifies key patterns or trends
3. Highlights high-risk areas
4. Remains neutral and factual
5. Protects user anonymity

Keep it under 500 words.`;

      const result = await model.generateContent(summaryPrompt);
      const summary = await result.response.text();

      // Save authority report
      const authorityReport = {
        geohash,
        reportCount: reports.length,
        timeframe: {
          start: startDate,
          end: now,
        },
        summary,
        generatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection('authority_reports').add(authorityReport);

      res.json({
        reportId: docRef.id,
        ...authorityReport,
        generatedAt: now,
      });
    } catch (error) {
      console.error('Error generating authority report:', error);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
);

/**
 * Get smart suggestions for report input
 * Uses Gemini AI + stored keyword patterns
 */
export const getSmartSuggestions = onRequest(
  {
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { partialText = '', category = null, limit = 10 } = req.body;

    try {
      // Fetch popular keywords from Firestore
      let keywordsQuery = db.collection('keywords')
        .orderBy('count', 'desc')
        .limit(20);
      
      if (category) {
        keywordsQuery = db.collection('keywords')
          .where('category', '==', category)
          .orderBy('count', 'desc')
          .limit(20);
      }

      const keywordsSnapshot = await keywordsQuery.get();
      const storedKeywords = [];
      keywordsSnapshot.forEach(doc => {
        storedKeywords.push({ id: doc.id, ...doc.data() });
      });

      // Fetch quick templates
      const templatesSnapshot = await db.collection('reportTemplates')
        .orderBy('usageCount', 'desc')
        .limit(8)
        .get();
      
      const templates = [];
      templatesSnapshot.forEach(doc => {
        templates.push({ id: doc.id, ...doc.data() });
      });

      // If user has typed something, use AI to suggest completions
      let aiSuggestions = [];
      if (partialText.length >= 3) {
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          
          const prompt = `You are helping users report safety concerns in their community. Based on the partial input, suggest 5 relevant completions or phrases.

Partial input: "${partialText}"

Common community safety topics include: suspicious activity, harassment, theft, unsafe infrastructure, noise complaints, vandalism, reckless driving, poorly lit areas.

Return a JSON array of 5 suggestion strings that would complete or enhance the user's input:
["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"]

Keep suggestions concise (under 50 characters each) and relevant to safety reporting.`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          
          const jsonMatch = responseText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiSuggestions = JSON.parse(jsonMatch[0]);
          }
        } catch (aiError) {
          console.error('AI suggestions failed, using keyword matching:', aiError);
          // Fallback: filter keywords by partial text
          aiSuggestions = storedKeywords
            .filter(k => k.keyword.toLowerCase().includes(partialText.toLowerCase()))
            .slice(0, 5)
            .map(k => k.keyword);
        }
      }

      // Combine results
      res.json({
        keywords: storedKeywords.slice(0, limit),
        templates: templates,
        suggestions: aiSuggestions,
        partialText: partialText
      });
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      
      // Return default templates even on error
      res.json({
        keywords: [],
        templates: [
          { id: 'default-1', template: 'Suspicious person near my location', category: 'suspicious-activity', icon: '🚶' },
          { id: 'default-2', template: 'Street light not working', category: 'unsafe-infrastructure', icon: '💡' },
          { id: 'default-3', template: 'Unsafe driving in the area', category: 'traffic', icon: '🚗' },
          { id: 'default-4', template: 'Harassment incident', category: 'harassment', icon: '⚠️' },
        ],
        suggestions: [],
        partialText: partialText
      });
    }
  }
);

/**
 * Update keyword statistics when a report is submitted
 * Extracts keywords using Gemini AI and stores them
 */
export const updateKeywordStats = onRequest(
  {
    cors: true,
    region: 'us-central1'
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { reportText, category = 'other', riskLevel = 'low' } = req.body;

    if (!reportText || typeof reportText !== 'string') {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    try {
      // Use Gemini to extract keywords
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Extract 3-5 key phrases from this safety report that would be useful for autocomplete suggestions. Focus on action words, location descriptors, and safety concerns.

Report: "${reportText}"

Return a JSON array of keyword/phrase strings:
["phrase1", "phrase2", "phrase3"]

Keep each phrase between 2-4 words, lowercase, focused on reusable patterns.`;

      let keywords = [];
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          keywords = JSON.parse(jsonMatch[0]);
        }
      } catch (aiError) {
        console.error('AI keyword extraction failed, using basic extraction:', aiError);
        // Basic extraction fallback
        keywords = reportText
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 4)
          .slice(0, 5);
      }

      // Update keyword counts in Firestore
      const batch = db.batch();
      const now = new Date();

      for (const keyword of keywords) {
        if (!keyword || keyword.length < 2) continue;
        
        const keywordLower = keyword.toLowerCase().trim();
        const keywordRef = db.collection('keywords').doc(keywordLower.replace(/\s+/g, '-'));
        
        const keywordDoc = await keywordRef.get();
        
        if (keywordDoc.exists) {
          batch.update(keywordRef, {
            count: FieldValue.increment(1),
            lastUsed: now,
            category: category
          });
        } else {
          batch.set(keywordRef, {
            keyword: keywordLower,
            count: 1,
            lastUsed: now,
            category: category,
            averageRiskLevel: riskLevel
          });
        }
      }

      await batch.commit();
      
      res.json({ 
        success: true, 
        extractedKeywords: keywords 
      });
    } catch (error) {
      console.error('Error updating keyword stats:', error);
      res.status(500).json({ error: 'Failed to update keyword stats' });
    }
  }
);

/**
 * Analyze report patterns - Runs daily to optimize suggestions
 */
export const analyzeReportPatterns = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1',
    timeZone: 'America/Los_Angeles'
  },
  async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Fetch recent reports
      const reportsSnapshot = await db
        .collection('reports')
        .where('timestamp', '>=', thirtyDaysAgo)
        .limit(500)
        .get();

      const reports = [];
      reportsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.originalText) {
          reports.push(data.originalText);
        }
      });

      if (reports.length < 10) {
        console.log('Not enough reports to analyze patterns');
        return;
      }

      // Use Gemini to find common patterns
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const sampleReports = reports.slice(0, 50).join('\n---\n');
      
      const prompt = `Analyze these community safety reports and identify common patterns, phrases, and templates that could help users write reports faster.

Reports:
${sampleReports}

Return a JSON object with:
{
  "commonTemplates": [
    {"template": "template text with {placeholder}", "category": "category", "icon": "emoji"}
  ],
  "frequentPhrases": ["phrase1", "phrase2"],
  "insights": "brief summary of patterns found"
}

Identify 5-8 templates and 10-15 frequent phrases.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to parse AI pattern analysis');
        return;
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Update report templates
      if (analysis.commonTemplates && analysis.commonTemplates.length > 0) {
        const batch = db.batch();
        
        for (const template of analysis.commonTemplates) {
          const templateId = template.template
            .substring(0, 30)
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '-');
          
          const templateRef = db.collection('reportTemplates').doc(templateId);
          const existingDoc = await templateRef.get();
          
          if (existingDoc.exists) {
            batch.update(templateRef, {
              usageCount: FieldValue.increment(1),
              lastUpdated: new Date()
            });
          } else {
            batch.set(templateRef, {
              template: template.template,
              category: template.category || 'other',
              icon: template.icon || '📋',
              usageCount: 1,
              keywords: template.template.toLowerCase().split(/\s+/).filter(w => w.length > 3),
              createdAt: new Date()
            });
          }
        }
        
        await batch.commit();
      }

      // Update frequent phrases as keywords
      if (analysis.frequentPhrases && analysis.frequentPhrases.length > 0) {
        const batch = db.batch();
        
        for (const phrase of analysis.frequentPhrases) {
          const phraseId = phrase.toLowerCase().replace(/\s+/g, '-');
          const phraseRef = db.collection('keywords').doc(phraseId);
          
          batch.set(phraseRef, {
            keyword: phrase.toLowerCase(),
            count: 10, // Boost discovered patterns
            lastUsed: new Date(),
            category: 'pattern-detected',
            source: 'ai-analysis'
          }, { merge: true });
        }
        
        await batch.commit();
      }

      console.log(`Pattern analysis complete. Found ${analysis.commonTemplates?.length || 0} templates and ${analysis.frequentPhrases?.length || 0} phrases.`);
    } catch (error) {
      console.error('Error analyzing report patterns:', error);
    }
  }
);

