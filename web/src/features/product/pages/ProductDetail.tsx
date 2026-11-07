import { useParams } from "react-router-dom";
import { PageContainer } from "@/shared/layouts/PageContainer";
import { DetailHeader, DetailSection } from '@/shared/ui';
import { ProductDetailProvider, useProductDetail } from "@/features/product/hooks/ProductDetailContext";
import { SellerSection } from "@/features/product/components/detail/SellerSection";
import { SellerProductList } from "@/features/product/components/detail/SellerProductList";
import { ProductDetailView } from "@/features/product/components/detail/ProductDetailView";
import { ProductEditForm } from "@/features/product/components/detail/ProductEditForm";

function ProductDetailContent() {
  const { isEditing } = useProductDetail();

  return (
    <PageContainer>
      <DetailHeader />

      <DetailSection style={{ marginBottom: 'var(--mantine-spacing-md)' }}>
        <SellerSection />
      </DetailSection>

      {isEditing ? <DetailSection><ProductEditForm /></DetailSection> : <ProductDetailView />}

      <SellerProductList />
    </PageContainer>
  );
}

function ProductDetail() {
  const { id } = useParams();

  return (
    <ProductDetailProvider id={id!}>
      <ProductDetailContent />
    </ProductDetailProvider>
  );
}

export default ProductDetail;
