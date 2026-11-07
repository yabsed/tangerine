import { create } from 'zustand';

export interface ProductFilters {
  region?: string;
  sido?: string;
  sigugun?: string;
  auction: boolean;
}

interface ProductFiltersState {
  filters: ProductFilters;
  setFilters: (filters: Partial<ProductFilters>) => void;
  getSearchParams: () => string;
}

const STORAGE_KEY = 'product-filters';

const getInitialFilters = (): ProductFilters => {
  if (typeof window === 'undefined') return { auction: false };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore parse errors
  }
  return { auction: false };
};

const saveFilters = (filters: ProductFilters) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
};

export const useProductFiltersStore = create<ProductFiltersState>((set, get) => ({
  filters: getInitialFilters(),

  setFilters: (newFilters) =>
    set((state) => {
      const updated = { ...state.filters, ...newFilters };
      saveFilters(updated);
      return { filters: updated };
    }),

  getSearchParams: () => {
    const { filters } = get();
    const params = new URLSearchParams();

    if (filters.region) {
      params.set('region', filters.region);
    } else if (filters.sido) {
      params.set('sido', filters.sido);
      if (filters.sigugun) {
        params.set('sigugun', filters.sigugun);
      }
    }

    if (filters.auction) {
      params.set('auction', 'true');
    }

    const str = params.toString();
    return str ? `?${str}` : '';
  },
}));

export const useProductFilters = () => useProductFiltersStore();
