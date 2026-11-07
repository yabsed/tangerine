import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs } from '@mantine/core';

export interface Tab<T extends string = string> {
  id: T;
  label: string;
  to?: string;
}

interface TabBarProps<T extends string = string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange?: (tabId: T) => void;
}

export function TabBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
}: TabBarProps<T>) {
  const navigate = useNavigate();
  const toById = useMemo(() => {
    const map = new Map<string, string>();
    for (const tab of tabs) {
      if (tab.to) map.set(String(tab.id), tab.to);
    }
    return map;
  }, [tabs]);

  return (
    <Tabs
      value={activeTab}
      onChange={(value) => {
        if (!value) return;
        const to = toById.get(String(value));
        if (to) {
          navigate(to);
          return;
        }
        onTabChange?.(value as T);
      }}
      variant="default"
    >
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab key={tab.id} value={tab.id}>
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
