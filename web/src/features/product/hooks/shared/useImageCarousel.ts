import { useState, useEffect, useCallback } from 'react';

export function useImageCarousel(length: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [length]);

  const goNext = useCallback(() => setIndex(i => Math.min(i + 1, length - 1)), [length]);
  const goPrev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);
  const goTo = useCallback((i: number) => setIndex(i), []);

  return {
    index,
    hasPrev: index > 0,
    hasNext: index < length - 1,
    goNext,
    goPrev,
    goTo,
  };
}
