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
    SlidersHorizontal,
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
    const [filtersOpen, setFiltersOpen] = useState(false);

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
    const activeFilterCount =
      (search ? 1 : 0) +
      (category !== "all" ? 1 : 0) +
      (status !== "all" ? 1 : 0);

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
      <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-full space-y-3 px-3 py-4">
          {/* ═══ HEADER ═══ */}
          <header className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LayoutGrid className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                    Items
                  </h1>
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    {pagination
                      ? `${pagination.totalItems} items in catalog`
                      : "Manage your catalog"}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleAddItem}
                size="sm"
                className="h-9 gap-1.5 rounded-full px-3.5 text-xs font-semibold shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {/* Search bar — large tap target, rounded */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search items..."
                  className="h-10 rounded-full border-border/60 bg-muted/40 pl-9 pr-9 text-sm"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFiltersOpen((v) => !v)}
                className={`relative h-10 w-10 shrink-0 rounded-full ${filtersOpen ? "border-primary bg-primary/5 text-primary" : ""
                  }`}
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </form>

            {/* Collapsible filters */}
            {filtersOpen && (
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Filters
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setCategory(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="Category" />
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
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </header>

          {/* ═══ LOADING ═══ */}
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-border/60">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-2.5 w-1/3" />
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ═══ ERROR ═══ */}
          {error && !isLoading && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    Failed to load items
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(error as any)?.message || "Something went wrong"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ═══ EMPTY ═══ */}
          {!isLoading && !error && items.length === 0 && (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <PackageOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    No items found
                  </p>
                  <p className="max-w-[240px] text-xs text-muted-foreground">
                    {hasActiveFilters
                      ? "Try adjusting your search or filters"
                      : "Create your first item to get started"}
                  </p>
                </div>
                {hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-full"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add your first item
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ═══ LIST ═══ */}
          {!isLoading && !error && items.length > 0 && (
            <>
              <div className="space-y-2">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className="overflow-hidden border-border/60 transition-colors active:bg-muted/40"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 p-3">
                        {/* Thumbnail — tappable to view */}
                        <button
                          onClick={() => handleViewItem(item)}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted"
                          aria-label={`View ${item.title}`}
                        >
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
                        </button>

                        {/* Info — tappable to view */}
                        <button
                          onClick={() => handleViewItem(item)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-semibold leading-tight text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                            {item.category || "Uncategorized"}
                            {item.condition && ` · ${item.condition}`}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant={statusVariant(item.status)}
                              className="px-2 py-0.5 text-[10px] font-medium capitalize"
                            >
                              {item.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </button>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0 rounded-full"
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
                              <DropdownMenuLabel className="truncate text-[10px] font-normal text-muted-foreground">
                                {item.title}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleViewItem(item)}
                                className="text-sm"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleEditItem(item)}
                                className="text-sm"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleDeleteItem(item)}
                                className="text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* ═══ PAGINATION — sticky bottom bar ═══ */}
              {pagination && pagination.totalPages > 1 && (
                <div className="sticky bottom-0 z-10 -mx-3 mt-2 border-t bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1 rounded-full px-3 text-xs"
                      onClick={() => setPage(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </Button>

                    <div className="text-center">
                      <p className="text-[11px] font-semibold text-foreground">
                        {pagination.currentPage} / {pagination.totalPages}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {(pagination.currentPage - 1) * pagination.pageSize + 1}–
                        {Math.min(
                          pagination.currentPage * pagination.pageSize,
                          pagination.totalItems
                        )}{" "}
                        of {pagination.totalItems}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1 rounded-full px-3 text-xs"
                      onClick={() => setPage(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ CREATE ITEM DIALOG ═══ */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <DialogHeader className="border-b px-4 py-3">
              <DialogTitle className="text-base">Add New Item</DialogTitle>
              <DialogDescription className="text-xs">
                Fill in the details below to create a new auction item.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 py-3">
              <CreateItem />
            </div>
          </DialogContent>
        </Dialog>

        {/* ═══ EDIT ITEM DIALOG ═══ */}
        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <DialogHeader className="border-b px-4 py-3">
              <DialogTitle className="text-base">Edit Item</DialogTitle>
              <DialogDescription className="text-xs">
                Update the item details and save your changes.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 py-3">
              {editingItem && (
                <EditItem item={editingItem} onSuccess={handleEditSuccess} />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ═══ DETAIL SHEET ═══ */}
        <Dialog
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setSelectedItem(null);
          }}
        >
          <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <DialogHeader className="border-b px-4 py-3">
              <DialogTitle className="pr-8 text-base">
                {selectedItem?.title ?? "Item Details"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Full information about this item.
              </DialogDescription>
            </DialogHeader>

            {selectedItem ? (
              <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto">
                <div className="space-y-4 p-4">
                  {/* Image */}
                  {selectedItem.image_url ? (
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                      <img
                        src={selectedItem.image_url}
                        alt={selectedItem.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
                      <PackageOpen className="h-12 w-12" />
                    </div>
                  )}

                  {/* Gallery thumbnails */}
                  {selectedItem.images && selectedItem.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-1.5">
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

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={statusVariant(selectedItem.status)}
                      className="px-2 py-0.5 text-[10px] capitalize"
                    >
                      {selectedItem.status}
                    </Badge>
                    {selectedItem.condition && (
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 text-[10px] capitalize"
                      >
                        {selectedItem.condition}
                      </Badge>
                    )}
                    {selectedItem.category && (
                      <Badge
                        variant="secondary"
                        className="px-2 py-0.5 text-[10px]"
                      >
                        {selectedItem.category}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description
                    </p>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                      {selectedItem.description || "No description provided."}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Slug</span>
                      <span className="break-all text-right font-medium text-foreground">
                        {selectedItem.slug || "—"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Item ID</span>
                      <span className="break-all text-right font-mono text-[10px] text-foreground">
                        {selectedItem.id}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium text-foreground">
                        {formatDate(selectedItem.created_at)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Updated</span>
                      <span className="font-medium text-foreground">
                        {formatDate(selectedItem.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions — full-width stacked on mobile */}
                  <div className="flex flex-col-reverse gap-2 pt-1">
                    <Button
                      variant="outline"
                      onClick={() => setDetailOpen(false)}
                      className="h-10 w-full text-sm"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        const item = selectedItem;
                        setDetailOpen(false);
                        if (item) handleEditItem(item);
                      }}
                      className="h-10 w-full gap-1.5 text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Item
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* ═══ DELETE CONFIRM ═══ */}
        <AlertDialog
          open={!!confirmItem}
          onOpenChange={(open) => !open && setConfirmItem(null)}
        >
          <AlertDialogContent className="w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">
                Delete this item?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                You're about to permanently delete{" "}
                <span className="font-semibold text-foreground">
                  "{confirmItem?.title}"
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
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                disabled={deleteMutation.isPending}
                className="h-10 flex-1 bg-destructive text-sm text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-1.5 h-4 w-4" />
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