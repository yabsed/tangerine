import { useState, useEffect } from 'react';
import { fetchRegionById } from '@/features/location/api/region';

interface RegionInfo {
  sido: string;
  sigugun: string;
  dong: string;
}

// Shared region cache across all consumers
const regionCache = new Map<string, RegionInfo>();

async function getRegionInfo(regionId: string): Promise<RegionInfo | null> {
  const cached = regionCache.get(regionId);
  if (cached) return cached;

  try {
    const region = await fetchRegionById(regionId);
    const info = { sido: region.sido, sigugun: region.sigugun, dong: region.dong };
    regionCache.set(regionId, info);
    return info;
  } catch {
    return null;
  }
}

interface RegionFilterOptions {
  regionId?: string;
  sido?: string;
  sigugun?: string;
}

type WithRegionId = { region_id: string };
type WithProductRegionId = { product?: { region_id: string } };

function getItemRegionId<T>(item: T): string | undefined {
  if ((item as WithRegionId).region_id) return (item as WithRegionId).region_id;
  if ((item as WithProductRegionId).product?.region_id) return (item as WithProductRegionId).product?.region_id;
  return undefined;
}

export function useRegionFilter<T>(
  items: T[] | undefined,
  options: RegionFilterOptions,
  isLoading: boolean
): { filtered: T[]; isFiltering: boolean } {
  const { regionId, sido, sigugun } = options;
  const [filtered, setFiltered] = useState<T[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    const filter = async () => {
      const data = items ?? [];

      // 지역 필터가 없으면 전체 반환
      if (!regionId && !sido && !sigugun) {
        setFiltered(data);
        setIsFiltering(false);
        return;
      }

      setIsFiltering(true);
      const result: T[] = [];

      for (const item of data) {
        const itemRegionId = getItemRegionId(item);
        if (!itemRegionId) continue;

        // 동 단위(regionId) 필터: 정확히 일치해야 함
        if (regionId) {
          if (itemRegionId === regionId) result.push(item);
          continue;
        }

        // 시/도, 시/구/군 단위 필터
        const info = await getRegionInfo(itemRegionId);
        if (!info) continue;

        const matchesSido = !sido || info.sido === sido;
        const matchesSigugun = !sigugun || info.sigugun === sigugun;
        if (matchesSido && matchesSigugun) result.push(item);
      }

      setFiltered(result);
      setIsFiltering(false);
    };

    if (!isLoading && items) filter();
  }, [items, isLoading, regionId, sido, sigugun]);

  return { filtered, isFiltering };
}
