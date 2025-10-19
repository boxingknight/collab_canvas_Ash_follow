/**
 * Hero Section Component
 * 
 * Main hero section for landing page with headline, CTA, and visual
 */

import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Design Together,
            <br />
            <span className="hero-title-gradient">Build Faster</span>
          </h1>
          
          <p className="hero-subtitle">
            The AI-powered collaborative canvas for modern teams.
            Create, share, and iterate in real-time with intelligent design assistance.
          </p>

          <div className="hero-cta">
            <button 
              className="btn btn-primary btn-large"
              onClick={() => navigate('/signup')}
            >
              Get Started Free
            </button>
            <button 
              className="btn btn-secondary btn-large"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
            >
              Learn More
            </button>
          </div>

          <p className="hero-caption">
            No credit card required • Unlimited canvases • AI included
          </p>
        </div>

        <div className="hero-visual">
          <div className="hero-demo-box">
            <div className="demo-canvas">
              {/* Animated demo preview */}
              <div className="demo-shape demo-rect" style={{ 
                left: '20%', top: '30%', width: '120px', height: '80px',
                background: '#3b82f6'
              }} />
              <div className="demo-shape demo-circle" style={{ 
                left: '55%', top: '25%', width: '90px', height: '90px',
                background: '#10b981', borderRadius: '50%'
              }} />
              <div className="demo-shape demo-rect" style={{ 
                left: '35%', top: '60%', width: '100px', height: '60px',
                background: '#f59e0b'
              }} />
              
              {/* Cursor indicators */}
              <div className="demo-cursor demo-cursor-1" 
                   style={{ left: '45%', top: '45%' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 3L15 10L9 11L7 17L5 3Z" 
                        fill="#3b82f6" stroke="white" strokeWidth="1"/>
                </svg>
                <span className="cursor-label">Sarah</span>
              </div>
              
              <div className="demo-cursor demo-cursor-2" 
                   style={{ left: '65%', top: '55%' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 3L15 10L9 11L7 17L5 3Z" 
                        fill="#10b981" stroke="white" strokeWidth="1"/>
                </svg>
                <span className="cursor-label">John</span>
              </div>
            </div>
            
            <div className="demo-ai-badge">
              <span className="ai-icon">✨</span>
              <span>AI Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <div className="hero-float hero-float-1" />
      <div className="hero-float hero-float-2" />
      <div className="hero-float hero-float-3" />
    </section>
  );
}

export default Hero;

