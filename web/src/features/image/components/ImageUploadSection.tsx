import { RefObject } from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
import { Button, CardImage } from '@/shared/ui';
import type { UploadEntry } from '../hooks';

type ImageUploadSectionProps = {
  images: UploadEntry[];
  dragOver: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenPicker: () => void;
  onRemove: (id?: string, previewUrl?: string) => void;
  onImageError: (clientId: string) => void;
  labels: {
    select: string;
    dropzone: string;
    selected: string;
    none: string;
    delete: string;
  };
};

export function ImageUploadSection({
  images,
  dragOver,
  inputRef,
  containerRef,
  onFileChange,
  onOpenPicker,
  onRemove,
  onImageError,
  labels,
}: ImageUploadSectionProps) {
  return (
    <Box mt="md">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
      <Box mb="xs">
        <Stack
          align="center"
          justify="center"
          gap="xs"
          py="md"
          c={dragOver ? 'orange' : 'var(--text-secondary)'}
        >
          <Button
            type="button"
            size="sm"
            variant={dragOver ? 'outline-primary' : 'outline'}
            onClick={onOpenPicker}
          >
            {labels.select}
          </Button>
          <Text size="sm" mt="xs">{labels.dropzone}</Text>
        </Stack>
        <Group justify="flex-end" mt="xs">
          <Text size="sm" c="var(--text-secondary)">
            {labels.selected.replace('{count}', String(images.length))}
          </Text>
        </Group>
      </Box>

      <Group ref={containerRef} gap="md" mt="md" wrap="wrap" align="flex-start">
        {images.length === 0 && (
          <Text size="sm" c="var(--text-secondary)" ml="xs">{labels.none}</Text>
        )}
        {images.map((img, idx) => (
          <Box key={img.clientId} pos="relative" data-clientid={img.clientId}>
            <CardImage
              src={img.previewUrl ?? img.image_url ?? undefined}
              alt={`preview-${idx}`}
              w={112}
              h={112}
              onError={() => onImageError(img.clientId)}
            />

            {img.uploading && (
              <Box
                pos="absolute"
                top={0}
                left={0}
                w={112}
                h={112}
                bg="rgba(0, 0, 0, 0.4)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--mantine-radius-xl)',
                }}
              >
                <Text size="sm" c="white">{img.progress}%</Text>
              </Box>
            )}

            <Button
              type="button"
              size="xs"
              variant="secondary"
              onClick={(e) => { e.stopPropagation(); onRemove(img.id, img.previewUrl); }}
              style={{ position: 'absolute', top: -8, right: -8 }}
              aria-label="remove image"
            >
              {labels.delete}
            </Button>
          </Box>
        ))}
      </Group>
    </Box>
  );
}
