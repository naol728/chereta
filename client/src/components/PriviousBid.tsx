/* eslint-disable */
// @ts-nocheck
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getPreviousAuctions } from "@/api/auction";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Gavel,
    Trophy,
    Package,
    RefreshCw,
    History,
    ImageOff,
    CalendarDays,
    CheckCircle2,
    Truck,
    MapPin,
    CreditCard,
} from "lucide-react";

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
    status: string;
};

type AuctionBid = {
    id: string;
    auction_id?: string;
    user_id?: string;
    bid_amount: number;
    paid_at: string | null;
    created_at: string;
    payment_order_id?: string;
};

type Auction = {
    id: string;
    item_id: string;
    starting_bid: number;
    currency: string;
    starts_at: string;
    ends_at: string;
    status: string;
    total_bids: number;
    total_revenue: number;
    created_at: string;

    item: AuctionItem | null;
    bids: AuctionBid[];
    winning_bid: AuctionBid | null;
    my_bids: AuctionBid[];
};

type AuctionWinner = {
    id: string;
    auction_id: string;
    user_id: string;
    winning_bid_id: string;
    winning_amount: number;

    delivery_status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

    delivery_address: Record<string, unknown> | null;
    claimed_at: string | null;
    created_at: string;

    auction: Auction | null;
    winning_bid: AuctionBid | null;
};

type PreviousAuctionsResponse = {
    status: "success";
    results: number;

    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };

    data: {
        auctions: AuctionWinner[];
    };
};

// ============================================================
// HELPERS
// ============================================================

const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-ET", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
};

const formatDateTime = (date: string) => {
    return new Intl.DateTimeFormat("en-ET", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(date));
};

const formatAmount = (
    amount: number | string,
    currency = "ETB"
) => {
    return `${Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${currency}`;
};

// ============================================================
// DELIVERY STATUS
// ============================================================

function DeliveryStatus({
    status,
}: {
    status: AuctionWinner["delivery_status"];
}) {
    const config = {
        pending: {
            label: "Awaiting delivery",
            className: "bg-amber-500/10 text-amber-600",
            icon: Clock,
        },

        processing: {
            label: "Processing",
            className: "bg-blue-500/10 text-blue-600",
            icon: Package,
        },

        shipped: {
            label: "Shipped",
            className: "bg-indigo-500/10 text-indigo-600",
            icon: Truck,
        },

        delivered: {
            label: "Delivered",
            className: "bg-emerald-500/10 text-emerald-600",
            icon: CheckCircle2,
        },

        cancelled: {
            label: "Cancelled",
            className: "bg-red-500/10 text-red-600",
            icon: Package,
        },
    };

    const item = config[status] || config.pending;
    const Icon = item.icon;

    return (
        <Badge
            variant="secondary"
            className={`gap-1 rounded-full border-0 px-2.5 py-1 text-[10px] font-semibold ${item.className}`}
        >
            <Icon className="h-3 w-3" />
            {item.label}
        </Badge>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PreviousBid() {
    const [page, setPage] = useState(1);
    const limit = 10;

    // ============================================================
    // QUERY
    // ============================================================

    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useQuery<PreviousAuctionsResponse>({
        queryKey: ["getPreviousAuctions", page],
        queryFn: () =>
            getPreviousAuctions({
                limit,
                page,
            }),
        staleTime: 30_000,
    });

    const auctions = data?.data?.auctions ?? [];
    const pagination = data?.pagination;

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="min-h-screen w-full bg-background pb-8 text-foreground">

            {/* ================================================== */}
            {/* HEADER */}
            {/* ================================================== */}

            <div className="flex items-center justify-between px-5 pb-5 pt-6">
                <div>
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />

                        <h1 className="text-xl font-extrabold tracking-tight">
                            Previous Auctions
                        </h1>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Your won auctions and purchase history
                    </p>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw
                        className={`h-4 w-4 ${isFetching ? "animate-spin" : ""
                            }`}
                    />
                </Button>
            </div>

            {/* ================================================== */}
            {/* SUMMARY */}
            {/* ================================================== */}

            {!isLoading && !isError && auctions.length > 0 && (
                <div className="mx-5 mb-5 grid grid-cols-2 gap-3">

                    <div className="rounded-2xl border border-border/60 bg-card p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span className="text-xs">Auctions won</span>
                        </div>

                        <p className="mt-2 text-xl font-extrabold">
                            {pagination?.total ?? auctions.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-card p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span className="text-xs">Winning amount</span>
                        </div>

                        <p className="mt-2 truncate text-xl font-extrabold">
                            {formatAmount(
                                auctions.reduce(
                                    (total, auction) =>
                                        total + Number(auction.winning_amount || 0),
                                    0
                                )
                            )}
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                            Current page total
                        </p>
                    </div>
                </div>
            )}

            {/* ================================================== */}
            {/* LOADING */}
            {/* ================================================== */}

            {isLoading && (
                <div className="space-y-3 px-5">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex animate-pulse gap-3 rounded-2xl border border-border/50 bg-card p-3"
                        >
                            <div className="h-20 w-20 shrink-0 rounded-xl bg-muted" />

                            <div className="flex flex-1 flex-col justify-center gap-3">
                                <div className="h-4 w-3/4 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted" />
                                <div className="h-3 w-2/3 rounded bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ================================================== */}
            {/* ERROR */}
            {/* ================================================== */}

            {isError && !isLoading && (
                <div className="mx-5 flex flex-col items-center rounded-2xl border border-border bg-card px-5 py-10 text-center">
                    <Package className="mb-3 h-9 w-9 text-muted-foreground" />

                    <h3 className="font-bold">
                        Unable to load auctions
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Please check your connection and try again.
                    </p>

                    <Button
                        onClick={() => refetch()}
                        className="mt-4"
                        size="sm"
                    >
                        Try again
                    </Button>
                </div>
            )}

            {/* ================================================== */}
            {/* EMPTY */}
            {/* ================================================== */}

            {!isLoading && !isError && auctions.length === 0 && (
                <div className="mx-5 flex flex-col items-center rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Gavel className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <h3 className="font-bold">
                        No previous auctions
                    </h3>

                    <p className="mt-1 max-w-[230px] text-sm text-muted-foreground">
                        Auctions you win will appear here. Start bidding
                        and you could be the next winner!
                    </p>
                </div>
            )}

            {/* ================================================== */}
            {/* AUCTION LIST */}
            {/* ================================================== */}

            {!isLoading && !isError && auctions.length > 0 && (
                <div className="space-y-3 px-5">

                    {auctions.map((winner) => {
                        const auction = winner.auction;
                        const item = auction?.item;

                        const image =
                            item?.image_url ||
                            item?.images?.[0] ||
                            null;

                        const winningBid =
                            winner.winning_bid || auction?.winning_bid;

                        const myBids = auction?.my_bids ?? [];

                        return (
                            // Removed onClick and cursor-pointer
                            <div
                                key={winner.id}
                                className="group w-full overflow-hidden rounded-2xl border border-border/60 bg-card text-left shadow-sm transition-all hover:border-primary/30"
                            >

                                {/* ====================================== */}
                                {/* PRODUCT */}
                                {/* ====================================== */}

                                <div className="flex gap-3 p-3">

                                    <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl bg-muted">
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={item?.title || "Auction item"}
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <ImageOff className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}

                                        <div className="absolute left-1.5 top-1.5">
                                            <Badge className="border-0 bg-emerald-500 px-2 py-0.5 text-[9px] text-white hover:bg-emerald-500">
                                                WON
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1">

                                        <div className="flex items-start justify-between gap-2">
                                            <h2 className="truncate text-sm font-bold">
                                                {item?.title || "Auction item"}
                                            </h2>
                                            {/* Removed ChevronRight icon here */}
                                        </div>

                                        {item?.category && (
                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                {item.category}
                                                {item.condition
                                                    ? ` · ${item.condition}`
                                                    : ""}
                                            </p>
                                        )}

                                        <div className="mt-2">
                                            <DeliveryStatus
                                                status={winner.delivery_status}
                                            />
                                        </div>

                                        <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <CalendarDays className="h-3 w-3" />
                                            Won on {formatDate(winner.created_at)}
                                        </p>
                                    </div>
                                </div>

                                {/* ====================================== */}
                                {/* WINNING AMOUNT */}
                                {/* ====================================== */}

                                <div className="mx-3 border-t border-border/60" />

                                <div className="grid grid-cols-2 gap-3 px-3 py-3">

                                    <div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Your winning bid
                                        </p>

                                        <p className="mt-1 flex items-center gap-1 text-sm font-extrabold text-emerald-600">
                                            <Trophy className="h-3.5 w-3.5" />

                                            {formatAmount(
                                                winner.winning_amount,
                                                auction?.currency || "ETB"
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] text-muted-foreground">
                                            Total auction bids
                                        </p>

                                        <p className="mt-1 flex items-center gap-1 text-sm font-bold">
                                            <Gavel className="h-3.5 w-3.5 text-primary" />

                                            {auction?.total_bids ??
                                                auction?.bids?.length ??
                                                0} bids
                                        </p>
                                    </div>
                                </div>

                                {/* ====================================== */}
                                {/* BID DETAILS */}
                                {/* ====================================== */}

                                <div className="mx-3 border-t border-border/60" />

                                <div className="space-y-2 px-3 py-3">

                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-muted-foreground">
                                            Winning bid details
                                        </span>

                                        <Badge
                                            variant="outline"
                                            className="rounded-full text-[9px]"
                                        >
                                            {myBids.length} of your bids
                                        </Badge>
                                    </div>

                                    {winningBid && (
                                        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Winning amount
                                                </p>

                                                <p className="mt-0.5 text-xs font-bold">
                                                    {formatAmount(
                                                        winningBid.bid_amount,
                                                        auction?.currency || "ETB"
                                                    )}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[10px] text-muted-foreground">
                                                    Payment status
                                                </p>

                                                <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-semibold text-emerald-600">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Paid
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Settled {formatDateTime(winner.created_at)}
                                        </span>
                                        {/* Removed "View details" link here */}
                                    </div>
                                </div>

                                {/* ====================================== */}
                                {/* DELIVERY */}
                                {/* ====================================== */}

                                {winner.delivery_address && (
                                    <>
                                        <div className="mx-3 border-t border-border/60" />

                                        <div className="flex items-center gap-2 px-3 py-2.5 text-[10px] text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5 text-primary" />

                                            <span>
                                                Delivery address submitted
                                            </span>
                                        </div>
                                    </>
                                )}

                            </div>
                        );
                    })}
                </div>
            )}

            {/* ================================================== */}
            {/* PAGINATION */}
            {/* ================================================== */}

            {!isLoading && !isError && auctions.length > 0 && (
                <div className="mx-5 mt-6">

                    <div className="flex items-center justify-between gap-3">

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 rounded-xl"
                            disabled={
                                !pagination?.hasPreviousPage || isFetching
                            }
                            onClick={() =>
                                setPage((current) => Math.max(current - 1, 1))
                            }
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="text-center">
                            <p className="text-xs font-bold">
                                Page {pagination?.page ?? page} of{" "}
                                {pagination?.totalPages ?? 1}
                            </p>

                            <p className="mt-1 text-[10px] text-muted-foreground">
                                {pagination?.total ?? auctions.length} auctions
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 rounded-xl"
                            disabled={
                                !pagination?.hasNextPage || isFetching
                            }
                            onClick={() =>
                                setPage((current) => current + 1)
                            }
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                    </div>

                    <p className="mt-4 text-center text-[10px] text-muted-foreground">
                        Showing {auctions.length} auctions on this page
                    </p>

                </div>
            )}

        </div>
    );
}