import React, { useState, useEffect, useRef } from 'react';
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
import { Button, Input, Select, Avatar } from '@/shared/ui';
import { imageApi as userImageApi } from '@/features/user/api/imageApi';
import { useTranslation } from '@/shared/i18n';
import { Box, Center, Group, Stack, Text } from '@mantine/core';

interface ProfileEditFormProps {
  initialEmail?: string;
  initialNickname?: string;
  initialRegionId?: string;
  initialProfileImage?: string;
  submitButtonText?: string;
  forceGPS?: boolean;
  onSubmit: (data: { nickname: string; region_id: string; profile_image: string }) => Promise<void>;
}

export default function ProfileEditForm({
  initialEmail = '',
  initialNickname = '',
  initialRegionId = '',
  initialProfileImage = '',
  submitButtonText,
  forceGPS = false,
  onSubmit
}: ProfileEditFormProps) {
  const t = useTranslation();
  const [nickname, setNickname] = useState(initialNickname);
  const [profileImage, setProfileImage] = useState(initialProfileImage);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  // --- 지역 선택 관련 State ---
  const [sidoList, setSidoList] = useState<string[]>([]);
  const [sigugunList, setSigugunList] = useState<string[]>([]);
  const [dongList, setDongList] = useState<DongEntry[]>([]);

  const [selectedSido, setSelectedSido] = useState('');
  const [selectedSigugun, setSelectedSigugun] = useState('');
  const [selectedDongId, setSelectedDongId] = useState(initialRegionId);

  const { detectRegion, detecting } = useGeoLocation();
  const { user, isLoggedIn } = useUser();

  // 1. 초기 데이터 세팅 (프로필 이미지, 닉네임)
  useEffect(() => {
    if (initialNickname) setNickname(initialNickname);
    if (initialProfileImage) {
      setProfileImage(initialProfileImage);
    } else {
      generateRandomImage();
    }
  }, [initialNickname, initialProfileImage]);

  // 2. 컴포넌트 마운트 시: 시/도 목록 불러오기
  useEffect(() => {
    const loadSido = async () => {
      try {
        const list = await fetchSidoList();
        setSidoList(list);
      } catch (e) {
        console.error(t.location.sidoLoadFailed, e);
      }
    };
    loadSido();
  }, [t.location.sidoLoadFailed]);

  // 3. 초기 지역 ID가 있거나 위치 찾기 성공 시: 전체 드롭다운 상태 복원
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

    } catch (e) {
      console.error(t.location.syncFailed, e);
    }
  };

  // 초기 렌더링 시 기존 지역 정보가 있다면 복원
  useEffect(() => {
    if (initialRegionId) {
      syncRegionState(initialRegionId);
    }
  }, [initialRegionId]);


  // --- 핸들러: 단계별 선택 로직 ---

  // 시/도 변경
  const handleSidoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSido = e.target.value;
    setSelectedSido(newSido);

    // 하위 초기화
    setSelectedSigugun('');
    setSelectedDongId('');
    setDongList([]);

    if (newSido) {
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

    // 하위 초기화
    setSelectedDongId('');

    if (newSigugun && selectedSido) {
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

  // 읍/면/동 변경 (최종 ID 선택)
  const handleDongChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDongId(e.target.value);
  };

  // 내 위치 찾기 핸들러
  const handleDetectLocation = async () => {
    try {
      // forceGPS가 false이고, 로그인한 유저이고 저장된 지역이 있으면 그것을 사용
      if (!forceGPS && isLoggedIn && user?.region) {
        await syncRegionState(user.region.id);
        alert(`${t.user.savedLocationSetPrefix}${user.region.full_name}${t.user.savedLocationSetSuffix}`);
        return;
      }

      // GPS로 위치 찾기
      const detectedRegion = await detectRegion();
      await syncRegionState(detectedRegion.id);
      alert(`${t.user.currentLocationSetPrefix}${detectedRegion.full_name}${t.user.currentLocationSetSuffix}`);
    } catch (error) {
      console.error("Error detecting location:", error);
      alert(error instanceof Error ? error.message : t.user.locationFailed);
    }
  };

  // 이미지 생성/링크 핸들러
  const generateRandomImage = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setProfileImage(`https://robohash.org/${randomSeed}?set=set4`);
  };

  const handleLinkInput = () => {
    const url = prompt(t.user.enterImageUrl, profileImage);
    if (url) setProfileImage(url);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await userImageApi.upload(file);
      if (res && res.image_url) {
        setProfileImage(res.image_url);
      } else {
        alert(t.user.imageUploadFailed || 'Image upload failed');
      }
    } catch (err) {
      console.error(err);
      alert(t.user.imageUploadFailed || 'Image upload failed');
    } finally {
      setUploading(false);
      // clear the input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDongId) {
        alert(t.user.selectAllRegion);
        return;
    }

    setLoading(true);
    try {
      await onSubmit({
        nickname,
        region_id: selectedDongId,
        profile_image: profileImage
      });
    } finally {
      setLoading(false);
    }
  };

  // --- 옵션 배열 생성 (Select 컴포넌트용) ---
  const sidoOptions = [
    { value: '', label: t.location.selectSido },
    ...sidoList.map(s => ({ value: s, label: s }))
  ];

  const sigugunOptions = [
    { value: '', label: t.location.selectSigugun },
    ...sigugunList.map(s => ({ value: s, label: s }))
  ];

  const dongOptions = [
    { value: '', label: t.location.selectDong },
    ...dongList.map(d => ({ value: d.id, label: d.dong }))
  ];

  const buttonText = submitButtonText || t.user.saveProfile;

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="lg">
        {/* 1. 프로필 이미지 */}
        <Center>
          <Stack gap="sm" align="center">
            <Avatar src={profileImage} alt="" size="xl" />

            <Group gap={6} wrap="wrap" justify="center">
              <Button type="button" size="sm" variant="secondary" onClick={generateRandomImage}>
                {t.common.random}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={triggerFileSelect} disabled={uploading}>
                {uploading ? (t.common.uploading || 'Uploading...') : t.common.upload}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleLinkInput}>
                {t.common.link}
              </Button>
            </Group>
          </Stack>
        </Center>

        {/* 2. 이메일 */}
        {initialEmail && (
          <Stack gap={6}>
            <Text size="sm" fw={600} c="dimmed">
              {t.user.email}
            </Text>
            <Input value={initialEmail} readOnly disabled />
          </Stack>
        )}

        {/* 3. 닉네임 */}
        <Stack gap={6}>
          <Text size="sm" fw={600} c="dimmed">
            {t.user.nickname}
          </Text>
          <Input
            value={nickname}
            onChange={(e) => setNickname(e.currentTarget.value)}
            required
            placeholder={t.user.enterNickname}
          />
        </Stack>

        {/* 4. 지역 선택 (3단 드롭다운) */}
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Text size="sm" fw={600} c="dimmed">
              {t.user.regionSettings}
            </Text>
            <Button
              type="button"
              size="sm"
              onClick={handleDetectLocation}
              disabled={detecting}
              variant="secondary"
            >
              {detecting ? t.location.findingLocation : t.user.findMyLocationIcon}
            </Button>
          </Group>

          <Stack gap="sm">
            <Select
              options={sidoOptions}
              value={selectedSido}
              onChange={handleSidoChange}
            />

            <Select
              options={sigugunOptions}
              value={selectedSigugun}
              onChange={handleSigugunChange}
              disabled={!selectedSido}
            />

            <Select
              options={dongOptions}
              value={selectedDongId}
              onChange={handleDongChange}
              disabled={!selectedSigugun}
            />
          </Stack>
        </Stack>

        <Box pt="sm">
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? t.common.processing : buttonText}
          </Button>
        </Box>
      </Stack>
    </form>
  );
}
