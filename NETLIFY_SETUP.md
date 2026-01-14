# Netlify Configuration for Silent Sentinel

To fix the "Firebase not configured" errors on your deployed site, you need to add your `.env` variables to Netlify's Environment Variables settings.

## 📋 Exact Keys to Add

Go to **Site Settings** > **Environment variables** in Netlify and add the following keys. **Copy the values exactly from your local `.env` file.**

| Key | Example Value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `AIzaSyB...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:abcdef...` |
| `VITE_GOOGLE_MAPS_API_KEY` | `AIzaSyC...` |
| `VITE_GEMINI_API_KEY` | `AIzaSyD...` |

> [!IMPORTANT]
> - All variable names **MUST** start with `VITE_` otherwise the frontend code cannot see them.
> - After adding these variables, you must **Trigger a new deploy** (Deployments > Trigger deploy > Clear cache and deploy site) for the changes to take effect.

## 🔐 Google Maps Restrictions
If your map still doesn't load on Netlify, ensured your Google Maps API key allows your Netlify domain:
1. Go to [Google Cloud Credentials](https://console.cloud.google.com/google/maps-apis/credentials)
2. Click your API Key
3. Under "Website restrictions", add your Netlify URL: `https://your-site-name.netlify.app/*`
