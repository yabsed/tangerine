import client from '@/shared/api/client';
import type { AxiosProgressEvent } from 'axios';

export interface ImageUploadResponse {
  id: string;
  image_url: string;
}

export const imageApi = {
  upload: async (
    file: File,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  ): Promise<ImageUploadResponse> => {
    const form = new FormData();
    form.append('file', file);
    const response = await client.post<ImageUploadResponse>('/api/image/user', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return response.data as ImageUploadResponse;
  },

  getById: async (id: string): Promise<ImageUploadResponse> => {
    const response = await client.get<ImageUploadResponse>(`/api/image/user/${id}`);
    return response.data;
  },
};

export default imageApi;
