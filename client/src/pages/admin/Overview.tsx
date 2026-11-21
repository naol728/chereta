/* eslint-disable */
//@ts-nocheck
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "@/api/admin";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  Gavel,
  Wallet,
  Trophy,
  Receipt,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Radio,
  CalendarClock,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  User as UserIcon,
  Hash,
  Copy,
  Loader2,
  Layers3,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Types ──────────────────────────────────────────────

interface OverviewStats {
  users: { total: number };
  items: { total: number };
  auctions: {
    total: number;
    live: number;
    scheduled: number;
    ended: number;
    cancelled: number;
  };
  bids: { total: number };
  payments: { total: number; pending: number; paid: number };
  winners: { total: number };
  settlements: { total: number };
  revenue: { total: number; currency: string };
}

interface RecentUser {
  id: string;
  telegram_id: number | string | null;
  username: string | null;
  Fname: string | null;
  Lname: string | null;
  phone: string | null;
  referral_id: string | null;
  created_at: string;
}

interface RecentAuctionItem {
  id: string;
  slug: string | null;
  title: string;
  images: string[] | null;
  category: string | null;
  condition: string | null;
  image_url: string | null;
  description: string | null;
}

interface RecentAuction {
  id: string;
  item_id: string;
  starting_bid: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  status: string;
  total_bids: number;
  total_revenue: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  participation_fee: number;
  item: RecentAuctionItem;
  creator: {
    id: string;
    Fname: string | null;
    Lname: string | null;
    username: string | null;
  } | null;
}

interface RecentBid {
  id: string;
  auction_id: string;
  user_id: string;
  bid_amount: number;
  idempotency_key: string;
  paid_at: string | null;
  created_at: string;
  payment_order_id: string | null;
  ticket_id: string | null;
  user: {
    id: string;
    Fname: string | null;
    Lname: string | null;
    phone: string | null;
    username: string | null;
    telegram_id: number | string | null;
  };
  auction: {
    id: string;
    status: string;
    ends_at: string;
    currency: string;
    starts_at: string;
    item: {
      id: string;
      title: string;
      images: string[] | null;
      image_url: string | null;
    };
  };
}

interface RecentPayment {
  id: string;
  user_id: string;
  auction_id: string;
  payment_method_id: string;
  bid_amount: number;
  currency: string;
  transaction_reference: string | null;
  status: string;
  idempotency_key: string;
  expires_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  pay_required: number;
  user: {
    id: string;
    Fname: string | null;
    Lname: string | null;
    phone: string | null;
    username: string | null;
    telegram_id: number | string | null;
  };
  auction: {
    id: string;
    status: string;
    currency: string;
    item: {
      id: string;
      title: string;
      images: string[] | null;
      image_url: string | null;
    };
  };
}

interface RecentWinner {
  id: string;
  auction_id: string;
  user_id: string;
  winning_bid_id: string;
  winning_amount: number;
  delivery_status: string;
  delivery_address: string | null;
  claimed_at: string | null;
  created_at: string;
  user: {
    id: string;
    Fname: string | null;
    Lname: string | null;
    phone: string | null;
    username: string | null;
    telegram_id: number | string | null;
  };
  winning_bid: {
    id: string;
    paid_at: string | null;
    bid_amount: number;
    created_at: string;
  };
  auction: {
    id: string;
    status: string;
    currency: string;
    item: {
      id: string;
      title: string;
      images: string[] | null;
      category: string | null;
      image_url: string | null;
    };
  };
}

interface RecentSettlement {
  id: string;
  auction_id: string;
  outcome: string;
  winning_bid_id: string | null;
  winner_user_id: string | null;
  winning_amount: number | null;
  admin_decision: string;
  decided_by: string | null;
  decided_at: string | null;
  settlement_data: {
    ended_at?: string;
    total_paid_bids?: number;
    distinct_amounts?: number;
  } | null;
  settled_at: string;
  winner: any | null;
  winning_bid: any | null;
  auction: {
    id: string;
    status: string;
    currency: string;
    total_bids: number;
    total_revenue: number;
    item: {
      id: string;
      title: string;
      images: string[] | null;
      category: string | null;
      condition: string | null;
      image_url: string | null;
    };
  };
  admin: any | null;
}

interface OverviewResponse {
  status: string;
  data: {
    statistics: OverviewStats;
    recent: {
      users: RecentUser[];
      auctions: RecentAuction[];
      bids: RecentBid[];
      payments: RecentPayment[];
      winners: RecentWinner[];
      settlements: RecentSettlement[];
    };
  };
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
  }).format(parsed);
};

const getUserName = (u?: {
  Fname?: string | null;
  Lname?: string | null;
  username?: string | null;
}) => {
  if (!u) return "Unknown user";
  const name = [u.Fname, u.Lname].filter(Boolean).join(" ").trim();
  return name || u.username || "Unknown user";
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "U";

const statusVariant = (status?: string) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "live":
    case "paid":
    case "completed":
    case "published":
      return "default" as const;
    case "scheduled":
    case "pending":
    case "awaiting_payment":
    case "no_unique_bid":
      return "secondary" as const;
    case "cancelled":
    case "failed":
      return "destructive" as const;
    case "ended":
    case "archived":
    case "approved":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
};

// ─── Sub-components ─────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  valueClass,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  valueClass?: string;
  accent?: "primary" | "emerald" | "amber" | "violet" | "blue";
}) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
    blue: "bg-blue-500/10 text-blue-600",
  }[accent ?? "primary"];

  return (
    <Card className="border-border/60">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p
              className={`mt-1 truncate text-lg font-bold tabular-nums ${valueClass ?? "text-foreground"
                }`}
            >
              {value}
            </p>
            {hint && (
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                {hint}
              </p>
            )}
          </div>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accentClass}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  count,
  onSeeAll,
}: {
  title: string;
  count?: number;
  onSeeAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between pt-1">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-muted px-1.5 py-0 text-[10px] font-semibold text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
        >
          See all
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <Card className="border-dashed border-border/60">
      <CardContent className="flex items-center justify-center py-6">
        <p className="text-xs text-muted-foreground">No {label} yet</p>
      </CardContent>
    </Card>
  );
}

// ─── Detail sheets ──────────────────────────────────────

function UserDetailContent({ user }: { user: RecentUser }) {
  const name = getUserName(user);
  return (
    <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-primary/5 p-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {getInitials(name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {user.username ? `@${user.username}` : "No username"}
            </p>
          </div>
        </div>
        <Card className="border-border/60">
          <CardContent className="divide-y divide-border/60 p-3">
            {[
              ["User ID", user.id, true],
              ["Telegram ID", user.telegram_id, true],
              ["Phone", user.phone, true],
              ["Referral ID", user.referral_id, true],
              ["Registered", formatDate(user.created_at)],
            ].map(([label, value, copyable], i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 py-2 text-xs"
              >
                <span className="shrink-0 text-muted-foreground">
                  {label as string}
                </span>
                <div className="flex items-center gap-1.5 text-right font-medium text-foreground">
                  <span className="break-all">
                    {value === null || value === undefined || value === ""
                      ? "—"
                      : String(value)}
                  </span>
                  {copyable && value && (
                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(String(value))
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AuctionDetailContent({ auction }: { auction: RecentAuction }) {
  const item = auction.item;
  return (
    <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto">
      <div className="space-y-4 p-4">
        {item?.image_url ? (
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border bg-muted">
            <img
              src={item.image_url}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
            <Package className="h-12 w-12" />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={statusVariant(auction.status)}
            className="px-2 py-0.5 text-[10px] capitalize"
          >
            {auction.status}
          </Badge>
          {item?.category && (
            <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
              {item.category}
            </Badge>
          )}
          {item?.condition && (
            <Badge variant="outline" className="px-2 py-0.5 text-[10px] capitalize">
              {item.condition}
            </Badge>
          )}
        </div>
        <Card className="border-border/60">
          <CardContent className="divide-y divide-border/60 p-3">
            {[
              ["Auction ID", auction.id, true],
              ["Item", item?.title],
              ["Starting bid", formatMoney(auction.starting_bid, auction.currency)],
              ["Participation fee", formatMoney(auction.participation_fee, auction.currency)],
              ["Total bids", auction.total_bids],
              ["Total revenue", formatMoney(auction.total_revenue, auction.currency)],
              ["Starts at", formatDate(auction.starts_at)],
              ["Ends at", formatDate(auction.ends_at)],
              ["Creator", auction.creator ? getUserName(auction.creator) : "—"],
            ].map(([label, value, copyable], i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 py-2 text-xs"
              >
                <span className="shrink-0 text-muted-foreground">
                  {label as string}
                </span>
                <div className="flex items-center gap-1.5 text-right font-medium text-foreground">
                  <span className="break-all">
                    {value === null || value === undefined || value === ""
                      ? "—"
                      : String(value)}
                  </span>
                  {copyable && value && (
                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(String(value))
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function Overview() {
  const navigate = useNavigate();

  const { data, isLoading, isFetching, isError, error, refetch } =
    useQuery<OverviewResponse>({
      queryKey: ["getAdminOverview"],
      queryFn: getAdminOverview,
      staleTime: 30_000,
    });

  const stats = data?.statistics;
  const recent = data?.recent;

  // Detail sheet
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailKind, setDetailKind] = useState<
    "user" | "auction" | null
  >(null);
  const [detailUser, setDetailUser] = useState<RecentUser | null>(null);
  const [detailAuction, setDetailAuction] = useState<RecentAuction | null>(
    null
  );

  const openUser = (u: RecentUser) => {
    setDetailUser(u);
    setDetailAuction(null);
    setDetailKind("user");
    setDetailOpen(true);
  };

  const openAuction = (a: RecentAuction) => {
    setDetailAuction(a);
    setDetailUser(null);
    setDetailKind("auction");
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setTimeout(() => {
      setDetailUser(null);
      setDetailAuction(null);
      setDetailKind(null);
    }, 200);
  };

  // ─── Loading ────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-full space-y-3 px-3 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-4 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────

  if (isError) {
    return (
      <div className="min-h-screen bg-background px-3 py-8">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Failed to load overview</p>
              <p className="text-xs text-muted-foreground">
                {(error as Error)?.message || "Something went wrong"}
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
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-full space-y-4 px-3 py-4">
        {/* ═══ HEADER ═══ */}
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers3 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                Overview
              </h1>
              <p className="text-[11px] leading-tight text-muted-foreground">
                Chereta admin dashboard
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
        </header>

        {/* ═══ REVENUE HERO ═══ */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-primary-foreground/80">
                  <Wallet className="h-3.5 w-3.5" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider">
                    Total Income
                  </p>
                </div>
                <p className="mt-1 text-3xl font-extrabold tabular-nums">
                  {formatMoney(
                    stats?.revenue?.total ?? 0,
                    stats?.revenue?.currency ?? "ETB"
                  )}
                </p>
                <p className="mt-1 text-[10px] text-primary-foreground/70">
                  Across all paid payments
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ STATS GRID ═══ */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Users}
            label="Users"
            value={stats?.users?.total ?? 0}
            accent="blue"
          />
          <StatCard
            icon={Package}
            label="Items"
            value={stats?.items?.total ?? 0}
            accent="violet"
          />
          <StatCard
            icon={Gavel}
            label="Auctions"
            value={stats?.auctions?.total ?? 0}
            hint={`${stats?.auctions?.live ?? 0} live · ${stats?.auctions?.ended ?? 0
              } ended`}
            accent="primary"
          />
          <StatCard
            icon={Trophy}
            label="Winners"
            value={stats?.winners?.total ?? 0}
            accent="emerald"
          />
          <StatCard
            icon={Receipt}
            label="Bids"
            value={stats?.bids?.total ?? 0}
            accent="primary"
          />
          <StatCard
            icon={Wallet}
            label="Payments"
            value={stats?.payments?.total ?? 0}
            hint={`${stats?.payments?.paid ?? 0} paid · ${stats?.payments?.pending ?? 0
              } pending`}
            accent="amber"
          />
        </div>

        {/* ═══ AUCTION STATUS ═══ */}
        <Card className="border-border/60">
          <CardContent className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Gavel className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Auction status
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {stats?.auctions?.total ?? 0} total
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                {
                  key: "live",
                  label: "Live",
                  icon: Radio,
                  value: stats?.auctions?.live ?? 0,
                  color: "text-emerald-600",
                  bg: "bg-emerald-500/10",
                },
                {
                  key: "scheduled",
                  label: "Scheduled",
                  icon: CalendarClock,
                  value: stats?.auctions?.scheduled ?? 0,
                  color: "text-blue-600",
                  bg: "bg-blue-500/10",
                },
                {
                  key: "ended",
                  label: "Ended",
                  icon: CheckCircle2,
                  value: stats?.auctions?.ended ?? 0,
                  color: "text-muted-foreground",
                  bg: "bg-muted",
                },
                {
                  key: "cancelled",
                  label: "Cancelled",
                  icon: AlertCircle,
                  value: stats?.auctions?.cancelled ?? 0,
                  color: "text-red-600",
                  bg: "bg-red-500/10",
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.key}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border/60 p-2 text-center"
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${s.bg} ${s.color}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {s.value}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ═══ RECENT USERS ═══ */}
        {/* <div className="space-y-2">
          <SectionHeader
            title="Recent users"
            count={recent?.users?.length}
            onSeeAll={() => navigate("/admin/users")}
          />

          {recent?.users?.length ? (
            <div className="space-y-2">
              {recent.users.slice(0, 5).map((user) => {
                const name = getUserName(user);
                return (
                  <Card
                    key={user.id}
                    className="overflow-hidden border-border/60 transition-colors active:bg-muted/40"
                  >
                    <button
                      onClick={() => openUser(user)}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {user.username
                            ? `@${user.username}`
                            : `TG ${user.telegram_id ?? "—"}`}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatShortDate(user.created_at)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyRow label="users" />
          )}
        </div> */}

        {/* ═══ RECENT AUCTIONS ═══ */}
        <div className="space-y-2">
          <SectionHeader
            title="Recent auctions"
            count={recent?.auctions?.length}
            onSeeAll={() => navigate("/admin/auctions")}
          />

          {recent?.auctions?.length ? (
            <div className="space-y-2">
              {recent.auctions.slice(0, 5).map((auction) => {
                const item = auction.item;
                return (
                  <Card
                    key={auction.id}
                    className="overflow-hidden border-border/60 transition-colors active:bg-muted/40"
                  >
                    <button
                      onClick={() => openAuction(auction)}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {item?.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item?.title ?? "Unknown item"}
                          </p>
                          <Badge
                            variant={statusVariant(auction.status)}
                            className="shrink-0 px-1.5 py-0 text-[9px] capitalize"
                          >
                            {auction.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {auction.total_bids} bids ·{" "}
                          {formatMoney(
                            auction.total_revenue,
                            auction.currency
                          )}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Ends {formatShortDate(auction.ends_at)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyRow label="auctions" />
          )}
        </div>

        {/* ═══ RECENT BIDS ═══ */}
        <div className="space-y-2">
          <SectionHeader
            title="Recent bids"
            count={recent?.bids?.length}
            onSeeAll={() => navigate("/admin/transactions")}
          />

          {recent?.bids?.length ? (
            <div className="space-y-2">
              {recent.bids.slice(0, 5).map((bid) => {
                const item = bid.auction?.item;
                const userName = getUserName(bid.user);
                return (
                  <Card key={bid.id} className="border-border/60">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {item?.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {item?.title ?? "Unknown item"}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {userName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-primary">
                          {formatMoney(
                            bid.bid_amount,
                            bid.auction?.currency || "ETB"
                          )}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {formatShortDate(bid.created_at)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyRow label="bids" />
          )}
        </div>

        {/* ═══ RECENT PAYMENTS ═══ */}
        <div className="space-y-2">
          <SectionHeader
            title="Recent payments"
            count={recent?.payments?.length}
            onSeeAll={() => navigate("/admin/payments")}
          />

          {recent?.payments?.length ? (
            <div className="space-y-2">
              {recent.payments.slice(0, 5).map((p) => {
                const item = p.auction?.item;
                const userName = getUserName(p.user);
                return (
                  <Card key={p.id} className="border-border/60">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {item?.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {item?.title ?? "Unknown item"}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {userName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-foreground">
                          {formatMoney(p.pay_required, p.currency)}
                        </p>
                        <Badge
                          variant={statusVariant(p.status)}
                          className="mt-0.5 px-1.5 py-0 text-[9px] capitalize"
                        >
                          {p.status.replaceAll("_", " ")}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyRow label="payments" />
          )}
        </div>

        {/* ═══ RECENT WINNERS ═══ */}
        <div className="space-y-2">
          <SectionHeader
            title="Recent winners"
            count={recent?.winners?.length}
          />

          {recent?.winners?.length ? (
            <div className="space-y-2">
              {recent.winners.slice(0, 5).map((w) => {
                const item = w.auction?.item;
                const userName = getUserName(w.user);
                return (
                  <Card key={w.id} className="border-border/60">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {item?.title ?? "Unknown item"}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {userName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-bold text-emerald-600">
                          {formatMoney(
                            w.winning_amount,
                            w.auction?.currency || "ETB"
                          )}
                        </p>
                        <p className="text-[9px] capitalize text-muted-foreground">
                          {w.delivery_status}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyRow label="winners" />
          )}
        </div>

        {/* ═══ RECENT SETTLEMENTS ═══ */}
        <div className="space-y-2">
          <SectionHeader
            title="Recent settlements"
            count={recent?.settlements?.length}
            onSeeAll={() => navigate("/admin/settlements")}
          />

          {recent?.settlements?.length ? (
            <div className="space-y-2">
              {recent.settlements.slice(0, 5).map((s) => {
                const item = s.auction?.item;
                return (
                  <Card key={s.id} className="border-border/60">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {item?.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {item?.title ?? "Unknown item"}
                        </p>
                        <p className="truncate text-[10px] capitalize text-muted-foreground">
                          {s.outcome.replaceAll("_", " ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge
                          variant={statusVariant(s.outcome)}
                          className="px-1.5 py-0 text-[9px] capitalize"
                        >
                          {s.outcome.replaceAll("_", " ")}
                        </Badge>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">
                          {formatShortDate(s.settled_at)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyRow label="settlements" />
          )}
        </div>

        {/* Footer */}
        <p className="pb-3 pt-1 text-center text-[10px] text-muted-foreground">
          Chereta Admin · Auction Management
        </p>
      </div>

      {/* ═══ DETAIL SHEETS ═══ */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) closeDetail();
          else setDetailOpen(true);
        }}
      >
        <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="pr-8 text-base">
              {detailKind === "user"
                ? detailUser
                  ? getUserName(detailUser)
                  : "User details"
                : detailKind === "auction"
                  ? detailAuction?.item?.title ?? "Auction details"
                  : "Details"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {detailKind === "user"
                ? "User profile information."
                : "Auction information."}
            </DialogDescription>
          </DialogHeader>

          {detailKind === "user" && detailUser && (
            <UserDetailContent user={detailUser} />
          )}
          {detailKind === "auction" && detailAuction && (
            <AuctionDetailContent auction={detailAuction} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}