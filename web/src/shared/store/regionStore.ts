import { create } from 'zustand';

// 전체 지역을 기본값으로 사용 (빈 ID는 전체 지역을 의미)
export const DEFAULT_REGION_ID = '';
export const DEFAULT_REGION_NAME = '전체 지역';

interface RegionState {
  regionId: string;
  regionName: string;
  setRegion: (id: string, name: string) => void;
  clearRegion: () => void;
}

export const useRegionStore = create<RegionState>((set) => ({
  regionId: DEFAULT_REGION_ID,
  regionName: DEFAULT_REGION_NAME,
  setRegion: (id: string, name: string) => {
    set({ regionId: id, regionName: name });
  },
  clearRegion: () => {
    set({ regionId: DEFAULT_REGION_ID, regionName: DEFAULT_REGION_NAME });
  },
}));
