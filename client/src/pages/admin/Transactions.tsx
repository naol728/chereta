/* eslint-disable */
//@ts-nocheck
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPaymentOrders } from "@/api/admin";
import {
    Search,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    CheckCircle2,
    Clock,
    TrendingUp,
    Wallet,
    CalendarDays,
    User,
    Package,
    Hash,
    Copy,
    X,
    SlidersHorizontal,
    AlertCircle,
    Receipt,
    MoreHorizontal,
    Eye,
    Loader2,
    Layers3,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ──────────────────────────────────────────────

type PaymentStatus = "paid" | "awaiting_payment";

interface PaymentOrder {
    id: string;
    user_id: string;
    auction_id: string;
    payment_method_id: string;
    bid_amount: number;
    currency: string;
    pay_required: number;
    transaction_reference: string | null;
    status: PaymentStatus | string;
    idempotency_key: string;
    expires_at: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;

    user?: {
        id: string;
        telegram_id: number | string;
        username: string | null;
        Fname: string | null;
        Lname: string | null;
        phone: string | null;
    };

    auction?: {
        id: string;
        item_id: string;
        starting_bid: number;
        currency: string;
        starts_at: string;
        ends_at: string;
        status: string;
        item?: {
            id: string;
            title: string;
            image_url: string | null;
            category: string | null;
            condition: string | null;
        };
    };

    payment_method?: {
        id: string;
        name: string;
        provider: string;
        account_name: string | null;
        account_number: string | null;
        is_active: boolean;
    };
}

interface PaymentAnalytics {
    total_orders?: number;
    paid_orders?: number;
    pending_orders?: number;
    success_rate?: number;
    average_payment?: number;

    currency_breakdown?: Array<{
        currency: string;
        total_orders: number;
        paid_orders: number;
        pending_orders: number;
        total_collected: number;
        pending_amount: number;
        total_bid_amount: number;
    }>;

    payment_methods?: Array<{
        payment_method_id: string;
        name: string;
        provider: string;
        total_orders: number;
        paid_orders: number;
        pending_orders: number;
        total_collected: number;
    }>;
}

interface PaymentOrdersResponse {
    status: string;
    results: number;
    data: PaymentOrder[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    analytics: PaymentAnalytics;
}

// ─── Helpers ────────────────────────────────────────────

const formatMoney = (
    amount: number | string | null | undefined,
    currency = "ETB"
) => {
    const value = Number(amount ?? 0);
    return new Intl.NumberFormat("en-ET", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
};

const formatDate = (date?: string | null) => {
    if (!date) return "—";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";
    return new Intl.DateTimeFormat("en-ET", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(parsed);
};

const formatShortDate = (date?: string | null) => {
    if (!date) return "—";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "—";
    return new Intl.DateTimeFormat("en-ET", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(parsed);
};

const getUserName = (user?: PaymentOrder["user"]) => {
    if (!user) return "Unknown user";
    const name = [user.Fname, user.Lname].filter(Boolean).join(" ");
    return name || user.username || "Unknown user";
};

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase() || "U";

// ─── Sub-components ─────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const isPaid = status === "paid";
    const isPending = status === "awaiting_payment";

    return (
        <Badge
            variant={isPaid ? "default" : isPending ? "secondary" : "outline"}
            className="gap-1 px-2 py-0.5 text-[10px] font-medium capitalize"
        >
            {isPaid && <CheckCircle2 className="h-3 w-3" />}
            {isPending && <Clock className="h-3 w-3" />}
            {status.replaceAll("_", " ")}
        </Badge>
    );
}

function DetailRow({
    label,
    value,
    copyable = false,
}: {
    label: string;
    value?: string | number | React.ReactNode | null;
    copyable?: boolean;
}) {
    const isSimple =
        value === null || value === undefined || typeof value !== "object";
    const displayValue = isSimple
        ? value === null || value === undefined || value === ""
            ? "—"
            : String(value)
        : value;

    const copy = async () => {
        if (!isSimple || !value) return;
        try {
            await navigator.clipboard.writeText(String(value));
        } catch {
            /* Clipboard may be unavailable in some webviews */
        }
    };

    return (
        <div className="flex min-w-0 items-start justify-between gap-3 py-2 text-xs">
            <span className="shrink-0 text-muted-foreground">{label}</span>
            <div className="flex min-w-0 items-center gap-1.5 text-right font-medium text-foreground">
                <span className="break-all">{displayValue}</span>
                {copyable && isSimple && value && String(value) !== "—" && (
                    <button
                        type="button"
                        onClick={copy}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        title={`Copy ${label}`}
                    >
                        <Copy className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    );
}

function InfoCard({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
}) {
    return (
        <Card className="border-border/60">
            <CardContent className="p-3">
                <div className="mb-2 flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {title}
                    </h3>
                </div>
                <div className="divide-y divide-border/60">{children}</div>
            </CardContent>
        </Card>
    );
}

function StatMiniCard({
    icon: Icon,
    label,
    value,
    valueClass,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    valueClass?: string;
}) {
    return (
        <Card className="border-border/60">
            <CardContent className="p-2.5">
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span className="text-[10px]">{label}</span>
                </div>
                <p
                    className={`mt-1 truncate text-base font-bold tabular-nums ${valueClass ?? "text-foreground"
                        }`}
                >
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

// ─── Detail sheet content ───────────────────────────────

function PaymentOrderDetailContent({ order }: { order: PaymentOrder }) {
    const item = order.auction?.item;
    const user = order.user;
    const method = order.payment_method;
    const userName = getUserName(user);

    return (
        <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto">
            <div className="space-y-4 p-4">
                {/* Hero image */}
                {item?.image_url ? (
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                        <img
                            src={item.image_url}
                            alt={item.title ?? "Auction item"}
                            className="h-full w-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
                        <Package className="h-12 w-12" />
                    </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={order.status} />
                    {item?.condition && (
                        <Badge
                            variant="outline"
                            className="px-2 py-0.5 text-[10px] capitalize"
                        >
                            {item.condition}
                        </Badge>
                    )}
                    {item?.category && (
                        <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                            {item.category}
                        </Badge>
                    )}
                </div>

                {/* Amount + user hero */}
                <div className="rounded-xl border border-border/60 bg-primary/5 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Required Payment
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary">
                        {formatMoney(order.pay_required, order.currency)}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                        Bid amount: {formatMoney(order.bid_amount, order.currency)}
                    </p>

                    <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {getInitials(userName)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">
                                {userName}
                            </p>
                            <p className="truncate text-[10px] text-muted-foreground">
                                {user?.username ? `@${user.username}` : "No username"}
                                {user?.telegram_id ? ` · TG ${user.telegram_id}` : ""}
                            </p>
                        </div>
                    </div>
                </div>

                {/* PAYMENT INFO */}
                <InfoCard title="Payment information" icon={Receipt}>
                    <DetailRow label="Order ID" value={order.id} copyable />
                    <DetailRow
                        label="Transaction ref"
                        value={order.transaction_reference || "N/A"}
                        copyable
                    />
                    <DetailRow
                        label="Idempotency key"
                        value={order.idempotency_key}
                        copyable
                    />
                    <DetailRow
                        label="Bid amount"
                        value={formatMoney(order.bid_amount, order.currency)}
                    />
                    <DetailRow
                        label="Required payment"
                        value={formatMoney(order.pay_required, order.currency)}
                    />
                    <DetailRow label="Currency" value={order.currency} />
                    <div className="flex items-center justify-between py-2 text-xs">
                        <span className="text-muted-foreground">Status</span>
                        <StatusBadge status={order.status} />
                    </div>
                </InfoCard>

                {/* USER */}
                <InfoCard title="User information" icon={User}>
                    <DetailRow label="Name" value={userName} />
                    <DetailRow label="User ID" value={order.user_id} copyable />
                    <DetailRow
                        label="Telegram ID"
                        value={user?.telegram_id ?? "N/A"}
                        copyable
                    />
                    <DetailRow
                        label="Username"
                        value={user?.username ? `@${user.username}` : "N/A"}
                    />
                    <DetailRow label="Phone" value={user?.phone || "N/A"} copyable />
                </InfoCard>

                {/* PAYMENT METHOD */}
                <InfoCard title="Payment method" icon={CreditCard}>
                    <DetailRow label="Method" value={method?.name ?? "—"} />
                    <DetailRow label="Provider" value={method?.provider ?? "—"} />
                    <DetailRow
                        label="Account name"
                        value={method?.account_name ?? "—"}
                    />
                    <DetailRow
                        label="Account number"
                        value={method?.account_number ?? "—"}
                        copyable
                    />
                    <DetailRow
                        label="Method ID"
                        value={order.payment_method_id}
                        copyable
                    />
                    <DetailRow
                        label="Active"
                        value={method?.is_active ? "Yes" : "No"}
                    />
                </InfoCard>

                {/* AUCTION + ITEM */}
                <InfoCard title="Auction & item" icon={Layers3}>
                    <DetailRow label="Auction ID" value={order.auction_id} copyable />
                    <DetailRow label="Item title" value={item?.title ?? "—"} />
                    <DetailRow label="Category" value={item?.category ?? "—"} />
                    <DetailRow label="Condition" value={item?.condition ?? "—"} />
                    <DetailRow label="Auction status" value={order.auction?.status ?? "—"} />
                    <DetailRow
                        label="Starting bid"
                        value={
                            order.auction
                                ? formatMoney(
                                    order.auction.starting_bid,
                                    order.auction.currency
                                )
                                : "—"
                        }
                    />
                </InfoCard>

                {/* DATES */}
                <InfoCard title="Dates" icon={CalendarDays}>
                    <DetailRow label="Created" value={formatDate(order.created_at)} />
                    <DetailRow label="Updated" value={formatDate(order.updated_at)} />
                    <DetailRow label="Paid at" value={formatDate(order.paid_at)} />
                    <DetailRow label="Expires at" value={formatDate(order.expires_at)} />
                    <DetailRow
                        label="Auction starts"
                        value={formatDate(order.auction?.starts_at)}
                    />
                    <DetailRow
                        label="Auction ends"
                        value={formatDate(order.auction?.ends_at)}
                    />
                </InfoCard>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────

export default function Transactions() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Search & filters
    const [searchInput, setSearchInput] = useState("");
    const [telegramId, setTelegramId] = useState("");
    const [auctionId, setAuctionId] = useState("");
    const [status, setStatus] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Detail sheet
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery<PaymentOrdersResponse>({
        queryKey: [
            "getPaymentOrders",
            page,
            limit,
            telegramId,
            auctionId,
            status,
        ],
        queryFn: () =>
            getPaymentOrders({
                page,
                limit,
                telegram_id: telegramId || undefined,
                auction_id: auctionId || undefined,
                status: status || undefined,
            }),
    });

    const orders = data?.data ?? [];
    const analytics = data?.analytics;
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages ?? 1;

    const hasActiveFilters =
        Boolean(telegramId) || Boolean(auctionId) || Boolean(status);
    const activeFilterCount =
        (telegramId ? 1 : 0) + (auctionId ? 1 : 0) + (status ? 1 : 0);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTelegramId(searchInput.trim());
        setPage(1);
    };

    const clearAllFilters = () => {
        setSearchInput("");
        setTelegramId("");
        setAuctionId("");
        setStatus("");
        setPage(1);
    };

    const openDetail = (order: PaymentOrder) => {
        setSelectedOrder(order);
        setDetailOpen(true);
    };

    const currencyStats = analytics?.currency_breakdown ?? [];
    const paymentMethods = analytics?.payment_methods ?? [];

    return (
        <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto max-w-full space-y-3 px-3 py-4">
                {/* ═══ HEADER ═══ */}
                <header className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <CreditCard className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                                    Payments
                                </h1>
                                <p className="text-[11px] leading-tight text-muted-foreground">
                                    {pagination
                                        ? `${pagination.total} orders total`
                                        : "Payment transactions"}
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="h-9 w-9 rounded-full"
                            aria-label="Refresh"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                            />
                        </Button>
                    </div>

                    {/* Search by Telegram ID */}
                    <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by Telegram ID..."
                                inputMode="numeric"
                                className="h-10 rounded-full border-border/60 bg-muted/40 pl-9 pr-9 text-sm"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchInput("");
                                        setTelegramId("");
                                        setPage(1);
                                    }}
                                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                    aria-label="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setFiltersOpen((v) => !v)}
                            className={`relative h-10 w-10 shrink-0 rounded-full ${filtersOpen ? "border-primary bg-primary/5 text-primary" : ""
                                }`}
                            aria-label="Toggle filters"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            {activeFilterCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Active search chip */}
                    {telegramId && (
                        <div className="flex items-center justify-between rounded-full bg-primary/5 px-3 py-1.5">
                            <p className="truncate text-[11px] text-muted-foreground">
                                Telegram ID:{" "}
                                <span className="font-semibold text-foreground">
                                    {telegramId}
                                </span>
                            </p>
                            <button
                                onClick={() => {
                                    setSearchInput("");
                                    setTelegramId("");
                                    setPage(1);
                                }}
                                className="shrink-0 text-[11px] font-semibold text-primary"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Collapsible filters */}
                    {filtersOpen && (
                        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    Filters
                                </span>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-[11px] font-medium text-primary hover:underline"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-muted-foreground">
                                        Auction ID
                                    </label>
                                    <div className="relative">
                                        <Hash className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            value={auctionId}
                                            onChange={(e) => {
                                                setAuctionId(e.target.value);
                                                setPage(1);
                                            }}
                                            placeholder="Auction UUID"
                                            className="h-9 rounded-lg pl-8 text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-muted-foreground">
                                        Status
                                    </label>
                                    <Select
                                        value={status || "all"}
                                        onValueChange={(v) => {
                                            setStatus(v === "all" ? "" : v);
                                            setPage(1);
                                        }}
                                    >
                                        <SelectTrigger className="h-9 w-full text-xs">
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All statuses</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="awaiting_payment">
                                                Awaiting payment
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* ═══ SUMMARY STATS ═══ */}
                {!isLoading && !isError && (
                    <div className="grid grid-cols-2 gap-2">
                        <StatMiniCard
                            icon={Receipt}
                            label="Total orders"
                            value={analytics?.total_orders ?? 0}
                        />
                        <StatMiniCard
                            icon={CheckCircle2}
                            label="Paid"
                            value={analytics?.paid_orders ?? 0}
                            valueClass="text-emerald-600"
                        />
                        <StatMiniCard
                            icon={Clock}
                            label="Pending"
                            value={analytics?.pending_orders ?? 0}
                            valueClass="text-amber-600"
                        />
                        <StatMiniCard
                            icon={TrendingUp}
                            label="Success rate"
                            value={`${Number(analytics?.success_rate ?? 0).toFixed(1)}%`}
                            valueClass="text-violet-600"
                        />
                    </div>
                )}

                {/* ═══ COLLECTED (only if data exists) ═══ */}
                {!isLoading &&
                    !isError &&
                    currencyStats.length > 0 && (
                        <Card className="border-border/60">
                            <CardContent className="p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Collected
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {currencyStats.map((item) => (
                                        <div key={item.currency}>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-foreground">
                                                    {item.currency}
                                                </span>
                                                <span className="font-bold text-emerald-600">
                                                    {formatMoney(item.total_collected, item.currency)}
                                                </span>
                                            </div>
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500"
                                                    style={{
                                                        width: `${item.total_orders > 0
                                                                ? (item.paid_orders / item.total_orders) * 100
                                                                : 0
                                                            }%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                                                <span>{item.total_orders} orders</span>
                                                <span>
                                                    {item.paid_orders} paid · {item.pending_orders} pending
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                {/* ═══ LOADING ═══ */}
                {isLoading && (
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden border-border/60">
                                <CardContent className="flex items-center gap-3 p-3">
                                    <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3.5 w-2/3" />
                                        <Skeleton className="h-2.5 w-1/3" />
                                        <Skeleton className="h-4 w-24 rounded-full" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* ═══ ERROR ═══ */}
                {isError && !isLoading && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                <AlertCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-foreground">
                                    Failed to load payments
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {error instanceof Error
                                        ? error.message
                                        : "Something went wrong"}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                className="gap-2 rounded-full"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ═══ EMPTY ═══ */}
                {!isLoading && !isError && orders.length === 0 && (
                    <Card className="border-border/60">
                        <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                                <CreditCard className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">
                                    No payment orders found
                                </p>
                                <p className="max-w-[240px] text-xs text-muted-foreground">
                                    {hasActiveFilters
                                        ? "Try adjusting your filters."
                                        : "Payment transactions will appear here."}
                                </p>
                            </div>
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearAllFilters}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ═══ LIST ═══ */}
                {!isLoading && !isError && orders.length > 0 && (
                    <>
                        <div className="flex items-center justify-between pt-1">
                            <h2 className="text-sm font-semibold">Payment orders</h2>
                            <span className="text-[10px] text-muted-foreground">
                                {orders.length} shown
                            </span>
                        </div>

                        <div className="space-y-2">
                            {orders.map((order) => {
                                const item = order.auction?.item;
                                const userName = getUserName(order.user);

                                return (
                                    <Card
                                        key={order.id}
                                        className="overflow-hidden border-border/60 transition-colors active:bg-muted/40"
                                    >
                                        <CardContent className="p-0">
                                            <div className="flex items-center gap-3 p-3">
                                                {/* Thumbnail */}
                                                <button
                                                    onClick={() => openDetail(order)}
                                                    className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted"
                                                    aria-label={`View payment for ${item?.title || "item"
                                                        }`}
                                                >
                                                    {item?.image_url ? (
                                                        <img
                                                            src={item.image_url}
                                                            alt={item.title ?? "Auction item"}
                                                            className="h-full w-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                            <Package className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </button>

                                                {/* Info */}
                                                <button
                                                    onClick={() => openDetail(order)}
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="truncate text-sm font-semibold leading-tight text-foreground">
                                                            {item?.title ?? "Unknown item"}
                                                        </p>
                                                        <StatusBadge status={order.status} />
                                                    </div>

                                                    <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                                                        {userName}
                                                        {order.user?.telegram_id
                                                            ? ` · TG ${order.user.telegram_id}`
                                                            : ""}
                                                    </p>

                                                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                        <span className="text-xs font-bold text-primary">
                                                            {formatMoney(
                                                                order.pay_required,
                                                                order.currency
                                                            )}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            ·
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {formatShortDate(order.created_at)}
                                                        </span>
                                                    </div>
                                                </button>

                                                {/* Actions */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        render={
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-9 w-9 shrink-0 rounded-full"
                                                                aria-label={`Actions for order`}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuLabel className="truncate text-[10px] font-normal text-muted-foreground">
                                                                {item?.title || "Order"}
                                                            </DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => openDetail(order)}
                                                                className="text-sm"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* ═══ PAGINATION — sticky bottom bar ═══ */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="sticky bottom-0 z-10 -mx-3 mt-2 border-t bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                                <div className="flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-1 rounded-full px-3 text-xs"
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                        disabled={page <= 1 || isFetching}
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                        Prev
                                    </Button>

                                    <div className="text-center">
                                        <p className="text-[11px] font-semibold text-foreground">
                                            {pagination.page} / {totalPages}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {(pagination.page - 1) * pagination.limit + 1}–
                                            {Math.min(
                                                pagination.page * pagination.limit,
                                                pagination.total
                                            )}{" "}
                                            of {pagination.total}
                                        </p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-1 rounded-full px-3 text-xs"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= totalPages || isFetching}
                                    >
                                        Next
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ═══ DETAIL SHEET ═══ */}
            <Dialog
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open);
                    if (!open) setSelectedOrder(null);
                }}
            >
                <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
                    <div className="flex justify-center pt-2 sm:hidden">
                        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                    </div>

                    <DialogHeader className="border-b px-4 py-3">
                        <DialogTitle className="pr-8 text-base">
                            {selectedOrder?.auction?.item?.title ?? "Payment Details"}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Full information about this payment order.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder ? (
                        <PaymentOrderDetailContent order={selectedOrder} />
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}