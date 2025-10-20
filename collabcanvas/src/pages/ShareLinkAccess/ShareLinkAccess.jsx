/**
 * ShareLinkAccess Page
 * 
 * Handles accessing a canvas via share link
 * Flow: /share/:linkId → validate → grant access → redirect to canvas
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { grantAccessFromShareLink } from '../../services/shareLinks';

function ShareLinkAccess() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // FIXED: Now checking loading state!
  const [status, setStatus] = useState('validating'); // 'validating', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleShareLinkAccess();
  }, [linkId, user, loading]); // FIXED: Added loading to dependencies
  
  // Prevent default navigation to dashboard
  useEffect(() => {
    console.log('🔍 ShareLinkAccess mounted. LinkId:', linkId, 'Loading:', loading, 'User:', user?.uid || 'not logged in', 'Status:', status);
  }, [linkId, user, loading, status]);

  async function handleShareLinkAccess() {
    // Wait for auth to load
    if (loading) {
      console.log('⏳ ShareLinkAccess: Waiting for auth to load... loading:', loading);
      return; // Still loading, don't do anything yet
    }

    // Require authentication
    if (!user) {
      console.log('🔐 ShareLinkAccess: User not authenticated (loading complete, user is null)');
      console.log('   Redirecting to login with returnUrl...');
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/share/${linkId}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    console.log('✅ ShareLinkAccess: User is authenticated!', user.uid, user.email);

    // Validate and grant access
    try {
      setStatus('validating');
      
      console.log('═══════════════════════════════════════════════');
      console.log('📋 SHARE LINK ACCESS - START');
      console.log('═══════════════════════════════════════════════');
      console.log('  Link ID:', linkId);
      console.log('  User ID:', user.uid);
      console.log('  User Email:', user.email);
      console.log('═══════════════════════════════════════════════');
      
      const { canvasId, permission } = await grantAccessFromShareLink(linkId, user.uid);
      
      console.log('═══════════════════════════════════════════════');
      console.log('✅ SHARE LINK ACCESS - SUCCESS!');
      console.log('═══════════════════════════════════════════════');
      console.log('  Canvas ID:', canvasId);
      console.log('  Permission:', permission);
      console.log('  Redirecting in 5 seconds...');
      console.log('═══════════════════════════════════════════════');
      
      setStatus('success');
      
      // Redirect to canvas after 5 seconds (long delay to see logs)
      setTimeout(() => {
        console.log('🔀 Redirecting NOW to /canvas/' + canvasId);
        navigate(`/canvas/${canvasId}`);
      }, 5000);
      
    } catch (error) {
      console.log('═══════════════════════════════════════════════');
      console.error('❌ SHARE LINK ACCESS - FAILED!');
      console.log('═══════════════════════════════════════════════');
      console.error('  Link ID:', linkId);
      console.error('  User ID:', user?.uid);
      console.error('  User Email:', user?.email);
      console.error('  Error:', error.message);
      console.error('  Stack:', error.stack);
      console.log('═══════════════════════════════════════════════');
      setStatus('error');
      setErrorMessage(error.message || 'Failed to access shared canvas');
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#fff',
      padding: '2rem'
    }}>
      <div style={{
        background: '#242424',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {status === 'validating' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
              Accessing Canvas...
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Validating your share link
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#4ade80' }}>
              Access Granted!
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
              Redirecting in 5 seconds... (Check console for logs)
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✕</div>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#ff453a' }}>
              Access Denied
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem' }}>
              {errorMessage}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #646cff 0%, #535bf2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ShareLinkAccess;

