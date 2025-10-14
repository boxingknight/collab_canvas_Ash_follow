import { useState } from 'react';
import useAuth from '../../hooks/useAuth';

function SignUp({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, loginWithGoogle, error: authError } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!email || !password || !confirmPassword || !displayName) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (displayName.length < 2) {
      setLocalError('Display name must be at least 2 characters');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      await signup(email, password, displayName);
      // User will be redirected automatically by App.jsx
    } catch (err) {
      setLocalError(getErrorMessage(err.code || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setLocalError('');
    try {
      setIsSubmitting(true);
      await loginWithGoogle();
      // User will be redirected automatically by App.jsx
    } catch (err) {
      setLocalError(getErrorMessage(err.code || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  function getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      default:
        return 'Failed to create account. Please try again.';
    }
  }

  const displayError = localError || authError;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up for CollabCanvas</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {displayError && (
            <div className="error-message">{displayError}</div>
          )}
          
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              disabled={isSubmitting}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="btn-google"
          disabled={isSubmitting}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {isSubmitting ? 'Signing up...' : 'Sign up with Google'}
        </button>

        <p className="auth-switch">
          Already have an account?{' '}
          <button 
            onClick={onSwitchToLogin}
            className="link-button"
            disabled={isSubmitting}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
