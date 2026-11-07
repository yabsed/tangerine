import { useState } from 'react';
import { Box, Center, Image, Skeleton, Text } from '@mantine/core';

interface ThumbnailProps {
  src?: string | null;
  alt?: string;
  size?: number; // px
  className?: string;
}

export function Thumbnail({ src, alt = '', size = 56, className = '' }: ThumbnailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizeStyle = { width: `${size}px`, height: `${size}px` } as const;

  return (
    <Box className={className} style={{ ...sizeStyle, borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
      {isLoading && src && <Skeleton visible h={size} w={size} />}

      {!hasError && src ? (
        <Image
          src={src}
          alt={alt}
          fit="cover"
          h={size}
          w={size}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : (
        <Center h={size} w={size} bg="var(--mantine-color-body)">
          <Text c="dimmed">🖼️</Text>
        </Center>
      )}
    </Box>
  );
}

export default Thumbnail;
