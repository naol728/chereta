/*eslint-disable*/
// @ts-nocheck
import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom"; // Added useNavigate
import {
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Gavel,
    Package,
    ArrowUpRight,
} from "lucide-react";

import { getAuctionItems } from "@/api/auction";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

type AuctionItemsResponse = {
    success: boolean;
    message: string;
    data: {
        items: AuctionItem[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
};

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
    const [failed, setFailed] = React.useState(false);
    const image = getImage(item);

    if (!image || failed) {
        return (
            <div
                className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
            >
                <Package className="h-12 w-12 opacity-40" />
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
        <div className="w-[82vw] min-w-[82vw] snap-start overflow-hidden rounded-2xl border bg-card sm:w-[300px] sm:min-w-[300px]">
            <div className="h-[190px] animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
            </div>
        </div>
    );
}

export default function LiveBid() {
    const sliderRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate(); // Initialize navigation

    const {
        data: response,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ["getAuctionItems"],
        queryFn: async () => {
            // Fetching a larger limit to display a good carousel
            const result = await getAuctionItems({
                page: 1,
                limit: 15,
            });

            const payload = result?.data?.data ?? result?.data ?? result;
            return payload as AuctionItemsResponse;
        },
        staleTime: 30_000,
    });

    const items = response?.items ?? [];

    const scroll = (direction: "left" | "right") => {
        sliderRef.current?.scrollBy({
            left: direction === "right" ? 320 : -320,
            behavior: "smooth",
        });
    };

    const handleViewProduct = (id: string) => {
        // Telegram haptic feedback
        if (typeof window !== "undefined") {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
        }
        // Redirect to the specific bid route
        navigate(`/bids/${id}`);
    };

    return (
        <section
            className="w-full bg-background px-4 pb-6 pt-5 text-foreground overscroll-x-contain"
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
                    </div>

                    {/* Controls: Refresh & Carousel Arrows */}
                    <div className="flex shrink-0 items-center gap-2">
                        <div className="hidden items-center gap-1 sm:flex">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => scroll("left")}
                                aria-label="Previous products"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full"
                                onClick={() => scroll("right")}
                                aria-label="Next products"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full ml-1"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            aria-label="Refresh products"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>
                </div>

                {/* Loading Skeleton */}
                {isLoading && (
                    <div className="flex snap-x gap-3 overflow-hidden">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <ProductSkeleton key={index} />
                        ))}
                    </div>
                )}

                {/* Error State */}
                {isError && !isLoading && (
                    <Card className="rounded-2xl border-destructive/20 bg-card">
                        <CardContent className="flex flex-col items-center px-5 py-8 text-center">
                            <RefreshCw className="mb-3 h-8 w-8 text-destructive" />
                            <h3 className="font-bold">Unable to load products</h3>
                            <Button onClick={() => refetch()} className="mt-4 rounded-xl" size="sm">
                                Try again
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Main Horizontal Carousel */}
                {!isLoading && !isError && items.length > 0 && (
                    <div
                        ref={sliderRef}
                        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4"
                    >
                        {items.map((item) => (
                            <Card
                                key={item.id}
                                className="w-[82vw] min-w-[82vw] snap-start gap-0 overflow-hidden rounded-2xl border-border bg-card py-0 shadow-sm transition-all sm:w-[300px] sm:min-w-[300px]"
                            >
                                {/* Product Image & Badges */}
                                <div className="relative h-[190px] overflow-hidden bg-muted sm:h-[210px]">
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

                                {/* Product Details */}
                                <CardContent className="p-4">
                                    <h3 className="truncate text-base font-bold tracking-tight">
                                        {item.title}
                                    </h3>

                                    <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-muted-foreground">
                                        {item.description || "Discover this product on Chereta."}
                                    </p>

                                    <div className="my-3 flex items-center justify-between border-y border-border/70 py-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-muted-foreground">Condition</p>
                                            <p className="mt-0.5 text-xs font-semibold">
                                                {conditionLabel[item.condition]}
                                            </p>
                                        </div>

                                        <div className="h-8 w-px bg-border" />

                                        <div className="min-w-0 text-right">
                                            <p className="text-[10px] text-muted-foreground">Listed on</p>
                                            <p className="mt-0.5 text-xs font-semibold">
                                                {formatDate(item.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        className="h-11 w-full rounded-xl text-sm font-bold active:scale-[0.98]"
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

                {/* Mobile Swipe Hint */}
                {!isLoading && items.length > 1 && (
                    <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-muted-foreground sm:hidden">
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span>ወደ ግራ ወይም ቀኝ ያንሸራትቱ</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                )}
            </div>
        </section>
    );
}