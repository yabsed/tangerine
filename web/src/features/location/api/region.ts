import client from '@/shared/api/client';
import type { RegionResponse, DongEntry } from '@/shared/api/types';

// Re-export types with aliases for backward compatibility
export type Region = RegionResponse;
export type { DongEntry } from '@/shared/api/types';

// 지역 검색 (검색어 포함)
// GET /api/region/search
export async function searchRegions(query: string, limit: number = 10, offset: number = 0): Promise<RegionResponse[]> {
  const response = await client.get<RegionResponse[]>('/api/region/search', {
    params: {
      query,
      limit,
      offset,
    },
  });
  return response.data;
}

// 내 주변 지역 찾기 (좌표 기반)
// GET /api/region/nearby
export async function fetchNearbyRegion(lat: number, long: number): Promise<RegionResponse> {
  const response = await client.get<RegionResponse>('/api/region/nearby', {
    params: {
      lat,
      long,
    },
  });
  return response.data;
}

// 시/도 목록 조회
// GET /api/region/sido
export async function fetchSidoList(): Promise<string[]> {
  const response = await client.get<string[]>('/api/region/sido');
  return response.data;
}

// 시/구/군 목록 조회
// GET /api/region/sido/{sido_name}/sigugun
export async function fetchSigugunList(sidoName: string): Promise<string[]> {
  const response = await client.get<string[]>(
    `/api/region/sido/${sidoName}/sigugun`
  );
  return response.data;
}

// 동 목록 조회
// GET /api/region/sido/{sido_name}/sigugun/{sigugun_name}/dong
export async function fetchDongList(sidoName: string, sigugunName: string): Promise<DongEntry[]> {
  const response = await client.get<DongEntry[]>(
    `/api/region/sido/${sidoName}/sigugun/${sigugunName}/dong`
  );
  return response.data;
}

// 특정 지역 ID로 상세 조회
// GET /api/region/{region_id}
export async function fetchRegionById(regionId: string): Promise<RegionResponse> {
  const response = await client.get<RegionResponse>(`/api/region/${regionId}`);
  return response.data;
}
