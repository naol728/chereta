/*eslint-disable*/
// @ts-nocheck
import { createItem } from "@/api/admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, X, Upload, Loader2, PackagePlus } from "lucide-react";

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

export default function CreateItem() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [condition, setCondition] = useState<ItemCondition>("new");
    const [status, setStatus] = useState<ItemStatus>("draft");
    const [images, setImages] = useState<File[]>([]);

    const [previews, setPreviews] = useState<string[]>([]);

    const MAX_IMAGES = 10;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    useEffect(() => {
        const urls = images.map((image) => URL.createObjectURL(image));
        setPreviews(urls);
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [images]);

    const { mutate, isPending } = useMutation({
        mutationFn: createItem,

        onError: (err) => {
            toast.error(err.message || "Failed to create item.");
        },

        onSuccess: () => {
            toast.success("Item created successfully!");

            queryClient.invalidateQueries({ queryKey: ["admin-items"] });

            setTitle("");
            setDescription("");
            setCategory("");
            setCondition("new");
            setStatus("draft");
            setImages([]);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        if (images.length + selectedFiles.length > MAX_IMAGES) {
            toast.error(`You can upload a maximum of ${MAX_IMAGES} images.`);
            e.target.value = "";
            return;
        }

        const validFiles: File[] = [];

        for (const file of selectedFiles) {
            if (
                !file.type.startsWith("image/") ||
                !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)
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

        setImages((prev) => [...prev, ...validFiles]);
        e.target.value = "";
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Please enter an item title.");
            return;
        }

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("category", category.trim());
        formData.append("condition", condition);
        formData.append("status", status);
        images.forEach((image) => formData.append("images", image));

        mutate(formData);
    };

    const handleReset = () => {
        setTitle("");
        setDescription("");
        setCategory("");
        setCondition("new");
        setStatus("draft");
        setImages([]);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className=" w-full space-y-5">
            {/* Compact header — dialog already has a title, this is a visual badge row */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PackagePlus className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold">New Item Details</p>
                    <p className="text-xs text-muted-foreground">
                        Fill in the form below to add a new auction item.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-5">
                {/* Basic Information */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg">
                            Basic Information
                        </CardTitle>
                        <CardDescription>
                            Provide the core details of the item.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 pt-0 sm:space-y-5 sm:p-6 sm:pt-0">
                        {/* Title */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="title">
                                    Item Title{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {title.length}/150
                                </span>
                            </div>

                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. iPhone 15 Pro Max"
                                maxLength={150}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the item, its features, and other details..."
                                rows={4}
                                className="resize-y"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g. Electronics, Fashion, Vehicles"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Item Images */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1.5">
                                <CardTitle className="text-base sm:text-lg">
                                    Item Images
                                </CardTitle>
                                <CardDescription>
                                    Upload up to {MAX_IMAGES} images. The first image
                                    will be the cover.
                                </CardDescription>
                            </div>

                            <Badge variant="secondary" className="shrink-0">
                                {images.length}/{MAX_IMAGES}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 p-4 pt-0 sm:space-y-5 sm:p-6 sm:pt-0">
                        {/* Upload Area */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={images.length >= MAX_IMAGES}
                            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 sm:py-10"
                        >
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-12 sm:w-12">
                                <ImagePlus className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>

                            <p className="text-sm font-medium">
                                Click to upload images
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
                                disabled={images.length >= MAX_IMAGES}
                                className="hidden"
                            />
                        </button>

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                                {previews.map((preview, index) => (
                                    <div
                                        key={`${images[index].name}-${index}`}
                                        className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                                    >
                                        <img
                                            src={preview}
                                            alt={`Item image ${index + 1}`}
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
                                            onClick={() => removeImage(index)}
                                            aria-label={`Remove image ${index + 1}`}
                                            className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full opacity-90 transition-opacity hover:opacity-100 sm:right-2 sm:top-2"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Item Settings */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg">
                            Item Settings
                        </CardTitle>
                        <CardDescription>
                            Set the condition and publishing status.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:gap-5 sm:p-6 sm:pt-0">
                        {/* Condition */}
                        <div className="space-y-2">
                            <Label htmlFor="condition">Condition</Label>
                            <Select
                                value={condition}
                                onValueChange={(v) => setCondition(v as ItemCondition)}
                            >
                                <SelectTrigger id="condition" className="w-full">
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="used">Used</SelectItem>
                                    <SelectItem value="refurbished">Refurbished</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={status}
                                onValueChange={(v) => setStatus(v as ItemStatus)}
                            >
                                <SelectTrigger id="status" className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
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
                                Creating...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                Create Item
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}