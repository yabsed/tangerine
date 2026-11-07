import { createContext, useContext, useMemo, type ReactNode, type Context } from 'react';
import { Loading, ErrorMessage, EmptyState } from '@/shared/ui';
import type { ProductResponse, PublicUserResponse, AuctionProduct } from '@/shared/api/types';
import type { ProductFormData } from '@/features/product/hooks/schemas';

export type DetailProduct = ProductResponse | AuctionProduct;

export interface DetailContextValue {
  product: DetailProduct;
  sellerProfile: PublicUserResponse | null | undefined;
  sellerProducts: ProductResponse[] | undefined;
  sellerAuctions: ProductResponse[] | undefined;
  isLiked: boolean;
  isOwner: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  isChatLoading: boolean;
  handleLike: () => void;
  handleChat: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleEdit: (data: ProductFormData) => Promise<void>;
  handleToggleSold: () => Promise<void>;
  handleNavigateToSeller: () => void;
  startEditing: () => void;
  cancelEditing: () => void;
}

export interface LogicWithDetailFields {
  product: DetailProduct | null | undefined;
  sellerProfile: PublicUserResponse | null | undefined;
  sellerProducts: ProductResponse[] | undefined;
  sellerAuctions: ProductResponse[] | undefined;
  isLiked: boolean;
  isOwner: boolean | undefined;
  isEditing: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  isChatLoading: boolean;
  handleLike: () => void;
  handleChat: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleEdit: (data: ProductFormData) => Promise<void>;
  handleToggleSold: () => Promise<void>;
  handleNavigateToSeller: () => void;
  startEditing: () => void;
  cancelEditing: () => void;
}

export function toDetailValue(logic: LogicWithDetailFields): DetailContextValue | null {
  if (!logic.product) return null;
  return {
    product: logic.product,
    sellerProfile: logic.sellerProfile,
    sellerProducts: logic.sellerProducts,
    sellerAuctions: logic.sellerAuctions,
    isLiked: logic.isLiked,
    isOwner: logic.isOwner ?? false,
    isEditing: logic.isEditing,
    isDeleting: logic.isDeleting,
    isUpdating: logic.isUpdating,
    isChatLoading: logic.isChatLoading,
    handleLike: logic.handleLike,
    handleChat: logic.handleChat,
    handleDelete: logic.handleDelete,
    handleEdit: logic.handleEdit,
    handleToggleSold: logic.handleToggleSold,
    handleNavigateToSeller: logic.handleNavigateToSeller,
    startEditing: logic.startEditing,
    cancelEditing: logic.cancelEditing,
  };
}

const DetailContext = createContext<DetailContextValue | null>(null);

export function DetailProvider({ value, children }: { value: DetailContextValue; children: ReactNode }) {
  return <DetailContext.Provider value={value}>{children}</DetailContext.Provider>;
}

export function useDetail(): DetailContextValue {
  const context = useContext(DetailContext);
  if (!context) throw new Error('useDetail must be used within DetailProvider');
  return context;
}

interface CreateDetailProviderConfig<T extends LogicWithDetailFields> {
  useLogic: (id: string) => T;
  loadingKey: keyof T;
  errorKey: keyof T;
  dataKey: keyof T;
  getMessages: (logic: T) => { error: string; empty: string };
}

export function createDetailProvider<T extends LogicWithDetailFields>(
  config: CreateDetailProviderConfig<T>
): {
  Context: Context<T | null>;
  Provider: React.FC<{ id: string; children: ReactNode }>;
  useContextHook: () => T;
} {
  const SpecificContext = createContext<T | null>(null);

  function Provider({ id, children }: { id: string; children: ReactNode }) {
    const logic = config.useLogic(id);
    const detailValue = useMemo(() => toDetailValue(logic), [logic]);

    const messages = config.getMessages(logic);
    if (logic[config.loadingKey]) return <Loading />;
    if (logic[config.errorKey]) return <ErrorMessage message={messages.error} />;
    if (!logic[config.dataKey] || !detailValue) return <EmptyState message={messages.empty} />;

    return (
      <SpecificContext.Provider value={logic}>
        <DetailProvider value={detailValue}>{children}</DetailProvider>
      </SpecificContext.Provider>
    );
  }

  function useContextHook(): T {
    const context = useContext(SpecificContext);
    if (!context) throw new Error('Hook must be used within its Provider');
    return context;
  }

  return { Context: SpecificContext, Provider, useContextHook };
}
