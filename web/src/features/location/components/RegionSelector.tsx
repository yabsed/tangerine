import { Button } from '@mantine/core';

interface RegionSelectorProps {
  regionName: string;
  onClick: () => void;
}

export default function RegionSelector({ regionName, onClick }: RegionSelectorProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="subtle"
      color="orange"
      size="sm"
      radius="md"
      style={{ color: 'var(--color-brand)' }}
      leftSection={
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
      }
      rightSection={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          style={{ opacity: 0.6 }}
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      }
    >
      {regionName}
    </Button>
  );
}
