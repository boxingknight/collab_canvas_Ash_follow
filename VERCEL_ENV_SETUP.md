# Vercel Environment Variables Setup

## Quick Instructions

Your Firebase environment variables need to be added to Vercel for the deployed app to work.

### Steps:

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Select your project:** collabcanvas
3. **Navigate to:** Settings → Environment Variables
4. **Add each variable below** (select all three environments: Production, Preview, Development)

### Variables to Add:

| Variable Name | Value |
|--------------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyBEB0cYx65bUajFt1vrbolFDq4G6PAt0ps` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `collabcanvas-2ba10.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `collabcanvas-2ba10` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `collabcanvas-2ba10.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `495849289861` |
| `VITE_FIREBASE_APP_ID` | `1:495849289861:web:53830b46cbf962492a91ec` |

### After Adding Variables:

**Option 1: Redeploy via Dashboard**
- In Vercel dashboard → Deployments tab → Click "..." on latest deployment → "Redeploy"

**Option 2: Trigger new deployment**
```bash
cd /Users/ijaramil/Documents/collab_canvas_Ash_follow
git commit --allow-empty -m "chore: trigger redeploy with env vars"
git push
```

### Test After Deployment:

1. Open deployed app
2. Log in
3. Create shapes in Draw mode
4. Refresh page - shapes should persist! ✅
5. Open in another window - shapes should sync! ✅

---

**Why this is needed:**
- `.env.local` only works on your local machine
- Vercel needs these variables configured in its dashboard to access Firebase in production

