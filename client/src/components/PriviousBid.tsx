/* eslint-disable */
// @ts-nocheck
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { getPreviousSetteldAuctions } from "@/api/auction";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
    Gavel,
    Trophy,
    Package,
    RefreshCw,
    History,
    ImageOff,
    User as UserIcon,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type AuctionItem = {
    id: string;
    title: string;
    images: string[];
    image_url: string | null;
};

type Auction = {
    id: string;
    item: AuctionItem | null;
    currency: string;
};

type WinningBid = {
    id: string;
    bid_amount: number;
};

type Winner = {
    id: string;
    winning_amount: number;
    winner: {
        Fname: string;
        Lname: string;
        username: string;
    };
    winning_bid: WinningBid;
    auction: Auction;
};

type PreviousSettledAuctionsResponse = {
    status: "success";
    pagination: {
        total: number;
    };
    data: {
        winners: Winner[];
    };
};

// ============================================================
// HELPERS
// ============================================================

const formatAmount = (amount: number, currency = "ETB") => {
    return `${Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${currency}`;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PreviousBid() {
    const { t } = useTranslation();

    const {
        data,
        isLoading,
        isError,
        refetch,
        isFetching,
    } = useQuery<PreviousSettledAuctionsResponse>({
        queryKey: ["getPreviousSetteldAuctions"],
        queryFn: () => getPreviousSetteldAuctions({ limit: 10, page: 1 }),
        staleTime: 30_000,
    });

    const winners = data?.data?.winners ?? [];
    const pagination = data?.pagination;

    return (
        <div className="w-full bg-background pb-4 text-foreground">

            {/* Compact Header */}
            <div className="flex items-center justify-between px-4 pb-3 pt-4">
                <div>
                    <div className="flex items-center gap-1.5">
                        <History className="h-4 w-4 text-primary" />
                        <h1 className="text-base font-extrabold tracking-tight">
                            {t("previousBid.title")}
                        </h1>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
                </Button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-2 px-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex animate-pulse gap-2.5 rounded-xl border border-border/50 bg-card p-2.5">
                            <div className="h-[56px] w-[56px] shrink-0 rounded-lg bg-muted" />
                            <div className="flex flex-1 flex-col justify-center gap-2">
                                <div className="h-3 w-3/4 rounded bg-muted" />
                                <div className="h-2.5 w-1/2 rounded bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {isError && !isLoading && (
                <div className="mx-4 flex flex-col items-center rounded-xl border border-border bg-card px-4 py-6 text-center">
                    <Package className="mb-2 h-6 w-6 text-muted-foreground" />
                    <h3 className="text-xs font-bold">{t("previousBid.unableToLoad")}</h3>
                    <Button onClick={() => refetch()} className="mt-3 h-7 text-xs" size="sm">
                        {t("previousBid.tryAgain")}
                    </Button>
                </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && winners.length === 0 && (
                <div className="mx-4 flex flex-col items-center rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Gavel className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-xs font-bold">{t("previousBid.noPreviousAuctions")}</h3>
                    <p className="mt-1 max-w-[200px] text-[10px] text-muted-foreground">
                        {t("previousBid.noPreviousAuctionsDescription")}
                    </p>
                </div>
            )}

            {/* Auction List */}
            {!isLoading && !isError && winners.length > 0 && (
                <div className="space-y-2 px-4">
                    {winners.map((winnerRecord) => {
                        const auction = winnerRecord.auction;
                        const item = auction?.item;
                        const image = item?.image_url || item?.images?.[0] || null;
                        const winnerUser = winnerRecord.winner;

                        const fullName =
                            [winnerUser?.Fname, winnerUser?.Lname].filter(Boolean).join(" ") ||
                            t("previousBid.unknownUser");

                        return (
                            <div
                                key={winnerRecord.id}
                                className="flex w-full items-start gap-2.5 rounded-xl border border-border/60 bg-card p-2.5 shadow-sm"
                            >
                                {/* Product image - smaller */}
                                <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-lg bg-muted">
                                    {image ? (
                                        <img
                                            src={image}
                                            alt={item?.title || t("previousBid.auctionItem")}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Details - compact */}
                                <div className="min-w-0 flex-1 flex flex-col gap-1">
                                    {/* Title */}
                                    <h2 className="truncate text-xs font-bold">
                                        {item?.title || t("previousBid.auctionItem")}
                                    </h2>

                                    {/* Winner Info - tiny text */}
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <UserIcon className="h-2.5 w-2.5 text-primary shrink-0" />
                                        <span className="font-medium text-foreground truncate max-w-[100px]">
                                            {fullName}
                                        </span>
                                        {winnerUser?.username && (
                                            <>
                                                <span className="text-[8px]">•</span>
                                                <span className="truncate max-w-[80px]">
                                                    @{winnerUser.username}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Result Badge + Amount inline */}
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <Badge className="gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0 text-[9px] text-emerald-600 hover:bg-emerald-500/10">
                                            <Trophy className="h-2 w-2" />
                                            {t("previousBid.won")}
                                        </Badge>

                                        <p className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                            {formatAmount(winnerRecord.winning_amount, auction?.currency)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && !isError && winners.length > 0 && (
                <p className="mt-3 text-center text-[10px] text-muted-foreground">
                    {t("previousBid.showing", {
                        shown: winners.length,
                        total: pagination?.total ?? winners.length,
                    })}
                </p>
            )}
        </div>
    );
}