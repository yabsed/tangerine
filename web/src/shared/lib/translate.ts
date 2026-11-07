const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

interface TranslateResult {
  translatedText: string;
  error?: string;
}

export async function translateText(
  text: string,
  targetLang: string = 'en',
  sourceLang: string = 'ko'
): Promise<TranslateResult> {
  if (!text.trim()) {
    return { translatedText: text };
  }

  try {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLang,
      tl: targetLang,
      dt: 't',
      q: text,
    });

    const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params}`);

    if (!response.ok) {
      throw new Error('Translation request failed');
    }

    const data = await response.json();

    // Google Translate API returns nested array: [[["translated text", "original text", ...]]]
    const translatedText = data[0]
      ?.map((item: [string]) => item[0])
      .join('') || text;

    return { translatedText };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translatedText: text,
      error: error instanceof Error ? error.message : 'Translation failed'
    };
  }
}

export async function translateMultiple(
  texts: string[],
  targetLang: string = 'en',
  sourceLang: string = 'ko'
): Promise<TranslateResult[]> {
  return Promise.all(
    texts.map(text => translateText(text, targetLang, sourceLang))
  );
}
