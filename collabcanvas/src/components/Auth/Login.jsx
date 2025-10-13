import { useState } from 'react';
import useAuth from '../../hooks/useAuth';

function Login({ onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error: authError } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      // User will be redirected automatically by App.jsx
    } catch (err) {
      setLocalError(getErrorMessage(err.code || err.message));
    } finally {
      setIsSubmitting(false);
    }
  }

  function getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      default:
        return 'Failed to log in. Please try again.';
    }
  }

  const displayError = localError || authError;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to CollabCanvas</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {displayError && (
            <div className="error-message">{displayError}</div>
          )}
          
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
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <button 
            onClick={onSwitchToSignup}
            className="link-button"
            disabled={isSubmitting}
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
