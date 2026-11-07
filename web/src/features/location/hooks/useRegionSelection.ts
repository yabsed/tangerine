import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchRegionById } from '@/features/location/api/region';
import { useTranslation } from '@/shared/i18n';

// 지역 선택 타입: 동 단위(region), 시/구/군 단위(sigugun), 시/도 단위(sido)
export type RegionSelectType = 'region' | 'sigugun' | 'sido';

export interface RegionSelection {
  type: RegionSelectType;
  regionId?: string;  // 동 단위일 때만 사용
  sido?: string;
  sigugun?: string;
  displayName: string;
}

export function useRegionSelection() {
  const t = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [regionDisplayName, setRegionDisplayName] = useState<string>('');

  // URL에서 현재 지역 정보를 가져옵니다
  const urlRegionId = searchParams.get('region') || undefined;
  const urlSido = searchParams.get('sido') || undefined;
  const urlSigugun = searchParams.get('sigugun') || undefined;

  // 현재 선택된 지역 타입 결정
  const getCurrentSelection = (): RegionSelection => {
    if (urlRegionId) {
      return {
        type: 'region',
        regionId: urlRegionId,
        displayName: regionDisplayName || t.location.allRegions,
      };
    }
    if (urlSido && urlSigugun) {
      return {
        type: 'sigugun',
        sido: urlSido,
        sigugun: urlSigugun,
        displayName: `${urlSido} ${urlSigugun}`,
      };
    }
    if (urlSido) {
      return {
        type: 'sido',
        sido: urlSido,
        displayName: urlSido,
      };
    }
    return {
      type: 'region',
      displayName: t.location.allRegions,
    };
  };

  const currentSelection = getCurrentSelection();

  // 지역 선택 (동 단위)
  const handleRegionSelect = (id: string, name?: string) => {
    if (name) {
      setRegionDisplayName(name);
    }
    setSearchParams((prev) => {
      prev.delete('sido');
      prev.delete('sigugun');
      prev.set('region', id);
      return prev;
    });
    closeModal();
  };

  // 시/도 단위 선택
  const handleSidoSelect = (sido: string) => {
    // 전체 지역 선택 시 필터 해제
    if (sido === 'ALL') {
      setRegionDisplayName('');
      setSearchParams((prev) => {
        prev.delete('region');
        prev.delete('sido');
        prev.delete('sigugun');
        return prev;
      });
      closeModal();
      return;
    }
    setSearchParams((prev) => {
      prev.delete('region');
      prev.delete('sigugun');
      prev.set('sido', sido);
      return prev;
    });
    closeModal();
  };

  // 시/구/군 단위 선택
  const handleSigugunSelect = (sido: string, sigugun: string) => {
    setSearchParams((prev) => {
      prev.delete('region');
      prev.set('sido', sido);
      prev.set('sigugun', sigugun);
      return prev;
    });
    closeModal();
  };

  // 지역 필터 해제 (전체 보기)
  const handleClearRegion = () => {
    setRegionDisplayName('');
    setSearchParams((prev) => {
      prev.delete('region');
      prev.delete('sido');
      prev.delete('sigugun');
      return prev;
    });
    closeModal();
  };

  // URL에 regionId가 있으면 이름을 가져옵니다
  useEffect(() => {
    if (!urlRegionId) {
      setRegionDisplayName('');
      return;
    }

    const fetchRegionName = async () => {
      try {
        const region = await fetchRegionById(urlRegionId);
        setRegionDisplayName(`${region.sigugun} ${region.dong}`);
      } catch (error) {
        console.error('Invalid region ID in URL:', error);
        setSearchParams((prev) => {
          prev.delete('region');
          return prev;
        });
      }
    };

    fetchRegionName();
  }, [urlRegionId, setSearchParams]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return {
    // 하위 호환성을 위해 기존 필드 유지
    currentRegionId: urlRegionId,
    currentRegionName: currentSelection.displayName,
    // 새로운 필드
    currentSelection,
    currentSido: urlSido,
    currentSigugun: urlSigugun,
    isModalOpen,
    openModal,
    closeModal,
    handleRegionSelect,
    handleSidoSelect,
    handleSigugunSelect,
    handleClearRegion,
  };
}