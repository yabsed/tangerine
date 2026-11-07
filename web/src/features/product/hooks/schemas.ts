import { z } from 'zod';

// Shared base fields used by both product and auction
export const baseFormFields = {
  title: z.string().min(1, '상품 제목을 입력해주세요.').transform(v => v.trim()),
  content: z.string().min(1, '상품 설명을 입력해주세요.').transform(v => v.trim()),
  image_ids: z.array(z.string()).optional(),
};

export const productFormSchema = z.object({
  ...baseFormFields,
  price: z.number({ error: '가격을 입력해주세요.' }).min(1, '가격을 입력해주세요.'),
  is_sold: z.boolean().optional(),
  isAuction: z.boolean().optional(),
  auctionEndAt: z.string().optional(),
  region_id: z.string().optional(),
}).refine(
  (data) => !data.isAuction || (data.isAuction && data.auctionEndAt),
  { message: '경매 종료 시간을 입력해주세요.', path: ['auctionEndAt'] }
);

export type ProductFormData = z.infer<typeof productFormSchema>;
