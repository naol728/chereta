/* eslint-disable */
//@ts-nocheck
import React, { useState } from "react";
import { getAuctionBids } from "@/api/admin";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Gavel,
  CreditCard,
  Receipt,
  Smartphone,
  Calendar,
  Clock,
  Hash,
  CheckCircle2,
  XCircle,
  Ticket,
  Package,
  Wallet,
  Copy,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  MoreHorizontal,
  Eye,
  FileText,
  Layers3,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ──────────────────────────────────────────────

interface AuctionBid {
  id: string;
  auction_id: string;
  user_id: string;
  bid_amount: number;
  idempotency_key: string;
  paid_at: string | null;
  created_at: string;
  payment_order_id: string | null;
  ticket_id: string | null;

  user: {
    id: string;
    Fname: string | null;
    Lname: string | null;
    phone: string | null;
    username: string | null;
    telegram_id: number;
    referral_id: string | null;
    invited_by: string | null;
    privacy_terms_accepted: boolean;
    created_at: string;
    updated_at: string;
  };

  auction: {
    id: string;
    item_id: string;
    starting_bid: number;
    currency: string;
    status: string;
    starts_at: string;
    ends_at: string;
    total_bids: number;
    total_revenue: number;
    participation_fee: number;
    created_at: string;
    updated_at: string;
    item: {
      id: string;
      title: string;
      slug: string;
      description: string;
      image_url: string;
      images: string[];
      category: string;
      condition: string;
      status: string;
    };
  };

  payment_order: {
    id: string;
    status: string;
    paid_at: string | null;
    user_id: string;
    currency: string;
    auction_id: string;
    bid_amount: number;
    created_at: string;
    expires_at: string;
    updated_at: string;
    pay_required: number;
    transaction_reference: string | null;
    idempotency_key: string;
    payment_method_id: string;

    payment_method: {
      id: string;
      name: string;
      provider: string;
      is_active: boolean;
      account_name: string;
      account_number: string;
      instructions: string | null;
      created_at: string;
      updated_at: string;
    };
  } | null;

  ticket: any;

  bid_transactions: {
    id: string;
    type: string;
    amount: number;
    bid_id: string;
    status: string;
    user_id: string;
    auction_id: string;
    created_at: string;
    completed_at: string | null;
    idempotency_key: string;
  }[];
}

interface AuctionBidsResponse {
  status: string;
  results: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  data: AuctionBid[];
}

// ─── Helpers ────────────────────────────────────────────

const formatDate = (date: string | null) => {
  if (!date) return "Not available";
  try {
    return new Date(date).toLocaleString("en-ET", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return date;
  }
};

const formatShortDate = (date: string | null) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-ET", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return date;
  }
};

const formatMoney = (amount: number | string, currency = "ETB") => {
  return `${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
};

const statusVariant = (status?: string) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "paid":
    case "completed":
    case "live":
    case "published":
      return "default" as const;
    case "pending":
    case "awaiting_payment":
      return "secondary" as const;
    case "failed":
    case "cancelled":
      return "destructive" as const;
    case "ended":
    case "archived":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
};

// ─── Sub-components ─────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const s = (status || "unknown").toLowerCase();
  const isSuccess = ["paid", "completed", "live", "published"].includes(s);
  const isFail = ["failed", "cancelled"].includes(s);

  return (
    <Badge
      variant={statusVariant(status)}
      className="gap-1 px-2 py-0.5 text-[10px] font-medium capitalize"
    >
      {isSuccess && <CheckCircle2 className="h-3 w-3" />}
      {isFail && <XCircle className="h-3 w-3" />}
      {status || "Unknown"}
    </Badge>
  );
}

function DetailRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
}) {
  const copyValue = String(value ?? "");

  return (
    <div className="flex min-w-0 items-start justify-between gap-3 py-2 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5 text-right font-medium text-foreground">
        <span className="break-all">{value ?? "N/A"}</span>
        {copyable && copyValue && copyValue !== "N/A" && (
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(copyValue)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            title="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h3>
        </div>
        <div className="divide-y divide-border/60">{children}</div>
      </CardContent>
    </Card>
  );
}

// ─── Component ─────────────────────────────────────────

export default function AuctionBids() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<AuctionBid | null>(null);

  const limit = 10;

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<AuctionBidsResponse>({
    queryKey: ["getAuctionBids", page, limit, search],
    queryFn: () => getAuctionBids({ page, limit, search }),
    staleTime: 30_000,
  });

  const bids = response?.data || [];
  const pagination = response?.pagination;

  const paidCount = bids.filter((bid) => !!bid.paid_at).length;

  // Revenue = participation_fee collected per bid.
  // Every placed bid required paying the auction's participation_fee.
  // We only count bids that were actually paid (so unpaid/cancelled
  // orders don't inflate the total).
  const totalRevenue = bids.reduce((total, bid) => {
    const isPaid =
      bid.payment_order?.status === "paid" ||
      bid.paid_at !== null;

    if (!isPaid) return total;

    const fee = Number(
      bid.payment_order?.pay_required ??
      bid.auction?.participation_fee ??
      0
    );

    return total + (Number.isFinite(fee) ? fee : 0);
  }, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const openDetail = (bid: AuctionBid) => {
    setSelectedBid(bid);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-full space-y-3 px-3 py-4">
        {/* ═══ HEADER ═══ */}
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Receipt className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                  Transactions
                </h1>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {pagination
                    ? `${pagination.total} bids total`
                    : "Auction bid records"}
                </p>
              </div>
            </div>

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
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by item name..."
                className="h-10 rounded-full border-border/60 bg-muted/40 pl-9 pr-9 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label="Clear search"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-10 shrink-0 rounded-full px-4 text-xs font-semibold"
            >
              Search
            </Button>
          </form>

          {/* Active search chip */}
          {search && (
            <div className="flex items-center justify-between rounded-full bg-primary/5 px-3 py-1.5">
              <p className="truncate text-[11px] text-muted-foreground">
                Results for{" "}
                <span className="font-semibold text-foreground">{search}</span>
              </p>
              <button
                onClick={clearSearch}
                className="shrink-0 text-[11px] font-semibold text-primary"
              >
                Clear
              </button>
            </div>
          )}
        </header>

        {/* ═══ SUMMARY ═══ */}
        {!isLoading && !isError && bids.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-border/60">
              <CardContent className="p-2.5">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Gavel className="h-3 w-3" />
                  <span className="text-[10px]">Total</span>
                </div>
                <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                  {pagination?.total ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-2.5">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="text-[10px]">Paid</span>
                </div>
                <p className="mt-1 text-base font-bold tabular-nums text-foreground">
                  {paidCount}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-2.5">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Wallet className="h-3 w-3" />
                  <span className="text-[10px]">Revenue</span>
                </div>
                <p className="mt-1 truncate text-xs font-bold tabular-nums text-green-600">
                  {formatMoney(totalRevenue)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

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
        {isError && !isLoading && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Failed to load transactions
                </p>
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
        )}

        {/* ═══ EMPTY ═══ */}
        {!isLoading && !isError && bids.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No transactions found
                </p>
                <p className="max-w-[240px] text-xs text-muted-foreground">
                  {search
                    ? "Try searching with a different item name."
                    : "Auction bids will appear here."}
                </p>
              </div>
              {search && (
                <Button variant="outline" size="sm" onClick={clearSearch}>
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* ═══ LIST ═══ */}
        {!isLoading && !isError && bids.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-sm font-semibold">Auction bids</h2>
              <span className="text-[10px] text-muted-foreground">
                {bids.length} shown · newest first
              </span>
            </div>

            <div className="space-y-2">
              {bids.map((bid) => {
                const item = bid.auction?.item;
                const user = bid.user;
                const payment = bid.payment_order;
                const method = payment?.payment_method;

                const userName =
                  [user?.Fname, user?.Lname].filter(Boolean).join(" ") ||
                  user?.username ||
                  "Unknown user";

                const bidStatus =
                  payment?.status || (bid.paid_at ? "paid" : "pending");

                return (
                  <Card
                    key={bid.id}
                    className="overflow-hidden border-border/60 transition-colors active:bg-muted/40"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 p-3">
                        {/* Thumbnail */}
                        <button
                          onClick={() => openDetail(bid)}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted"
                          aria-label={`View bid for ${item?.title || "item"}`}
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
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          )}
                        </button>

                        {/* Info */}
                        <button
                          onClick={() => openDetail(bid)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold leading-tight text-foreground">
                              {item?.title || "Unknown item"}
                            </p>
                            <StatusBadge status={bidStatus} />
                          </div>

                          <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                            {userName}
                            {item?.category && ` · ${item.category}`}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-primary">
                              {formatMoney(
                                bid.bid_amount,
                                bid.auction?.currency || "ETB"
                              )}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ·
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatShortDate(bid.created_at)}
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
                                aria-label={`Actions for bid`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="truncate text-[10px] font-normal text-muted-foreground">
                                {item?.title || "Bid"}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDetail(bid)}
                                className="text-sm"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPreviousPage || isFetching}
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
                    onClick={() => setPage((p) => p + 1)}
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

      {/* ═══ BID DETAIL SHEET ═══ */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedBid(null);
        }}
      >
        <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="pr-8 text-base">
              {selectedBid?.auction?.item?.title ?? "Bid Details"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Full information about this bid.
            </DialogDescription>
          </DialogHeader>

          {selectedBid ? <BidDetailContent bid={selectedBid} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Detail sheet content ───────────────────────────────

function BidDetailContent({ bid }: { bid: AuctionBid }) {
  const item = bid.auction?.item;
  const user = bid.user;
  const payment = bid.payment_order;
  const method = payment?.payment_method;

  const userName =
    [user?.Fname, user?.Lname].filter(Boolean).join(" ") ||
    user?.username ||
    "Unknown user";

  const bidStatus = payment?.status || (bid.paid_at ? "paid" : "pending");

  return (
    <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto">
      <div className="space-y-4 p-4">
        {/* Hero image */}
        {item?.image_url ? (
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted">
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}

        {/* Gallery */}
        {item?.images && item.images.length > 1 && (
          <div className="grid grid-cols-4 gap-1.5">
            {item.images.map((src, idx) => (
              <div
                key={`${src}-${idx}`}
                className="aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                <img
                  src={src}
                  alt={`${item.title} ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Bid summary */}
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={bidStatus} />
          {item?.condition && (
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-[10px] capitalize"
            >
              {item.condition}
            </Badge>
          )}
          {item?.category && (
            <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
              {item.category}
            </Badge>
          )}
        </div>

        {/* Amount + user hero */}
        <div className="rounded-xl border border-border/60 bg-primary/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Bid Amount
          </p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary">
            {formatMoney(bid.bid_amount, bid.auction?.currency)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {getInitials(userName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {userName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {user?.username ? `@${user.username}` : "No username"}
              </p>
            </div>
          </div>
        </div>

        {/* BID DETAILS */}
        <InfoCard title="Bid details" icon={Gavel}>
          <DetailRow label="Bid ID" value={bid.id} copyable />
          <DetailRow label="Auction ID" value={bid.auction_id} copyable />
          <DetailRow label="User ID" value={bid.user_id} copyable />
          <DetailRow
            label="Bid amount"
            value={formatMoney(bid.bid_amount, bid.auction?.currency)}
          />
          <DetailRow label="Idempotency key" value={bid.idempotency_key} copyable />
          <DetailRow label="Created" value={formatDate(bid.created_at)} />
          <DetailRow label="Paid at" value={formatDate(bid.paid_at)} />
          <DetailRow
            label="Payment order"
            value={bid.payment_order_id || "N/A"}
            copyable
          />
          <DetailRow label="Ticket" value={bid.ticket_id || "N/A"} copyable />
        </InfoCard>

        {/* USER */}
        <InfoCard title="User information" icon={User}>
          <DetailRow label="User ID" value={user?.id} copyable />
          <DetailRow label="Telegram ID" value={user?.telegram_id} copyable />
          <DetailRow label="First name" value={user?.Fname || "N/A"} />
          <DetailRow label="Last name" value={user?.Lname || "N/A"} />
          <DetailRow
            label="Username"
            value={user?.username ? `@${user.username}` : "N/A"}
          />
          <DetailRow label="Phone" value={user?.phone || "N/A"} copyable />
          <DetailRow label="Referral" value={user?.referral_id || "N/A"} copyable />
          <DetailRow label="Invited by" value={user?.invited_by || "N/A"} copyable />
          <DetailRow
            label="Privacy"
            value={user?.privacy_terms_accepted ? "Accepted" : "Not accepted"}
          />
          <DetailRow label="Registered" value={formatDate(user?.created_at)} />
        </InfoCard>

        {/* AUCTION */}
        <InfoCard title="Auction details" icon={Package}>
          <DetailRow label="Auction ID" value={bid.auction?.id} copyable />
          <DetailRow
            label="Status"
            value={<StatusBadge status={bid.auction?.status} />}
          />
          <DetailRow label="Currency" value={bid.auction?.currency} />
          <DetailRow
            label="Starting bid"
            value={formatMoney(
              bid.auction?.starting_bid || 0,
              bid.auction?.currency
            )}
          />
          <DetailRow
            label="Participation fee"
            value={formatMoney(
              bid.auction?.participation_fee || 0,
              bid.auction?.currency
            )}
          />
          <DetailRow label="Total bids" value={bid.auction?.total_bids} />
          <DetailRow
            label="Total revenue"
            value={formatMoney(
              bid.auction?.total_revenue || 0,
              bid.auction?.currency
            )}
          />
          <DetailRow label="Starts at" value={formatDate(bid.auction?.starts_at)} />
          <DetailRow label="Ends at" value={formatDate(bid.auction?.ends_at)} />
        </InfoCard>

        {/* ITEM */}
        <InfoCard title="Item details" icon={Layers3}>
          <DetailRow label="Item ID" value={item?.id} copyable />
          <DetailRow label="Title" value={item?.title} />
          <DetailRow label="Slug" value={item?.slug} copyable />
          <DetailRow label="Category" value={item?.category} />
          <DetailRow
            label="Condition"
            value={<StatusBadge status={item?.condition} />}
          />
          <DetailRow
            label="Item status"
            value={<StatusBadge status={item?.status} />}
          />
          {item?.description && (
            <div className="py-2">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <p className="text-xs leading-relaxed text-foreground">
                {item.description}
              </p>
            </div>
          )}
        </InfoCard>

        {/* PAYMENT ORDER */}
        <InfoCard title="Payment order" icon={CreditCard}>
          {payment ? (
            <>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={payment.status} />
              </div>
              <DetailRow label="Order ID" value={payment.id} copyable />
              <DetailRow
                label="Bid amount"
                value={formatMoney(payment.bid_amount, payment.currency)}
              />
              <DetailRow
                label="Required payment"
                value={formatMoney(payment.pay_required, payment.currency)}
              />
              <DetailRow label="Currency" value={payment.currency} />
              <DetailRow
                label="Transaction reference"
                value={payment.transaction_reference || "N/A"}
                copyable
              />
              <DetailRow
                label="Idempotency key"
                value={payment.idempotency_key}
                copyable
              />
              <DetailRow label="Created" value={formatDate(payment.created_at)} />
              <DetailRow label="Expires at" value={formatDate(payment.expires_at)} />
              <DetailRow label="Paid at" value={formatDate(payment.paid_at)} />
            </>
          ) : (
            <p className="py-3 text-center text-xs text-muted-foreground">
              No payment order associated with this bid.
            </p>
          )}
        </InfoCard>

        {/* PAYMENT METHOD */}
        {method && (
          <InfoCard title="Payment method" icon={Smartphone}>
            <DetailRow label="Method ID" value={method.id} copyable />
            <DetailRow label="Name" value={method.name} />
            <DetailRow label="Provider" value={method.provider} />
            <DetailRow label="Account name" value={method.account_name} />
            <DetailRow
              label="Account number"
              value={method.account_number}
              copyable
            />
            <DetailRow label="Active" value={method.is_active ? "Yes" : "No"} />
            {method.instructions && (
              <div className="py-2">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Instructions
                </p>
                <p className="whitespace-pre-line text-xs leading-relaxed text-foreground">
                  {method.instructions}
                </p>
              </div>
            )}
          </InfoCard>
        )}

        {/* TRANSACTIONS */}
        <InfoCard title="Bid transactions" icon={Receipt}>
          {bid.bid_transactions?.length ? (
            <div className="space-y-2 pt-2">
              {bid.bid_transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-lg border border-border/60 bg-muted/20 p-2.5"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {tx.type.replace("_", " ")}
                    </span>
                    <StatusBadge status={tx.status} />
                  </div>
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    {formatMoney(tx.amount, bid.auction?.currency)}
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-[10px] text-muted-foreground">
                    <p className="break-all font-mono">{tx.id}</p>
                    <p>{formatDate(tx.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-3 text-center text-xs text-muted-foreground">
              No transactions found for this bid.
            </p>
          )}
        </InfoCard>

        {/* TICKET */}
        {bid.ticket && (
          <InfoCard title="Bid ticket" icon={Ticket}>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all pt-2 text-[10px] text-foreground">
              {JSON.stringify(bid.ticket, null, 2)}
            </pre>
          </InfoCard>
        )}

        {/* Close */}
        <div className="pt-1">
          <Button
            variant="outline"
            onClick={() => {
              // handled by parent's onOpenChange
            }}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}