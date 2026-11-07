import { create } from 'zustand';

type Language = 'ko' | 'en';

interface LanguageState {
  language: Language;
  toggleLanguage: () => void;
}

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'ko';
  return (localStorage.getItem('language') as Language) || 'ko';
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLanguage(),
  toggleLanguage: () =>
    set((state) => {
      const newLanguage = state.language === 'ko' ? 'en' : 'ko';
      localStorage.setItem('language', newLanguage);
      return { language: newLanguage };
    }),
}));

export const useLanguage = () => useLanguageStore();
