import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from '@/shared/ui';
import { OnboardingBanner } from '../../features/auth/components/OnboardingBanner';
import { useUser } from '@/features/user/hooks/useUser';
import { Box } from '@mantine/core';
import { APP_Z_INDEX } from '@/shared/ui/theme/zIndex';

const SCROLL_THRESHOLD = 10;

export function MainLayout() {
  const { isLoggedIn } = useUser();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < SCROLL_THRESHOLD) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Box mih="100dvh" bg="var(--bg-page)">
      {/* Onboarding Banner - hides when scrolling down */}
      <Box
        style={{
          overflow: 'hidden',
          maxHeight: isHeaderVisible ? 100 : 0,
          transition: 'max-height 0.3s ease',
        }}
      >
        <OnboardingBanner />
      </Box>
      {/* NavBar - always sticky at top */}
      <Box
        pos="sticky"
        top={0}
        style={{
          zIndex: APP_Z_INDEX.header,
        }}
      >
        <NavBar isLoggedIn={isLoggedIn} />
      </Box>
      <Box w="100%" mx="auto">
        <Outlet />
      </Box>
    </Box>
  );
}
