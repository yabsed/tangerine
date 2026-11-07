import { forwardRef } from 'react';
import { Select as MantineSelect } from '@mantine/core';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  error?: string;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, label, error, className = '', disabled, onChange, value, ...props }, ref) => {
    const handleChange = (nextValue: string | null) => {
      if (!onChange) return;

      // Most call sites treat this component like a native <select> and expect
      // `e.target.value`. Mantine's Select calls onChange with the selected value.
      const v = nextValue ?? '';
      const eventLike = {
        target: { value: v },
        currentTarget: { value: v },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;

      onChange(eventLike);
    };

    return (
      <MantineSelect
        ref={ref as any}
        className={className}
        styles={{ root: { width: '100%' } }}
        data={options}
        label={label}
        error={error}
        disabled={disabled}
        value={(value as any) ?? null}
        onChange={handleChange}
        {...(props as any)}
      />
    );
  }
);

Select.displayName = 'Select';
