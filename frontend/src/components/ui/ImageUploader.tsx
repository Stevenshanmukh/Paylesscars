'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Upload,
    X,
    Image as ImageIcon,
    Star,
    GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateImageFile } from '@/lib/utils/image';
import { toast } from 'sonner';

interface ImageFile {
    id: string;
    file?: File;
    preview: string;
    isPrimary: boolean;
    isExisting?: boolean;
}

interface ImageUploaderProps {
    existingImages?: Array<{ id: string; url: string; isPrimary: boolean }>;
    onImagesChange: (files: File[], primaryIndex: number, deletedImageIds: string[], imageOrder: string[]) => void;
    maxImages?: number;
    className?: string;
}

export function ImageUploader({
    existingImages = [],
    onImagesChange,
    maxImages = 10,
    className
}: ImageUploaderProps) {
    const [images, setImages] = useState<ImageFile[]>(() =>
        existingImages.map(img => ({
            id: img.id,
            preview: img.url,
            isPrimary: img.isPrimary,
            isExisting: true
        }))
    );
    const [isDragging, setIsDragging] = useState(false);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFilesSelected = useCallback((files: FileList | null) => {
        if (!files) return;

        const newImages: ImageFile[] = [];
        const errors: string[] = [];

        Array.from(files).forEach(file => {
            const validation = validateImageFile(file);
            if (!validation.valid) {
                errors.push(`${file.name}: ${validation.error}`);
                return;
            }

            if (images.length + newImages.length >= maxImages) {
                errors.push(`Maximum ${maxImages} images allowed`);
                return;
            }

            newImages.push({
                id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                file,
                preview: URL.createObjectURL(file),
                isPrimary: images.length === 0 && newImages.length === 0
            });
        });

        if (errors.length) {
            toast.error(errors.join(', '));
        }

        if (newImages.length) {
            const updated = [...images, ...newImages];
            setImages(updated);
            notifyChange(updated);
        }
    }, [images, maxImages]);

    const notifyChange = useCallback((imgs: ImageFile[], deleted: string[] = deletedIds) => {
        const files = imgs.filter(img => img.file).map(img => img.file!);
        const primaryIndex = imgs.findIndex(img => img.isPrimary);
        const imageOrder = imgs.map(img => img.id);
        onImagesChange(files, primaryIndex >= 0 ? primaryIndex : 0, deleted, imageOrder);
    }, [onImagesChange, deletedIds]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFilesSelected(e.dataTransfer.files);
    }, [handleFilesSelected]);

    const removeImage = useCallback((id: string) => {
        setImages(prev => {
            const toRemove = prev.find(img => img.id === id);
            const updated = prev.filter(img => img.id !== id);

            // Track deleted existing images
            let newDeletedIds = deletedIds;
            if (toRemove?.isExisting) {
                newDeletedIds = [...deletedIds, id];
                setDeletedIds(newDeletedIds);
            }

            // If we removed the primary, make the first one primary
            if (updated.length > 0 && !updated.some(img => img.isPrimary)) {
                updated[0].isPrimary = true;
            }
            notifyChange(updated, newDeletedIds);
            return updated;
        });
    }, [notifyChange, deletedIds]);

    const setPrimary = useCallback((id: string) => {
        setImages(prev => {
            const updated = prev.map(img => ({
                ...img,
                isPrimary: img.id === id
            }));
            notifyChange(updated);
            return updated;
        });
    }, [notifyChange]);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Drop Zone */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    images.length >= maxImages && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium">Drop images here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                        JPEG, PNG, WebP • Max 10MB each • Up to {maxImages} images
                    </p>
                </div>
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className={cn(
                                "relative aspect-[4/3] rounded-lg overflow-hidden border-2 group",
                                img.isPrimary ? "border-primary" : "border-border"
                            )}
                        >
                            <img
                                src={img.preview}
                                alt="Vehicle"
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPrimary(img.id);
                                    }}
                                    title="Set as primary"
                                >
                                    <Star className={cn("w-4 h-4", img.isPrimary && "fill-yellow-500 text-yellow-500")} />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="destructive"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(img.id);
                                    }}
                                    title="Remove"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Primary Badge */}
                            {img.isPrimary && (
                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                    Primary
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Status */}
            <p className="text-sm text-muted-foreground">
                {images.length} of {maxImages} images
            </p>
        </div>
    );
}
