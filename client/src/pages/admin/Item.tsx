/* eslint-disable */
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

  const { data, isLoading, isError, error, refetch } = useQuery<ItemResponse>({
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
      item.images?.length ? item.images : item.image_url ? [item.image_url] : []
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
        err?.response?.data?.message || err?.message || "Unable to update item."
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
        err?.response?.data?.message || err?.message || "Unable to delete item."
      );
    },
  });

  const handleFilesPicked = (files: FileList | null) => {
    if (!files?.length) return;

    const selectedFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
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
        (url) => url !== previewUrl
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
          className="-ml-2 mb-3 h-9 gap-1.5 rounded-full px-3 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="mx-auto max-w-xl border-destructive/20">
          <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <Package className="h-7 w-7 text-destructive" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Unable to load item</h2>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message ||
                  "Something went wrong. Please try again."}
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
          className="-ml-2 mb-3 h-9 gap-1.5 rounded-full px-3 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="mx-auto max-w-xl">
          <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Package className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Item not found</h2>
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
      <div className="space-y-4">
        {/* ═══ BREADCRUMB ═══ */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/items")}
          className="-ml-2 h-8 gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All items
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">Item details</span>
        </Button>

        {/* ═══ HERO IMAGE ═══ */}
        <Card className="overflow-hidden border-border/60">
          {gallery.length > 0 ? (
            <div className="aspect-square w-full bg-muted">
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
            <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-muted/50 text-muted-foreground">
              <ImagePlus className="h-10 w-10" />
              <p className="text-xs font-medium">No images available</p>
            </div>
          )}
        </Card>

        {/* Thumbnail strip */}
        {gallery.length > 1 && (
          <div className="grid grid-cols-4 gap-1.5">
            {gallery.slice(1, 6).map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="aspect-square overflow-hidden rounded-lg border bg-muted"
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

        {/* ═══ TITLE + STATUS ═══ */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={`px-2 py-0.5 text-[10px] capitalize ${statusStyles[item.status]}`}
            >
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
              {item.status}
            </Badge>
            {item.category && (
              <Badge
                variant="outline"
                className="gap-1 px-2 py-0.5 text-[10px]"
              >
                <Tag className="h-2.5 w-2.5" />
                {item.category}
              </Badge>
            )}
          </div>

          <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
            {item.title}
          </h1>
        </div>

        {/* ═══ ACTION BUTTONS — prominent ═══ */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="h-10 gap-1.5 rounded-full text-sm font-medium"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeleteOpen(true)}
            className="h-10 gap-1.5 rounded-full border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <Separator />

        {/* ═══ INFO CARD ═══ */}
        <Card className="border-border/60">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Item information</CardTitle>
            <CardDescription className="text-xs">
              Key attributes and publishing details.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-3 pt-0">
            <InfoRow icon={<Layers3 />} label="Condition">
              <span className="capitalize">{item.condition || "—"}</span>
            </InfoRow>
            <InfoRow icon={<Tag />} label="Category">
              {item.category || "—"}
            </InfoRow>
            <InfoRow icon={<Hash />} label="Slug">
              <span className="max-w-[160px] break-all font-mono text-[10px]">
                {item.slug || "—"}
              </span>
            </InfoRow>
            <InfoRow icon={<CalendarDays />} label="Created">
              {formatDate(item.created_at)}
            </InfoRow>
            <InfoRow icon={<CalendarDays />} label="Updated">
              {formatDate(item.updated_at)}
            </InfoRow>
          </CardContent>
        </Card>

        {/* ═══ DESCRIPTION ═══ */}
        <Card className="border-border/60">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-sm">Description</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {item.description?.trim() ||
                "No description has been added for this item."}
            </p>
          </CardContent>
        </Card>

        {/* ═══ RECORD ID ═══ */}
        <Card className="border-border/60">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Record information</CardTitle>
            <CardDescription className="text-xs">
              Internal reference for this item.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
              <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Item ID
                </p>
                <p className="break-all font-mono text-[10px] leading-relaxed">
                  {item.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ EDIT DIALOG — bottom sheet ═══ */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open && !updateMutation.isPending) clearNewUploads();
          setIsEditOpen(open);
        }}
      >
        <DialogContent className="bottom-0 top-auto max-h-[92dvh] w-full max-w-full translate-y-0 gap-0 overflow-y-auto rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-2xl sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="px-4 py-3">
            <DialogTitle className="text-base">Edit item</DialogTitle>
            <DialogDescription className="text-xs">
              Update the item information and manage its images.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-4 pb-2">
            {/* Basic info */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Basic information
              </h3>

              <div className="space-y-1.5">
                <label htmlFor="item-title" className="text-xs font-medium">
                  Item title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="item-title"
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Enter item title"
                  maxLength={150}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="item-slug" className="text-xs font-medium">
                  URL slug
                </label>
                <Input
                  id="item-slug"
                  value={form.slug}
                  onChange={(event) => updateForm("slug", event.target.value)}
                  placeholder="item-url-slug"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="item-description"
                  className="text-xs font-medium"
                >
                  Description
                </label>
                <textarea
                  id="item-description"
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Describe this item..."
                  className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <Separator />

            {/* Classification */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Classification
              </h3>

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="item-category"
                    className="text-xs font-medium"
                  >
                    Category
                  </label>
                  <Input
                    id="item-category"
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    placeholder="Category"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="item-condition"
                    className="text-xs font-medium"
                  >
                    Condition
                  </label>
                  <Input
                    id="item-condition"
                    value={form.condition}
                    onChange={(event) =>
                      updateForm("condition", event.target.value)
                    }
                    placeholder="Condition"
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Status</label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      updateForm("status", value as ItemStatus)
                    }
                  >
                    <SelectTrigger className="h-10 w-full text-sm">
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
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Images
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  {existingImages.length + newFiles.length} total
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((src, index) => (
                  <div
                    key={`existing-${src}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
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
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-sm transition hover:bg-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {filePreviews.map((src, index) => (
                  <div
                    key={`new-${src}`}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-primary/30 bg-muted"
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
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white shadow-sm transition hover:bg-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <Badge className="absolute bottom-1 left-1 px-1.5 py-0 text-[9px]">
                      New
                    </Badge>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium">Add</span>
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

              <div className="flex items-start gap-1.5 rounded-lg border border-dashed p-2.5 text-[10px] text-muted-foreground">
                <UploadCloud className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  Select one or more image files. Existing images are retained
                  unless you remove them above.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 flex-row gap-2 border-t bg-background px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={updateMutation.isPending}
              className="mt-0 h-10 flex-1 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending || !form.title.trim()}
              className="h-10 flex-1 gap-1.5 text-sm"
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

      {/* ═══ DELETE CONFIRM ═══ */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-md">
          <AlertDialogHeader>
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-base">
              Delete this item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              You are about to permanently delete{" "}
              <span className="font-semibold text-foreground">
                {item.title}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="mt-0 h-10 flex-1 text-sm"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-10 flex-1 bg-destructive text-sm text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
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
    <main className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-full px-3 py-4">{children}</div>
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
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        <span className="text-xs">{label}</span>
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-full" />
          <Skeleton className="h-10 rounded-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </PageShell>
  );
}