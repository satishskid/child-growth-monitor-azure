// Development utilities for cleaner console output
const isDev = __DEV__;

// Suppress common React Native Web warnings that don't affect functionality
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

if (isDev) {
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Suppress known harmless warnings
    if (
      message.includes('"shadow*" style props are deprecated') ||
      message.includes('props.pointerEvents is deprecated') ||
      message.includes('style.resizeMode is deprecated') ||
      message.includes('style.tintColor is deprecated') ||
      message.includes('Download the React DevTools') ||
      message.includes('WebSocket connection to') ||
      message.includes('_expo/ws') ||
      message.includes('Image: style.resizeMode') ||
      message.includes('Image: style.tintColor')
    ) {
      return; // Suppress these warnings
    }
    
    // Log other warnings normally
    originalConsoleWarn(...args);
  };
  
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suppress WebSocket connection errors in development
    if (
      message.includes('WebSocket connection to') ||
      message.includes('_expo/ws') ||
      message.includes('failed to connect')
    ) {
      return; // Suppress these errors
    }
    
    // Log other errors normally
    originalConsoleError(...args);
  };
}

// Export utility functions
export const suppressWarnings = {
  restore: () => {
    if (isDev) {
      console.warn = originalConsoleWarn;
      console.error = originalConsoleError;
    }
  },
  
  enable: () => {
    // Re-enable warning suppression (already done above)
  }
};

export default {
  suppressWarnings,
};
