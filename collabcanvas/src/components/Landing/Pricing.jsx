/**
 * Pricing Section Component
 * 
 * Displays pricing tiers and features
 */

import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Pricing() {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out CollabCanvas',
      features: [
        '3 canvases',
        '1 GB storage',
        '100 AI operations/month',
        'Public sharing only',
        'Community support'
      ],
      cta: 'Get Started',
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$15',
      period: 'per month',
      description: 'For professionals and power users',
      features: [
        'Unlimited canvases',
        '10 GB storage',
        'Unlimited AI operations',
        'Private + password sharing',
        'Version history (30 days)',
        'Priority email support'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Team',
      price: '$45',
      period: 'per month',
      description: 'For teams that build together',
      features: [
        'Everything in Pro',
        'Team workspaces (10 members)',
        '100 GB shared storage',
        'Advanced permissions',
        'Activity log & audit trail',
        'Priority support + onboarding'
      ],
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  const handleCTA = (plan) => {
    if (plan.name === 'Team') {
      window.location.href = 'mailto:hello@collabcanvas.app?subject=Team Plan Inquiry';
    } else {
      navigate('/signup');
    }
  };

  return (
    <section id="pricing" className="pricing">
      <div className="pricing-container">
        <div className="pricing-header">
          <h2 className="section-title">
            Simple, transparent pricing
          </h2>
          <p className="section-subtitle">
            Start free, upgrade when you're ready. No hidden fees.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`pricing-card ${plan.highlighted ? 'pricing-card-highlighted' : ''}`}
            >
              {plan.highlighted && (
                <div className="pricing-badge">Most Popular</div>
              )}
              
              <div className="pricing-card-header">
                <h3 className="pricing-plan-name">{plan.name}</h3>
                <div className="pricing-plan-price">
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-period">/{plan.period}</span>
                </div>
                <p className="pricing-plan-description">{plan.description}</p>
              </div>

              <ul className="pricing-features">
                {plan.features.map((feature, i) => (
                  <li key={i} className="pricing-feature">
                    <svg className="feature-check" width="20" height="20" viewBox="0 0 20 20">
                      <path 
                        d="M7 10l2 2 4-4" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} btn-block`}
                onClick={() => handleCTA(plan)}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <div className="pricing-faq">
          <p className="faq-text">
            Have questions? <a href="mailto:hello@collabcanvas.app">Contact us</a> or check out our <a href="/docs">documentation</a>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Pricing;

