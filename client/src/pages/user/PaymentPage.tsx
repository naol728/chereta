/*eslint-disable*/
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
    getPendingPaymentOrder,
    submitPaymentTransaction,
    deletePaymentOrder
} from "@/api/auction";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
    ArrowLeft,
    Clock,
    Users,
    Copy,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    AlertCircle,
    Trash2,
    Timer,
    Hourglass
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
    return new Intl.NumberFormat("en-ET", {
        maximumFractionDigits: 2,
    }).format(amount) + ` ${currency}`;
};

// Status badge color helper
const getStatusColor = (status: string) => {
    switch (status) {
        case "awaiting_payment":
            return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
        case "verifying":
        case "submitted":
            return "bg-blue-500/10 text-blue-600 border-blue-500/20";
        case "paid":
            return "bg-green-500/10 text-green-600 border-green-500/20";
        default:
            return "bg-muted text-muted-foreground border-border";
    }
};

const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").toUpperCase();
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function PaymentPage() {
    const { t } = useTranslation();
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();

    const [transactionId, setTransactionId] = useState("");
    const [timeLeft, setTimeLeft] = useState<number>(0);

    // Fetch Payment Order
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["pending-payment-order", orderId],
        queryFn: () => getPendingPaymentOrder({ id: orderId }),
        enabled: Boolean(orderId),
        // Refresh every 30s in case status changes on the backend
        refetchInterval: 30000,
    });

    const order = data?.data;
    const auction = order?.auction;
    const item = auction?.item;
    const paymentMethod = order?.payment_method;
    const amountToPay = auction?.participation_fee || order?.bid_amount;
    const currency = order?.currency || "ETB";
    const isExpired = timeLeft <= 0 && order?.status === "awaiting_payment";

    // ============================================================
    // COUNTDOWN TIMER
    // ============================================================

    useEffect(() => {
        if (!order?.expires_at) return;

        const calculateTimeLeft = () => {
            const difference = new Date(order.expires_at).getTime() - new Date().getTime();
            return Math.max(0, Math.floor(difference / 1000));
        };

        // Set initial time
        setTimeLeft(calculateTimeLeft());

        // Tick every second
        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [order?.expires_at]);

    // Format countdown (MM:SS)
    const formatCountdown = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // ============================================================
    // MUTATIONS
    // ============================================================

    const submitMutation = useMutation({
        mutationFn: () =>
            submitPaymentTransaction({
                id: orderId,
                transaction_reference: transactionId,
            }),

        onSuccess: (data) => {
            toast.success(data.message, {
                autoClose: 3000,
            });

            setTimeout(() => {
                navigate("/my-bids");
            }, 3000);
        },

        onError: (error: any) => {
            toast.error(error?.message || t("payment.failedToSubmit"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deletePaymentOrder({ id: orderId }),
        onSuccess: () => {
            toast.success(t("payment.orderDeletedSuccess"));
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
            refetch();
            navigate(-1);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || t("payment.failedToDelete"));
            window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
        },
    });

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(t("payment.copiedToClipboard"));
    };

    const handleSubmit = () => {
        if (isExpired) {
            toast.error(t("payment.expiredError"));
            return;
        }
        if (transactionId.trim().length < 5) {
            toast.error(t("payment.invalidTransactionId"));
            return;
        }
        submitMutation.mutate();
    };

    const handleDelete = () => {
        if (window.confirm(t("payment.confirmDelete"))) {
            deleteMutation.mutate();
        }
    };

    // ============================================================
    // LOADING & ERROR STATES
    // ============================================================

    if (isLoading) {
        return (
            <div className="w-full bg-background p-4 flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !order || !item || !auction) {
        return (
            <div className="w-full bg-background px-4 py-12 flex flex-col items-center text-center">
                <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                <h2 className="text-lg font-bold">{t("payment.invalidPaymentOrder")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    {t("payment.invalidPaymentOrderDescription")}
                </p>
                <Button variant="outline" className="mt-6" onClick={() => navigate(-1)}>
                    {t("payment.goBack")}
                </Button>
            </div>
        );
    }

    return (
        <div className="relative w-full bg-background pb-24 overscroll-y-contain">
            <div className="mx-auto max-w-lg">

                {/* Header */}
                <header className="sticky top-0 z-20 flex flex-col border-b border-border/50 bg-background/95 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full"
                                onClick={() => navigate(-1)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-sm font-bold">{t("payment.completePayment")}</h1>
                                <p className="text-[10px] text-muted-foreground">
                                    {t("payment.stepOf", { step: 2, total: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0.5 ${getStatusColor(order.status)}`}>
                                {formatStatusLabel(order.status)}
                            </Badge>

                            {/* Delete Order Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                aria-label="Delete order"
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Countdown Banner */}
                    {!isExpired ? (
                        <div className="bg-primary/10 px-4 py-1.5 flex items-center justify-center gap-2 text-primary text-[11px] font-semibold border-t border-primary/10">
                            <Timer className="h-3.5 w-3.5" />
                            <span>{t("payment.timeRemainingToPay")}</span>
                            <span className="font-bold tabular-nums tracking-wider text-xs">
                                {formatCountdown(timeLeft)}
                            </span>
                        </div>
                    ) : (
                        <div className="bg-destructive/10 px-4 py-1.5 flex items-center justify-center gap-2 text-destructive text-[11px] font-semibold border-t border-destructive/10">
                            <Hourglass className="h-3.5 w-3.5" />
                            <span>{t("payment.orderExpired")}</span>
                        </div>
                    )}
                </header>

                <main className="space-y-4 p-4">

                    {/* Expired Alert */}
                    {isExpired && (
                        <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/5">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-sm font-bold">{t("payment.paymentExpired")}</AlertTitle>
                            <AlertDescription className="text-xs">
                                {t("payment.paymentExpiredMessage")}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Order Summary Card */}
                    <Card className="overflow-hidden border-border shadow-sm">
                        <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-muted/20">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                                <img
                                    src={item.image_url || item.images?.[0]}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <h2 className="text-sm font-bold truncate">{item.title}</h2>
                                <p className="text-[11px] text-muted-foreground capitalize">{item.category} • {item.condition}</p>
                                <p className="text-sm font-extrabold text-primary mt-1">
                                    {t("payment.yourBid")} {formatAmount(order.bid_amount, currency)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 text-[11px] text-muted-foreground bg-card">
                            <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" />
                                <span>{t("payment.totalBidsCount", { count: auction.total_bids })}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{t("payment.endsLabel", { date: formatDate(auction.ends_at) })}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Payment Method Details */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold px-1">{t("payment.paymentInstructions")}</h3>

                        <Card className="border-primary/20 bg-primary/5 shadow-none">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="capitalize text-primary border-primary/20 bg-primary/10">
                                        {paymentMethod?.provider}
                                    </Badge>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                        {t("payment.transferExactly")}
                                    </span>
                                </div>

                                <div className="rounded-xl bg-background border border-border p-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground mb-0.5">{t("payment.amountToPay")}</p>
                                        <p className="text-lg font-extrabold text-foreground">
                                            {formatAmount(amountToPay, currency)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-1">
                                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground mb-0.5">{t("payment.accountName")}</p>
                                            <p className="text-xs font-semibold">{paymentMethod?.account_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground mb-0.5">{t("payment.accountNumber")}</p>
                                            <p className="text-sm font-bold tracking-wider">{paymentMethod?.account_number}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-primary hover:bg-primary/10"
                                            onClick={() => handleCopy(paymentMethod?.account_number)}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {paymentMethod?.instructions && (
                                    <p className="text-[10px] text-muted-foreground leading-relaxed bg-muted p-2 rounded-lg">
                                        <span className="font-bold text-foreground">{t("payment.note")}</span> {paymentMethod.instructions}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Separator />

                    {/* Transaction ID Input */}
                    <div className="space-y-3">
                        <div>
                            <h3 className="text-sm font-bold">{t("payment.enterTransactionId")}</h3>
                            <p className="text-[11px] text-muted-foreground">
                                {t("payment.transactionIdDescription", { provider: paymentMethod?.provider })}
                            </p>
                        </div>

                        <Input
                            placeholder={t("payment.transactionIdPlaceholder")}
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="h-12 text-sm font-medium"
                            disabled={isExpired}
                        />
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        {t("payment.paymentVerifiedAutomatically")}
                    </div>

                </main>

                {/* Sticky Bottom Action Button */}
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-background/95 p-3 backdrop-blur-md">
                    <div className="mx-auto max-w-lg">
                        <Button
                            className="h-11 w-full rounded-xl text-sm font-bold shadow-md active:scale-[0.98]"
                            disabled={!transactionId || isExpired || submitMutation.isPending || deleteMutation.isPending}
                            onClick={handleSubmit}
                        >
                            {submitMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t("payment.verifying")}
                                </>
                            ) : isExpired ? (
                                t("payment.paymentExpired")
                            ) : (
                                <>
                                    {t("payment.submitTransaction")}
                                    <CheckCircle2 className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}