/* eslint-disable */
// @ts-nocheck
import { updateItem } from "@/api/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ImagePlus, X, Save, Loader2, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type ItemCondition = "new" | "used" | "refurbished";
type ItemStatus = "draft" | "published" | "archived";

interface ItemFormValues {
    title: string;
    description: string;
    category: string;
    condition: ItemCondition;
    status: ItemStatus;
}

interface ExistingImage {
    id: string;
    url: string;
}

interface EditItemProps {
    item: {
        id: string;
        title: string;
        description: string;
        category: string;
        condition: string;
        status: ItemStatus;
        image_url: string;
        images: string[];
    };
    onSuccess?: () => void;
}

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function EditItem({ item, onSuccess }: EditItemProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Existing images already on the server (cover first, then gallery)
    const initialExisting: ExistingImage[] = (() => {
        const urls = [item.image_url, ...(item.images ?? [])].filter(
            Boolean
        ) as string[];

        const seen = new Set<string>();
        const unique: ExistingImage[] = [];
        urls.forEach((url) => {
            if (!seen.has(url)) {
                seen.add(url);
                unique.push({ id: url, url });
            }
        });
        return unique;
    })();

    const [existingImages, setExistingImages] =
        useState<ExistingImage[]>(initialExisting);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);

    const form = useForm<ItemFormValues>({
        defaultValues: {
            title: item.title ?? "",
            description: item.description ?? "",
            category: item.category ?? "",
            condition: (item.condition as ItemCondition) || "new",
            status: item.status || "draft",
        },
        mode: "onChange",
    });

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = form;

    const title = watch("title");
    const condition = watch("condition");
    const status = watch("status");

    // New file previews
    useEffect(() => {
        const urls = newImages.map((file) => URL.createObjectURL(file));
        setNewPreviews(urls);
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [newImages]);

    // Reset when the item prop changes
    useEffect(() => {
        reset({
            title: item.title ?? "",
            description: item.description ?? "",
            category: item.category ?? "",
            condition: (item.condition as ItemCondition) || "new",
            status: item.status || "draft",
        });
        setExistingImages(initialExisting);
        setNewImages([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.id]);

    const totalCount = existingImages.length + newImages.length;

    // ─── Mutation ─────────────────────────────────────────────────────────────
    const { mutate, isPending } = useMutation({
        mutationFn: updateItem,

        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to update item."
            );
        },

        onSuccess: () => {
            toast.success("Item updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["getItems"] });
            queryClient.invalidateQueries({ queryKey: ["admin-items"] });
            onSuccess?.();
        },
    });

    // ─── Image selection ──────────────────────────────────────────────────────
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        if (totalCount + selectedFiles.length > MAX_IMAGES) {
            toast.error(`You can upload a maximum of ${MAX_IMAGES} images.`);
            e.target.value = "";
            return;
        }

        const validFiles: File[] = [];
        for (const file of selectedFiles) {
            if (
                !file.type.startsWith("image/") ||
                !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
                    file.type
                )
            ) {
                toast.error(`${file.name} is not a supported image.`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`${file.name} exceeds the 5MB limit.`);
                continue;
            }
            validFiles.push(file);
        }

        setNewImages((prev) => [...prev, ...validFiles]);
        e.target.value = "";
    };

    const removeExistingImage = (id: string) => {
        setExistingImages((prev) => prev.filter((img) => img.id !== id));
    };

    const removeNewImage = (index: number) => {
        setNewImages((prev) => prev.filter((_, i) => i !== index));
    };

    // ─── Submit ───────────────────────────────────────────────────────────────
    const onSubmit = (values: ItemFormValues) => {
        if (!values.title.trim()) {
            toast.error("Please enter an item title.");
            return;
        }

        const formData = new FormData();
        formData.append("title", values.title.trim());
        formData.append("description", values.description.trim());
        formData.append("category", values.category.trim());
        formData.append("condition", values.condition);
        formData.append("status", values.status);

        // Existing images kept — send their URLs so the server knows what to retain
        const keptUrls = existingImages.map((img) => img.url);
        formData.append("existingImages", JSON.stringify(keptUrls));

        // Only append `images` if the user actually added new ones
        if (newImages.length > 0) {
            newImages.forEach((image) => formData.append("images", image));
        }

        mutate({ id: item.id, formData });
    };

    const handleReset = () => {
        reset({
            title: item.title ?? "",
            description: item.description ?? "",
            category: item.category ?? "",
            condition: (item.condition as ItemCondition) || "new",
            status: item.status || "draft",
        });
        setExistingImages(initialExisting);
        setNewImages([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="w-full space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PackagePlus className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold">Edit Item Details</p>
                    <p className="text-xs text-muted-foreground">
                        Update the details below to save your changes.
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full space-y-5"
            >
                {/* Basic Information */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg">
                            Basic Information
                        </CardTitle>
                        <CardDescription>
                            Update the core details of the item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 pt-0 sm:space-y-5 sm:p-6 sm:pt-0">
                        {/* Title */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="edit-title">
                                    Item Title{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {title.length}/150
                                </span>
                            </div>
                            <Input
                                id="edit-title"
                                placeholder="e.g. iPhone 15 Pro Max"
                                maxLength={150}
                                aria-invalid={!!errors.title}
                                {...register("title", {
                                    required: "Item title is required.",
                                    maxLength: {
                                        value: 150,
                                        message:
                                            "Title must be 150 characters or less.",
                                    },
                                })}
                            />
                            {errors.title && (
                                <p className="text-xs text-destructive">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                placeholder="Describe the item, its features, and other details..."
                                rows={4}
                                className="resize-y"
                                {...register("description")}
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-category">Category</Label>
                            <Input
                                id="edit-category"
                                placeholder="e.g. Electronics, Fashion, Vehicles"
                                {...register("category")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Images */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1.5">
                                <CardTitle className="text-base sm:text-lg">
                                    Item Images
                                </CardTitle>
                                <CardDescription>
                                    Keep existing images or add new ones. The
                                    first image is the cover.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                                {totalCount}/{MAX_IMAGES}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
                        {/* Existing images */}
                        {existingImages.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Current Images
                                </p>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                                    {existingImages.map((img, index) => (
                                        <div
                                            key={img.id}
                                            className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Existing image ${
                                                    index + 1
                                                }`}
                                                className="h-full w-full object-cover"
                                            />

                                            {index === 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="absolute bottom-1.5 left-1.5 bg-background/90 text-foreground backdrop-blur sm:bottom-2 sm:left-2"
                                                >
                                                    Cover
                                                </Badge>
                                            )}

                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() =>
                                                    removeExistingImage(img.id)
                                                }
                                                aria-label={`Remove existing image ${
                                                    index + 1
                                                }`}
                                                className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full opacity-90 transition-opacity hover:opacity-100 sm:right-2 sm:top-2"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New images */}
                        {newImages.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    New Images
                                </p>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                                    {newPreviews.map((preview, index) => (
                                        <div
                                            key={`${newImages[index].name}-${index}`}
                                            className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                                        >
                                            <img
                                                src={preview}
                                                alt={`New image ${index + 1}`}
                                                className="h-full w-full object-cover"
                                            />

                                            <Badge
                                                variant="default"
                                                className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2"
                                            >
                                                New
                                            </Badge>

                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() =>
                                                    removeNewImage(index)
                                                }
                                                aria-label={`Remove new image ${
                                                    index + 1
                                                }`}
                                                className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full opacity-90 transition-opacity hover:opacity-100 sm:right-2 sm:top-2"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload Area */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={totalCount >= MAX_IMAGES}
                            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 sm:py-10"
                        >
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-12 sm:w-12">
                                <ImagePlus className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <p className="text-sm font-medium">
                                Click to add images
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                JPEG, PNG, WEBP or AVIF · Maximum 5MB each
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                multiple
                                onChange={handleImageChange}
                                disabled={totalCount >= MAX_IMAGES}
                                className="hidden"
                            />
                        </button>
                    </CardContent>
                </Card>

                {/* Item Settings */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg">
                            Item Settings
                        </CardTitle>
                        <CardDescription>
                            Update the condition and publishing status.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:gap-5 sm:p-6 sm:pt-0">
                        {/* Condition */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-condition">Condition</Label>
                            <Select
                                value={condition}
                                onValueChange={(v) =>
                                    setValue(
                                        "condition",
                                        v as ItemCondition,
                                        { shouldValidate: true }
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="edit-condition"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="used">Used</SelectItem>
                                    <SelectItem value="refurbished">
                                        Refurbished
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(v) =>
                                    setValue("status", v as ItemStatus, {
                                        shouldValidate: true,
                                    })
                                }
                            >
                                <SelectTrigger
                                    id="edit-status"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">
                                        Published
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        Archived
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={handleReset}
                        className="w-full sm:w-auto"
                    >
                        Reset
                    </Button>

                    <Button
                        type="submit"
                        disabled={isPending || !title.trim()}
                        className="w-full sm:w-auto"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}