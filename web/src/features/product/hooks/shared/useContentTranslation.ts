import { useState, useMemo } from 'react';
import { useLanguage } from '@/shared/store/languageStore';
import { translateMultiple } from '@/shared/lib/translate';

function detectLanguage(text: string): 'ko' | 'en' {
  return /[가-힣]/.test(text) ? 'ko' : 'en';
}

export function useContentTranslation(title: string, content: string) {
  const { language } = useLanguage();
  const [isTranslated, setIsTranslated] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translated, setTranslated] = useState({ title: '', content: '' });

  const sourceLang = useMemo(() => detectLanguage(title + content), [title, content]);
  const needsTranslation = sourceLang !== language;

  const handleTranslate = async (): Promise<boolean> => {
    if (isTranslated) {
      setIsTranslated(false);
      return true;
    }
    if (translated.title && translated.content) {
      setIsTranslated(true);
      return true;
    }

    setIsTranslating(true);
    try {
      const results = await translateMultiple([title, content], language, sourceLang);
      setTranslated({ title: results[0].translatedText, content: results[1].translatedText });
      setIsTranslated(true);
      return true;
    } catch {
      return false;
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    displayTitle: isTranslated ? translated.title : title,
    displayContent: isTranslated ? translated.content : content,
    needsTranslation,
    isTranslated,
    isTranslating,
    handleTranslate,
  };
}
