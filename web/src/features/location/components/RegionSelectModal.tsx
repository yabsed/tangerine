import React, { useState, useEffect } from 'react';
import {
  fetchSidoList,
  fetchSigugunList,
  fetchDongList,
  fetchRegionById,
  Region,
  DongEntry
} from '@/features/location/api/region';
import { useGeoLocation } from '@/features/location/hooks/useGeoLocation';
import { useUser } from '@/features/user/hooks/useUser';
import { Button, Select } from '@/shared/ui';
import { Modal } from '@/shared/ui/feedback';
import { useTranslation } from '@/shared/i18n';
import { Divider, Group, Stack } from '@mantine/core';

interface RegionSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (regionId: string, regionName: string) => void;
  onSelectSido?: (sido: string) => void;
  onSelectSigugun?: (sido: string, sigugun: string) => void;
  initialRegionId?: string;
}

export default function RegionSelectModal({
  isOpen,
  onClose,
  onSelect,
  onSelectSido,
  onSelectSigugun,
  initialRegionId
}: RegionSelectModalProps) {
  const t = useTranslation();
  const [sidoList, setSidoList] = useState<string[]>([]);
  const [sigugunList, setSigugunList] = useState<string[]>([]);
  const [dongList, setDongList] = useState<DongEntry[]>([]);

  const ALL_REGIONS = 'ALL';

  const [selectedSido, setSelectedSido] = useState(ALL_REGIONS);
  const [selectedSigugun, setSelectedSigugun] = useState(ALL_REGIONS);
  const [selectedDongId, setSelectedDongId] = useState(ALL_REGIONS);
  const [selectedDongName, setSelectedDongName] = useState('');

  const { detectRegion, detecting } = useGeoLocation();
  const { user, isLoggedIn } = useUser();

  // 모달 열릴 때 시/도 목록 불러오기
  useEffect(() => {
    if (isOpen) {
      const loadSido = async () => {
        try {
          const list = await fetchSidoList();
          setSidoList(list);
        } catch (e) {
          console.error(t.location.sidoLoadFailed, e);
        }
      };
      loadSido();
    }
  }, [isOpen, t.location.sidoLoadFailed]);

  // 초기 지역 ID가 있으면 드롭다운 상태 복원
  const syncRegionState = async (regionId: string) => {
    try {
      const regionData: Region = await fetchRegionById(regionId);

      setSelectedSido(regionData.sido);

      const siguguns = await fetchSigugunList(regionData.sido);
      setSigugunList(siguguns);
      setSelectedSigugun(regionData.sigugun);

      const dongs = await fetchDongList(regionData.sido, regionData.sigugun);
      setDongList(dongs);
      setSelectedDongId(regionData.id);
      setSelectedDongName(`${regionData.sigugun} ${regionData.dong}`);
    } catch (e) {
      console.error(t.location.syncFailed, e);
    }
  };

  useEffect(() => {
    if (isOpen && initialRegionId) {
      syncRegionState(initialRegionId);
    }
  }, [isOpen, initialRegionId]);

  // 시/도 변경
  const handleSidoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSido = e.target.value;
    setSelectedSido(newSido);
    setSelectedSigugun(ALL_REGIONS);
    setSelectedDongId(ALL_REGIONS);
    setSelectedDongName('');
    setDongList([]);

    if (newSido && newSido !== ALL_REGIONS) {
      try {
        const list = await fetchSigugunList(newSido);
        setSigugunList(list);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSigugunList([]);
    }
  };

  // 시/구/군 변경
  const handleSigugunChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSigugun = e.target.value;
    setSelectedSigugun(newSigugun);
    setSelectedDongId(ALL_REGIONS);
    setSelectedDongName('');

    if (newSigugun && newSigugun !== ALL_REGIONS && selectedSido && selectedSido !== ALL_REGIONS) {
      try {
        const list = await fetchDongList(selectedSido, newSigugun);
        setDongList(list);
      } catch (e) {
        console.error(e);
      }
    } else {
      setDongList([]);
    }
  };

  // 동 변경
  const handleDongChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dongId = e.target.value;
    setSelectedDongId(dongId);
    const dong = dongList.find(d => d.id === dongId);
    if (dong) {
      setSelectedDongName(`${selectedSigugun} ${dong.dong}`);
    }
  };

  // 내 위치 찾기
  const handleDetectLocation = async () => {
    try {
      // 로그인한 유저이고 저장된 지역이 있으면 그것을 사용
      if (isLoggedIn && user?.region) {
        await syncRegionState(user.region.id);
        return;
      }

      // 그렇지 않으면 GPS로 위치 찾기
      const detectedRegion = await detectRegion();
      await syncRegionState(detectedRegion.id);
    } catch (error) {
      console.error("Error detecting location:", error);
      alert(error instanceof Error ? error.message : t.user.locationFailed);
    }
  };

  // 확인 버튼 - 시/도, 시/구/군, 동 중 어느 단계에서든 적용 가능
  const handleConfirm = () => {
    // 동까지 선택한 경우
    if (selectedDongId && selectedDongId !== ALL_REGIONS) {
      onSelect(selectedDongId, selectedDongName);
      onClose();
      return;
    }

    // 시/구/군까지 선택한 경우 (동이 전체 지역)
    if (selectedSido !== ALL_REGIONS && selectedSigugun !== ALL_REGIONS && onSelectSigugun) {
      onSelectSigugun(selectedSido, selectedSigugun);
      onClose();
      return;
    }

    // 시/도만 선택한 경우 (시/구/군이 전체 지역)
    if (selectedSido !== ALL_REGIONS && onSelectSido) {
      onSelectSido(selectedSido);
      onClose();
      return;
    }

    // 시/도도 전체 지역인 경우 - 전체 지역 선택
    if (selectedSido === ALL_REGIONS && onSelectSido) {
      onSelectSido(ALL_REGIONS);
      onClose();
      return;
    }

    onClose();
  };

  // 옵션 배열
  const sidoOptions = [
    { value: ALL_REGIONS, label: t.location.allRegions },
    ...sidoList.map(s => ({ value: s, label: s }))
  ];

  const sigugunOptions = [
    { value: ALL_REGIONS, label: t.location.allRegions },
    ...sigugunList.map(s => ({ value: s, label: s }))
  ];

  const dongOptions = [
    { value: ALL_REGIONS, label: t.location.allRegions },
    ...dongList.map(d => ({ value: d.id, label: d.dong }))
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.location.regionSettings}>
      <Stack gap="md">
        {/* 내 위치로 찾기 버튼 */}
        <Button
          type="button"
          variant="secondary"
          fullWidth
          onClick={handleDetectLocation}
          disabled={detecting}
        >
          {detecting ? t.location.findingLocation : t.user.findMyLocation}
        </Button>

        <Divider label={t.location.orSelectDirectly} labelPosition="center" />

        {/* 3단 드롭다운 */}
        <Select
          options={sidoOptions}
          value={selectedSido}
          onChange={handleSidoChange}
        />

        <Select
          options={sigugunOptions}
          value={selectedSigugun}
          onChange={handleSigugunChange}
          disabled={selectedSido === ALL_REGIONS}
        />

        <Select
          options={dongOptions}
          value={selectedDongId}
          onChange={handleDongChange}
          disabled={selectedSido === ALL_REGIONS || selectedSigugun === ALL_REGIONS}
        />

        {/* 버튼 영역 */}
        <Group grow gap="md" mt="md">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={handleConfirm}
          >
            {t.common.confirm}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
