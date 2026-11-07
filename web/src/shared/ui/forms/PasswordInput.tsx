import { forwardRef } from 'react';
import { PasswordInput as MantinePasswordInput } from '@mantine/core';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className = '', size, ...props }, ref) => {
    return (
      <MantinePasswordInput
        ref={ref}
        label={label}
        error={error}
        className={className}
        styles={{ root: { width: '100%' } }}
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
