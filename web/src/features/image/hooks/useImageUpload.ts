import { useCallback, useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import { imageApi } from '@/features/product/api/imageApi';

export type UploadEntry = {
  id?: string;
  image_url?: string;
  file?: File;
  uploading: boolean;
  progress: number;
  previewUrl?: string;
  failedToLoad?: boolean;
  clientId: string;
};

type UseImageUploadOptions = {
  initialImageIds?: string[];
  onUploadFailed?: () => void;
};

export function useImageUpload({ initialImageIds, onUploadFailed }: UseImageUploadOptions = {}) {
  const [images, setImages] = useState<UploadEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial images from server
  useEffect(() => {
    if (!initialImageIds?.length) return;
    let mounted = true;

    (async () => {
      const results: UploadEntry[] = [];
      for (const id of initialImageIds) {
        try {
          const r = await imageApi.getById(id);
          results.push({ clientId: `server-${r.id}`, id: r.id, image_url: r.image_url, uploading: false, progress: 100 });
        } catch { /* ignore */ }
      }
      if (mounted) setImages(results);
    })();

    return () => { mounted = false; };
  }, [initialImageIds]);

  const uploadFile = useCallback(async (file: File) => {
    const clientId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const entry: UploadEntry = { clientId, file, uploading: true, progress: 0, previewUrl: URL.createObjectURL(file) };
    setImages((prev) => [...prev, entry]);

    try {
      const res = await imageApi.upload(file, (ev) => {
        if (ev.total && ev.loaded) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setImages((prev) => prev.map((p) => (p.clientId === clientId ? { ...p, progress: pct } : p)));
        }
      });
      setImages((prev) => prev.map((p) => (p.clientId === clientId ? { ...p, id: res.id, image_url: res.image_url, uploading: false, progress: 100 } : p)));
    } catch {
      setImages((prev) => prev.map((p) => (p.clientId === clientId ? { ...p, uploading: false } : p)));
      onUploadFailed?.();
    }
  }, [onUploadFailed]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) uploadFile(files[i]);
    if (e.currentTarget) e.currentTarget.value = '';
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) uploadFile(files[i]);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const types = Array.from(e.dataTransfer?.types ?? []) as string[];
    setDragOver(types.includes('Files'));
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const removeImage = useCallback((id?: string, previewUrl?: string) => {
    setImages((prev) => prev.filter((p) => (id ? p.id !== id : p.previewUrl !== previewUrl)));
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch { /* ignore */ }
    }
  }, []);

  const handleImageError = useCallback((clientId: string) => {
    setImages((prev) => prev.map((p) => {
      if (p.clientId !== clientId) return p;
      if (p.previewUrl && p.image_url) return { ...p, image_url: undefined };
      return { ...p, failedToLoad: true };
    }));
  }, []);

  // Setup sortable
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sortable = Sortable.create(el, {
      animation: 150,
      onEnd: (evt: Sortable.SortableEvent) => {
        const oldIndex = evt.oldIndex ?? 0;
        const newIndex = evt.newIndex ?? 0;
        setImages((prev) => {
          const copy = [...prev];
          const [moved] = copy.splice(oldIndex, 1);
          copy.splice(newIndex, 0, moved);
          return copy;
        });
      },
    });
    return () => { try { sortable.destroy(); } catch { /* ignore */ } };
  }, []);

  const openFilePicker = useCallback(() => inputRef.current?.click(), []);
  const isAnyUploading = images.some((u) => u.uploading);
  const imageIds = images.map((i) => i.id).filter(Boolean) as string[];

  return {
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
  };
}
