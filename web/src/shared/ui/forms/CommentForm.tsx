import React from 'react';
import { Group } from '@mantine/core';
import { Input } from './Input';
import { Button } from '../display/Button';

interface CommentFormProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  submitText?: string;
  isSubmitting?: boolean;
}

export function CommentForm({
  value,
  onChange,
  onSubmit,
  placeholder = '메시지를 입력하세요',
  submitText = '전송',
  isSubmitting = false,
}: CommentFormProps) {
  return (
    <Group component="form" onSubmit={onSubmit} gap="sm" wrap="nowrap">
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ flex: 1, backgroundColor: 'var(--bg-page)' }}
      />
      <Button
        type="submit"
        variant="primary"
        style={{ height: 'auto', paddingInline: 20, whiteSpace: 'nowrap' }}
        disabled={isSubmitting || !value.trim()}
      >
        {submitText}
      </Button>
    </Group>
  );
}
