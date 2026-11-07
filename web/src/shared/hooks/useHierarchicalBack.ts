import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProductFiltersStore } from '@/features/product/store/productFiltersStore';

/**
 * Returns a navigation function that goes back using browser history first,
 * then falls back to hierarchical navigation for direct URL access.
 *
 * Hierarchy fallback:
 * - /products/:id → /products (with saved filters)
 * - /chat/:id → /chat
 * - /my/:tab → /my
 * - /user/:id → /products (or previous section)
 */
export function useHierarchicalBack() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const getProductSearchParams = useProductFiltersStore((state) => state.getSearchParams);

  const goBack = useCallback(() => {
    // If there's browser history, use it (preserves navigation context like myCarrt → product → back to myCarrt)
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    // Fallback: hierarchical navigation for direct URL access
    // /products/:id → /products with filters
    if (/^\/products\/[^/]+$/.test(pathname)) {
      navigate('/products' + getProductSearchParams());
      return;
    }

    // /chat/:id → /chat
    if (/^\/chat\/[^/]+$/.test(pathname)) {
      navigate('/chat');
      return;
    }

    // /my/:tab → /my
    if (/^\/my\/[^/]+$/.test(pathname)) {
      navigate('/my');
      return;
    }

    // /user/:id → /products with filters
    if (/^\/user\/[^/]+$/.test(pathname)) {
      navigate('/products' + getProductSearchParams());
      return;
    }

    // Final fallback to products
    navigate('/products' + getProductSearchParams());
  }, [pathname, navigate, getProductSearchParams]);

  return goBack;
}
