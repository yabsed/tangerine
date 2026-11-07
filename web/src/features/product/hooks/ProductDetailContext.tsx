import { useProductDetailLogic } from './useProductDetailLogic';
import { useTranslation } from '@/shared/i18n';
import { createDetailProvider } from './DetailContext';

function useProductLogicWithMessages(id: string) {
  const t = useTranslation();
  return { ...useProductDetailLogic(id), messages: { error: t.product.loadFailed, empty: t.product.noInfo } };
}

const { Provider, useContextHook } = createDetailProvider({
  useLogic: useProductLogicWithMessages,
  loadingKey: 'productLoading',
  errorKey: 'productError',
  dataKey: 'product',
  getMessages: (logic) => logic.messages,
});

export { Provider as ProductDetailProvider, useContextHook as useProductDetail };
