import { PasswordInput, Button } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { Box, Stack } from '@mantine/core';

const PasswordTab = () => {
  const t = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(t.user.passwordChanged);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md" pt="xs">
        <PasswordInput label={t.user.currentPassword} />
        <PasswordInput label={t.user.newPassword} />
        <PasswordInput label={t.user.confirmNewPassword} />
        <Box pt="sm">
          <Button type="submit" size="lg" fullWidth>
            {t.user.changePassword}
          </Button>
        </Box>
      </Stack>
    </form>
  );
};
export default PasswordTab;