import { useTranslation } from '@/shared/i18n';
import { TextInput } from '@mantine/core';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export default function SearchBar({ searchQuery, setSearchQuery }: SearchBarProps) {
  const t = useTranslation();

  return (
    <TextInput
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.currentTarget.value)}
      placeholder={t.product.enterSearchQuery}
      radius="xl"
      w={400}
      maw="100%"
    />
  );
}
