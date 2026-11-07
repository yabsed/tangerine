import { useNavigate } from "react-router-dom";
import { useUser } from "@/features/user/hooks/useUser";
import { useCreateProduct } from "@/features/product/hooks/useProducts";
import { PageContainer } from "@/shared/layouts/PageContainer";
import { DetailHeader, DetailSection, LoginRequired, OnboardingRequired } from '@/shared/ui';
import ProductForm, { type ProductFormData } from "@/features/product/components/form/ProductForm";
import { useTranslation } from "@/shared/i18n";
import { useHierarchicalBack } from "@/shared/hooks/useHierarchicalBack";

function ProductNew() {
  const navigate = useNavigate();
  const goBack = useHierarchicalBack();
  const { isLoggedIn, needsOnboarding } = useUser();
  const createProduct = useCreateProduct();
  const t = useTranslation();

  if (!isLoggedIn) {
    return (
      <PageContainer>
        <DetailHeader />
        <LoginRequired />
      </PageContainer>
    );
  }

  if (needsOnboarding) {
    return (
      <PageContainer>
        <DetailHeader />
        <OnboardingRequired />
      </PageContainer>
    );
  }

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const payload = {
        title: data.title,
        content: data.content,
        price: data.price,
        image_ids: data.image_ids ?? [],
        category_id: '1',
      };

      const newProduct = await createProduct.mutateAsync(payload);
      alert(t.product.productRegistered);
      navigate(`/products/${newProduct.id}`);
    } catch {
      alert(t.product.registerFailed);
    }
  };

  return (
    <PageContainer>
      <DetailHeader />
      <DetailSection>
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={goBack}
          isLoading={createProduct.isPending}
        />
      </DetailSection>
    </PageContainer>
  );
}

export default ProductNew;
