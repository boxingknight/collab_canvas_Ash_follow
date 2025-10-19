/**
 * Features Section Component
 * 
 * Displays key features in a grid layout
 */

import './Landing.css';

function Features() {
  const features = [
    {
      icon: '👥',
      title: 'Real-Time Collaboration',
      description: 'See everyone\'s cursor movements and edits instantly. No more "who\'s working on what?" confusion.'
    },
    {
      icon: '✨',
      title: 'AI-Powered Design',
      description: 'Create complex layouts with natural language. "Make a login form" and watch the AI build it for you.'
    },
    {
      icon: '🔒',
      title: 'Enterprise Ready',
      description: 'Share links with permissions, password protection, and fine-grained access control for teams.'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Optimized for 60 FPS performance even with thousands of shapes. Smooth pan, zoom, and editing.'
    },
    {
      icon: '🎨',
      title: 'Professional Tools',
      description: 'Multi-select, alignment tools, layers, undo/redo, copy/paste, and everything you expect from pro software.'
    },
    {
      icon: '🌐',
      title: 'Work Anywhere',
      description: 'Browser-based, no installation required. Works on desktop, tablet, and mobile devices.'
    }
  ];

  return (
    <section id="features" className="features">
      <div className="features-container">
        <div className="features-header">
          <h2 className="section-title">
            Everything you need to design together
          </h2>
          <p className="section-subtitle">
            Built for modern teams who move fast and build beautiful things
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="features-proof">
          <p className="proof-text">
            Trusted by designers, product managers, and teams at startups worldwide
          </p>
        </div>
      </div>
    </section>
  );
}

export default Features;

