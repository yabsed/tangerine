import { SegmentedControl } from '@mantine/core';

export interface SegmentedTab<T extends string = string> {
  id: T;
  label: string;
}

interface SegmentedTabBarProps<T extends string = string> {
  tabs: SegmentedTab<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  className?: string;
  fullWidth?: boolean;
}

export function SegmentedTabBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className,
  fullWidth = false,
}: SegmentedTabBarProps<T>) {
  return (
    <SegmentedControl
      className={className}
      value={activeTab}
      onChange={(value) => onTabChange(value as T)}
      data={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
      radius="xl"
      color="orange"
      fullWidth={fullWidth}
      withItemsBorders={false}
      w={fullWidth ? undefined : 'fit-content'}
    />
  );
}
