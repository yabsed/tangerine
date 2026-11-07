import { useState } from 'react';
import { Box, Center, Image, Skeleton, Stack, Text } from '@mantine/core';

interface DetailImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function DetailImage({ src, alt, className = '' }: DetailImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <Box pos="relative" className={className} style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
      {isLoading && src && (
        <Skeleton visible h={400} />
      )}

      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          fit="contain"
          h={400}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : (
        <Center h={400}>
          <Stack align="center" gap={6}>
            <Text fz={40} c="dimmed">
              🖼️
            </Text>
            <Text size="sm" c="dimmed">
              {alt}
            </Text>
          </Stack>
        </Center>
      )}
    </Box>
  );
}
