
import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getEndedAuctions } from "@/api/auction";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    ChevronRight,
    Clock,
    Gavel,
    Trophy,
    Package,
    RefreshCw,
    History,
    ImageOff,
} from "lucide-react";

// Types
type AuctionItem = {
    id: string;
    title: string;
    image_url: string | null;
    images: string[];
    category: string | null;
    condition: string;
};

type AuctionSettlement = {
    outcome: "winner_found" | "no_unique_bid" | "cancelled";
    winning_amount: number | null;
    winner_user_id: string | null;
    winning_bid_id: string | null;
    admin_decision: string | null;
    settled_at: string;
};

type EndedAuction = {
    id: string;
    item_id: string;
    starting_bid: number;
    currency: string;
    starts_at: string;
    ends_at: string;
    status: string;
    total_bids: number;
    item: AuctionItem | null;
    settlement: AuctionSettlement | null;
};

type EndedAuctionsResponse = {
    success: boolean;
    data: {
        auctions: EndedAuction[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
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

const formatAmount = (amount: number, currency = "ETB") => {
    return `${Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${currency}`;
};

function AuctionResult({ settlement }: { settlement: AuctionSettlement | null }) {
    if (!settlement) {
        return (
            <Badge variant="secondary" className="rounded-full text-[10px]">
                Awaiting result
            </Badge>
        );
    }

    if (settlement.outcome === "winner_found") {
        return (
            <Badge className="gap-1 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10">
                <Trophy className="h-3 w-3" />
                Winner found
            </Badge>
        );
    }

    if (settlement.outcome === "no_unique_bid") {
        return (
            <Badge variant="secondary" className="rounded-full">
                No unique bid
            </Badge>
        );
    }

    return (
        <Badge variant="destructive" className="rounded-full">
            Cancelled
        </Badge>
    );
}

export default function PreviousBid() {
    const navigate = useNavigate();

    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useQuery<EndedAuctionsResponse>({
        queryKey: ["getEndedAuctions"],
        queryFn: () => getEndedAuctions({ limit: 10, page: 1 }),
        staleTime: 30_000,
    });

    const auctions = data?.data?.auctions ?? [];

    return (
        <div className="min-h-screen w-full bg-background pb-6 text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-5 pt-6">
                <div>
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        <h1 className="text-xl font-extrabold tracking-tight">
                            Previous Auctions
                        </h1>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                        Explore recently ended auctions
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
                        className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                    />
                </Button>
            </div>

            {/* Loading */}
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

            {/* Error */}
            {isError && !isLoading && (
                <div className="mx-5 flex flex-col items-center rounded-2xl border border-border bg-card px-5 py-10 text-center">
                    <Package className="mb-3 h-9 w-9 text-muted-foreground" />
                    <h3 className="font-bold">Unable to load auctions</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Please check your connection and try again.
                    </p>
                    <Button onClick={() => refetch()} className="mt-4" size="sm">
                        Try again
                    </Button>
                </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && auctions.length === 0 && (
                <div className="mx-5 flex flex-col items-center rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Gavel className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <h3 className="font-bold">No previous auctions</h3>
                    <p className="mt-1 max-w-[230px] text-sm text-muted-foreground">
                        Ended auctions will appear here when they become available.
                    </p>
                </div>
            )}

            {/* Auction List */}
            {!isLoading && !isError && auctions.length > 0 && (
                <div className="space-y-3 px-5">
                    {auctions.map((auction) => {
                        const item = auction.item;
                        const settlement = auction.settlement;

                        const image =
                            item?.image_url || item?.images?.[0] || null;

                        const hasWinner =
                            settlement?.outcome === "winner_found" &&
                            settlement.winning_amount !== null;

                        return (
                            <button
                                key={auction.id}
                                type="button"
                                onClick={() => navigate(`/auction/${auction.id}`)}
                                className="group flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left shadow-sm transition-all active:scale-[0.98] hover:border-primary/30"
                            >
                                {/* Product image */}
                                <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-muted">
                                    {image ? (
                                        <img
                                            src={image}
                                            alt={item?.title || "Auction item"}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ImageOff className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                        <h2 className="truncate text-sm font-bold">
                                            {item?.title || "Auction item"}
                                        </h2>
                                    </div>

                                    <div className="mb-2">
                                        <AuctionResult settlement={settlement} />
                                    </div>

                                    {hasWinner ? (
                                        <p className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                            <Trophy className="h-3.5 w-3.5" />
                                            {formatAmount(
                                                settlement.winning_amount!,
                                                auction.currency
                                            )}
                                        </p>
                                    ) : (
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3.5 w-3.5" />
                                            Ended {formatDate(auction.ends_at)}
                                        </p>
                                    )}
                                </div>

                                {/* Arrow */}
                                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Pagination information */}
            {!isLoading && !isError && auctions.length > 0 && (
                <p className="mt-5 text-center text-xs text-muted-foreground">
                    Showing {auctions.length} of {data?.data?.pagination?.total ?? auctions.length} previous auctions
                </p>
            )}
        </div>
    );
}
