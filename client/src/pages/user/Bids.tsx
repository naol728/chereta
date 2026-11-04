  /* eslint-disable */
  // @ts-nocheck
  import React, { useMemo, useState, useRef } from "react";
  import { useQuery } from "@tanstack/react-query";
  import { useNavigate } from "react-router-dom";
  import {
    ChevronLeft,
    ChevronRight,
    Search,
    RefreshCw,
    Gavel,
    Package,
    ArrowUpRight,
    X,
    SlidersHorizontal,
  } from "lucide-react";

  import { getAuctionItems } from "@/api/auction";

  import { Button } from "@/components/ui/button";
  import { Card, CardContent } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Input } from "@/components/ui/input";

  // ============================================================
  // TYPES
  // ============================================================

  type AuctionItem = {
    id: string;
    title: string;
    slug: string | null;
    description: string | null;
    image_url: string | null;
    images: string[];
    category: string | null;
    condition: "new" | "used" | "refurbished";
  };

  type Auction = {
    id: string;
    item_id: string;
    starting_bid: number;
    currency: string;
    starts_at: string;
    ends_at: string;
    status: "live";
    total_bids: number;
    total_revenue: number;
    created_at: string;
    item: AuctionItem | null;
  };

  type AuctionItemsResponse = {
    auctions: Auction[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const PAGE_SIZE = 12;

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-ET", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatAmount = (amount: number, currency = "ETB") => {
    return new Intl.NumberFormat("en-ET", {
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currency}`;
  };

  const conditionLabel: Record<AuctionItem["condition"], string> = {
    new: "New",
    used: "Used",
    refurbished: "Refurbished",
  };

  const conditionStyles: Record<AuctionItem["condition"], string> = {
    new: "bg-primary/10 text-primary border-primary/20",
    used: "bg-muted text-muted-foreground border-border",
    refurbished: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  function getImage(item: AuctionItem) {
    return item.image_url || item.images?.[0] || "";
  }

  // ============================================================
  // SUB-COMPONENTS
  // ============================================================

  function ProductImage({ item, className = "" }: { item: AuctionItem; className?: string }) {
    const [failed, setFailed] = useState(false);
    const image = getImage(item);

    if (!image || failed) {
      return (
        <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
          <Package className="h-10 w-10 opacity-40" />
        </div>
      );
    }

    return (
      <img
        src={image}
        alt={item.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }

  function ProductSkeleton() {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-border bg-card">
        <div className="h-[160px] animate-pulse bg-muted sm:h-[200px]" />
        <div className="space-y-3 p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN COMPONENT
  // ============================================================

  export default function Bids() {
    const navigate = useNavigate();
    const topRef = useRef<HTMLDivElement>(null);

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const {
      data: response,
      isLoading,
      isError,
      refetch,
      isFetching,
    } = useQuery<AuctionItemsResponse>({
      queryKey: ["getAuctionItems", page, search, category],
      queryFn: async () => {
        const result = await getAuctionItems({
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          category: category === "All" ? undefined : category,
        });
        return result.data as AuctionItemsResponse;
      },
      staleTime: 30_000,
    });

    const auctions = response?.auctions ?? [];
    const pagination = response?.pagination;

    // Extract unique categories from the currently fetched auctions
    const categories = useMemo(() => {
      const uniqueCategories = Array.from(
        new Set(
          auctions
            .map((auction) => auction.item?.category)
            .filter((value): value is string => Boolean(value))
        )
      );
      return ["All", ...uniqueCategories];
    }, [auctions]);

    const handleViewProduct = (auctionId: string) => {
      if (typeof window !== "undefined") {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
      }
      navigate(`/bids/${auctionId}`);
    };

    const changeCategory = (value: string) => {
      setCategory(value);
      setPage(1);
    };

    const changeSearch = (value: string) => {
      setSearch(value);
      setPage(1);
    };

    const scrollToTop = () => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
      <div ref={topRef} className="w-full bg-background px-4 pb-6 pt-5 text-foreground">
        <div className="mx-auto w-full max-w-5xl">

          {/* Header */}
          <div className="mb-5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">
                  በቀጥታ ጨረታ
                </p>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                አሁን ቅረብ
              </h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Discover live auctions and participate.
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full border-border bg-card"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh auctions"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Sticky Search & Categories */}
          <div className="sticky top-0 z-40 bg-background/95 pb-3 pt-1 backdrop-blur-md">
            {/* Search Bar */}
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => changeSearch(event.target.value)}
                  placeholder="Search auctions..."
                  className="h-11 rounded-xl border-border bg-card pl-9"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => changeSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 shrink-0 rounded-xl border-border bg-card"
                onClick={() => {
                  setCategory("All");
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* Categories Scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeCategory(value)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${category === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                >
                  {value === "All" ? "ሁሉም" : value}
                </button>
              ))}
            </div>
          </div>

          {/* List Heading */}
          <div className="mb-3 flex items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="text-base font-bold">Live Auctions</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pagination?.total ?? 0} auctions available
              </p>
            </div>
          </div>

          {/* Loading Skeleton Grid */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <Card className="rounded-2xl border-destructive/20 bg-card">
              <CardContent className="flex flex-col items-center px-5 py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h3 className="font-bold">Unable to load auctions</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Something went wrong while fetching the live data.
                </p>
                <Button onClick={() => refetch()} className="mt-4 rounded-xl" size="sm">
                  Try again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && !isError && auctions.length === 0 && (
            <Card className="rounded-2xl border-dashed bg-card">
              <CardContent className="flex flex-col items-center px-5 py-10 text-center">
                <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <h3 className="font-bold">No live auctions found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try another search term or category.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-xl"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Vertical Product Grid */}
          {!isLoading && !isError && auctions.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {auctions.map((auction) => {
                const item = auction.item;
                if (!item) return null;

                return (
                  <Card
                    key={auction.id}
                    className="group flex flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card py-0 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
                  >
                    {/* Product Image Area */}
                    <div className="relative h-[180px] overflow-hidden bg-muted sm:h-[200px]">
                      <ProductImage
                        item={item}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

                      {/* Category Badge */}
                      {item.category && (
                        <Badge className="absolute left-3 top-3 rounded-full border border-white/20 bg-background/90 px-3 py-1 text-[10px] font-semibold text-foreground shadow-sm hover:bg-background/90">
                          {item.category}
                        </Badge>
                      )}

                      {/* Condition Badge */}
                      <Badge
                        variant="outline"
                        className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-sm ${conditionStyles[item.condition]
                          }`}
                      >
                        {conditionLabel[item.condition]}
                      </Badge>

                      {/* Live Indicator */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold text-destructive-foreground shadow-lg">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        LIVE
                      </div>
                    </div>

                    {/* Auction Details */}
                    <CardContent className="flex flex-1 flex-col p-4">
                      <h3 className="truncate text-base font-bold tracking-tight text-foreground">
                        {item.title}
                      </h3>

                      <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">
                        {item.description || "Discover this product on Chereta."}
                      </p>

                      {/* Price & Bids */}
                      <div className="my-3 flex items-center justify-between border-y border-border/60 py-2.5">
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Starting Bid
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-primary">
                            {formatAmount(auction.starting_bid, auction.currency)}
                          </p>
                        </div>

                        <div className="h-8 w-px bg-border/60" />

                        <div className="min-w-0 text-right">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Total Bids
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-foreground">
                            {auction.total_bids.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* End Date */}
                      <div className="mb-3 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Auction Ends</span>
                        <span className="font-semibold text-foreground">{formatDate(auction.ends_at)}</span>
                      </div>

                      {/* Action Button */}
                      <div className="mt-auto pt-1">
                        <Button
                          className="h-10 w-full rounded-xl text-sm font-bold active:scale-[0.98]"
                          onClick={() => handleViewProduct(auction.id)}
                        >
                          <Gavel className="mr-2 h-4 w-4" />
                          View Auction
                          <ArrowUpRight className="ml-auto h-4 w-4 opacity-70" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-border bg-card"
                disabled={!pagination.hasPreviousPage || isFetching}
                onClick={() => {
                  setPage((previous) => Math.max(1, previous - 1));
                  scrollToTop();
                }}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prev
              </Button>

              <span className="text-xs font-medium text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-border bg-card"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => {
                  setPage((previous) => previous + 1);
                  scrollToTop();
                }}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }