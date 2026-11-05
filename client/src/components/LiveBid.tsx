/* eslint-disable */
// @ts-nocheck
import React, { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Gavel,
    Package,
    ArrowUpRight,
    Clock,
} from "lucide-react";

import { getAuctionItems } from "@/api/auction";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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

const formatAmount = (amount: number, currency = "ETB") => {
    return new Intl.NumberFormat("en-ET", {
        maximumFractionDigits: 0,
    }).format(amount) + ` ${currency}`;
};

const conditionLabel: Record<AuctionItem["condition"], string> = {
    new: "New",
    used: "Used",
    refurbished: "Refurbished",
};

function getImage(item: AuctionItem) {
    return item.image_url || item.images?.[0] || "";
}

// Calculate remaining time parts (Days, Hours, Minutes, Seconds)
function getTimeRemaining(endTime: string) {
    const total = Date.parse(endTime) - Date.parse(new Date().toString());
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return {
        total,
        days: days > 0 ? days : 0,
        hours: hours > 0 ? hours : 0,
        minutes: minutes > 0 ? minutes : 0,
        seconds: seconds > 0 ? seconds : 0,
    };
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function CountdownTimer({ endsAt }: { endsAt: string }) {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(endsAt));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeRemaining(endsAt));
        }, 1000);

        return () => clearInterval(timer);
    }, [endsAt]);

    if (timeLeft.total <= 0) {
        return (
            <div className="flex items-center gap-1 text-[10px] font-bold text-destructive">
                <Clock className="h-3 w-3" />
                Auction Ended
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-primary">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
            </span>
        </div>
    );
}

function ProductImage({ item, className = "" }: { item: AuctionItem; className?: string }) {
    const [failed, setFailed] = React.useState(false);
    const image = getImage(item);

    if (!image || failed) {
        return (
            <div className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
                <Package className="h-8 w-8 opacity-40" />
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

// Skeleton that matches the exact card dimensions
function ProductSkeleton() {
    return (
        <div className="w-[65vw] min-w-[65vw] snap-start overflow-hidden rounded-2xl border border-border bg-card sm:w-[260px] sm:min-w-[260px]">
            {/* Image Skeleton */}
            <Skeleton className="h-[130px] w-full rounded-none sm:h-[150px]" />

            {/* Content Skeleton */}
            <div className="space-y-2.5 p-3">
                {/* Title */}
                <Skeleton className="h-4 w-3/4" />

                {/* Description */}
                <Skeleton className="h-3 w-full" />

                {/* Countdown */}
                <Skeleton className="h-3 w-1/3" />

                {/* Divider */}
                <div className="border-t border-border/50 pt-2 mt-2 space-y-2">
                    {/* Bid & Bids row */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-2 w-8" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="space-y-1 flex flex-col items-end">
                            <Skeleton className="h-2 w-8" />
                            <Skeleton className="h-4 w-10" />
                        </div>
                    </div>

                    {/* Button */}
                    <Skeleton className="h-8 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LiveBid() {
    const sliderRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const {
        data: response,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useQuery<AuctionItemsResponse>({
        queryKey: ["getAuctionItems"],
        queryFn: async () => {
            const result = await getAuctionItems({ page: 1, limit: 15 });
            return result.data as AuctionItemsResponse;
        },
        staleTime: 30_000,
    });

    const auctions = response?.auctions ?? [];

    const scroll = (direction: "left" | "right") => {
        sliderRef.current?.scrollBy({
            left: direction === "right" ? 280 : -280,
            behavior: "smooth",
        });
    };

    const handleViewProduct = (auctionId: string) => {
        if (typeof window !== "undefined") {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
        }
        navigate(`/bids/${auctionId}`);
    };

    return (
        <section className="relative w-full bg-background px-3 pb-6 pt-4 text-foreground">
            <div className="mx-auto w-full max-w-5xl">

                {/* Header Section */}
                <div className="mb-3 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">
                                በቀጥታ ጨረታ
                            </p>
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
                            አሁን ቅረብ
                        </h2>
                    </div>

                    {/* Controls Area */}
                    <div className="flex shrink-0 items-center gap-1.5">
                        <div className="hidden items-center gap-1 sm:flex">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-full border-border bg-card"
                                onClick={() => scroll("left")}
                                aria-label="Previous auctions"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 rounded-full border-border bg-card"
                                onClick={() => scroll("right")}
                                aria-label="Next auctions"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full border-border bg-card"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            aria-label="Refresh auctions"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* Loading Skeletons (Carousel) */}
                {isLoading && (
                    <div className="flex snap-x gap-3 overflow-hidden">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <ProductSkeleton key={index} />
                        ))}
                    </div>
                )}

                {/* Error State */}
                {isError && !isLoading && (
                    <Card className="rounded-xl border-destructive/20 bg-card">
                        <CardContent className="flex flex-col items-center px-4 py-6 text-center">
                            <RefreshCw className="mb-2 h-6 w-6 text-destructive" />
                            <h3 className="text-sm font-bold">Unable to load</h3>
                            <Button onClick={() => refetch()} className="mt-3 h-8 rounded-lg px-4 text-xs" size="sm">
                                Try again
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {!isLoading && !isError && auctions.length === 0 && (
                    <Card className="rounded-xl border-border bg-card">
                        <CardContent className="flex flex-col items-center px-4 py-8 text-center">
                            <Package className="mb-2 h-6 w-6 text-muted-foreground opacity-50" />
                            <h3 className="text-sm font-bold">No live auctions</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Check back later!
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Main Horizontal Carousel */}
                {!isLoading && !isError && auctions.length > 0 && (
                    <div
                        ref={sliderRef}
                        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {auctions.map((auction) => {
                            const item = auction.item;
                            if (!item) return null;

                            return (
                                <Card
                                    key={auction.id}
                                    className="w-[65vw] min-w-[65vw] snap-start gap-0 overflow-hidden rounded-2xl border-border bg-card py-0 shadow-sm transition-all sm:w-[260px] sm:min-w-[260px]"
                                >
                                    {/* Image Area */}
                                    <div className="relative h-[130px] overflow-hidden bg-muted sm:h-[150px]">
                                        <ProductImage
                                            item={item}
                                            className="h-full w-full object-cover"
                                        />

                                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />

                                        {/* Live Indicator */}
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[9px] font-bold text-destructive-foreground shadow-sm">
                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                            LIVE
                                        </div>

                                        {item.condition && (
                                            <div className="absolute right-2 top-2">
                                                <Badge className="rounded-full bg-background/90 text-foreground text-[9px] font-bold px-2 py-0.5 hover:bg-background/90">
                                                    {conditionLabel[item.condition]}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <CardContent className="flex flex-col p-3">
                                        <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground">
                                            {item.title}
                                        </h3>

                                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                                            {item.description || "Discover this product."}
                                        </p>

                                        {/* COUNTDOWN TIMER */}
                                        <div className="mt-1.5">
                                            <CountdownTimer endsAt={auction.ends_at} />
                                        </div>

                                        {/* Price & Stats */}
                                        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
                                            <div>
                                                <p className="text-[9px] font-medium uppercase text-muted-foreground">
                                                    Bid
                                                </p>
                                                <p className="text-xs font-bold text-primary">
                                                    {formatAmount(auction.starting_bid, auction.currency)}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[9px] font-medium uppercase text-muted-foreground">
                                                    Bids
                                                </p>
                                                <p className="text-xs font-bold text-foreground">
                                                    {auction.total_bids}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Button
                                            className="mt-2 h-8 w-full rounded-lg text-xs font-bold active:scale-[0.98]"
                                            onClick={() => handleViewProduct(auction.id)}
                                        >
                                            <Gavel className="mr-1.5 h-3 w-3" />
                                            View
                                            <ArrowUpRight className="ml-auto h-3 w-3 opacity-70" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Mobile Swipe Hint */}
                {!isLoading && auctions.length > 1 && (
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground sm:hidden">
                        <ChevronLeft className="h-3 w-3" />
                        <span>ወደ ግራ ወይም ቀኝ ያንሸራትቱ</span>
                        <ChevronRight className="h-3 w-3" />
                    </div>
                )}
            </div>
        </section>
    );
}