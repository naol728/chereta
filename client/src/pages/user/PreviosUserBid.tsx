/* eslint-disable */
// @ts-nocheck
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getPreviousAuctions } from "@/api/auction";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import {
    Clock,
    Gavel,
    Trophy,
    Package,
    RefreshCw,
    ImageOff,
    CalendarDays,
    CheckCircle2,
    Truck,
} from "lucide-react";

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

const formatAmount = (amount: number | string, currency = "ETB") => {
    return `${Number(amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} ${currency}`;
};

// ============================================================
// DELIVERY STATUS BADGE
// ============================================================

function DeliveryStatus({ status }: { status: string }) {
    const { t } = useTranslation();

    const config: Record<string, { labelKey: string; className: string; icon: any }> = {
        pending: {
            labelKey: "previousUserBid.deliveryStatus.pending",
            className: "bg-amber-500/10 text-amber-600",
            icon: Clock,
        },
        processing: {
            labelKey: "previousUserBid.deliveryStatus.processing",
            className: "bg-blue-500/10 text-blue-600",
            icon: Package,
        },
        shipped: {
            labelKey: "previousUserBid.deliveryStatus.shipped",
            className: "bg-indigo-500/10 text-indigo-600",
            icon: Truck,
        },
        delivered: {
            labelKey: "previousUserBid.deliveryStatus.delivered",
            className: "bg-emerald-500/10 text-emerald-600",
            icon: CheckCircle2,
        },
        cancelled: {
            labelKey: "previousUserBid.deliveryStatus.cancelled",
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
            {t(item.labelKey)}
        </Badge>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PreviousUserBid() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ["getPreviousAuctions", page],
        queryFn: () => getPreviousAuctions({ limit: 5, page }),
        staleTime: 30_000,
    });

    const auctions = data?.data?.auctions ?? [];

    return (
        <div className="space-y-3">
            {/* Header with Refresh */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{t("previousUserBid.title")}</h3>
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[9px]">
                        {t("previousUserBid.won")}
                    </Badge>
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

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-2">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="flex animate-pulse gap-3 rounded-2xl border border-border/50 bg-card p-3"
                        >
                            <div className="h-16 w-16 shrink-0 rounded-xl bg-muted" />
                            <div className="flex flex-1 flex-col justify-center gap-2">
                                <div className="h-3 w-3/4 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {isError && !isLoading && (
                <Card className="rounded-2xl border-border bg-card p-4 text-center">
                    <p className="text-xs text-muted-foreground">{t("previousUserBid.unableToLoad")}</p>
                    <Button onClick={() => refetch()} size="sm" className="mt-2 h-7 text-xs">
                        {t("previousUserBid.tryAgain")}
                    </Button>
                </Card>
            )}

            {/* Empty State */}
            {!isLoading && !isError && auctions.length === 0 && (
                <Card className="rounded-2xl border-dashed border-border bg-card py-8 text-center">
                    <Gavel className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{t("previousUserBid.noPreviousAuctions")}</p>
                </Card>
            )}

            {/* Auction List */}
            {!isLoading && !isError && auctions.length > 0 && (
                <div className="space-y-2.5">
                    {auctions.map((winner: any) => {
                        const auction = winner.auction;
                        const item = auction?.item;
                        const image = item?.image_url || item?.images?.[0] || null;

                        return (
                            <Card
                                key={winner.id}
                                className="overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm"
                            >
                                <div className="flex gap-3 p-3">
                                    {/* Image */}
                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={item?.title || t("previousUserBid.auctionItem")}
                                                loading="lazy"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <ImageOff className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="absolute left-1 top-1">
                                            <Badge className="bg-emerald-500 px-1.5 py-0 text-[8px] text-white hover:bg-emerald-500">
                                                {t("previousUserBid.won")}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                                        <h2 className="truncate text-xs font-bold">
                                            {item?.title || t("previousUserBid.auctionItem")}
                                        </h2>

                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Trophy className="h-3 w-3 text-emerald-600" />
                                            <span className="font-bold text-emerald-600">
                                                {formatAmount(winner.winning_amount, auction?.currency)}
                                            </span>
                                        </div>

                                        <div className="mt-0.5 flex items-center justify-between">
                                            <DeliveryStatus status={winner.delivery_status} />
                                            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                                <CalendarDays className="h-2.5 w-2.5" />
                                                {formatDate(winner.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}