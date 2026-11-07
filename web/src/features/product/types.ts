// Re-export types from centralized location
export type {
  ProductResponse as Product,
  ProductDetailResponse as ProductDetail,
  ProductPostRequest as CreateProductRequest,
  ProductPatchRequest as UpdateProductRequest,
} from '@/shared/api/types';
