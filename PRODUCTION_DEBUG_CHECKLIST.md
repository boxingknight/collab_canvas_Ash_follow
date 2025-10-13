# 🔥 Production Firestore Debug Checklist

## Issue: Works Locally, Fails in Production with 400 Errors

---

## ✅ Step 1: Verify You're Signed In on Production

### Check:
1. Open your deployed app: https://your-app.vercel.app
2. Are you logged in? Check the header for your email/logout button
3. Open browser console (F12) → Console tab
4. Look for: `Firebase Config` → Does it show `projectId: "collabcanvas-2ba10"`?

### Action:
- [ ] **Confirmed:** I am logged in on the production app
- [ ] **User email showing in header:** ________________

---

## ✅ Step 2: Add Vercel Domain to Firebase Auth

### Why:
Your Firestore rules require `request.auth != null`, which means users must be authenticated. Firebase Auth must recognize your Vercel domain.

### Steps:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **collabcanvas-2ba10**
3. Go to **Authentication** → **Settings** tab
4. Click **Authorized domains**
5. Check if your Vercel domain is listed (e.g., `collabcanvas.vercel.app`)

### Your Vercel Domain:
To find it:
- Go to Vercel Dashboard → Your project → Deployments
- Copy the domain from the latest deployment (e.g., `collabcanvas-abc123.vercel.app`)

### Action:
- [ ] **Found my Vercel domain:** ________________________________
- [ ] **Verified it's in Firebase Authorized domains list**
- [ ] **If NOT in list:** Click "Add domain" and add it
- [ ] **Also add:** Any custom domains you're using

**CRITICAL:** Without this, authentication won't work on production and all Firestore operations will fail!

---

## ✅ Step 3: Check Firebase App Check

### Why:
If App Check is enabled, production requests will be blocked without proper initialization.

### Steps:
1. In Firebase Console → Select **collabcanvas-2ba10**
2. In left sidebar, look for **App Check**
3. Click on it

### What do you see?

#### Option A: "Get started" button
- [ ] **App Check is NOT enabled** → ✅ Good! This is not the issue.

#### Option B: App Check is enabled with web app listed
- [ ] **App Check IS enabled** → ⚠️ This might be the problem!

### If App Check is Enabled:
You need to either:
1. **Disable it** (for MVP/testing)
   - Go to App Check → Click your web app → Disable
2. **OR implement App Check in your code** (more complex)

### Action:
- [ ] **App Check status:** ☐ Enabled ☐ Disabled

---

## ✅ Step 4: Verify Firestore Database Exists

### Steps:
1. Firebase Console → **Firestore Database**
2. Do you see collections and documents?
3. Specifically, do you see a **shapes** collection with documents?

### Action:
- [ ] **Database exists with data:** Yes, I see ____ shapes in the collection
- [ ] **Database location:** ________________ (e.g., us-central1)

---

## ✅ Step 5: Test Firestore Rules in Simulator

### Steps:
1. Firebase Console → **Firestore Database** → **Rules** tab
2. Click **Rules Playground** (or **Simulator** button at top)
3. Configure the test:
   ```
   Location: /shapes/{shapeId}
   
   Authenticated: ✓ YES
   Provider: Email/Password
   UID: test-user-123
   
   Operation: get (read)
   ```
4. Click **Run**

### What happens?

- [ ] ✅ **Allowed** - Rules are working!
- [ ] ❌ **Denied** - Rules have an issue!

### If Denied:
Check your rules are EXACTLY:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shapes/{shapeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.createdBy == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

### Action:
- [ ] **Simulator test result:** ☐ Allowed ☐ Denied
- [ ] **If denied, error message:** ________________________________

---

## ✅ Step 6: Check Environment Variables in Vercel

### Steps:
1. Go to Vercel Dashboard → Your project
2. **Settings** → **Environment Variables**
3. Verify ALL 6 variables exist:

### Required Variables:
- [ ] `VITE_FIREBASE_API_KEY` (all environments: Production, Preview, Development)
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` (all environments)
- [ ] `VITE_FIREBASE_PROJECT_ID` (all environments)
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` (all environments)
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` (all environments)
- [ ] `VITE_FIREBASE_APP_ID` (all environments)

### Verify Values:
Compare with your local `.env.local` file:
```bash
cd /Users/ijaramil/Documents/collab_canvas_Ash_follow/collabcanvas
cat .env.local
```

### Action:
- [ ] **All 6 variables exist in Vercel**
- [ ] **All are enabled for Production environment**
- [ ] **Values match local .env.local**

---

## ✅ Step 7: Check Production Logs

### Steps:
1. Open your deployed app
2. Open browser console (F12 → Console)
3. Refresh the page
4. Look for these specific logs:

### Expected Logs:
```
🔍 Environment Check: {...}
🔥 Firebase Config: {projectId: "collabcanvas-2ba10", ...}
Firebase initialized: {...}
🧪 TESTING: Attempting simple getDocs() call...
```

### What do you see?

#### Scenario A: getDocs SUCCESS ✅
```
🧪 TEST SUCCESS! getDocs returned X documents
```
→ **Firestore works! The issue is with real-time listeners only**

#### Scenario B: getDocs FAILS with permission-denied ❌
```
🧪 TEST FAILED! getDocs error:
🧪 Error code: permission-denied
```
→ **Auth or rules issue**

#### Scenario C: getDocs FAILS with unavailable ❌
```
🧪 Error code: unavailable
```
→ **Firestore API not enabled or network issue**

### Action:
- [ ] **Console log result:** ________________________________
- [ ] **getDocs test:** ☐ Success ☐ Failed
- [ ] **If failed, error code:** ________________________________

---

## ✅ Step 8: Verify User Authentication Token

### Steps:
Add this temporary log to check if the user is properly authenticated:

1. In your deployed app's console, run:
```javascript
firebase.auth().currentUser
```

OR check the logs for user info from `useAuth` hook.

### What to verify:
- User object exists
- Has a `uid` property
- `email` is correct

### Action:
- [ ] **User object exists in production:** Yes/No
- [ ] **User UID:** ________________________________
- [ ] **User email:** ________________________________

---

## ✅ Step 9: Force Complete Rebuild

### Why:
Vercel might be using a cached build from before env vars were added.

### Steps:
1. Vercel Dashboard → Your project → **Deployments**
2. Click "..." on latest deployment
3. Click **"Redeploy"**
4. **IMPORTANT:** Make sure "Use existing Build Cache" is **UNCHECKED**
5. Click **Redeploy**

### Action:
- [ ] **Performed fresh rebuild without cache**
- [ ] **Waited for deployment to complete (~2 min)**
- [ ] **Tested app after fresh build**

---

## 🎯 Most Likely Issues (In Order of Probability)

### 1. **Vercel Domain Not in Firebase Authorized Domains** (90% likelihood)
- Symptom: Auth works, but Firestore fails with 400/permission errors
- Fix: Step 2 above

### 2. **Env Variables Not Properly Loaded** (8% likelihood)
- Symptom: Firebase config shows undefined values
- Fix: Steps 6 and 9 above

### 3. **App Check Enabled** (2% likelihood)
- Symptom: All requests blocked with 400
- Fix: Step 3 above

---

## 📋 Quick Action Summary

**Do these in order:**

1. ✅ Add Vercel domain to Firebase Authorized domains (Step 2)
2. ✅ Check App Check is disabled (Step 3)
3. ✅ Test Firestore rules in simulator (Step 5)
4. ✅ Force rebuild without cache (Step 9)
5. ✅ Check production console logs (Step 7)

---

## 🆘 Report Your Findings

After going through this checklist, report:

1. **Vercel domain:** ________________________________
2. **Is domain in Firebase Authorized domains?** Yes/No
3. **App Check status:** Enabled/Disabled
4. **getDocs test result:** Success/Failed/Error: ____________
5. **Any error messages from console:** ________________________________

This will tell us exactly what needs to be fixed!

