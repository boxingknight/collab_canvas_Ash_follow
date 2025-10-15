# Environment Variables Setup Guide

## 🔐 Security First!

This project uses environment variables to store sensitive API keys. **Never commit `.env.local` to git!**

## Quick Setup

### Step 1: Copy the Template
```bash
cp .env.example .env.local
```

### Step 2: Fill in Your Keys

Open `.env.local` and replace the placeholder values with your actual keys.

---

## Firebase Configuration

### Where to Get Firebase Keys

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) → **Project Settings**
4. Scroll to "Your apps" section
5. Find your web app or create one
6. Copy all the config values

### Required Firebase Variables

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

**Note:** If you don't have a Realtime Database yet:
1. Go to **Realtime Database** in Firebase Console
2. Click **Create Database**
3. Choose a location
4. Start in **Test Mode** (we'll add security rules later)
5. Copy the database URL to `VITE_FIREBASE_DATABASE_URL`

---

## OpenAI Configuration

### Where to Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-`)
5. **Save it immediately** - you won't be able to see it again!

### Required OpenAI Variable

```env
VITE_OPENAI_API_KEY=sk-proj-...your-key-here
```

### ⚠️ Security Note for OpenAI Key

**Client-Side Exposure**: This API key will be visible in the browser because we're making client-side calls.

**Why this is acceptable for MVP:**
- Faster development (no backend needed)
- Good enough for demo/testing
- Firebase handles user authentication

**For Production:**
- Move OpenAI calls to backend (Cloud Functions)
- Use request signing/authentication
- Add rate limiting

**Protect Your Key:**
1. Set spending limits in [OpenAI Billing](https://platform.openai.com/account/billing/limits)
2. Monitor usage regularly
3. Rotate key if compromised
4. Never commit to git (it's already gitignored)

---

## Verification

### Check Files Exist
```bash
ls -la | grep .env
```

You should see:
- `.env.example` (committed to git)
- `.env.local` (gitignored, contains your keys)

### Check Git Ignore
```bash
git check-ignore .env.local
```

Should output: `.env.local` (confirming it's ignored)

### Test in Browser
1. Start dev server: `npm run dev`
2. Open browser console
3. Check environment variables are loaded:
```javascript
console.log('Firebase Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('OpenAI Key exists:', !!import.meta.env.VITE_OPENAI_API_KEY);
```

**Never log the full API key!**

---

## Troubleshooting

### "Cannot find module" error
- Make sure `.env.local` exists in `collabcanvas/` directory
- Check variable names start with `VITE_` (required by Vite)
- Restart dev server after adding variables

### Variables not loading
- Restart dev server (`npm run dev`)
- Check for syntax errors in `.env.local` (no spaces around `=`)
- Verify file is named exactly `.env.local` (not `.env.local.txt`)

### Firebase connection fails
- Check all Firebase variables are filled in
- Verify Firebase project is active in console
- Check Firebase Authentication is enabled
- Check Firestore and Realtime Database exist

### OpenAI API errors
- Verify API key starts with `sk-`
- Check OpenAI account has credits
- Verify no extra spaces in key
- Check spending limits aren't exceeded

---

## Security Checklist

- [ ] `.env.local` is in `.gitignore` (line 13: `*.local`)
- [ ] `.env.local` is in `.cursorignore` (line 13: `*.local`)
- [ ] `.env.example` is committed (template only, no real keys)
- [ ] `.env.local` has all required variables filled in
- [ ] Firebase project is properly configured
- [ ] OpenAI spending limits are set
- [ ] Never shared API keys in chat/email/slack
- [ ] Keys are not in any committed files

---

## Need Help?

### Firebase Issues
- [Firebase Documentation](https://firebase.google.com/docs/web/setup)
- [Firebase Console](https://console.firebase.google.com/)

### OpenAI Issues
- [OpenAI API Documentation](https://platform.openai.com/docs/introduction)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [OpenAI Billing](https://platform.openai.com/account/billing)

---

## Next Steps

After setting up environment variables:

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Test Firebase connection (login/signup should work)
4. Test AI service (PR #18 implementation)

Ready to build the AI-powered collaborative canvas! 🚀

