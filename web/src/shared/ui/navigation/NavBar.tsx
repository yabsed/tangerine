import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/shared/store/themeStore';
import { useLanguage } from '@/shared/store/languageStore';
import { useTranslation } from '@/shared/i18n';
import { useChatRooms } from '@/features/chat/hooks/useChat';
import { Button } from '../display/Button';
import { Badge } from '../feedback';
import { POLLING_CONFIG, getPollingInterval } from '@/shared/config/polling';
import { useProductFiltersStore } from '@/features/product/store/productFiltersStore';
import {
  ActionIcon,
  Box,
  Container,
  Drawer,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { APP_Z_INDEX } from '@/shared/ui/theme/zIndex';

export default function NavBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toggleLanguage } = useLanguage();
  const t = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getProductSearchParams = useProductFiltersStore((state) => state.getSearchParams);

  const MENUS = [
    { id: 'products', label: t.nav.products, path: '/products' },
    { id: 'chat', label: t.nav.chat, path: '/chat' },
  ];

  // 로그인 상태일 때 읽지 않은 메시지 수 폴링 (React Query handles caching & deduplication)
  const { totalUnreadCount } = useChatRooms({
    refetchInterval: getPollingInterval(POLLING_CONFIG.UNREAD_COUNT, isLoggedIn),
    enabled: isLoggedIn,
  });

  const handleNav = (path: string) => {
    if (path === '/products') {
      navigate(path + getProductSearchParams());
    } else {
      navigate(path);
    }
    setIsMenuOpen(false);
  };

  const NavItem = ({ label, path, mobile = false }: { label: string, path: string, mobile?: boolean }) => {
    const isActive = pathname.startsWith(path);
    const isChat = path === '/chat';
    const showBadge = isChat && totalUnreadCount > 0;

    return (
      <Button
        onClick={() => handleNav(path)}
        variant="ghost"
        fullWidth={mobile}
        style={{
          textAlign: mobile ? 'left' : undefined,
          fontSize: mobile ? 'var(--mantine-font-size-lg)' : undefined,
          color: isActive ? 'var(--color-brand-nav)' : 'var(--text-body)',
          fontWeight: isActive ? 700 : 500,
          gap: 8,
        }}
      >
        {label}
        {showBadge && (
          <Badge variant="notification">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Badge>
        )}
      </Button>
    );
  };

  const authItem = { label: isLoggedIn ? t.nav.myOrange : t.nav.login, path: isLoggedIn ? '/my' : '/auth/login' };

  return (
    <>
      <Box component="nav" bg="var(--bg-page)" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <Container size="lg" py={10}>
          <Group justify="space-between" align="center">
            <Group gap="xl" align="center">
              <Title
                order={1}
                size="h3"
                style={{ cursor: 'pointer', color: 'var(--color-brand)' }}
                onClick={() => handleNav('/products')}
              >
                {t.nav.orangeMarket}
              </Title>

              {/* 데스크탑 메뉴 */}
              <Group gap="xs" visibleFrom="md">
                {MENUS.map((menu) => (
                  <NavItem key={menu.id} {...menu} />
                ))}
                <NavItem {...authItem} />
              </Group>
            </Group>

            <Group gap="xs">
              <Button onClick={toggleLanguage} variant="ghost" aria-label={t.nav.langToggle}>
                {t.nav.langLabel}
              </Button>

              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                aria-label={t.nav.themeToggle}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </ActionIcon>

              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                hiddenFrom="md"
                aria-label="menu"
                onClick={() => setIsMenuOpen(true)}
              >
                <MenuIcon />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </Box>

      <Drawer
        opened={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position="right"
        size="70%"
        padding="md"
        zIndex={APP_Z_INDEX.overlay}
        title={
          <Group justify="space-between" w="100%">
            <Text fw={700} style={{ color: 'var(--color-brand)' }}>
              {t.nav.orangeMarket}
            </Text>
            <Group gap={6}>
              <Button onClick={toggleLanguage} variant="ghost" aria-label={t.nav.langToggle}>
                {t.nav.langLabel}
              </Button>
              <ActionIcon variant="subtle" color="gray" size="lg" aria-label={t.nav.themeToggle} onClick={toggleTheme}>
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </ActionIcon>
              <ActionIcon variant="subtle" color="gray" size="lg" aria-label="close" onClick={() => setIsMenuOpen(false)}>
                <CloseIcon />
              </ActionIcon>
            </Group>
          </Group>
        }
      >
        <Stack gap="xs">
          {MENUS.map((menu) => (
            <NavItem key={menu.id} {...menu} mobile />
          ))}
          <NavItem {...authItem} mobile />
        </Stack>
      </Drawer>
    </>
  );
}

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
