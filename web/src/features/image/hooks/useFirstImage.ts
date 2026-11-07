import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { imageApi, type ImageUploadResponse } from '@/features/product/api/imageApi';

export function useFirstImage(imageIds?: string[]) {
  const firstImageId = useMemo(
    () => (imageIds?.length ? imageIds[0] : undefined),
    [imageIds]
  );

  const { data: firstImage } = useQuery<ImageUploadResponse | null>({
    queryKey: ['image', firstImageId],
    queryFn: () => (firstImageId ? imageApi.getById(firstImageId) : null),
    enabled: !!firstImageId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });

  return firstImage?.image_url;
}
