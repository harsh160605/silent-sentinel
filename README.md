# Silent Sentinel 🛡️

**Privacy-first hyper-local safety and civic intelligence platform**

Built for hackathon demonstration of ethical AI and community safety technology.

---

## 🎯 Core Philosophy

Silent Sentinel is **NOT**:
- ❌ A crime-tracking app
- ❌ A social media platform
- ❌ A surveillance tool
- ❌ A vigilante enabler
- ❌ A permanent fear map

Silent Sentinel **IS**:
- ✅ Privacy-first and consent-based
- ✅ Anonymous but accountable
- ✅ Community-driven intelligence
- ✅ Auto-expiring safety awareness
- ✅ Ethically designed from the ground up

---

## 🌟 Key Features

### 1. **Interactive Safety Mapping**
- Multi-layer Google Maps interface
- **Perception Layer**: User-reported feelings of unsafety
- **Crime Layer**: Verified incident reports
- **Pattern Layer**: AI-detected clusters from multiple reports
- Real-time visualization with risk-level color coding

### 2. **Natural Language Safety Reporting**
- Describe incidents in your own words (any language)
- Google Gemini AI extracts:
  - Risk level (Low/Medium/High)
  - Incident category
  - Concise summary
- Fallback logic if AI is unavailable
- AI moderation blocks harmful content automatically

### 3. **Consent-Based Location**
- Browser permission requested only when needed
- Exact location used ONLY for active report
- Can submit reports without location
- No background tracking ever
- No location history stored

### 4. **Anonymous Community Intelligence**
- Location-scoped anonymous discussions (Whisper Network)
- Firebase anonymous authentication
- No usernames or persistent profiles
- Verified presence without identity exposure

### 5. **AI Safety Guardrails**
- Auto-moderation using Google Gemini
- Blocks: hate speech, doxxing, PII, vigilante language
- Prevents naming and shaming
- Explainable AI decisions

### 6. **Pattern Detection**
- Cloud Functions cluster similar reports
- Escalates confidence with multiple reports
- Highlights high-risk zones
- Runs hourly to detect trends

### 7. **Authority Bridge**
- Aggregate anonymous reports for campus security/police
- Generate neutral, factual summaries
- Export functionality (no personal data)
- Professional briefings for law enforcement

### 8. **Proximity Awareness**
- Non-panic notifications when entering higher-risk zones
- Calm, informative alerts
- User-dismissible
- No fear-mongering

---

## 🛠️ Tech Stack

All Google technologies as required:

- **Frontend**: React + Vite
- **Maps**: Google Maps Platform (@react-google-maps/api)
- **Backend**: Firebase
  - Authentication (Anonymous)
  - Firestore (Database)
  - Cloud Functions (Serverless compute)
  - Hosting
- **AI**: Google Gemini Pro
  - Natural language understanding
  - Content moderation
  - Authority report generation
- **State Management**: Zustand
- **Icons**: Lucide React

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Google Cloud Account
- Firebase Project

### 1. Clone & Install

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Maps API Key (from Google Cloud Console)
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Cloud Functions environment (set via Firebase)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Setup Firebase

```bash
# Login to Firebase
firebase login

# Initialize project (if not already done)
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting

# Set Cloud Functions environment variables
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

### 4. Setup Google APIs

#### Enable APIs in Google Cloud Console:
1. **Google Maps JavaScript API**
2. **Google Maps Geocoding API**
3. **Generative Language API** (for Gemini)

#### Create API Keys:
- Maps API Key: Restrict to your domain
- Gemini API Key: For Cloud Functions use

### 5. Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 6. Run Development Server

```bash
# Frontend
npm run dev

# Cloud Functions (separate terminal)
npm run functions:dev
```

Visit: `http://localhost:3000`

---

## 📦 Deployment

### Deploy to Firebase Hosting

```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy

# Or deploy selectively
firebase deploy --only hosting
firebase deploy --only functions
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)               │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Google Maps │  │  Report Form │            │
│  │   + Layers   │  │   (Natural   │            │
│  │              │  │   Language)  │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│          Firebase (Backend Services)             │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Anonymous    │  │  Firestore   │            │
│  │ Auth         │  │  (NoSQL DB)  │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │       Cloud Functions (Node.js)           │  │
│  │  • parseReport (Gemini AI)               │  │
│  │  • moderateContent (Gemini AI)           │  │
│  │  • detectPatterns (Scheduled)            │  │
│  │  • cleanupExpiredReports (Scheduled)     │  │
│  │  • generateAuthorityReport (On-demand)   │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│         Google Gemini Pro (AI Layer)            │
│  • Natural Language Understanding               │
│  • Content Moderation                           │
│  • Report Summarization                         │
└─────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### Report Document

```javascript
{
  reportType: 'perception' | 'crime',
  riskLevel: 'low' | 'medium' | 'high',
  reason: string,           // AI-generated summary
  originalText: string,     // User's input
  location: {
    lat: number,
    lng: number,
    geohash: string        // For proximity queries
  },
  timestamp: Timestamp,
  expiresAt: Timestamp,    // Auto-delete after 30 days
  status: 'unverified' | 'community-verified' | 'official',
  aiParsed: boolean
}
```

### Pattern Document

```javascript
{
  location: {
    lat: number,
    lng: number,
    geohash: string
  },
  reportCount: number,
  confidence: number,      // 0.0 - 1.0
  reportIds: string[],
  lastUpdate: Timestamp
}
```

### Authority Report Document

```javascript
{
  geohash: string,
  reportCount: number,
  timeframe: {
    start: Timestamp,
    end: Timestamp
  },
  summary: string,        // AI-generated neutral summary
  generatedAt: Timestamp
}
```

---

## 🔒 Privacy & Security

### Privacy Measures

1. **Anonymous Authentication**
   - Firebase anonymous auth - no email, no password
   - No user profiles or persistent identity
   - Cannot track users across sessions

2. **Location Privacy**
   - Explicit consent required (browser prompt)
   - One-time location capture per report
   - No continuous tracking
   - Geohashing for proximity without exact coordinates

3. **Data Retention**
   - Reports auto-expire after 30 days
   - Scheduled Cloud Function deletes expired data
   - No historical archive

4. **Content Moderation**
   - AI blocks PII (names, emails, phone numbers)
   - Prevents doxxing and vigilantism
   - Removes hate speech

### Security Rules

Firestore security rules enforce:
- Authenticated users only (even if anonymous)
- Read-only access to patterns and authority reports
- Immutable reports (no updates after creation)
- Required fields validation

---

## 🎨 Design Decisions

### Why Anonymous?
- Removes fear of retaliation
- Encourages honest reporting
- Protects vulnerable users (students, marginalized groups)

### Why Auto-Expiring?
- Prevents permanent stigmatization of areas
- Reflects current conditions, not historical data
- Reduces database size

### Why Natural Language?
- Lower barrier to entry (no rigid forms)
- Multilingual support
- AI extracts structured data

### Why Google Tech Stack?
- Seamless integration across services
- Enterprise-grade reliability
- Strong AI capabilities with Gemini
- Excellent mapping infrastructure

---

## 🧪 Testing & Demo

### Demo Scenarios

1. **Report Flow**
   - Click "Report Safety Concern"
   - Enter natural language description
   - Allow location (or skip)
   - Review AI parsing
   - Submit

2. **Map Visualization**
   - Toggle layers (Perception, Crime, Patterns)
   - View risk-level color coding
   - Observe clustering

3. **Proximity Alerts**
   - Move map to high-risk area
   - Simulate user location
   - See non-panic advisory

4. **Authority Report**
   - Call Cloud Function with geohash
   - Review neutral summary
   - Export for authorities

---

## 📝 Future Enhancements

*For post-hackathon development:*

- [ ] Multi-language UI (i18n)
- [ ] Real-time chat (Whisper Network)
- [ ] Campus integration (SSO for universities)
- [ ] Mobile apps (React Native)
- [ ] Apple/Google Maps integration
- [ ] Advanced pattern detection (ML clustering)
- [ ] Community verification system
- [ ] Accessibility improvements (WCAG 2.1 AA)
- [ ] Progressive Web App (PWA) offline support

---

## 🤝 Contributing

This is a hackathon project. If you're interested in contributing to ethical safety tech:

1. Respect the core philosophy (privacy-first, no surveillance)
2. Test all AI guardrails thoroughly
3. Document ethical considerations
4. Focus on accessibility

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

- Google Cloud Platform for infrastructure
- Firebase for seamless backend services
- Google Gemini for responsible AI capabilities
- Community safety advocates for inspiration

---

## ⚠️ Disclaimer

This is a hackathon MVP demonstrating ethical AI and privacy-first design. For production use:

- Conduct thorough security audits
- Implement rate limiting
- Add abuse reporting mechanisms
- Partner with local authorities
- Conduct community feedback sessions
- Legal review for liability

**Silent Sentinel is a tool for awareness, not emergency response. Always call 911 or local emergency services for immediate threats.**

---

## 📞 Contact

For hackathon judges or questions:

**Project**: Silent Sentinel  
**Category**: Google Technologies / Social Good  
**Focus**: Ethical AI + Community Safety

---

Built with ❤️ and a commitment to privacy, safety, and community empowerment.

