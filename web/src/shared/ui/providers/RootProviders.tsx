import { ReactNode, useMemo } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { useThemeStore } from '@/shared/store/themeStore';

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  const { theme } = useThemeStore();

  const mantineTheme = useMemo(
    () =>
      createTheme({
        primaryColor: 'orange',
        fontFamily: 'var(--font-display)',
        headings: { fontFamily: 'var(--font-display)' },
        defaultRadius: 'md',
      }),
    []
  );

  return (
    <MantineProvider theme={mantineTheme} forceColorScheme={theme}>
      {children}
    </MantineProvider>
  );
}
