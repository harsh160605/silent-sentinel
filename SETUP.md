# Setup Guide for Silent Sentinel

This guide provides step-by-step instructions for judges and evaluators to run Silent Sentinel locally.

---

## 🎯 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher): [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Firebase CLI**: Install with `npm install -g firebase-tools`
- **Google Cloud Account**: [Create one here](https://cloud.google.com/)
- **Firebase Project**: [Create one here](https://console.firebase.google.com/)

---

## 📋 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

**Expected output**: No errors, all packages installed successfully.

---

### Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it: `silent-sentinel` (or your choice)
4. Disable Google Analytics (optional for demo)
5. Click **"Create project"**

---

### Step 3: Enable Firebase Services

In your Firebase project console:

1. **Authentication**
   - Go to: Build → Authentication
   - Click "Get Started"
   - Enable "Anonymous" provider
   - Save

2. **Firestore Database**
   - Go to: Build → Firestore Database
   - Click "Create database"
   - Select "Start in test mode" (for demo)
   - Choose location (e.g., `us-central`)
   - Create

3. **Hosting** (optional, for deployment)
   - Go to: Build → Hosting
   - Click "Get Started"
   - Follow the wizard

---

### Step 4: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click the **Web icon** (`</>`)
4. Register app: name it `Silent Sentinel Web`
5. Copy the `firebaseConfig` object

It looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

### Step 5: Setup Google Cloud & APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project from the dropdown
3. Enable the following APIs:
   - **Google Maps JavaScript API**
   - **Generative Language API** (for Gemini)

#### Create API Keys:

**Google Maps API Key:**
1. Navigation Menu → APIs & Services → Credentials
2. Click "Create Credentials" → "API Key"
3. Copy the key
4. Click "Restrict Key"
   - Application restrictions: HTTP referrers
   - Add: `http://localhost:3000/*`
   - API restrictions: Google Maps JavaScript API
   - Save

**Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select your Firebase project
4. Copy the key

---

### Step 6: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Firebase Config (from Step 4)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Maps (from Step 5)
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key_here

# Gemini AI (from Step 5) - Will be set in Firebase later
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### Step 7: Initialize Firebase in Project

```bash
# Login to Firebase
firebase login

# Initialize project
firebase use --add

# Select your Firebase project from the list
# Give it an alias (e.g., 'default')
```

---

### Step 8: Deploy Firestore Rules & Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes (for efficient queries)
firebase deploy --only firestore:indexes
```

**Expected output**: 
```
✔ Deploy complete!
```

---

### Step 9: Configure Cloud Functions

Set the Gemini API key for Cloud Functions:

```bash
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

**Note**: Replace `YOUR_GEMINI_API_KEY` with your actual key from Step 5.

---

### Step 10: Run Development Servers

Open **TWO terminal windows**:

**Terminal 1 - Frontend:**
```bash
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in 500 ms
➜  Local:   http://localhost:3000/
```

**Terminal 2 - Cloud Functions (optional for full demo):**
```bash
cd functions
npm run serve
```

Expected output:
```
✔  functions: Loaded functions definitions...
✔  functions[us-central1-parseReport]: http function initialized...
```

---

### Step 11: Test the Application

1. Open browser: `http://localhost:3000`
2. You should see:
   - ✅ Welcome modal
   - ✅ Google Map (if API key is correct)
   - ✅ Sidebar with layer controls
   - ✅ "Anonymous mode active" status at bottom

3. Test location permission:
   - Browser will ask for location access
   - Allow or deny (both work)

4. Test report submission:
   - Click "Report Safety Concern"
   - Enter text: "Someone suspicious near library entrance at night"
   - Click "Next"
   - Review AI-parsed data
   - Click "Submit Report"
   - Map should update with new report

---

## 🔍 Troubleshooting

### Issue: Map doesn't load

**Solution**:
- Check `VITE_GOOGLE_MAPS_API_KEY` in `.env`
- Verify API is enabled in Google Cloud Console
- Check browser console for errors

### Issue: Firebase errors

**Solution**:
- Run `firebase login` again
- Check Firebase config in `.env`
- Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`

### Issue: Cloud Functions not working

**Solution**:
- Ensure you're running `npm run serve` in the `functions` directory
- Check Functions emulator is running on `http://localhost:5001`
- Update `VITE_CLOUD_FUNCTION_URL` in `.env` if needed

### Issue: AI parsing fails

**Solution**:
- Check Gemini API key is set: `firebase functions:config:get`
- Verify Generative Language API is enabled in Cloud Console
- Fallback parser will activate automatically if AI fails

---

## 🎬 Demo Flow for Judges

1. **Introduction** (1 min)
   - Show welcome modal explaining core principles
   - Emphasize privacy-first design

2. **Create Report** (2 min)
   - Demonstrate natural language input
   - Show AI extraction of risk level and summary
   - Submit report

3. **Map Visualization** (2 min)
   - Toggle different layers
   - Explain color coding
   - Show pattern detection (if available)

4. **Privacy Features** (1 min)
   - Highlight anonymous auth status
   - Explain auto-expiring reports
   - Demonstrate no-tracking approach

5. **Ethical Guardrails** (1 min)
   - Show moderation example (try submitting PII)
   - Explain pattern detection logic
   - Discuss authority bridge concept

---

## 📞 Support

For hackathon judges or evaluators encountering issues:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Ensure all environment variables are set correctly
4. Verify Firebase services are enabled

---

## 🚀 Quick Deploy (Optional)

To deploy to Firebase Hosting:

```bash
# Build production version
npm run build

# Deploy to Firebase
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

---

**Setup should take 15-20 minutes. Once running, the demo takes 5-7 minutes.**

