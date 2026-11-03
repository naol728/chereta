/*eslint-disable*/
// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // Added useNavigate
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

type AuctionItem = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  images: string[];
  category: string | null;
  condition: "new" | "used" | "refurbished";
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AuctionItemsResponse = {
  success: boolean;
  message: string;
  data: {
    items: AuctionItem[];
    pagination: Pagination;
  };
};

const PAGE_SIZE = 12;

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en-ET", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
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

function ProductImage({
  item,
  className = "",
}: {
  item: AuctionItem;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const image = getImage(item);

  if (!image || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
      >
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
    <div className="w-full overflow-hidden rounded-2xl border bg-card">
      <div className="h-[160px] animate-pulse bg-muted sm:h-[200px]" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export default function Bids() {
  const navigate = useNavigate(); // Initialize router navigation

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const {
    data: response,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["getAuctionItems", page, search, category],
    queryFn: async () => {
      const result = await getAuctionItems({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        category: category === "All" ? undefined : category,
      });

      const payload = result?.data?.data ?? result?.data ?? result;
      return payload as AuctionItemsResponse;
    },
    staleTime: 30_000,
  });

  const items = response?.items ?? [];
  const pagination = response?.data?.pagination;

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        items
          .map((item) => item.category)
          .filter((value): value is string => Boolean(value))
      )
    );

    return ["All", ...uniqueCategories];
  }, [items]);

  const handleViewProduct = (id: string) => {
    // Telegram haptic feedback
    if (typeof window !== "undefined") {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
    }

    // Navigate to the specific bid page
    navigate(`/bids/${id}`);
  };

  const changeCategory = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <section
      className="w-full min-h-[100dvh] bg-background px-4 pb-6 pt-5 text-foreground overscroll-y-contain"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                በቀጥታ ጨረታ
              </p>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              አሁን ቅረብ
            </h2>

            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Discover products and participate in auctions.
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh products"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search products..."
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
            className="h-11 w-11 shrink-0 rounded-xl"
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

        {/* Categories */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        {/* List Heading & Pagination Info */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">Featured Products</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {pagination?.total ?? 0} products available
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

        {/* Error */}
        {isError && !isLoading && (
          <Card className="rounded-2xl border-destructive/20 bg-card">
            <CardContent className="flex flex-col items-center px-5 py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <RefreshCw className="h-5 w-5" />
              </div>

              <h3 className="font-bold">Unable to load products</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Something went wrong while fetching the products.
              </p>

              <Button
                onClick={() => refetch()}
                className="mt-4 rounded-xl"
                size="sm"
              >
                Try again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!isLoading && !isError && items.length === 0 && (
          <Card className="rounded-2xl border-dashed bg-card">
            <CardContent className="flex flex-col items-center px-5 py-10 text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/50" />

              <h3 className="font-bold">No products found</h3>

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
        {!isLoading && !isError && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1">
            {items.map((item) => (
              <Card
                key={item.id}
                className="gap-0 overflow-hidden rounded-2xl border-border bg-card py-0 shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
              >
                {/* Product image */}
                <div className="relative h-[180px] overflow-hidden bg-muted sm:h-[200px]">
                  <ProductImage
                    item={item}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />

                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

                  {item.category && (
                    <Badge className="absolute left-3 top-3 rounded-full border border-white/20 bg-background/90 px-3 py-1 text-[10px] font-semibold text-foreground shadow-sm hover:bg-background/90">
                      {item.category}
                    </Badge>
                  )}

                  <Badge
                    variant="outline"
                    className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-sm ${conditionStyles[item.condition]
                      }`}
                  >
                    {conditionLabel[item.condition]}
                  </Badge>
                </div>

                {/* Product details */}
                <CardContent className="p-4">
                  <h3 className="truncate text-base font-bold tracking-tight">
                    {item.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">
                    {item.description || "Discover this product on Chereta."}
                  </p>

                  <div className="my-3 flex items-center justify-between border-y border-border/70 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">
                        Condition
                      </p>
                      <p className="mt-0.5 text-xs font-semibold">
                        {conditionLabel[item.condition]}
                      </p>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    <div className="min-w-0 text-right">
                      <p className="text-[10px] text-muted-foreground">
                        Listed on
                      </p>
                      <p className="mt-0.5 text-xs font-semibold">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="h-10 w-full rounded-xl text-sm font-bold active:scale-[0.98]"
                    onClick={() => handleViewProduct(item.id)}
                  >
                    <Gavel className="mr-2 h-4 w-4" />
                    View product
                    <ArrowUpRight className="ml-auto h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination (Bottom) */}
        {!isLoading && !isError && pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!pagination.hasPreviousPage || isFetching}
              onClick={() => {
                setPage((previous) => Math.max(1, previous - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
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
              className="rounded-xl"
              disabled={!pagination.hasNextPage || isFetching}
              onClick={() => {
                setPage((previous) => previous + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}