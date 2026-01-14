# Architecture Document

**Silent Sentinel** - Technical Architecture & Design Decisions

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   React UI  │  │  Google Map │  │   Zustand   │        │
│  │  Components │  │  Rendering  │  │  State Mgmt │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                           ▼ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE SERVICES                         │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Anonymous  │  │  Firestore  │  │   Hosting   │        │
│  │    Auth     │  │  Database   │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │           CLOUD FUNCTIONS (Node.js)               │      │
│  │                                                    │      │
│  │  ┌────────────────┐  ┌────────────────────┐     │      │
│  │  │  parseReport   │  │ moderateContent    │     │      │
│  │  │  (On Request)  │  │ (On Request)       │     │      │
│  │  └────────────────┘  └────────────────────┘     │      │
│  │                                                    │      │
│  │  ┌────────────────┐  ┌────────────────────┐     │      │
│  │  │ detectPatterns │  │ cleanupExpired     │     │      │
│  │  │  (Scheduled)   │  │  (Scheduled)       │     │      │
│  │  └────────────────┘  └────────────────────┘     │      │
│  │                                                    │      │
│  │  ┌─────────────────────────────────────────┐     │      │
│  │  │     generateAuthorityReport             │     │      │
│  │  │          (On Request)                    │     │      │
│  │  └─────────────────────────────────────────┘     │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ▼ API
┌─────────────────────────────────────────────────────────────┐
│                  GOOGLE AI SERVICES                          │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │   Google Gemini     │  │   Google Maps API   │          │
│  │   (AI Processing)   │  │   (Geolocation)     │          │
│  └─────────────────────┘  └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Architecture

### Frontend Components

```
src/
├── components/
│   ├── MapView.jsx              # Google Maps integration
│   ├── Sidebar.jsx              # Layer controls & stats
│   ├── ReportModal.jsx          # Natural language report form
│   ├── WelcomeModal.jsx         # Onboarding & principles
│   └── ProximityAlert.jsx       # Non-panic safety notifications
├── services/
│   ├── firebase.js              # Firebase initialization
│   ├── geolocation.js           # Consent-based location
│   ├── reportService.js         # CRUD operations
│   └── aiService.js             # AI integration layer
├── stores/
│   ├── authStore.js             # Anonymous auth state
│   └── mapStore.js              # Map state & layer toggles
├── styles/
│   └── index.css                # Global styles
├── App.jsx                      # Root component
└── main.jsx                     # Entry point
```

---

## 🔄 Data Flow

### Report Submission Flow

```
User Input (Natural Language)
        ▼
┌─────────────────┐
│  ReportModal    │ → User types description
└─────────────────┘
        ▼
┌─────────────────┐
│ Moderation Check│ → Cloud Function: moderateContent()
└─────────────────┘
        ▼
    Approved?
        │
        ├─ Yes ───────────────────┐
        │                          ▼
        │                  ┌──────────────┐
        │                  │ Parse Report │ → Cloud Function: parseReport()
        │                  └──────────────┘
        │                          ▼
        │                  ┌──────────────┐
        │                  │ Extract Data │ → riskLevel, reason, category
        │                  └──────────────┘
        │                          ▼
        │                  ┌──────────────┐
        │                  │ User Review  │ → Show parsed results
        │                  └──────────────┘
        │                          ▼
        │                  ┌──────────────┐
        │                  │Submit to DB  │ → Firestore: reports collection
        │                  └──────────────┘
        │                          ▼
        │                  ┌──────────────┐
        │                  │ Update Map   │ → Real-time marker added
        │                  └──────────────┘
        │
        └─ No ────────────────────┐
                                  ▼
                          ┌──────────────┐
                          │ Show Error   │ → Display moderation reason
                          └──────────────┘
```

### Map Rendering Flow

```
User Opens App
        ▼
┌──────────────────┐
│ Request Location │ → Browser geolocation API (consent-based)
└──────────────────┘
        ▼
┌──────────────────┐
│ Load Google Maps │ → Initialize map at user location or default
└──────────────────┘
        ▼
┌──────────────────┐
│  Fetch Reports   │ → Query Firestore by geohash
└──────────────────┘
        ▼
┌──────────────────┐
│ Fetch Patterns   │ → Query Firestore for AI-detected clusters
└──────────────────┘
        ▼
┌──────────────────┐
│ Render Layers    │ → Based on user's layer toggles
└──────────────────┘
        │
        ├─ Perception Layer → Circles (semi-transparent)
        ├─ Crime Layer      → Markers (solid)
        └─ Pattern Layer    → Clusters (gradient)
```

---

## 🗄️ Database Schema

### Firestore Collections

#### `reports`

```javascript
{
  id: "auto-generated",
  reportType: "perception" | "crime",
  riskLevel: "low" | "medium" | "high",
  reason: string,              // AI-generated summary (150 chars max)
  originalText: string,        // User's input
  location: {
    lat: number,
    lng: number,
    geohash: string           // 6-char geohash for proximity
  },
  timestamp: Timestamp,
  expiresAt: Timestamp,        // timestamp + 30 days
  status: "unverified" | "community-verified" | "official",
  aiParsed: boolean,           // true if Gemini succeeded
  category: string             // e.g., "harassment", "theft"
}
```

**Indexes:**
- `location.geohash` + `timestamp` (DESC)
- `reportType` + `timestamp` (DESC)
- `riskLevel` + `timestamp` (DESC)

---

#### `patterns`

```javascript
{
  id: "auto-generated",
  location: {
    lat: number,              // Cluster centroid
    lng: number,
    geohash: string           // 4-char prefix for area
  },
  reportCount: number,        // Number of reports in cluster
  confidence: number,         // 0.0 - 1.0 (reportCount / 10, capped)
  reportIds: string[],        // Array of report IDs in cluster
  lastUpdate: Timestamp,
  radius: number              // Cluster radius in meters (default 200)
}
```

**Indexes:**
- `location.geohash` + `confidence` (DESC)

---

#### `authority_reports`

```javascript
{
  id: "auto-generated",
  geohash: string,            // Target area
  reportCount: number,
  timeframe: {
    start: Timestamp,
    end: Timestamp
  },
  summary: string,            // AI-generated neutral summary
  generatedAt: Timestamp
}
```

---

#### `user_preferences` (future)

```javascript
{
  id: "user_uid",
  notificationRadius: number, // meters
  enableProximityAlerts: boolean,
  preferredLanguage: string
}
```

---

## 🔐 Security Architecture

### Firebase Security Rules

**Key Principles:**
1. All reads require authentication (even anonymous)
2. Reports are immutable once created
3. Patterns and authority reports are read-only for clients
4. Field validation enforced at database level

**Rules Highlights:**

```javascript
// Anyone can read reports (transparency)
allow read: if true;

// Authenticated users can create reports
allow create: if isAuthenticated() 
           && request.resource.data.keys().hasAll([...required fields...])
           && request.resource.data.riskLevel in ['low', 'medium', 'high'];

// No updates or deletions (immutability)
allow update: if false;
allow delete: if false;
```

---

### Privacy Guarantees

1. **Anonymous Authentication**
   - No email, password, or personal info
   - Firebase generates random UID
   - Cannot link reports to user identity

2. **Location Privacy**
   - Browser geolocation API (user consent required)
   - One-time capture (not continuous)
   - Geohashing for approximate location storage
   - No IP address logging

3. **Data Retention**
   - Auto-expiry: 30 days per report
   - Daily cleanup job (Cloud Function)
   - No archival or backup of expired data

4. **Content Safety**
   - AI moderation blocks PII
   - Regex patterns for phone/email/SSN
   - No names or addresses allowed

---

## 🤖 AI Integration

### Google Gemini Pro Usage

#### 1. Natural Language Parsing

**Function:** `parseReport`

**Input:**
```json
{
  "text": "Someone has been following students near the library...",
  "language": "en"
}
```

**Prompt Strategy:**
```
You are a safety analyst. Extract:
1. Risk Level: low/medium/high
2. Reason: concise summary (150 chars)
3. Category: harassment, theft, assault, etc.

Respond in JSON format.
```

**Output:**
```json
{
  "riskLevel": "medium",
  "reason": "Reports of someone following students near library entrance",
  "category": "harassment",
  "aiParsed": true
}
```

**Fallback:** Keyword-based classification if AI fails.

---

#### 2. Content Moderation

**Function:** `moderateContent`

**Input:**
```json
{
  "text": "User's report content..."
}
```

**Prompt Strategy:**
```
You are a content moderator. Check for:
- PII (names, emails, phone numbers)
- Hate speech
- Calls for violence
- False accusations
- Doxxing

Respond: { "approved": true/false, "reason": "..." }
```

**Output:**
```json
{
  "approved": false,
  "reason": "Content contains personal phone number"
}
```

**Fallback:** Regex patterns for PII + keyword blacklist.

---

#### 3. Authority Report Generation

**Function:** `generateAuthorityReport`

**Input:**
```json
{
  "geohash": "9q8y",
  "days": 7
}
```

**Prompt Strategy:**
```
Generate a neutral, factual summary for local authorities:
- Number of reports and timeframe
- Key patterns and trends
- High-risk areas
- Remain neutral and protect anonymity
```

**Output:**
```json
{
  "reportId": "abc123",
  "reportCount": 47,
  "summary": "Over the past 7 days, 47 safety concerns were reported in the campus area..."
}
```

---

## ⚙️ Cloud Functions

### HTTP Functions (On-Demand)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `parseReport` | HTTP POST | Parse natural language report |
| `moderateContent` | HTTP POST | Check content for violations |
| `generateAuthorityReport` | HTTP POST | Create summary for authorities |

### Scheduled Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `detectPatterns` | Every 1 hour | Cluster similar reports |
| `cleanupExpiredReports` | Every 24 hours | Delete reports older than 30 days |

---

## 🗺️ Geospatial Strategy

### Geohashing

**Why?**
- Efficient proximity queries
- No need for expensive geo-libraries
- Firestore-native indexing

**Implementation:**
```javascript
generateGeohash(lat, lng, precision = 6)
```

**Precision Levels:**
- 4 chars: ~20 km × 20 km (for patterns)
- 6 chars: ~0.6 km × 1.2 km (for individual reports)

**Query Strategy:**
```javascript
// Fetch all reports in area starting with geohash prefix
where('location.geohash', '>=', 'prefix')
where('location.geohash', '<=', 'prefix' + '\uf8ff')
```

---

## 🎨 UI/UX Design Principles

### Color Coding

| Risk Level | Color | Hex | Use Case |
|------------|-------|-----|----------|
| Low | Green | `#10b981` | Minor concerns |
| Medium | Amber | `#f59e0b` | Caution advised |
| High | Red | `#ef4444` | Immediate threat |
| Pattern | Purple | `#8b5cf6` | AI-detected cluster |

### Calm Design

- **No sirens or alarms**: Proximity alerts are informative, not alarming
- **Soft colors**: Gradients and transparency reduce anxiety
- **Clear language**: "Safety Advisory" not "DANGER"
- **User control**: All alerts dismissible

---

## 🧪 Testing Strategy

### Unit Tests (Future)

- `geolocation.js`: Distance calculations, geohash generation
- `aiService.js`: Fallback parsers, moderation logic
- `reportService.js`: Data transformation, query building

### Integration Tests (Future)

- Report submission end-to-end
- AI parsing with mock Gemini responses
- Firestore rules validation

### Manual Testing (Current)

1. Report flow with various inputs
2. Layer toggles and map rendering
3. Location permission deny/allow
4. Moderation edge cases (PII, profanity)
5. Proximity alert triggers

---

## 📊 Performance Considerations

### Frontend Optimization

- **Code splitting**: Dynamic imports for modals
- **Lazy loading**: Map markers render on demand
- **Debouncing**: Map center change events (500ms)
- **Caching**: Firestore offline persistence enabled

### Backend Optimization

- **Indexed queries**: All Firestore queries use indexes
- **Geohash prefixes**: Limit search radius
- **Cloud Functions**: Stateless, auto-scaling
- **Batch operations**: Pattern detection uses batched writes

### Scalability

| Metric | Target | Current |
|--------|--------|---------|
| Reports/day | 10,000 | N/A (demo) |
| Concurrent users | 1,000 | N/A (demo) |
| Map load time | < 2s | ~1s (tested) |
| AI parse time | < 3s | ~2s (avg) |

---

## 🔮 Future Architecture Enhancements

1. **Real-time Subscriptions**
   - Use Firestore `onSnapshot` for live updates
   - WebSocket connections for chat

2. **Advanced ML**
   - Vertex AI for pattern detection
   - Custom models for local threat classification

3. **Multi-region**
   - Deploy Cloud Functions to multiple regions
   - Firestore multi-region replication

4. **Edge Computing**
   - Cloudflare Workers for API gateway
   - Edge caching for static assets

5. **Microservices**
   - Separate services for AI, reporting, mapping
   - GraphQL API for flexible queries

---

## 📚 Technology Choices

| Decision | Rationale |
|----------|-----------|
| React | Component-based, large ecosystem, fast rendering |
| Vite | Fast dev server, modern build tool |
| Firebase | All-in-one Google backend, seamless integration |
| Zustand | Lightweight state management, no boilerplate |
| Google Maps | Best-in-class mapping, required by hackathon |
| Gemini Pro | Latest Google AI, strong NLP capabilities |
| Lucide React | Modern icons, tree-shakeable |

---

## 🛡️ Ethical Safeguards

### Built-in Protections

1. **Anti-Vigilantism**
   - AI blocks calls to action
   - No "witch hunt" language allowed
   - Moderation emphasizes reporting, not confrontation

2. **Anti-Discrimination**
   - No demographic profiling
   - Bias detection in AI summaries
   - Community guidelines enforcement

3. **Accountability**
   - Reports are anonymous but traceable to Firebase UID
   - Abuse reporting mechanism (future)
   - Authority bridge for escalation

4. **Transparency**
   - Open-source code
   - Explainable AI decisions
   - Clear privacy policy

---

Built with ethical AI principles and privacy-first design.

