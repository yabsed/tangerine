import { Chip, Group, Stack, Text } from '@mantine/core';

export interface SelectOption {
  value: string;
  label: string;
}

interface CategorySelectorProps {
  options: SelectOption[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
  title?: string;
}

export default function CategorySelector({
  options,
  selected,
  onSelect,
  className = '',
  title
}: CategorySelectorProps) {
  return (
    <Stack gap="sm" className={className}>
      {title && (
        <Text fw={700}>
          {title}
        </Text>
      )}

      <Chip.Group
        multiple={false}
        value={selected}
        onChange={(value) => {
          if (typeof value !== 'string') return;
          onSelect(value);
        }}
      >
        <Group gap="xs" wrap="wrap">
          {options.map((option) => (
            <Chip key={option.value} value={option.value} color="orange" radius="xl" variant="light">
              {option.label}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
    </Stack>
  );
}
