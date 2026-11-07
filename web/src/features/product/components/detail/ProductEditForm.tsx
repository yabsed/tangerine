import ProductForm from '@/features/product/components/form/ProductForm';
import { useTranslation } from '@/shared/i18n';
import { useDetail } from '@/features/product/hooks/DetailContext';

export function ProductEditForm() {
  const t = useTranslation();
  const { product, handleEdit, cancelEditing, isUpdating } = useDetail();

  return (
    <ProductForm
      initialData={{ ...product, content: product.content ?? undefined }}
      onSubmit={handleEdit}
      onCancel={cancelEditing}
      submitLabel={t.common.save}
      showIsSold={true}
      showRegion={true}
      showAuctionOption={false}
      isLoading={isUpdating}
    />
  );
}
