import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Redirect to Desktop if on root - use navigate instead of window.location
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/Desktop', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Don't show layout for file viewer
  if (currentPageName === 'FileViewer') {
    return <div className="min-h-screen bg-gray-900">{children}</div>;
  }

  // Don't show layout for Wiki pages
  if (currentPageName === 'Wiki' || currentPageName === 'WikiDev' || currentPageName === 'Desktop') {
    return <div className="min-h-screen bg-gray-900">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main>
        {children}
      </main>
    </div>
  );
}
