import React, { useState, useEffect, useRef } from 'react';
import { Loading, ErrorMessage } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { Box, Center, Stack, Text } from '@mantine/core';
import { APP_Z_INDEX } from '@/shared/ui/theme/zIndex';

interface DataListLayoutProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty: boolean;
  emptyMessage?: string;
  filters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DataListLayout({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  filters,
  children,
  className = ''
}: DataListLayoutProps) {
  const t = useTranslation();
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 스크롤을 내리면 필터 숨김, 올리면 필터 표시
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsFilterVisible(false);
      } else {
        setIsFilterVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const errorMsg = error?.message ?? null;

  return (
    <Stack gap="md" className={className}>
      {filters && (
        <Box
          pos="sticky"
          top={0}
          py="xs"
          style={{
            zIndex: APP_Z_INDEX.header,
            backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(6px)',
            transition: 'transform 300ms ease, opacity 300ms ease',
            transform: isFilterVisible ? 'translateY(0)' : 'translateY(-100%)',
            opacity: isFilterVisible ? 1 : 0,
            pointerEvents: isFilterVisible ? 'auto' : 'none',
          }}
        >
          {filters}
        </Box>
      )}

      {isLoading ? (
        <Center py={80}>
          <Loading />
        </Center>
      ) : errorMsg ? (
        <Center py={80}>
          <ErrorMessage message={errorMsg} />
        </Center>
      ) : (
        <>
          {children}
          {isEmpty && (
            <Center py={80}>
              <Stack gap={6} align="center">
                <Text fz={32}>📭</Text>
                <Text c="dimmed">{emptyMessage || t.common.noData}</Text>
              </Stack>
            </Center>
          )}
        </>
      )}
    </Stack>
  );
}
