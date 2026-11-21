/* eslint-disable */
//@ts-nocheck
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuctions } from "@/api/admin";
import { format } from "date-fns";
import { toast } from "sonner";
import CreateAuction from "./CreateAuction";
import EditAuction from "./EditAuction";
import {
  CalendarDays,
  Clock,
  Gavel,
  Wallet,
  Package,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Trophy,
  CalendarClock,
  Radio,
  Search,
  X,
  SlidersHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ──────────────────────────────────────────────

type AuctionStatus = "scheduled" | "live" | "ended" | "cancelled";

interface AuctionItem {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  images: string[];
  category: string | null;
  condition: "new" | "used" | "refurbished";
  status: "draft" | "published" | "archived";
}

interface Auction {
  id: string;
  item_id: string;
  starting_bid: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  status: AuctionStatus;
  total_bids: number;
  total_revenue: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participation_fee: number;
  item: AuctionItem;
}

interface AuctionPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AuctionsResponse {
  status: "success";
  results: number;
  pagination: AuctionPagination;
  data: {
    auctions: Auction[];
  };
}

// ─── Helpers ────────────────────────────────────────────

const formatDate = (date?: string) => {
  if (!date) return "—";
  try {
    return format(new Date(date), "MMM d, yyyy · h:mm a");
  } catch {
    return date;
  }
};

const formatShortDate = (date?: string) => {
  if (!date) return "—";
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch {
    return date;
  }
};

const formatMoney = (amount: number, currency = "ETB") => {
  return `${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
};

const statusConfig: Record<
  AuctionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ElementType;
  }
> = {
  live: { label: "Live", variant: "default", icon: Radio },
  scheduled: { label: "Scheduled", variant: "secondary", icon: CalendarClock },
  ended: { label: "Ended", variant: "outline", icon: Trophy },
  cancelled: { label: "Cancelled", variant: "destructive", icon: AlertCircle },
};

// ─── Component ─────────────────────────────────────────

export default function Auctions() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const limit = 10;

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AuctionStatus>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);

  const [confirmAuction, setConfirmAuction] = useState<Auction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Query ───────────────────────────────────────────

  const { data, isLoading, isFetching, error, refetch } =
    useQuery<AuctionsResponse>({
      queryKey: ["getAuctions", page, limit],
      queryFn: () => getAuctions({ page, limit }),
      staleTime: 30_000,
      retry: 2,
    });

  const auctions = data?.data?.auctions ?? [];
  const pagination = data?.pagination;

  // ─── Delete mutation ─────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAuction(id),

    onSuccess: (_data, id) => {
      toast.success("Auction deleted successfully");

      if (selectedAuction?.id === id) {
        setDetailOpen(false);
        setSelectedAuction(null);
      }
      if (editingAuction?.id === id) {
        setEditOpen(false);
        setEditingAuction(null);
      }

      queryClient.invalidateQueries({ queryKey: ["getAuctions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });

      if (auctions.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    },

    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete auction."
      );
    },

    onSettled: () => {
      setDeletingId(null);
    },
  });

  // ─── Client-side filtering ───────────────────────────

  const filteredAuctions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auctions.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.item?.title?.toLowerCase().includes(q) ||
        a.item?.category?.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    });
  }, [auctions, search, statusFilter]);

  const hasActiveFilters = search || statusFilter !== "all";
  const activeFilterCount =
    (search ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  // ─── Handlers ────────────────────────────────────────

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter("all");
  };

  const handleAddAuction = () => setCreateOpen(true);

  const handleViewAuction = (auction: Auction) => {
    setSelectedAuction(auction);
    setDetailOpen(true);
  };

  const handleEditAuction = (auction: Auction) => {
    setEditingAuction(auction);
    setEditOpen(true);
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
    setEditingAuction(null);
  };

  const handleCreateSuccess = () => {
    setCreateOpen(false);
  };



  const confirmDelete = () => {
    if (!confirmAuction) return;
    setDeletingId(confirmAuction.id);
    deleteMutation.mutate(confirmAuction.id);
    setConfirmAuction(null);
  };

  // ─── Loading ─────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-full space-y-3 px-3 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
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
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-screen bg-background px-3 py-8">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Failed to load auctions</p>
              <p className="text-xs text-muted-foreground">
                {(error as Error)?.message || "Something went wrong"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2 rounded-full"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-full space-y-3 px-3 py-4">
        {/* ═══ HEADER ═══ */}
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Gavel className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                  Auctions
                </h1>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {pagination
                    ? `${pagination.total} auctions total`
                    : "Manage your auctions"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-9 w-9 rounded-full"
                aria-label="Refresh"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                onClick={handleAddAuction}
                size="sm"
                className="h-9 gap-1.5 rounded-full px-3.5 text-xs font-semibold shadow-sm"
              >
                <Gavel className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>

          {/* Search + filter toggle */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search auctions..."
                className="h-10 rounded-full border-border/60 bg-muted/40 pl-9 pr-9 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
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

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger className="h-9 w-full text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </header>

        {/* ═══ EMPTY ═══ */}
        {auctions.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Gavel className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No auctions found
                </p>
                <p className="max-w-[240px] text-xs text-muted-foreground">
                  Create your first auction to get started.
                </p>
              </div>
              <Button
                size="sm"
                className="gap-1.5 rounded-full"
                onClick={handleAddAuction}
              >
                <Gavel className="h-3.5 w-3.5" />
                Add your first auction
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ FILTERED EMPTY ═══ */}
        {auctions.length > 0 && filteredAuctions.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No matching auctions
                </p>
                <p className="max-w-[240px] text-xs text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ LIST ═══ */}
        {filteredAuctions.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-sm font-semibold">All Auctions</h2>
              <span className="text-[10px] text-muted-foreground">
                {filteredAuctions.length} shown · newest first
              </span>
            </div>

            <div className="space-y-2">
              {filteredAuctions.map((auction) => {
                const item = auction.item;
                const config = statusConfig[auction.status];
                const StatusIcon = config.icon;

                return (
                  <Card
                    key={auction.id}
                    className="overflow-hidden border-border/60 transition-colors active:bg-muted/40"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 p-3">
                        {/* Thumbnail — tappable to view */}
                        <button
                          onClick={() => handleViewAuction(auction)}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted"
                          aria-label={`View ${item?.title || "auction"}`}
                        >
                          {item?.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </button>

                        {/* Info — tappable to view */}
                        <button
                          onClick={() => handleViewAuction(auction)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold leading-tight text-foreground">
                              {item?.title || "Unknown Item"}
                            </p>
                            <Badge
                              variant={config.variant}
                              className="shrink-0 gap-1 px-2 py-0.5 text-[10px] font-medium capitalize"
                            >
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </div>

                          <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                            {item?.category || "Uncategorized"}
                            {item?.condition && ` · ${item.condition}`}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {formatMoney(
                                auction.starting_bid,
                                auction.currency
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ·
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {auction.total_bids} bids
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ·
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatShortDate(auction.created_at)}
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
                                aria-label={`Actions for ${item?.title || "auction"
                                  }`}
                                disabled={deletingId === auction.id}
                              >
                                {deletingId === auction.id ? (
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
                                {item?.title || "Auction"}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => handleViewAuction(auction)}
                                className="text-sm"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleEditAuction(auction)}
                                className="text-sm"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />


                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* ═══ PAGINATION — sticky bottom bar ═══ */}
            {pagination && pagination.totalPages > 1 && (
              <div className="sticky bottom-0 z-10 -mx-3 mt-2 border-t bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 rounded-full px-3 text-xs"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage || isFetching}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>

                  <div className="text-center">
                    <p className="text-[11px] font-semibold text-foreground">
                      {pagination.page} / {pagination.totalPages}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {(pagination.page - 1) * pagination.limit + 1}–
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{" "}
                      of {pagination.total}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 rounded-full px-3 text-xs"
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage || isFetching}
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

      {/* ═══ CREATE AUCTION DIALOG ═══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-base">Add New Auction</DialogTitle>
            <DialogDescription className="text-xs">
              Set up a new auction for one of your items.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 py-3">
            <CreateAuction onSuccess={() => setCreateOpen(false)} onCancel={() => setCreateOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT AUCTION DIALOG ═══ */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingAuction(null);
        }}
      >
        <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-base">Edit Auction</DialogTitle>
            <DialogDescription className="text-xs">
              Update the auction details and save your changes.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 py-3">
            {editingAuction && (
              <EditAuction
                auction={editingAuction}
                onSuccess={handleEditSuccess}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ AUCTION DETAIL SHEET ═══ */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedAuction(null);
        }}
      >
        <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="pr-8 text-base">
              {selectedAuction?.item?.title ?? "Auction Details"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Full information about this auction.
            </DialogDescription>
          </DialogHeader>

          {selectedAuction ? (
            <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto">
              <div className="space-y-4 p-4">
                {/* Image */}
                {selectedAuction.item?.image_url ? (
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                    <img
                      src={selectedAuction.item.image_url}
                      alt={selectedAuction.item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
                    <Package className="h-12 w-12" />
                  </div>
                )}

                {/* Gallery */}
                {selectedAuction.item?.images &&
                  selectedAuction.item.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {selectedAuction.item.images.map((src, idx) => (
                        <div
                          key={`${src}-${idx}`}
                          className="aspect-square overflow-hidden rounded-lg border bg-muted"
                        >
                          <img
                            src={src}
                            alt={`${selectedAuction.item.title} ${idx + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                {/* Status badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant={statusConfig[selectedAuction.status].variant}
                    className="gap-1 px-2 py-0.5 text-[10px] capitalize"
                  >
                    {React.createElement(
                      statusConfig[selectedAuction.status].icon,
                      { className: "h-3 w-3" }
                    )}
                    {statusConfig[selectedAuction.status].label}
                  </Badge>
                  {selectedAuction.item?.condition && (
                    <Badge
                      variant="outline"
                      className="px-2 py-0.5 text-[10px] capitalize"
                    >
                      {selectedAuction.item.condition}
                    </Badge>
                  )}
                  {selectedAuction.item?.category && (
                    <Badge
                      variant="secondary"
                      className="px-2 py-0.5 text-[10px]"
                    >
                      {selectedAuction.item.category}
                    </Badge>
                  )}
                </div>

                {/* Financials grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                      <Wallet className="h-3 w-3" />
                      <span className="text-[10px]">Starting Bid</span>
                    </div>
                    <p className="text-xs font-bold tabular-nums text-foreground">
                      {formatMoney(
                        selectedAuction.starting_bid,
                        selectedAuction.currency
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                      <Wallet className="h-3 w-3" />
                      <span className="text-[10px]">Participation Fee</span>
                    </div>
                    <p className="text-xs font-bold tabular-nums text-foreground">
                      {formatMoney(
                        selectedAuction.participation_fee,
                        selectedAuction.currency
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                      <Gavel className="h-3 w-3" />
                      <span className="text-[10px]">Total Bids</span>
                    </div>
                    <p className="text-xs font-bold tabular-nums text-foreground">
                      {Number(selectedAuction.total_bids).toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                      <Wallet className="h-3 w-3" />
                      <span className="text-[10px]">Total Revenue</span>
                    </div>
                    <p className="text-xs font-bold tabular-nums text-green-600">
                      {formatMoney(
                        selectedAuction.total_revenue,
                        selectedAuction.currency
                      )}
                    </p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground">
                        Starts At
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {formatDate(selectedAuction.starts_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground">
                        Ends At
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {formatDate(selectedAuction.ends_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {selectedAuction.item?.description ||
                      "No description provided."}
                  </p>
                </div>

                {/* Record info */}
                <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Auction ID</span>
                    <span className="break-all text-right font-mono text-[10px] text-foreground">
                      {selectedAuction.id}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Item ID</span>
                    <span className="break-all text-right font-mono text-[10px] text-foreground">
                      {selectedAuction.item_id}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium text-foreground">
                      {formatDate(selectedAuction.created_at)}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium text-foreground">
                      {formatDate(selectedAuction.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Actions — Edit + Close */}
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
                      const a = selectedAuction;
                      setDetailOpen(false);
                      if (a) handleEditAuction(a);
                    }}
                    className="h-10 w-full gap-1.5 text-sm"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Auction
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>


    </div>
  );
}