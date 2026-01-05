# Firebase Setup Guide - Required Variables & Settings

## 1. Environment Variables (Already in your `.env.production`)

You need these 6 variables from Firebase Console:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### How to Get These Values:

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/project/get-it-done-901f7

2. **Click the gear icon ⚙️** next to "Project Overview"
   - Select "Project settings"

3. **Scroll down to "Your apps"** section
   - If you don't have a web app, click "Add app" → Web (</>) icon
   - If you have one, click on it

4. **Copy the config values:**
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",           // → NEXT_PUBLIC_FIREBASE_API_KEY
     authDomain: "...",           // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     projectId: "...",            // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
     storageBucket: "...",        // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     messagingSenderId: "...",    // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
     appId: "1:..."              // → NEXT_PUBLIC_FIREBASE_APP_ID
   };
   ```

## 2. Firebase Console Settings That MUST Be Enabled

### A. Enable Firestore Database

1. Go to: **Firestore Database** (left sidebar)
2. Click **"Create database"** if not created
3. Choose **"Start in test mode"** (we'll secure it with rules)
4. Select a location (choose closest to your users)

### B. Enable Anonymous Authentication

1. Go to: **Authentication** (left sidebar)
2. Click **"Get started"** if not set up
3. Click **"Sign-in method"** tab
4. Find **"Anonymous"** in the list
5. Click on it → **Enable** → **Save**

**This is critical!** Your app uses anonymous auth, so this MUST be enabled.

### C. Set Firestore Security Rules

1. Go to: **Firestore Database** → **Rules** tab
2. Your current rules should be:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /tasks/{taskId} {
         allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
         allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
         
         match /notes/{noteId} {
           allow read, write: if request.auth != null && get(/databases/$(database)/documents/tasks/$(taskId)).data.userId == request.auth.uid;
         }
       }
       
       match /categories/{catId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
3. Click **"Publish"** to save rules

### D. Create Firestore Indexes (if needed)

1. Go to: **Firestore Database** → **Indexes** tab
2. If you see errors about missing indexes, Firebase will provide a link to create them
3. Click the link and create the required indexes

## 3. Verify Your Current Setup

Your current values (from `.env.production`):
- ✅ Project ID: `get-it-done-901f7`
- ✅ API Key: Set
- ✅ Auth Domain: `get-it-done-901f7.firebaseapp.com`
- ✅ Storage Bucket: `get-it-done-901f7.firebasestorage.app`
- ✅ Messaging Sender ID: `126502209756`
- ✅ App ID: `1:126502209756:web:7d00df02f8d46d69334c19`

## 4. Quick Checklist

Before deploying, verify:

- [ ] Firestore Database is created
- [ ] Anonymous Authentication is **ENABLED**
- [ ] Firestore Rules are published (allow authenticated users)
- [ ] Environment variables are in `.env.production`
- [ ] Build includes environment variables: `npm run build`
- [ ] Deploy: `firebase deploy --only hosting`

## 5. Common Issues

### Issue: "User not authenticated"
**Solution:** Enable Anonymous Authentication in Firebase Console

### Issue: "Permission denied"
**Solution:** Check Firestore Rules allow `request.auth != null`

### Issue: "Firebase config is missing"
**Solution:** Verify `.env.production` has all 6 variables and rebuild

### Issue: "Firebase not initialized"
**Solution:** Check browser console for specific error, verify API key is correct

## 6. Testing Locally

1. Make sure `.env.local` has the same values as `.env.production`
2. Run: `npm run dev`
3. Open browser console (F12)
4. Look for: "✅ Firebase initialized successfully"
5. Check for any error messages

## 7. Testing After Deploy

1. Deploy: `npm run build && firebase deploy --only hosting`
2. Visit: https://get-it-done-901f7.web.app
3. Open browser console (F12)
4. Check for Firebase initialization messages
5. Try creating a task/category

