import { ReactNode, CSSProperties } from 'react';
import { Paper } from '@mantine/core';

interface DetailSectionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function DetailSection({ children, className = '', style }: DetailSectionProps) {
  return (
    <Paper withBorder radius="md" p="lg" className={className} style={style}>
      {children}
    </Paper>
  );
}
