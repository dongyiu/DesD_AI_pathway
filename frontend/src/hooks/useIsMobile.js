import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the user is on a mobile device
 * Checks both viewport width and touch capability for accuracy
 * @returns {boolean} - True if mobile device, false otherwise
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check viewport width (768px is Tailwind's md breakpoint)
      const isMobileWidth = window.innerWidth < 768;

      // Check if device supports touch OR is in portrait orientation
      // Portrait orientation is a strong signal of mobile usage
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isPortrait = window.innerHeight > window.innerWidth;

      // Device is mobile if:
      // 1. Narrow width AND touch support (real mobile devices)
      // 2. OR narrow width AND portrait orientation (DevTools emulation)
      setIsMobile(isMobileWidth && (isTouchDevice || isPortrait));
    };

    // Check on mount
    checkMobile();

    // Listen for resize and orientation changes
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return isMobile;
};
