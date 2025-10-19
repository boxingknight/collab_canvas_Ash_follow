/**
 * Landing Page
 * 
 * Main marketing/landing page for CollabCanvas
 * Route: /
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Hero from '../../components/Landing/Hero';
import Features from '../../components/Landing/Features';
import Pricing from '../../components/Landing/Pricing';
import Footer from '../../components/Landing/Footer';
import '../../components/Landing/Landing.css';

function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="landing-page">
      {/* Top Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="nav-brand">
            <span className="brand-logo">🎨</span>
            <span className="brand-name">CollabCanvas</span>
          </div>
          
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="/docs" className="nav-link">Docs</a>
            <button 
              className="btn btn-ghost"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Page Sections */}
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}

export default Landing;

