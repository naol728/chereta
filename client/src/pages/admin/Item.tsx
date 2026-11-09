/* eslint-disable  */
//@no-tscheck

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ArrowLeft,
    CalendarDays,
    Check,
    ChevronRight,
    FileText,
    Hash,
    ImagePlus,
    Layers3,
    Loader2,
    Package,
    Pencil,
    Plus,
    Tag,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";

import { getItem, updateItem, deleteItem } from "@/api/admin";
import type { ItemType } from "./Items";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface Item {
    id: string;
    title: string;
    slug: string;
    description: string;
    image_url: string;
    images: string[];
    category: string;
    condition: string;
    status: "draft" | "published" | "archived";
    created_at: string;
    updated_at: string;
}

export interface ItemResponse {
    success: boolean;
    message: string;
    data: { item: Item };
}

type ItemStatus = ItemType["status"];

type ItemForm = {
    title: string;
    slug: string;
    description: string;
    category: string;
    condition: string;
    status: ItemStatus;
};

const statusStyles: Record<ItemStatus, string> = {
    published:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    draft:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    archived: "border-border bg-muted text-muted-foreground",
};

const formatDate = (value?: string) => {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
};

const emptyForm: ItemForm = {
    title: "",
    slug: "",
    description: "",
    category: "",
    condition: "",
    status: "draft",
};

export default function ItemPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [form, setForm] = useState<ItemForm>(emptyForm);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<string[]>([]);
    const previewUrlsRef = useRef<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery<ItemResponse>({
        queryKey: ["getItem", id],
        queryFn: () => getItem(id as string),
        enabled: Boolean(id),
        staleTime: 30_000,
        retry: 2,
    });

    const item = data?.data?.item;

    const clearNewUploads = () => {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current = [];
        setNewFiles([]);
        setFilePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    useEffect(() => {
        return () => {
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    useEffect(() => {
        if (!item || !isEditOpen) return;

        setForm({
            title: item.title ?? "",
            slug: item.slug ?? "",
            description: item.description ?? "",
            category: item.category ?? "",
            condition: item.condition ?? "",
            status: item.status,
        });

        setExistingImages(
            item.images?.length ? item.images : item.image_url ? [item.image_url] : [],
        );
        clearNewUploads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item, isEditOpen]);

    const updateMutation = useMutation({
        mutationFn: () => {
            if (!item) throw new Error("Item not found.");

            const payload = new FormData();
            payload.append("title", form.title.trim());
            payload.append("slug", form.slug.trim());
            payload.append("description", form.description.trim());
            payload.append("category", form.category.trim());
            payload.append("condition", form.condition.trim());
            payload.append("status", form.status);

            existingImages.forEach((url) => payload.append("keep_images", url));
            newFiles.forEach((file) => payload.append("images", file));

            return updateItem({ id: item.id, payload });
        },
        onSuccess: () => {
            toast.success("Item updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["getItem", id] });
            queryClient.invalidateQueries({ queryKey: ["getItems"] });
            clearNewUploads();
            setIsEditOpen(false);
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || err?.message || "Unable to update item.",
            );
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => {
            if (!item) throw new Error("Item not found.");
            return deleteItem(item.id);
        },
        onSuccess: () => {
            toast.success("Item deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["getItems"] });
            navigate("/admin/items");
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message || err?.message || "Unable to delete item.",
            );
        },
    });

    const handleFilesPicked = (files: FileList | null) => {
        if (!files?.length) return;

        const selectedFiles = Array.from(files).filter((file) =>
            file.type.startsWith("image/"),
        );

        if (!selectedFiles.length) {
            toast.error("Please select valid image files.");
            return;
        }

        const urls = selectedFiles.map((file) => URL.createObjectURL(file));
        previewUrlsRef.current = [...previewUrlsRef.current, ...urls];
        setNewFiles((previous) => [...previous, ...selectedFiles]);
        setFilePreviews((previous) => [...previous, ...urls]);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeExistingImage = (index: number) => {
        setExistingImages((previous) => previous.filter((_, i) => i !== index));
    };

    const removeNewFile = (index: number) => {
        const previewUrl = filePreviews[index];
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrlsRef.current = previewUrlsRef.current.filter(
                (url) => url !== previewUrl,
            );
        }

        setNewFiles((previous) => previous.filter((_, i) => i !== index));
        setFilePreviews((previous) => previous.filter((_, i) => i !== index));
    };

    const updateForm = <K extends keyof ItemForm>(key: K, value: ItemForm[K]) => {
        setForm((previous) => ({ ...previous, [key]: value }));
    };

    if (isLoading) return <ItemSkeleton />;

    if (isError) {
        return (
            <PageShell>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="-ml-2 mb-6 gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to items
                </Button>

                <Card className="mx-auto max-w-xl border-destructive/20">
                    <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                            <Package className="h-7 w-7 text-destructive" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold">Unable to load item</h2>
                            <p className="text-sm text-muted-foreground">
                                {(error as any)?.message || "Something went wrong. Please try again."}
                            </p>
                        </div>
                        <Button onClick={() => refetch()}>Try again</Button>
                    </CardContent>
                </Card>
            </PageShell>
        );
    }

    if (!item) {
        return (
            <PageShell>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin/items")}
                    className="-ml-2 mb-6 gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to items
                </Button>

                <Card className="mx-auto max-w-xl">
                    <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                            <Package className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold">Item not found</h2>
                            <p className="text-sm text-muted-foreground">
                                This item may have been removed or is no longer available.
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => navigate("/admin/items")}>
                            Return to items
                        </Button>
                    </CardContent>
                </Card>
            </PageShell>
        );
    }

    const gallery = item.images?.length
        ? item.images
        : item.image_url
            ? [item.image_url]
            : [];

    return (
        <PageShell>
            <div className="space-y-7">
                {/* Breadcrumb and page actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin/items")}
                            className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            All items
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span className="text-foreground">Item details</span>
                        </Button>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="gap-1.5 font-medium">
                                <Tag className="h-3 w-3" />
                                {item.category || "Uncategorized"}
                            </Badge>
                            <Badge
                                variant="outline"
                                className={`capitalize ${statusStyles[item.status]}`}
                            >
                                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                                {item.status}
                            </Badge>
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                {item.title}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Review and manage the details of this item.
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(true)}
                            className="gap-2"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit item
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(true)}
                            className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Main content */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
                    {/* Image gallery */}
                    <section className="min-w-0 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold">Item images</h2>
                                <p className="text-xs text-muted-foreground">
                                    Product photography and gallery
                                </p>
                            </div>
                            <Badge variant="secondary">
                                {gallery.length} {gallery.length === 1 ? "image" : "images"}
                            </Badge>
                        </div>

                        <Card className="overflow-hidden">
                            {gallery.length > 0 ? (
                                <div className="aspect-[4/3] w-full bg-muted">
                                    <img
                                        src={gallery[0]}
                                        alt={item.title}
                                        className="h-full w-full object-cover"
                                        onError={(event) => {
                                            event.currentTarget.style.visibility = "hidden";
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-muted/50 text-muted-foreground">
                                    <ImagePlus className="h-10 w-10" />
                                    <p className="text-sm font-medium">No images available</p>
                                </div>
                            )}
                        </Card>

                        {gallery.length > 1 && (
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                                {gallery.slice(1, 6).map((src, index) => (
                                    <div
                                        key={`${src}-${index}`}
                                        className="aspect-square overflow-hidden rounded-xl border bg-muted"
                                    >
                                        <img
                                            src={src}
                                            alt={`${item.title} image ${index + 2}`}
                                            className="h-full w-full object-cover"
                                            onError={(event) => {
                                                event.currentTarget.style.visibility = "hidden";
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Item information */}
                    <section className="space-y-5">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base">Item information</CardTitle>
                                <CardDescription>
                                    Key attributes and publishing details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <InfoRow icon={<Layers3 />} label="Condition">
                                    <span className="capitalize">{item.condition || "—"}</span>
                                </InfoRow>
                                <Separator />
                                <InfoRow icon={<Tag />} label="Category">
                                    {item.category || "—"}
                                </InfoRow>
                                <Separator />
                                <InfoRow icon={<Hash />} label="URL slug">
                                    <span className="max-w-[170px] break-all font-mono text-xs">
                                        {item.slug || "—"}
                                    </span>
                                </InfoRow>
                                <Separator />
                                <InfoRow icon={<CalendarDays />} label="Created">
                                    {formatDate(item.created_at)}
                                </InfoRow>
                                <Separator />
                                <InfoRow icon={<CalendarDays />} label="Last updated">
                                    {formatDate(item.updated_at)}
                                </InfoRow>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Record information</CardTitle>
                                <CardDescription>
                                    Internal reference for this item.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                                    <Hash className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Item ID
                                        </p>
                                        <p className="break-all font-mono text-xs leading-relaxed">
                                            {item.id}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* Description */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-base">Description</CardTitle>
                        </div>
                        <CardDescription>
                            The item's full description and additional information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                            {item.description?.trim() ||
                                "No description has been added for this item."}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Edit item dialog */}
            <Dialog
                open={isEditOpen}
                onOpenChange={(open) => {
                    if (!open && !updateMutation.isPending) clearNewUploads();
                    setIsEditOpen(open);
                }}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Edit item</DialogTitle>
                        <DialogDescription>
                            Update the item information and manage its images.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        {/* Basic information */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold">Basic information</h3>
                                <p className="text-xs text-muted-foreground">
                                    Keep the item details accurate and easy to understand.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="item-title" className="text-sm font-medium">
                                    Item title <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    id="item-title"
                                    value={form.title}
                                    onChange={(event) => updateForm("title", event.target.value)}
                                    placeholder="Enter item title"
                                    maxLength={150}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="item-slug" className="text-sm font-medium">
                                    URL slug
                                </label>
                                <Input
                                    id="item-slug"
                                    value={form.slug}
                                    onChange={(event) => updateForm("slug", event.target.value)}
                                    placeholder="item-url-slug"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="item-description" className="text-sm font-medium">
                                    Description
                                </label>
                                <textarea
                                    id="item-description"
                                    rows={5}
                                    value={form.description}
                                    onChange={(event) =>
                                        updateForm("description", event.target.value)
                                    }
                                    placeholder="Describe this item..."
                                    className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Classification */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold">Classification</h3>
                                <p className="text-xs text-muted-foreground">
                                    Set the category, condition, and publication status.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <label htmlFor="item-category" className="text-sm font-medium">
                                        Category
                                    </label>
                                    <Input
                                        id="item-category"
                                        value={form.category}
                                        onChange={(event) =>
                                            updateForm("category", event.target.value)
                                        }
                                        placeholder="Category"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="item-condition" className="text-sm font-medium">
                                        Condition
                                    </label>
                                    <Input
                                        id="item-condition"
                                        value={form.condition}
                                        onChange={(event) =>
                                            updateForm("condition", event.target.value)
                                        }
                                        placeholder="Condition"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select
                                        value={form.status}
                                        onValueChange={(value) =>
                                            updateForm("status", value as ItemStatus)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Image management */}
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-semibold">Item images</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Add images or remove existing ones.
                                    </p>
                                </div>
                                <Badge variant="secondary">
                                    {existingImages.length + newFiles.length} total
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                {existingImages.map((src, index) => (
                                    <div
                                        key={`existing-${src}-${index}`}
                                        className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                                    >
                                        <img
                                            src={src}
                                            alt={`Existing item image ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(index)}
                                            aria-label="Remove existing image"
                                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-100 shadow-sm transition hover:bg-destructive sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}

                                {filePreviews.map((src, index) => (
                                    <div
                                        key={`new-${src}`}
                                        className="group relative aspect-square overflow-hidden rounded-xl border border-primary/30 bg-muted"
                                    >
                                        <img
                                            src={src}
                                            alt={`New item image ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeNewFile(index)}
                                            aria-label="Remove uploaded image"
                                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-100 shadow-sm transition hover:bg-destructive sm:opacity-0 sm:group-hover:opacity-100"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        <Badge className="absolute bottom-2 left-2 text-[10px]">
                                            New
                                        </Badge>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-medium">Add images</span>
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(event) => handleFilesPicked(event.target.files)}
                            />

                            <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                                <UploadCloud className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>
                                    Select one or more image files. Existing images are retained
                                    unless you remove them above.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 border-t pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                            disabled={updateMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending || !form.title.trim()}
                            className="min-w-32 gap-2"
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Save changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
                            <Trash2 className="h-5 w-5 text-destructive" />
                        </div>
                        <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to permanently delete{" "}
                            <span className="font-semibold text-foreground">{item.title}</span>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                            onClick={(event) => {
                                event.preventDefault();
                                deleteMutation.mutate();
                            }}
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete item"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageShell>
    );
}

function PageShell({ children }: { children: ReactNode }) {
    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
                {children}
            </div>
        </main>
    );
}

function InfoRow({
    icon,
    label,
    children,
}: {
    icon: ReactNode;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
                <span>{label}</span>
            </div>
            <div className="min-w-0 text-right font-medium text-foreground">
                {children}
            </div>
        </div>
    );
}

function ItemSkeleton() {
    return (
        <PageShell>
            <div className="space-y-7">
                <div className="space-y-3">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-9 w-2/3 max-w-md" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Separator />
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <div className="space-y-4">
                        <Skeleton className="h-72 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                </div>
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
        </PageShell>
    );
}
