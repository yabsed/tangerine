import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/features/user/hooks/useUser';
import { useCreateRoom } from '@/features/chat/hooks/useChat';
import { useDeleteProduct, useUpdateProduct } from '@/features/product/hooks/useProducts';
import { useTranslation } from '@/shared/i18n';
import type { UpdateProductRequest } from '@/features/product/types';
import type { ProductFormData } from '@/features/product/hooks/schemas';

interface ProductLike {
  id: string;
  owner_id: string;
  title: string;
  content: string | null;
  price: number;
  image_ids?: string[];
  category_id: string;
  region_id: string;
  is_sold: boolean;
}

interface DetailHandlersOptions {
  product: ProductLike | undefined;
  redirectPath: string;
  onEditSuccess?: () => void;
}

export function useDetailHandlers({ product, redirectPath, onEditSuccess }: DetailHandlersOptions) {
  const navigate = useNavigate();
  const t = useTranslation();
  const { user, isLoggedIn } = useUser();

  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const createRoom = useCreateRoom();

  const [isLiked, setIsLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isOwner = product && String(user?.id) === product.owner_id;

  const handleLike = useCallback(() => setIsLiked(prev => !prev), []);

  const handleChat = useCallback(async () => {
    if (!product) return;
    if (!isLoggedIn) {
      navigate('/auth/login');
      return;
    }
    if (String(user?.id) === product.owner_id) {
      alert(t.product.ownProduct);
      return;
    }
    createRoom.mutate(product.owner_id, {
      onSuccess: (roomId) => navigate(`/chat/${roomId}`),
      onError: () => alert(t.chat.cannotOpenRoom),
    });
  }, [product, isLoggedIn, user?.id, navigate, createRoom, t]);

  const handleDelete = useCallback(async () => {
    if (!product || !confirm(t.product.confirmDelete)) return;
    try {
      await deleteProduct.mutateAsync(product.id);
      alert(t.product.deleted);
      navigate(redirectPath);
    } catch {
      alert(t.product.deleteFailed);
    }
  }, [product, deleteProduct, navigate, redirectPath, t]);

  const handleEdit = useCallback(async (data: ProductFormData) => {
    if (!product) return;

    const updateData: UpdateProductRequest = {
      title: data.title.trim(),
      content: data.content.trim(),
      price: data.price,
      category_id: product.category_id,
      image_ids: data.image_ids ?? [],
      region_id: data.region_id ?? product.region_id,
      is_sold: data.is_sold ?? false,
    };

    try {
      await updateProduct.mutateAsync({ id: product.id, data: updateData });
      alert(t.product.updated);
      setIsEditing(false);
      onEditSuccess?.();
    } catch {
      alert(t.product.updateFailed);
    }
  }, [product, updateProduct, t, onEditSuccess]);

  const handleNavigateToSeller = useCallback(() => {
    if (product?.owner_id) navigate(`/user/${product.owner_id}`);
  }, [product?.owner_id, navigate]);

  const handleToggleSold = useCallback(async () => {
    if (!product) return;

    const updateData: UpdateProductRequest = {
      title: product.title,
      content: product.content ?? '',
      price: product.price,
      category_id: product.category_id,
      region_id: product.region_id,
      image_ids: product.image_ids ?? [],
      is_sold: !product.is_sold,
    };

    try {
      await updateProduct.mutateAsync({ id: product.id, data: updateData });
      alert(t.product.statusChanged);
      onEditSuccess?.();
    } catch {
      alert(t.product.updateFailed);
    }
  }, [product, updateProduct, t, onEditSuccess]);

  const startEditing = useCallback(() => setIsEditing(true), []);
  const cancelEditing = useCallback(() => setIsEditing(false), []);

  return {
    isLiked,
    isEditing,
    isOwner,
    isDeleting: deleteProduct.isPending,
    isUpdating: updateProduct.isPending,
    isChatLoading: createRoom.isPending,
    handleLike,
    handleChat,
    handleDelete,
    handleEdit,
    handleToggleSold,
    handleNavigateToSeller,
    startEditing,
    cancelEditing,
  };
}
