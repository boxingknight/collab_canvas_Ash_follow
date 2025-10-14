# Google OAuth Setup Guide

## Overview
This guide explains how to enable Google OAuth authentication for CollabCanvas.

## Prerequisites
- Firebase project already created
- Firebase Console access

## Setup Steps

### 1. Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** from the left sidebar
4. Click on the **Sign-in method** tab
5. Find **Google** in the providers list
6. Click on **Google** to expand it
7. Toggle the **Enable** switch to ON
8. Set a **Project support email** (required by Google)
   - This is a public-facing email that users will see
   - Can be your email or a support email
9. Click **Save**

### 2. Add Authorized Domains (if needed)

Firebase automatically authorizes:
- `localhost` (for development)
- Your Firebase Hosting domain (e.g., `your-app.web.app`)

If you're using custom domains or Vercel, add them:
1. Stay in **Authentication > Sign-in method**
2. Scroll down to **Authorized domains**
3. Click **Add domain**
4. Enter your domain (e.g., `your-app.vercel.app`)
5. Click **Add**

### 3. Test the Integration

1. Start your development server:
   ```bash
   cd collabcanvas
   npm run dev
   ```

2. Navigate to `http://localhost:5173`
3. You should see the login page
4. Click "Sign in with Google" button
5. A Google sign-in popup should appear
6. Select your Google account
7. You should be redirected to the canvas

### 4. Verify User Data

After signing in with Google:
- The user's display name will be their Google account name
- The user's email will be their Google email
- No password is stored (handled by Google)
- User profile photo is available via `user.photoURL` (not currently used)

## Code Changes Made

### Files Modified:
1. **src/services/auth.js**
   - Added `loginWithGoogle()` function
   - Uses `signInWithPopup` and `GoogleAuthProvider`

2. **src/hooks/useAuth.js**
   - Exposed `loginWithGoogle` method
   - Same error handling as email/password login

3. **src/components/Auth/Login.jsx**
   - Added "Sign in with Google" button
   - Google logo SVG included
   - Proper error handling

4. **src/components/Auth/SignUp.jsx**
   - Added "Sign up with Google" button
   - Same UI/UX as Login component

5. **src/index.css**
   - Added `.btn-google` styles
   - Added `.auth-divider` styles
   - Added light mode styles for both

## Features

- **One-click sign-in**: Users can sign in with their Google account
- **No password management**: Google handles authentication
- **Display name auto-populated**: Uses Google account name
- **Works on both Login and SignUp**: Same button on both pages
- **Responsive design**: Button works on mobile and desktop
- **Error handling**: Proper error messages for failed sign-ins
- **Loading states**: Button shows "Signing in..." during auth

## Common Issues

### Issue: "This app is not verified"
**Solution**: This appears during development. Click "Advanced" → "Go to [app name] (unsafe)" to continue. For production, you'll need to verify your app with Google.

### Issue: "popup_closed_by_user"
**Solution**: User closed the popup. This is normal behavior - just show a message like "Sign-in cancelled".

### Issue: "auth/popup-blocked"
**Solution**: Browser blocked the popup. Ask user to allow popups or use redirect method instead.

### Issue: Email already exists
**Solution**: User already signed up with email/password using that email. Firebase handles this automatically by linking accounts.

## Security Notes

- Google OAuth tokens are handled securely by Firebase
- No API keys needed in frontend (uses Firebase Auth)
- Users can revoke access via their Google account settings
- Firebase automatically manages token refresh

## Next Steps

Once Google OAuth is working:
1. Test with multiple accounts
2. Test sign-in and sign-up flows
3. Verify display names appear correctly
4. Test in production after deployment
5. Consider adding profile photo display (available via `user.photoURL`)

## Testing Checklist

- [ ] Google provider enabled in Firebase Console
- [ ] Support email configured
- [ ] localhost authorized
- [ ] Production domain authorized (if applicable)
- [ ] Login page shows Google button
- [ ] SignUp page shows Google button
- [ ] Button shows Google logo
- [ ] Clicking button opens Google popup
- [ ] Can select Google account
- [ ] Successfully redirects to canvas
- [ ] Display name shows correctly
- [ ] Can log out and log back in
- [ ] Works in different browsers
- [ ] Works on mobile (if applicable)

## Documentation

For more details, see:
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/google-signin)
- [Google Sign-In Branding Guidelines](https://developers.google.com/identity/branding-guidelines)

