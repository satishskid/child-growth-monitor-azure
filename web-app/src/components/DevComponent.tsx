import React, { useEffect } from 'react';

/**
 * Development component that provides better developer experience
 * Handles React DevTools and other development optimizations
 */
const DevComponent: React.FC = () => {
  useEffect(() => {
    if (__DEV__) {
      // Install React DevTools suggestion (one-time only)
      const hasSeenDevToolsMessage = localStorage.getItem('devtools-message-seen');

      if (!hasSeenDevToolsMessage && typeof window !== 'undefined') {
        console.log(
          '%c🛠️ Child Growth Monitor Development Mode',
          'background: #2E8B57; color: white; padding: 8px; border-radius: 4px; font-weight: bold;'
        );
        console.log(
          '%cFor the best development experience, install React DevTools:\nhttps://reactjs.org/link/react-devtools',
          'color: #2E8B57; font-size: 12px;'
        );
        console.log(
          '%c📱 Test Login Credentials:\n• Email: healthcare@example.org\n• Password: healthcare123',
          'color: #0066cc; font-size: 12px;'
        );

        localStorage.setItem('devtools-message-seen', 'true');
      }
    }
  }, []);

  return null; // This component doesn't render anything
};

export default DevComponent;
