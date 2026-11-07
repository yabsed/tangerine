import { z } from 'zod';
import { AxiosError } from 'axios';

// ============================================
// API Error Types
// ============================================

export interface ApiErrorData {
  detail?: string;
  message?: string;
  error?: string;
  error_msg?: string;
}

export type ApiError = AxiosError<ApiErrorData>;

export function isApiError(error: unknown): error is ApiError {
  return error instanceof AxiosError;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    const data = error.response?.data;
    return data?.detail ?? data?.message ?? data?.error ?? data?.error_msg ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

// ============================================
// Common / Shared Schemas
// ============================================

export const PublicUserResponseSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  profile_image: z.string().nullable(),
});

export const RegionResponseSchema = z.object({
  id: z.string(),
  sido: z.string(),
  sigugun: z.string(),
  dong: z.string(),
  full_name: z.string(),
});

export const ValidationErrorSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
});

export const HTTPValidationErrorSchema = z.object({
  detail: z.array(ValidationErrorSchema).optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const UserSigninRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UserSignupRequestSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const TokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

// ============================================
// User Schemas
// ============================================

export const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nickname: z.string().nullable(),
  region: RegionResponseSchema.nullable(),
  profile_image: z.string().nullable(),
  coin: z.number().int(),
  status: z.string(),
});

export const UserOnboardingRequestSchema = z.object({
  nickname: z.string(),
  region_id: z.string(),
  profile_image: z.string().nullable().optional(),
  coin: z.number().int().nullable().optional(),
});

export const UserUpdateRequestSchema = z.object({
  nickname: z.string().nullable().optional(),
  region_id: z.string().nullable().optional(),
  profile_image: z.string().nullable().optional(),
});

// ============================================
// Chat Schemas
// ============================================

export const ChatRoomReadSchema = z.object({
  id: z.string(),
  user_one_id: z.string(),
  user_two_id: z.string(),
  created_at: z.string().datetime(),
});

export const ChatRoomListReadSchema = z.object({
  room_id: z.string(),
  opponent_id: z.string(),
  opponent_nickname: z.string().nullable().optional(),
  opponent_profile_image: z.string().nullable().optional(),
  last_message: z.string().nullable().optional(),
  last_message_at: z.string().datetime().nullable().optional(),
  unread_count: z.number().int().default(0),
});

export const MessageCreateSchema = z.object({
  content: z.string(),
});

export const MessageReadSchema = z.object({
  id: z.number().int(),
  room_id: z.string(),
  sender_id: z.string(),
  content: z.string(),
  created_at: z.string().datetime(),
  is_read: z.boolean(),
});

export const OpponentStatusSchema = z.object({
  user_id: z.string(),
  nickname: z.string().nullable().optional(),
  profile_image: z.string().nullable().optional(),
  status: z.string(),
  last_active_at: z.string().datetime().nullable().optional(),
});

// ============================================
// Product Schemas
// ============================================

export const ProductPostRequestSchema = z.object({
  title: z.string(),
  content: z.string(),
  price: z.number().int(),
  image_ids: z.array(z.string()).optional(),
  category_id: z.string(),
  auction: z.object({ end_at: z.string() }).optional(),
});

export const ProductPatchRequestSchema = z.object({
  title: z.string(),
  content: z.string(),
  price: z.number().int(),
  image_ids: z.array(z.string()).optional(),
  category_id: z.string(),
  region_id: z.string(),
  is_sold: z.boolean(),
});

export const ProductResponseSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  price: z.number().int(),
  like_count: z.number().int(),
  category_id: z.string(),
  image_ids: z.array(z.string()).optional(),
  region_id: z.string(),
  is_sold: z.boolean(),
});

// ============================================
// Auction Schemas
// ============================================

export const AuctionStatusSchema = z.enum(['active', 'ended', 'cancelled']);

export const AuctionProductSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  title: z.string(),
  image_ids: z.array(z.string()).optional(),
  content: z.string().nullable(),
  price: z.number().int(),
  like_count: z.number().int(),
  category_id: z.string(),
  region_id: z.string(),
  is_sold: z.boolean(),
});

export const AuctionInfoSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  current_price: z.number().int(),
  end_at: z.string().datetime(),
  bid_count: z.number().int(),
  status: AuctionStatusSchema,
});

export const AuctionResponseSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  current_price: z.number().int(),
  end_at: z.string().datetime(),
  bid_count: z.number().int(),
  status: AuctionStatusSchema,
  product: AuctionProductSchema,
});

export const ProductWithAuctionResponseSchema = ProductResponseSchema.extend({
  auction: AuctionInfoSchema,
});

export const ProductDetailResponseSchema = ProductResponseSchema.extend({
  auction: AuctionInfoSchema.optional(),
});

export const BidResponseSchema = z.object({
  id: z.string(),
  auction_id: z.string(),
  bidder_id: z.string(),
  bid_price: z.number().int(),
  bid_at: z.string().datetime(),
});

export const TopBidResponseSchema = z.object({
  id: z.string(),
  auction_id: z.string(),
  bidder_id: z.string(),
  bid_price: z.number().int(),
  bid_at: z.string().datetime(),
});

export const CreateAuctionDataSchema = z.object({
  end_at: z.string().datetime(),
});

export const CreateAuctionRequestSchema = z.object({
  title: z.string(),
  image_ids: z.array(z.string()).optional(),
  content: z.string(),
  price: z.number().int(),
  category_id: z.string(),
  auction: CreateAuctionDataSchema,
});

export const PlaceBidRequestSchema = z.object({
  bid_price: z.number().int().positive(),
});

// ============================================
// Region Schemas
// ============================================

export const DongEntrySchema = z.object({
  id: z.string(),
  dong: z.string(),
});

// ============================================
// Pay Schemas
// ============================================

export const TransactionTypeSchema = z.enum(['DEPOSIT', 'WITHDRAW', 'TRANSFER']);

export const BalanceRequestSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string(),
  request_key: z.string(),
});

export const BalanceResponseSchema = z.object({
  amount: z.number().int(),
  description: z.string(),
  time: z.string().datetime(),
  user: PublicUserResponseSchema,
});

export const TransferRequestSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string(),
  request_key: z.string(),
  receive_user_id: z.string(),
});

export const TransferResponseSchema = z.object({
  amount: z.number().int(),
  description: z.string(),
  time: z.string().datetime(),
  user: PublicUserResponseSchema,
  receive_user: PublicUserResponseSchema,
});

export const TransactionResponseSchema = z.object({
  id: z.string(),
  type: TransactionTypeSchema,
  details: z.union([TransferResponseSchema, BalanceResponseSchema]),
});

// ============================================
// Type Exports (inferred from schemas)
// ============================================

// Common
export type PublicUserResponse = z.infer<typeof PublicUserResponseSchema>;
export type RegionResponse = z.infer<typeof RegionResponseSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type HTTPValidationError = z.infer<typeof HTTPValidationErrorSchema>;

// Auth
export type UserSigninRequest = z.infer<typeof UserSigninRequestSchema>;
export type UserSignupRequest = z.infer<typeof UserSignupRequestSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

// User
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserOnboardingRequest = z.infer<typeof UserOnboardingRequestSchema>;
export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>;

// Chat
export type ChatRoomRead = z.infer<typeof ChatRoomReadSchema>;
export type ChatRoomListRead = z.infer<typeof ChatRoomListReadSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type MessageRead = z.infer<typeof MessageReadSchema>;
export type OpponentStatus = z.infer<typeof OpponentStatusSchema>;

// Product
export type ProductPostRequest = z.infer<typeof ProductPostRequestSchema>;
export type ProductPatchRequest = z.infer<typeof ProductPatchRequestSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;

// Region
export type DongEntry = z.infer<typeof DongEntrySchema>;

// Pay
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type BalanceRequest = z.infer<typeof BalanceRequestSchema>;
export type BalanceResponse = z.infer<typeof BalanceResponseSchema>;
export type TransferRequest = z.infer<typeof TransferRequestSchema>;
export type TransferResponse = z.infer<typeof TransferResponseSchema>;
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;

// Auction
export type AuctionStatus = z.infer<typeof AuctionStatusSchema>;
export type AuctionProduct = z.infer<typeof AuctionProductSchema>;
export type AuctionInfo = z.infer<typeof AuctionInfoSchema>;
export type AuctionResponse = z.infer<typeof AuctionResponseSchema>;
export type ProductWithAuctionResponse = z.infer<typeof ProductWithAuctionResponseSchema>;
export type BidResponse = z.infer<typeof BidResponseSchema>;
export type TopBidResponse = z.infer<typeof TopBidResponseSchema>;
export type CreateAuctionData = z.infer<typeof CreateAuctionDataSchema>;
export type CreateAuctionRequest = z.infer<typeof CreateAuctionRequestSchema>;
export type PlaceBidRequest = z.infer<typeof PlaceBidRequestSchema>;
