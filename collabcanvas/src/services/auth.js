import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Sign up a new user with email, password, and display name
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name
 * @returns {Promise<Object>} User credentials
 */
export async function signup(email, password, displayName) {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update user profile with display name
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    return userCredential;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Sign in an existing user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} User credentials
 */
export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

/**
 * Get the current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<Object>} User credentials
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}
