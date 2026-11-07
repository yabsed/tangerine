import React, { forwardRef } from 'react';
import { TextInput } from '@mantine/core';

type NativeInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

interface InputProps extends NativeInputProps {
  error?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        error={error}
        className={className}
        styles={{ root: { width: '100%' } }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
