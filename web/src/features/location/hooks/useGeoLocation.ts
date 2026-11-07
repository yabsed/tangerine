import { useState } from 'react';
import { fetchNearbyRegion, Region } from '@/features/location/api/region';
import { useTranslation } from '@/shared/i18n';
import { getErrorMessage } from '@/shared/api/types';

export function useGeoLocation() {
  const [detecting, setDetecting] = useState(false);
  const t = useTranslation();

  // [추가됨] IP 기반으로 위치를 추정하고 지역 정보를 가져오는 함수
  const fetchRegionByIP = async (): Promise<Region> => {
    try {
      // 1. IP 기반 위치 정보 서비스 호출 (예: ipapi.co 등 무료/유료 API 사용)
      // 실제 프로덕션에서는 백엔드 프록시를 통하거나 신뢰할 수 있는 API를 사용하세요.
      const ipResponse = await fetch('https://ipapi.co/json/');
      
      if (!ipResponse.ok) {
        throw new Error('IP Geolocation service unavailable');
      }
      
      const ipData = await ipResponse.json();
      
      // 2. IP로 얻은 위도/경도로 기존 Region API 재호출
      // (ipData.latitude, ipData.longitude 등 API 응답 스펙에 맞춰 수정 필요)
      return await fetchNearbyRegion(ipData.latitude, ipData.longitude);
      
    } catch (error) {
      throw error; // IP 조회조차 실패하면 상위로 에러 전파
    }
  };

  const detectRegion = async (): Promise<Region> => {
    if (!navigator.geolocation) {
      throw new Error(t.location.browserNotSupported);
    }

    setDetecting(true);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        // ------------------------------------------------
        // 1. 브라우저 위치 가져오기 성공 시 (GPS/Wifi)
        // ------------------------------------------------
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const data = await fetchNearbyRegion(latitude, longitude);
            resolve(data);
          } catch (error) {
            const msg = getErrorMessage(error, t.location.serverLocationError);
            reject(new Error(msg));
          } finally {
            setDetecting(false);
          }
        },
        
        // ------------------------------------------------
        // 2. 브라우저 위치 가져오기 실패 시 (에러 핸들링 & Fallback)
        // ------------------------------------------------
        async (error) => {
          // A. 사용자가 명시적으로 거부한 경우 -> 즉시 실패 처리 (Fallback 안함)
          if (error.code === error.PERMISSION_DENIED) {
            setDetecting(false);
            reject(new Error(t.location.permissionDenied));
            return;
          }

          // B. 기술적 문제 (POSITION_UNAVAILABLE, TIMEOUT 등) -> IP 기반 Fallback 시도
          try {
            // console.log("GPS 실패, IP 위치 조회 시도..."); // 디버깅용
            const fallbackData = await fetchRegionByIP();
            resolve(fallbackData);
          } catch (fallbackError) {
            // C. IP 조회까지 실패한 경우 -> 원래 에러 메시지(또는 통합 에러) 출력
            let msg = t.location.locationUnavailable;
            if (error.code === error.TIMEOUT) msg = t.location.timeout;
            if (error.code === error.POSITION_UNAVAILABLE) msg = t.location.positionUnavailable;
            
            reject(new Error(msg));
          } finally {
            // Fallback 시도가 끝난 후에 로딩 상태 해제
            setDetecting(false);
          }
        },
        
        // ------------------------------------------------
        // 3. 옵션 (정확도 향상)
        // ------------------------------------------------
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  return { detectRegion, detecting };
}