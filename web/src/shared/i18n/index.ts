import { useLanguage } from '@/shared/store/languageStore';
import { ko } from './translations/ko';
import { en } from './translations/en';

const translations = { ko, en } as const;

export function useTranslation() {
  const { language } = useLanguage();
  return translations[language];
}

export { ko, en };
