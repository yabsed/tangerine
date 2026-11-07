import client from '@/shared/api/client';
import type { Product, ProductDetail, CreateProductRequest, UpdateProductRequest } from '../types';
import type { BidResponse, PlaceBidRequest, TopBidResponse } from '@/shared/api/types';

export interface ProductListParams {
  region?: string;
  seller?: string;
  category?: string;
  search?: string;
  auction?: boolean;
}

export const productApi = {
  getList: async (params: ProductListParams = {}, skipAuth = true): Promise<Product[]> => {
    const response = await client.get<Product[]>('/api/product/', {
      params,
      skipAuth,
    });
    return response.data;
  },

  getById: async (id: string): Promise<ProductDetail> => {
    const response = await client.get<ProductDetail>(`/api/product/${id}`);
    return response.data;
  },

  create: async (data: CreateProductRequest): Promise<Product> => {
    const response = await client.post<Product>('/api/product/', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const response = await client.patch<Product>(`/api/product/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/api/product/${id}`);
  },

  placeBid: async (auctionId: string, data: PlaceBidRequest): Promise<BidResponse> => {
    const response = await client.post<BidResponse>(`/api/auction/${auctionId}/bids`, data);
    return response.data;
  },

  getTopBid: async (auctionId: string): Promise<TopBidResponse | null> => {
    try {
      const response = await client.get<TopBidResponse>(`/api/auction/${auctionId}/top-bid`);
      return response.data;
    } catch {
      return null;
    }
  },
};
