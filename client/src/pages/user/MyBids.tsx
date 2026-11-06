/*eslint-disable*/
// @ts-nocheck
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyAuction } from "@/api/auction";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowUpRight,
    X,
    Copy,
    Trophy,
    Package,
    RefreshCw,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================
// HELPERS
// ============================================================

const formatAmount = (amount: number, currency = "ETB") => {
    return new Intl.NumberFormat("en-ET", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + ` ${currency}`;
};

// ============================================================
// SKELETON COMPONENTS
// ============================================================

function SummarySkeleton() {
    return (
        <div className="mb-4 flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-2 w-8" />
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-2 w-8" />
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-2 w-8" />
            </div>
        </div>
    );
}

function BidCardSkeleton() {
    return (
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="p-3.5">
                <div className="flex items-start justify-between gap-2.5">
                    <div className="flex gap-2.5">
                        <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-4 rounded-full" />
                </div>

                <div className="my-3 h-px w-full bg-border" />

                <div className="flex items-end justify-between gap-2">
                    <div className="space-y-1.5">
                        <Skeleton className="h-2 w-16" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-2.5 w-20" />
                </div>

                <div className="mt-3 space-y-1.5">
                    <Skeleton className="h-2 w-20" />
                    <Skeleton className="h-5 w-28" />
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MyBids() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState("all");

    const { data, error, isLoading, refetch } = useQuery({
        queryKey: ["getMyAuction"],
        queryFn: getMyAuction
    });

    const bids = Array.isArray(data?.data) ? data.data : [];

    // Calculate summary stats safely
    const totalBids = bids.length;
    const uniqueBids = bids.filter((b) => b?.is_unique === true).length;
    const lostBids = bids.filter((b) => b?.is_unique === false).length;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(t("myBids.copied"));
    };

    // Filter bids based on selected pill
    const filteredBids = bids.filter((bid) => {
        if (activeFilter === "unique") return bid?.is_unique === true;
        if (activeFilter === "lost") return bid?.is_unique === false;
        return true;
    });

    // ============================================================
    // ERROR STATE
    // ============================================================

    if (error) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center bg-background p-6 text-center">
                <Package className="mb-2 h-8 w-8 text-muted-foreground" />
                <h3 className="text-sm font-bold text-foreground">{t("myBids.failedToLoad")}</h3>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" /> {t("myBids.tryAgain")}
                </Button>
            </div>
        );
    }

    // ============================================================
    // LOADING SKELETON STATE
    // ============================================================

    if (isLoading) {
        return (
            <div className="min-h-[100dvh] w-full bg-background p-3 pb-24 font-sans text-foreground">
                <div className="mb-3 space-y-2">
                    <Skeleton className="h-2.5 w-24" />
                    <Skeleton className="h-5 w-48" />
                </div>

                <SummarySkeleton />

                <div className="mb-4 flex gap-1.5 overflow-hidden">
                    <Skeleton className="h-7 w-16 rounded-full shrink-0" />
                    <Skeleton className="h-7 w-14 rounded-full shrink-0" />
                    <Skeleton className="h-7 w-24 rounded-full shrink-0" />
                    <Skeleton className="h-7 w-20 rounded-full shrink-0" />
                </div>

                <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <BidCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN UI
    // ============================================================

    return (
        <div className="min-h-[100dvh] w-full bg-background p-3 pb-24 font-sans text-foreground">

            {/* Header */}
            <div className="mb-3">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {t("myBids.registerTitle")}
                </p>
                <h1 className="mt-0.5 text-xl font-extrabold leading-tight tracking-tight text-foreground">
                    {t("myBids.registerSubtitle")}
                </h1>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-card-foreground">{totalBids}</span>
                    <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">{t("myBids.active")}</span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-card-foreground">{uniqueBids}</span>
                    <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">{t("myBids.unique")}</span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-destructive">{lostBids}</span>
                    <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">{t("myBids.lost")}</span>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[
                    { id: "all", labelKey: "myBids.filters.all" },
                    { id: "unique", labelKey: "myBids.filters.unique" },
                    { id: "pending", labelKey: "myBids.filters.pending" },
                    { id: "lost", labelKey: "myBids.filters.lost" },
                ].map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors ${activeFilter === filter.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "border border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                    >
                        {t(filter.labelKey)}
                    </button>
                ))}
            </div>

            {/* Bids List */}
            <div className="flex flex-col gap-3">
                {filteredBids.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-10">
                        <Package className="mb-2 h-6 w-6 text-muted-foreground/50" />
                        <p className="text-xs font-medium text-muted-foreground">{t("myBids.noBidsFound")}</p>
                    </div>
                ) : (
                    filteredBids.map((bid) => {
                        const item = bid?.auction?.item;
                        if (!item) return null;

                        const canNavigate = bid.is_unique === false;

                        return (
                            <Card
                                key={bid.id}
                                onClick={() => {
                                    if (canNavigate) navigate(`/bids/${bid.auction_id}`);
                                }}
                                className={`overflow-hidden rounded-2xl border-border bg-card shadow-sm transition-all ${canNavigate ? "cursor-pointer active:scale-[0.98] hover:shadow-md" : "cursor-default"
                                    }`}
                            >
                                <CardContent className="p-3.5">

                                    {/* Top: Image, Title, Status */}
                                    <div className="flex items-start justify-between gap-2.5">
                                        <div className="flex gap-2.5">
                                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                                <img
                                                    src={item.image_url || item.images?.[0]}
                                                    alt={item.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="line-clamp-2 text-xs font-bold leading-tight text-card-foreground">
                                                    {item.title}
                                                </h3>

                                                {/* Status Badge */}
                                                <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${bid.is_unique
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-destructive/10 text-destructive"
                                                    }`}>
                                                    {bid.is_unique ? (
                                                        <Trophy className="h-2.5 w-2.5" />
                                                    ) : (
                                                        <X className="h-2.5 w-2.5" />
                                                    )}
                                                    {bid.is_unique ? t("myBids.statusWon") : t("myBids.statusLost")}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Icon: Arrow if clickable, Check if not clickable */}
                                        <div className="shrink-0 text-muted-foreground pt-1">
                                            {canNavigate ? (
                                                <ArrowUpRight className="h-4 w-4" />
                                            ) : (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="my-3 h-px w-full bg-border" />

                                    {/* Middle: Your Bid & Code */}
                                    <div className="flex items-end justify-between gap-2">
                                        <div>
                                            <p className="text-[9px] font-bold text-muted-foreground">{t("myBids.yourBid")}</p>
                                            <p className="mt-0.5 text-sm font-extrabold text-card-foreground">
                                                {formatAmount(bid.bid_amount, bid.auction?.currency)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground">
                                                <span>bid-{bid.id.split('-')[0].toUpperCase()}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCopy(bid.id);
                                                    }}
                                                    className="p-0.5 hover:text-foreground"
                                                >
                                                    <Copy className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>



                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}