import { ReactNode } from 'react';
import { Badge as MantineBadge, type BadgeProps as MantineBadgeProps } from '@mantine/core';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'notification';
  className?: string;
}

export default function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  const mantineVariant: MantineBadgeProps['variant'] =
    variant === 'secondary' ? 'light' : variant === 'notification' ? 'filled' : 'light';

  const color: MantineBadgeProps['color'] =
    variant === 'primary'
      ? 'orange'
      : variant === 'secondary'
        ? 'gray'
        : variant === 'success'
          ? 'green'
          : variant === 'error'
            ? 'red'
            : variant === 'warning'
              ? 'yellow'
              : 'orange';

  return (
    <MantineBadge className={className} variant={mantineVariant} color={color} radius="xl">
      {children}
    </MantineBadge>
  );
}
