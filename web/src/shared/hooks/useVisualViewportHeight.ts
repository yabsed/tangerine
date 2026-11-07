import { useState, useEffect } from 'react';

/**
 * Returns the height of the visual viewport to help with mobile keyboard issues.
 * Returns '100dvh' as a fallback during SSR or if visualViewport is not supported.
 */
export function useVisualViewportHeight() {
  const [height, setHeight] = useState<string | number>('100dvh');

  useEffect(() => {
    // Only run on client side and if visualViewport is supported
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const updateHeight = () => {
      // Use window.visualViewport.height for precise keyboard-aware sizing on mobile
      if (window.visualViewport) {
        setHeight(window.visualViewport.height);
      }
    };

    window.visualViewport.addEventListener('resize', updateHeight);
    window.visualViewport.addEventListener('scroll', updateHeight);
    
    // Initial set
    updateHeight();

    return () => {
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', updateHeight);
            window.visualViewport.removeEventListener('scroll', updateHeight);
        }
    };
  }, []);

  return height;
}
