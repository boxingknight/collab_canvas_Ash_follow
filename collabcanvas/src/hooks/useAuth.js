import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { login as loginService, signup as signupService, logout as logoutService } from '../services/auth';

/**
 * Custom hook to manage authentication state
 * @returns {Object} Authentication state and methods
 */
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  /**
   * Sign up a new user
   * @param {string} email 
   * @param {string} password 
   * @param {string} displayName 
   */
  async function signup(email, password, displayName) {
    try {
      setError(null);
      setLoading(true);
      await signupService(email, password, displayName);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Log in an existing user
   * @param {string} email 
   * @param {string} password 
   */
  async function login(email, password) {
    try {
      setError(null);
      setLoading(true);
      await loginService(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Log out the current user
   */
  async function logout() {
    try {
      setError(null);
      await logoutService();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  return {
    user,
    loading,
    error,
    signup,
    login,
    logout
  };
}

export default useAuth;
