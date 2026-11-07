import client from '@/shared/api/client';
import type {
  TransactionResponse,
  BalanceRequest,
  TransferRequest,
} from '@/shared/api/types';

// Re-export types with aliases for backward compatibility
export type PayTransaction = TransactionResponse;
export type DepositRequest = BalanceRequest;
export type WithdrawRequest = BalanceRequest;
export type { TransferRequest } from '@/shared/api/types';

export interface GetTransactionsParams {
  limit?: number;
  offset?: number;
  partner_id?: string;
}

export const payApi = {
  getTransactions: async (params?: GetTransactionsParams): Promise<TransactionResponse[]> => {
    const response = await client.get<TransactionResponse[]>('/api/pay/', { params });
    return response.data;
  },

  deposit: async (data: BalanceRequest): Promise<TransactionResponse> => {
    const response = await client.post<TransactionResponse>('/api/pay/deposit', data);
    return response.data;
  },

  withdraw: async (data: BalanceRequest): Promise<TransactionResponse> => {
    const response = await client.post<TransactionResponse>('/api/pay/withdraw', data);
    return response.data;
  },

  transfer: async (data: TransferRequest): Promise<TransactionResponse> => {
    const response = await client.post<TransactionResponse>('/api/pay/transfer', data);
    return response.data;
  },
};
