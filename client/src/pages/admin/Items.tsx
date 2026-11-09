/* eslint-disable */
//@ts-nocheck
import React, { useState, useMemo } from "react";
import EditItem from "./EditItem";
import CreateItem from "./CreateItem";
import { useNavigate } from "react-router-dom";
import { getItems, deleteItem, type GetItemsParams } from "@/api/admin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  AlertCircle,
  LayoutGrid,
  ListFilter,
  X,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

interface PaginationMeta {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ItemType {
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

interface ItemsResponse {
  success: boolean;
  message: string;
  data: {
    items: ItemType[];
    pagination: PaginationMeta;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (iso?: string) => {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
};

const statusVariant = (s: ItemType["status"]) => {
  switch (s) {
    case "published":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "archived":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Items() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ─── List filters / pagination ─────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<
    "all" | "draft" | "published" | "archived"
  >("all");

  // ─── Dialog state ──────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemType | null>(null);

  const [confirmItem, setConfirmItem] = useState<ItemType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Query ─────────────────────────────────────────────────────────────────
  const params: GetItemsParams = useMemo(() => {
    const p: GetItemsParams = { page, limit };
    if (search.trim()) p.search = search.trim();
    if (category !== "all") p.category = category;
    if (status !== "all") p.status = status;
    return p;
  }, [page, limit, search, category, status]);

  const { data, isLoading, error, refetch } = useQuery<ItemsResponse>({
    queryKey: ["getItems", params],
    queryFn: () => getItems(params),
    staleTime: 30_000,
    retry: 2,
  });

  const items = data?.data?.items ?? [];
  const pagination = data?.data?.pagination;

  // ─── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteItem(id),

    onSuccess: (_data, id) => {
      toast.success("Item deleted successfully");

      if (selectedItem?.id === id) {
        setDetailOpen(false);
        setSelectedItem(null);
      }
      if (editingItem?.id === id) {
        setEditOpen(false);
        setEditingItem(null);
      }

      queryClient.invalidateQueries({ queryKey: ["getItems"] });
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });

      if (items.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to delete item."
      );
    },

    onSettled: () => {
      setDeletingId(null);
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setCategory("all");
    setStatus("all");
    setPage(1);
  };

  const handleAddItem = () => setCreateOpen(true);

  const handleViewItem = (item: ItemType) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleEditItem = (item: ItemType) => {
    setEditingItem(item);
    setEditOpen(true);
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: ItemType) => {
    setConfirmItem(item);
  };

  const confirmDelete = () => {
    if (!confirmItem) return;
    setDeletingId(confirmItem.id);
    deleteMutation.mutate(confirmItem.id);
    setConfirmItem(null);
  };

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  const hasActiveFilters = search || category !== "all" || status !== "all";
  const skeletonCount = Math.min(limit, 12);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-10">
        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Items
              </h1>
              {pagination && (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                >
                  {pagination.totalItems} total
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Browse, edit, and manage every item in your catalog.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full items-center gap-2 sm:w-auto"
            >
              <div className="relative flex-1 sm:w-72 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search items by title..."
                  className="h-10 pl-9"
                />
              </div>
              <Button type="submit" className="h-10 shrink-0">
                Search
              </Button>
            </form>

            <Button
              onClick={handleAddItem}
              className="h-10 w-full gap-1.5 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <Separator />

        {/* FILTERS */}
        <div className="-mx-4 flex items-center gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-muted-foreground">
            <ListFilter className="h-4 w-4" />
            Filters
          </div>

          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[160px] shrink-0 sm:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as typeof status);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px] shrink-0 sm:w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleResetFilters}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* LOADING */}
        {isLoading && (
          <Card className="overflow-hidden border-border bg-card">
            <CardContent className="p-0">
              <div className="divide-y">
                {Array.from({ length: Math.min(skeletonCount, 6) }).map(
                  (_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4">
                      <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
                      <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ERROR */}
        {error && !isLoading && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  Failed to load items
                </p>
                <p className="text-sm text-muted-foreground">
                  {(error as any)?.message || "Something went wrong"}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* EMPTY */}
        {!isLoading && !error && items.length === 0 && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center gap-4 px-4 py-16 text-center sm:py-24">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <PackageOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  No items found
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Try adjusting your search or filters"
                    : "Create your first item to get started"}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4" />
                  Add your first item
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* LIST */}
        {!isLoading && !error && items.length > 0 && (
          <>
            <Card className="overflow-hidden border-border bg-card">
              <CardContent className="p-0">
                {/* Column header — desktop only */}
                <div className="hidden items-center gap-4 border-b px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:flex">
                  <div className="w-14 shrink-0" />
                  <div className="flex-1">Item</div>
                  <div className="w-32 shrink-0">Category</div>
                  <div className="w-28 shrink-0">Condition</div>
                  <div className="w-24 shrink-0">Status</div>
                  <div className="w-28 shrink-0">Created</div>
                  <div className="w-12 shrink-0 text-right">Actions</div>
                </div>

                {/* Rows */}
                <div className="divide-y">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      {/* Thumbnail */}
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <PackageOpen className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      {/* Title / slug */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.slug || item.id}
                        </p>

                        {/* Mobile meta line */}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 md:hidden">
                          <Badge
                            variant={statusVariant(item.status)}
                            className="capitalize"
                          >
                            {item.status}
                          </Badge>
                          {item.category && (
                            <Badge variant="secondary">
                              {item.category}
                            </Badge>
                          )}
                          <span className="text-xs capitalize text-muted-foreground">
                            {item.condition || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Category — md+ */}
                      <div className="hidden w-32 shrink-0 md:block">
                        <span className="text-sm text-muted-foreground">
                          {item.category || "—"}
                        </span>
                      </div>

                      {/* Condition — lg+ */}
                      <div className="hidden w-28 shrink-0 lg:block">
                        <span className="text-sm capitalize text-muted-foreground">
                          {item.condition || "—"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="hidden w-24 shrink-0 md:block">
                        <Badge
                          variant={statusVariant(item.status)}
                          className="capitalize"
                        >
                          {item.status}
                        </Badge>
                      </div>

                      {/* Created — xl+ */}
                      <div className="hidden w-28 shrink-0 xl:block">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {/* Actions — Base UI dropdown */}
                      <div className="flex w-12 shrink-0 items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Actions for ${item.title}`}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            }
                          />

                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                                {item.title}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleViewItem(item)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleEditItem(item)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDeleteItem(item)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PAGINATION */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-4 sm:px-5">
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <p className="text-center text-sm text-muted-foreground sm:text-left">
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {(pagination.currentPage - 1) * pagination.pageSize + 1}–
                      {Math.min(
                        pagination.currentPage * pagination.pageSize,
                        pagination.totalItems
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-foreground">
                      {pagination.totalItems}
                    </span>
                  </p>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="px-2 text-sm font-medium text-foreground sm:hidden">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>

                    <div className="hidden items-center gap-1 sm:flex">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      ).map((pg) => (
                        <Button
                          key={pg}
                          variant={
                            pg === pagination.currentPage ? "default" : "ghost"
                          }
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPage(pg)}
                        >
                          {pg}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 sm:justify-end">
                  <span className="text-xs text-muted-foreground">
                    Items per page
                  </span>
                  <Select
                    value={String(limit)}
                    onValueChange={(v) => {
                      setLimit(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 / page</SelectItem>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── CREATE ITEM DIALOG ────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl gap-0 p-0 sm:w-full lg:max-w-5xl xl:max-w-6xl">
          <DialogHeader className="border-b px-4 py-4 sm:px-6">
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new auction item.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-7rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <CreateItem />
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT ITEM DIALOG ──────────────────────────────────────────────── */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl gap-0 p-0 sm:w-full lg:max-w-5xl xl:max-w-6xl">
          <DialogHeader className="border-b px-4 py-4 sm:px-6">
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the item details and save your changes.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(90vh-7rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {editingItem && (
              <EditItem item={editingItem} onSuccess={handleEditSuccess} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── DETAIL POPUP (WIDE, TWO-COLUMN) ───────────────────────────────── */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-4xl gap-0 p-0 sm:w-full xl:max-w-5xl">
          <DialogHeader className="border-b px-4 py-4 sm:px-6">
            <DialogTitle className="pr-8">
              {selectedItem?.title ?? "Item Details"}
            </DialogTitle>
            <DialogDescription>
              Full information about this item.
            </DialogDescription>
          </DialogHeader>

          {selectedItem ? (
            <div className="max-h-[calc(90vh-7rem)] overflow-y-auto">
              <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-2">
                {/* LEFT: images */}
                <div className="space-y-3">
                  {selectedItem.image_url ? (
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-muted p-2">
                      <img
                        src={selectedItem.image_url}
                        alt={selectedItem.title}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-xl border bg-muted text-muted-foreground">
                      <PackageOpen className="h-12 w-12" />
                    </div>
                  )}

                  {selectedItem.images && selectedItem.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedItem.images.map((src, idx) => (
                        <div
                          key={`${src}-${idx}`}
                          className="aspect-square overflow-hidden rounded-lg border bg-muted"
                        >
                          <img
                            src={src}
                            alt={`${selectedItem.title} ${idx + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT: details */}
                <div className="space-y-5">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={statusVariant(selectedItem.status)}
                      className="capitalize"
                    >
                      {selectedItem.status}
                    </Badge>
                    {selectedItem.condition && (
                      <Badge variant="outline" className="capitalize">
                        {selectedItem.condition}
                      </Badge>
                    )}
                    {selectedItem.category && (
                      <Badge variant="secondary">
                        {selectedItem.category}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Description
                    </p>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {selectedItem.description || "No description provided."}
                    </p>
                  </div>

                  <Separator />

                  {/* Metadata */}
                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Slug
                      </p>
                      <p className="break-all font-medium text-foreground">
                        {selectedItem.slug || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Item ID
                      </p>
                      <p className="break-all font-medium text-foreground">
                        {selectedItem.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Created
                      </p>
                      <p className="font-medium text-foreground">
                        {formatDate(selectedItem.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Updated
                      </p>
                      <p className="font-medium text-foreground">
                        {formatDate(selectedItem.updated_at)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setDetailOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        const item = selectedItem;
                        setDetailOpen(false);
                        if (item) handleEditItem(item);
                      }}
                      className="w-full gap-1.5 sm:w-auto"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Item
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ─── CONFIRM DELETE DIALOG ─────────────────────────────────────────── */}
      <AlertDialog
        open={!!confirmItem}
        onOpenChange={(open) => !open && setConfirmItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to permanently delete{" "}
              <span className="font-medium text-foreground">
                "{confirmItem?.title}"
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}