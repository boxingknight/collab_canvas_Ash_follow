import { useState } from 'react';
import useAuth from './hooks/useAuth';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Canvas from './components/Canvas/Canvas';
import AppLayout from './components/Layout/AppLayout';
import './App.css';

function App() {
  const { user, loading, logout } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show authentication forms if user is not logged in
  if (!user) {
    return showSignUp ? (
      <SignUp onSwitchToLogin={() => setShowSignUp(false)} />
    ) : (
      <Login onSwitchToSignup={() => setShowSignUp(true)} />
    );
  }

  // Show main app if user is authenticated
  return (
    <AppLayout user={user} onLogout={logout}>
      <Canvas />
    </AppLayout>
  );
}

export default App;
