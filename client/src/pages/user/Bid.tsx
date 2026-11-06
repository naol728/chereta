/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";

import {
    getAuctionItem,
    createPaymentOrder,
    getPendingPaymentOrder,
} from "@/api/auction";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { toast } from "sonner";

import {
    ArrowLeft,
    ArrowRight,
    AlertCircle,
    ShieldCheck,
    Gavel,
    ImageOff,
    Info,
    Clock,
    TrendingUp,
    Users,
    Loader2,
} from "lucide-react";

// ============================================================
// HELPERS
// ============================================================

const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-ET", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
};

const formatAmount = (amount: number, currency = "ETB") => {
    return (
        new Intl.NumberFormat("en-ET", {
            maximumFractionDigits: 2,
        }).format(amount) + ` ${currency}`
    );
};


function getTimeRemaining(endTime: string) {
    const endTimestamp = new Date(endTime).getTime();

    if (!Number.isFinite(endTimestamp)) {
        return null;
    }

    const totalSeconds = Math.max(
        0,
        Math.ceil((endTimestamp - Date.now()) / 1000)
    );

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
        total: totalSeconds * 1000,
        days,
        hours,
        minutes,
        seconds,
    };
}


function CountdownTimer({ endsAt }: { endsAt: string }) {
    const [timeLeft, setTimeLeft] = useState(() =>
        getTimeRemaining(endsAt)
    );

    useEffect(() => {
        const updateCountdown = () => {
            setTimeLeft(getTimeRemaining(endsAt));
        };

        // Update immediately
        updateCountdown();

        // Update every second
        const timer = window.setInterval(updateCountdown, 1000);

        return () => window.clearInterval(timer);
    }, [endsAt]);

    if (!timeLeft) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-2 text-xs font-bold text-destructive">
                <Clock className="h-4 w-4" />
                Invalid auction end date
            </div>
        );
    }

    if (timeLeft.total <= 0) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 py-2.5 text-xs font-bold text-destructive">
                <Clock className="h-4 w-4" />
                Auction Ended
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 py-2.5">
            <Clock className="h-4 w-4 text-primary" />

            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ends in:
            </span>

            <span className="text-sm font-extrabold tabular-nums text-primary">
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {String(timeLeft.hours).padStart(2, "0")}:
                {String(timeLeft.minutes).padStart(2, "0")}:
                {String(timeLeft.seconds).padStart(2, "0")}
            </span>
        </div>
    );
}




// ============================================================
// COMPONENT
// ============================================================

export default function Bid() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [bidAmount, setBidAmount] = useState("");
    const [selectedImage, setSelectedImage] = useState(0);

    // ============================================================
    // FETCH AUCTION
    // ============================================================

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["auctionItem", id],
        queryFn: () => getAuctionItem({ id }),
        enabled: Boolean(id),
        staleTime: 30_000,
        retry: 1,
    });

    // Access auction data
    const auction = data?.data?.auction;
    const item = auction?.item;

    // ============================================================
    // FETCH EXISTING PAYMENT ORDER
    // ============================================================

    const {
        data: pendingOrderResponse,
        isLoading: checkingPayment,
    } = useQuery({
        queryKey: ["pending-payment-order", id],
        queryFn: () => getPendingPaymentOrder({ id }),
        enabled: Boolean(id) && Boolean(auction),
        staleTime: 0,
        retry: 1,
    });

    const pendingOrder = pendingOrderResponse?.data ?? null;

    const hasPendingOrder =
        pendingOrder &&
        ["awaiting_payment", "submitted", "verifying"].includes(
            pendingOrder.status
        ) &&
        new Date(pendingOrder.expires_at).getTime() > Date.now();

    // ============================================================
    // AUTO-REDIRECT TO PAYMENT PAGE IF PENDING ORDER EXISTS
    // ============================================================

    useEffect(() => {
        if (!checkingPayment && hasPendingOrder && pendingOrder?.id) {
            // Use replace: true so they can't go back and get stuck in a loop
            navigate(`/payment/${pendingOrder.auction_id}`, { replace: true });
        }
    }, [checkingPayment, hasPendingOrder, pendingOrder, navigate]);

    // ============================================================
    // BID VALIDATION
    // ============================================================

    const amount = Number(bidAmount);

    const isValidAmount =
        bidAmount.trim() !== "" &&
        Number.isFinite(amount) &&
        amount >= 1;

    // ============================================================
    // IMAGES
    // ============================================================

    const images = item?.images?.length
        ? item.images
        : item?.image_url
            ? [item.image_url]
            : [];

    const currentImage = images[selectedImage] ?? images[0];

    // ============================================================
    // CREATE PAYMENT ORDER
    // ============================================================

    const paymentMutation = useMutation({
        mutationFn: () =>
            createPaymentOrder({ id: auction.id }, amount),

        onSuccess: (response) => {
            const auction_id = response?.data?.auction_id;

            if (!auction_id) {
                toast.error("Payment order ID was not returned.");
                return;
            }

            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
                "success"
            );

            // Navigate to payment page
            navigate(`/payment/${auction_id}`, { replace: true });
        },

        onError: (error: any) => {
            toast.error(
                error?.response?.data?.message ||
                "Failed to create payment order. Please try again."
            );

            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
                "error"
            );
        },
    });

    // ============================================================
    // HANDLE CONTINUE
    // ============================================================

    const handleContinue = () => {
        if (!auction || !isValidAmount || paymentMutation.isPending) {
            return;
        }

        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");

        paymentMutation.mutate();
    };

    // ============================================================
    // LOADING
    // ============================================================

    if (isLoading) {
        return (
            <div className="w-full bg-background p-4">
                <div className="mx-auto max-w-lg space-y-4">
                    <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
                    <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
                    <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-20 animate-pulse rounded-xl bg-muted" />
                    <div className="h-12 animate-pulse rounded-xl bg-muted" />
                </div>
            </div>
        );
    }

    // ============================================================
    // ERROR
    // ============================================================

    if (!id || isError || !auction || !item) {
        return (
            <div className="w-full bg-background px-4 py-12">
                <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>

                    <h2 className="text-xl font-bold">
                        {id ? "Auction not found" : "Invalid auction"}
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                        {id
                            ? "We couldn't load this auction. It may have been removed or is no longer available."
                            : "The auction ID is missing from the URL."}
                    </p>

                    {isError && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {error instanceof Error
                                ? error.message
                                : "Something went wrong."}
                        </p>
                    )}

                    <div className="mt-6 flex w-full gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go back
                        </Button>

                        {id && (
                            <Button
                                className="flex-1"
                                onClick={() => refetch()}
                            >
                                Try again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // MAIN UI
    // ============================================================

    return (
        <div className="relative w-full bg-background pb-24 overscroll-y-contain">
            <div className="mx-auto max-w-lg">

                {/* Sticky Header */}

                <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-md">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-full"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-sm font-bold">Place your bid</h1>
                        <p className="text-[10px] text-muted-foreground">
                            Lowest unique bid wins
                        </p>
                    </div>

                    <Badge variant="secondary" className="text-[10px] font-bold">
                        {auction.currency}
                    </Badge>
                </header>

                <main className="space-y-4 p-4">

                    {/* Product Image Gallery */}

                    <div className="space-y-3">
                        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <ImageOff className="h-10 w-10" />
                                    <span className="text-sm">No image available</span>
                                </div>
                            )}

                            <Badge className="absolute left-3 top-3 rounded-full bg-background/90 text-foreground shadow-sm">
                                {item.category || "General"}
                            </Badge>

                            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold text-destructive-foreground shadow-lg">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                                LIVE
                            </div>
                        </div>

                        {/* Image Thumbnails */}

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {images.map((image, index) => (
                                    <button
                                        key={`${image}-${index}`}
                                        onClick={() => setSelectedImage(index)}
                                        className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${selectedImage === index
                                            ? "border-primary"
                                            : "border-transparent opacity-70 hover:opacity-100"
                                            }`}
                                    >
                                        <img
                                            src={image}
                                            alt={`${item.title} ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Auction Stats */}

                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 text-center shadow-sm">
                            <TrendingUp className="mb-1 h-4 w-4 text-primary" />
                            <span className="text-[10px] text-muted-foreground">
                                Start Bid
                            </span>
                            <span className="text-xs font-bold">
                                {formatAmount(auction.starting_bid, auction.currency)}
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 text-center shadow-sm">
                            <Users className="mb-1 h-4 w-4 text-blue-500" />
                            <span className="text-[10px] text-muted-foreground">
                                Total Bids
                            </span>
                            <span className="text-xs font-bold">
                                {auction.total_bids}
                            </span>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-2 text-center shadow-sm">
                            <Clock className="mb-1 h-4 w-4 text-destructive" />
                            <span className="text-[10px] text-muted-foreground">
                                Ends At
                            </span>
                            <span className="text-[11px] font-bold">
                                {formatDate(auction.ends_at).split(",")[0]}
                            </span>
                        </div>
                    </div>

                    {/* LIVE COUNTDOWN TIMER (Placed right below the stats grid) */}
                    <CountdownTimer endsAt={auction.ends_at} />

                    {/* Product Details */}

                    <section className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold leading-tight">
                                {item.title}
                            </h2>

                            <Badge variant="outline" className="shrink-0 capitalize text-[10px]">
                                {item.condition}
                            </Badge>
                        </div>

                        <p className="text-xs leading-relaxed text-muted-foreground">
                            {item.description || "No description available for this item."}
                        </p>
                    </section>

                    <Separator />

                    {/* How it works */}

                    <Card className="border-primary/20 bg-primary/5 shadow-none">
                        <CardContent className="flex items-start gap-3 p-3">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <Gavel className="h-4 w-4 text-primary" />
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold">
                                    How bidding works
                                </h3>

                                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                    Choose your bid amount. If your amount is the
                                    lowest amount submitted by exactly one user,
                                    you win the auction.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* If we are redirecting, show a loading state instead of the input */}
                    {checkingPayment || hasPendingOrder ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground text-center">
                                You have an unfinished bid for this auction.<br />
                                Redirecting to payment...
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Bid Input */}

                            <section className="space-y-3">
                                <div>
                                    <h3 className="text-sm font-bold">
                                        Enter your bid amount
                                    </h3>
                                </div>

                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        inputMode="decimal"
                                        placeholder="Enter amount"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        className="h-12 pr-14 text-lg font-bold"
                                    />

                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                                        {auction.currency}
                                    </span>
                                </div>

                                {bidAmount && !isValidAmount && (
                                    <p className="flex items-center gap-1 text-xs text-destructive">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        Enter a valid bid amount of at least 1.
                                    </p>
                                )}

                                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
                                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        You can only submit the same bid amount once per auction.
                                    </p>
                                </div>
                            </section>

                            {/* Summary */}

                            {isValidAmount && (
                                <Card className="shadow-sm">
                                    <CardContent className="space-y-2 p-3">
                                        <h3 className="text-sm font-semibold">Bid summary</h3>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Item</span>
                                            <span className="max-w-[60%] truncate font-medium">
                                                {item.title}
                                            </span>
                                        </div>

                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Your bid</span>
                                            <span className="font-bold">
                                                {formatAmount(amount, auction.currency)}
                                            </span>
                                        </div>

                                        <Separator className="my-1" />

                                        <div className="flex justify-between">
                                            <span className="text-xs font-semibold">
                                                Payment amount
                                            </span>

                                            <span className="text-sm font-bold text-primary">
                                                {formatAmount(auction.participation_fee, auction.currency)}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Security */}

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pb-4">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        Secure payment verification
                    </div>

                </main>

                {/* Sticky Bottom Action Button */}
                {/* Hide the button if redirecting to avoid clicking during transition */}
                {!checkingPayment && !hasPendingOrder && (
                    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-background/95 p-3 backdrop-blur-md">
                        <div className="mx-auto max-w-lg">
                            <Button
                                className="h-11 w-full rounded-xl text-sm font-bold shadow-md active:scale-[0.98]"
                                disabled={
                                    !isValidAmount ||
                                    paymentMutation.isPending
                                }
                                onClick={handleContinue}
                            >
                                {paymentMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating payment order...
                                    </>
                                ) : (
                                    <>
                                        Continue to payment
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}