import React from 'react';
import { Box, Container, Group, Stack, Title } from '@mantine/core';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  rightAction?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string | number;
}

export function PageContainer({ title, rightAction, children, fullWidth = false, size }: PageContainerProps) {
  return (
    <Container
      fluid={fullWidth}
      size={size || (fullWidth ? undefined : 'lg')}
      px={fullWidth ? 0 : 'md'}
      py={fullWidth ? 0 : 'lg'}
      style={{ minHeight: 'calc(100vh - 60px)' }}
    >
      <Stack gap="md" style={{ minHeight: 'calc(100vh - 60px)' }}>
        {title && (
          <Group justify="space-between" align="center" px={fullWidth ? 'md' : 0}>
            <Title order={1} size="h2">
              {title}
            </Title>
            {rightAction && <Box>{rightAction}</Box>}
          </Group>
        )}
        <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</Box>
      </Stack>
    </Container>
  );
}
