import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Stack,
  Group,
  TextInput,
  NumberInput,
  Textarea,
  Checkbox,
  Text,
  UnstyledButton,
  Select,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { IconMapPin, IconInfoCircle, IconCalendar, IconClock, IconEdit } from '@tabler/icons-react';
import 'dayjs/locale/ko';
import { Button, SegmentedTabBar } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { useLanguage } from '@/shared/store/languageStore';
import { productFormSchema, type ProductFormData } from '@/features/product/hooks/schemas';
import { useImageUpload, ImageUploadSection } from '@/features/image';
import RegionSelectModal from '@/features/location/components/RegionSelectModal';
import { fetchRegionById } from '@/features/location/api/region';

export type { ProductFormData };

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  showIsSold?: boolean;
  showRegion?: boolean;
  showAuctionOption?: boolean;
  isLoading?: boolean;
}

const ProductForm = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel,
  showIsSold = false,
  showRegion = false,
  showAuctionOption = true,
  isLoading = false,
}: ProductFormProps) => {
  const t = useTranslation();
  const { language } = useLanguage();
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [regionId, setRegionId] = useState<string | undefined>(initialData?.region_id);
  const [regionName, setRegionName] = useState<string>('');

  useEffect(() => {
    if (initialData?.region_id) {
      fetchRegionById(initialData.region_id)
        .then(region => setRegionName(`${region.sigugun} ${region.dong}`))
        .catch(() => setRegionName(''));
    }
  }, [initialData?.region_id]);

  const handleRegionSelect = (id: string, name: string) => {
    setRegionId(id);
    setRegionName(name);
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      price: initialData?.price,
      content: initialData?.content ?? '',
      is_sold: initialData?.is_sold ?? false,
      image_ids: initialData?.image_ids ?? [],
      isAuction: initialData?.isAuction ?? false,
      auctionEndAt: initialData?.auctionEndAt ?? '',
    },
  });

  const isAuction = watch('isAuction');

  const {
    images,
    dragOver,
    inputRef,
    containerRef,
    isAnyUploading,
    imageIds,
    openFilePicker,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    removeImage,
    handleImageError,
  } = useImageUpload({
    initialImageIds: initialData?.image_ids,
    onUploadFailed: () => alert(t.product.imageUploadFailed),
  });

  const wrappedSubmit = handleSubmit(async (data) => {
    if (isAnyUploading) {
      alert(t.product.imageUploadingWait);
      return;
    }
    
    if (watch('isAuction')) {
      if (!window.confirm(t.auction.cannotEditOrDelete)) {
        return;
      }
    }

    await onSubmit({ ...data, image_ids: imageIds, region_id: regionId });
  });

  return (
    <Box
      component="form"
      onSubmit={wrappedSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      pos="relative"
    >
      <Box mb="xs">
        <TextInput
          {...register('title')}
          placeholder={t.product.enterTitle}
          variant="unstyled"
          size="xl"
          styles={{
            input: {
              fontSize: 'var(--mantine-font-size-xl)',
              fontWeight: 700,
              borderBottom: '1px dashed var(--mantine-color-default-border)',
              borderRadius: 0,
              paddingBottom: 'var(--mantine-spacing-xs)',
              '&:focus': {
                borderBottomColor: 'var(--mantine-color-orange-6)',
              },
            },
          }}
          error={errors.title?.message}
        />
      </Box>

      <Box mb="lg">
        <Group gap="xs" align="baseline">
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <NumberInput
                {...field}
                placeholder={isAuction ? t.auction.startingPrice : t.product.price}
                min={0}
                variant="unstyled"
                hideControls
                w={160}
                styles={{
                  input: {
                    fontSize: 'var(--mantine-font-size-xl)',
                    fontWeight: 700,
                    color: 'var(--mantine-color-orange-6)',
                    borderBottom: '1px dashed var(--mantine-color-default-border)',
                    borderRadius: 0,
                    paddingBottom: 'var(--mantine-spacing-xs)',
                    '&:focus': {
                      borderBottomColor: 'var(--mantine-color-orange-6)',
                    },
                  },
                }}
              />
            )}
          />
          <Text size="xl" fw={700} c="orange.6">{t.common.won}</Text>
        </Group>
        {errors.price && <Text size="sm" c="red" mt="xs">{errors.price.message}</Text>}
      </Box>

      {showAuctionOption && (
        <>
          <Box mb="lg">
            <SegmentedTabBar
              tabs={[
                { id: 'regular', label: t.product.regular },
                { id: 'auction', label: t.auction.auction },
              ]}
              activeTab={isAuction ? 'auction' : 'regular'}
              onTabChange={(tab) => setValue('isAuction', tab === 'auction')}
            />
          </Box>
          {isAuction && (
            <Box
              mb="lg"
              p="md"
              style={{
                backgroundColor: 'var(--mantine-color-gray-0)',
                borderRadius: 'var(--mantine-radius-md)',
                borderLeft: '3px solid var(--mantine-color-orange-5)',
              }}
            >
              <Controller
                name="auctionEndAt"
                control={control}
                render={({ field }) => {
                  const getDefaultDate = () => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(12, 0, 0, 0);
                    return tomorrow;
                  };

                  const currentDate = field.value ? new Date(field.value) : getDefaultDate();

                  if (!field.value) {
                    field.onChange(currentDate.toISOString());
                  }

                  const hours = Array.from({ length: 24 }, (_, i) => ({
                    value: String(i),
                    label: `${i}시`,
                  }));
                  const minutes = Array.from({ length: 12 }, (_, i) => ({
                    value: String(i * 5),
                    label: `${i * 5}분`,
                  }));

                  const updateDateTime = (date: Date | string | null, hour?: number, minute?: number) => {
                    const baseDate = date
                      ? (typeof date === 'string' ? new Date(date) : new Date(date))
                      : new Date(currentDate);
                    baseDate.setHours(hour ?? currentDate.getHours());
                    baseDate.setMinutes(minute ?? currentDate.getMinutes());
                    baseDate.setSeconds(0);
                    field.onChange(baseDate.toISOString());
                  };

                  const formatDateKo = (date: Date) => {
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    const hour = date.getHours();
                    const minute = date.getMinutes().toString().padStart(2, '0');
                    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                    return `${month}월 ${day}일 (${weekdays[date.getDay()]}) ${hour}시 ${minute}분`;
                  };

                  const formatDateEn = (date: Date) => {
                    const day = date.getDate();
                    const hour = date.getHours();
                    const minute = date.getMinutes().toString().padStart(2, '0');
                    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${months[date.getMonth()]} ${day} (${weekdays[date.getDay()]}) ${hour}:${minute}`;
                  };

                  return (
                    <Stack gap="sm">
                      <Group gap="xs" align="center" wrap="wrap">
                        {language === 'ko' ? (
                          <>
                            <Text size="md" fw={600} c="orange.6">{formatDateKo(currentDate)}</Text>
                            <Text size="md" c="dimmed">{t.auction.auctionEndsAt}</Text>
                          </>
                        ) : (
                          <>
                            <Text size="md" c="dimmed">{t.auction.auctionEndsAt}</Text>
                            <Text size="md" fw={600} c="orange.6">{formatDateEn(currentDate)}</Text>
                          </>
                        )}
                        <UnstyledButton
                          onClick={() => setDatePickerOpen(!datePickerOpen)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <IconEdit size={14} color="var(--mantine-color-dimmed)" />
                          <Text size="xs" c="dimmed">{datePickerOpen ? t.auction.close : t.auction.change}</Text>
                        </UnstyledButton>
                      </Group>
                      {datePickerOpen && (
                        <Group gap="lg" align="flex-start" mt="xs">
                          <Box>
                            <Group gap={4} mb={4}>
                              <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                              <Text size="xs" c="dimmed">{t.auction.date}</Text>
                            </Group>
                            <DatePicker
                              value={currentDate}
                              onChange={(date) => updateDateTime(date)}
                              locale="ko"
                              minDate={new Date()}
                              size="sm"
                            />
                          </Box>
                          <Box>
                            <Group gap={4} mb={4}>
                              <IconClock size={14} color="var(--mantine-color-dimmed)" />
                              <Text size="xs" c="dimmed">{t.auction.time}</Text>
                            </Group>
                            <Stack gap="xs">
                              <Select
                                data={hours}
                                value={String(currentDate.getHours())}
                                onChange={(v) => updateDateTime(null, Number(v))}
                                w={90}
                                size="sm"
                                comboboxProps={{ withinPortal: true }}
                              />
                              <Select
                                data={minutes}
                                value={String(Math.floor(currentDate.getMinutes() / 5) * 5)}
                                onChange={(v) => updateDateTime(null, undefined, Number(v))}
                                w={90}
                                size="sm"
                                comboboxProps={{ withinPortal: true }}
                              />
                            </Stack>
                          </Box>
                        </Group>
                      )}
                      <Group gap={6} align="center">
                        <IconInfoCircle size={14} color="var(--mantine-color-dimmed)" />
                        <Text size="xs" c="dimmed">
                          {t.auction.cannotEditOrDelete}
                        </Text>
                      </Group>
                    </Stack>
                  );
                }}
              />
            </Box>
          )}
          {errors.auctionEndAt && <Text size="sm" c="red" mb="md">{errors.auctionEndAt.message}</Text>}
        </>
      )}

      {showRegion && (
        <Box mb="lg">
          <Group gap="sm" align="center">
            <Text size="sm" c="dimmed">{t.product.region}:</Text>
            <UnstyledButton
              onClick={() => setRegionModalOpen(true)}
              px="sm"
              py={6}
              style={{
                fontSize: 'var(--mantine-font-size-sm)',
                fontWeight: 500,
                backgroundColor: 'var(--mantine-color-default-hover)',
                borderRadius: 'var(--mantine-radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--mantine-spacing-xs)',
              }}
            >
              <IconMapPin size={16} color="var(--mantine-color-orange-6)" />
              <span>{regionName || t.location.allRegions}</span>
            </UnstyledButton>
          </Group>
          <RegionSelectModal
            isOpen={regionModalOpen}
            onClose={() => setRegionModalOpen(false)}
            onSelect={handleRegionSelect}
            initialRegionId={regionId}
          />
        </Box>
      )}

      <Box mt="lg" pt="lg" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Textarea
          {...register('content')}
          rows={6}
          variant="unstyled"
          placeholder={t.product.enterDescription}
          styles={{
            input: {
              borderBottom: '1px dashed var(--mantine-color-default-border)',
              borderRadius: 0,
              '&:focus': {
                borderBottomColor: 'var(--mantine-color-orange-6)',
              },
            },
          }}
          error={errors.content?.message}
        />
      </Box>

      <ImageUploadSection
        images={images}
        dragOver={dragOver}
        inputRef={inputRef}
        containerRef={containerRef}
        onFileChange={handleFileChange}
        onOpenPicker={openFilePicker}
        onRemove={removeImage}
        onImageError={handleImageError}
        labels={{
          select: t.product.imagesSelect,
          dropzone: t.product.imagesDropzone,
          selected: t.product.imagesSelected,
          none: t.product.imagesNone,
          delete: t.common.delete,
        }}
      />

      <Group justify="flex-end" pt="lg" mt="lg" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Group justify="flex-end" w="100%">
          {showIsSold && (
            <Checkbox
              {...register('is_sold')}
              label={t.product.soldOut}
              size="sm"
              style={{ marginRight: 'auto' }}
            />
          )}
          <Group gap="xs">
            <Button size="sm" variant="ghost" type="button" onClick={onCancel}>
              {t.common.cancel}
            </Button>
            <Button size="sm" type="submit" disabled={isLoading}>
              {isLoading ? t.common.processing : (submitLabel || t.common.save)}
            </Button>
          </Group>
        </Group>
      </Group>
    </Box>
  );
};

export default ProductForm;
