import { Button } from '../display/Button';
import { useTranslation } from '@/shared/i18n';
import { useHierarchicalBack } from '@/shared/hooks/useHierarchicalBack';
import { Box } from '@mantine/core';

export function DetailHeader() {
  const t = useTranslation();
  const goBack = useHierarchicalBack();

  return (
    <Box mb="md">
      <Button
        variant="ghost"
        onClick={goBack}
      >
        {t.layout.goBack}
      </Button>
    </Box>
  );
}
