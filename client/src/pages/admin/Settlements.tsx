/* eslint-disable */
//@ts-nocheck
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuctionSettlements } from "@/api/admin";
import {
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Gavel,
  Package,
  Wallet,
  Copy,
  X,
  SlidersHorizontal,
  MoreHorizontal,
  Eye,
  CalendarDays,
  Layers3,
  User,
  Loader2,
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

type SettlementOutcome = "no_unique_bid" | "winner" | "no_winner";
type AdminDecision = "pending" | "approved" | "rejected";

interface SettlementItem {
  id: string;
  slug: string | null;
  title: string;
  images: string[] | null;
  category: string | null;
  condition: string | null;
  image_url: string | null;
  description: string | null;
}

interface SettlementAuction {
  id: string;
  status: string;
  ends_at: string;
  currency: string;
  starts_at: string;
  total_bids: number;
  starting_bid: number;
  total_revenue: number;
  participation_fee: number;
  item: SettlementItem;
}

interface SettlementWinner {
  id: string;
  Fname: string | null;
  Lname: string | null;
  username: string | null;
  telegram_id: number | string | null;
  phone: string | null;
}

interface SettlementWinningBid {
  id: string;
  bid_amount: number;
  user_id: string;
  created_at: string;
  paid_at: string | null;
}

interface Settlement {
  id: string;
  auction_id: string;
  outcome: SettlementOutcome | string;
  winning_bid_id: string | null;
  winner_user_id: string | null;
  winning_amount: number | null;
  admin_decision: AdminDecision | string;
  decided_by: string | null;
  decided_at: string | null;
  settlement_data: {
    ended_at?: string;
    total_paid_bids?: number;
    distinct_amounts?: number;
    [key: string]: any;
  } | null;
  settled_at: string;
  winner: SettlementWinner | null;
  winning_bid: SettlementWinningBid | null;
  auction: SettlementAuction;
}

interface SettlementsResponse {
  status: string;
  results: number;
  data: {
    settlements: Settlement[];
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
    year: "numeric",
  }).format(parsed);
};

const getWinnerName = (winner?: SettlementWinner | null) => {
  if (!winner) return "No winner";
  const name = [winner.Fname, winner.Lname].filter(Boolean).join(" ");
  return name || winner.username || "Unknown user";
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "U";

const outcomeMeta: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ElementType;
    tone: "success" | "warning" | "neutral" | "danger";
  }
> = {
  winner: {
    label: "Winner",
    variant: "default",
    icon: Trophy,
    tone: "success",
  },
  no_unique_bid: {
    label: "No Unique Bid",
    variant: "secondary",
    icon: AlertCircle,
    tone: "warning",
  },
  no_winner: {
    label: "No Winner",
    variant: "outline",
    icon: XCircle,
    tone: "neutral",
  },
};

const decisionMeta: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    icon: React.ElementType;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: XCircle,
  },
};

const getOutcome = (outcome: string) =>
  outcomeMeta[outcome] ?? {
    label: outcome.replaceAll("_", " "),
    variant: "outline" as const,
    icon: AlertCircle,
    tone: "neutral" as const,
  };

const getDecision = (decision: string) =>
  decisionMeta[decision] ?? {
    label: decision.replaceAll("_", " "),
    variant: "outline" as const,
    icon: Clock,
  };

// ─── Sub-components ─────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: string }) {
  const meta = getOutcome(outcome);
  const Icon = meta.icon;
  return (
    <Badge
      variant={meta.variant}
      className="gap-1 px-2 py-0.5 text-[10px] font-medium capitalize"
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </Badge>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const meta = getDecision(decision);
  const Icon = meta.icon;
  return (
    <Badge
      variant={meta.variant}
      className="gap-1 px-2 py-0.5 text-[10px] font-medium capitalize"
    >
      <Icon className="h-3 w-3" />
      {meta.label}
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
      /* noop */
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

function SettlementDetailContent({ settlement }: { settlement: Settlement }) {
  const item = settlement.auction?.item;
  const winner = settlement.winner;
  const winningBid = settlement.winning_bid;
  const currency = settlement.auction?.currency || "ETB";
  const winnerName = getWinnerName(winner);

  return (
    <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto">
      <div className="space-y-4 p-4">
        {/* Hero image */}
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

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <OutcomeBadge outcome={settlement.outcome} />
          <DecisionBadge decision={settlement.admin_decision} />
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

        {/* Winner / outcome hero */}
        {winner ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <Trophy className="h-3.5 w-3.5" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">
                Winning Bid
              </p>
            </div>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-emerald-600">
              {formatMoney(settlement.winning_amount, currency)}
            </p>

            <div className="mt-3 flex items-center gap-2 border-t border-emerald-500/20 pt-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-600">
                {getInitials(winnerName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {winnerName}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {winner.username ? `@${winner.username}` : "No username"}
                  {winner.telegram_id ? ` · TG ${winner.telegram_id}` : ""}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">
                No Winner
              </p>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {getOutcome(settlement.outcome).label}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              This auction ended without a unique winning bid.
            </p>
          </div>
        )}

        {/* SETTLEMENT INFO */}
        <InfoCard title="Settlement" icon={Gavel}>
          <DetailRow label="Settlement ID" value={settlement.id} copyable />
          <DetailRow
            label="Outcome"
            value={<OutcomeBadge outcome={settlement.outcome} />}
          />
          <DetailRow
            label="Admin decision"
            value={<DecisionBadge decision={settlement.admin_decision} />}
          />
          <DetailRow label="Settled at" value={formatDate(settlement.settled_at)} />
          <DetailRow label="Decided at" value={formatDate(settlement.decided_at)} />
          <DetailRow label="Decided by" value={settlement.decided_by || "—"} copyable />
        </InfoCard>

        {/* WINNER */}
        {winner && (
          <InfoCard title="Winner" icon={User}>
            <DetailRow label="Name" value={winnerName} />
            <DetailRow label="User ID" value={settlement.winner_user_id} copyable />
            <DetailRow
              label="Telegram ID"
              value={winner.telegram_id ?? "—"}
              copyable
            />
            <DetailRow
              label="Username"
              value={winner.username ? `@${winner.username}` : "—"}
            />
            <DetailRow label="Phone" value={winner.phone || "—"} copyable />
          </InfoCard>
        )}

        {/* WINNING BID */}
        {winningBid && (
          <InfoCard title="Winning bid" icon={Trophy}>
            <DetailRow label="Bid ID" value={winningBid.id} copyable />
            <DetailRow
              label="Bid amount"
              value={formatMoney(winningBid.bid_amount, currency)}
            />
            <DetailRow label="User ID" value={winningBid.user_id} copyable />
            <DetailRow label="Created" value={formatDate(winningBid.created_at)} />
            <DetailRow label="Paid at" value={formatDate(winningBid.paid_at)} />
          </InfoCard>
        )}

        {/* AUCTION */}
        <InfoCard title="Auction" icon={Layers3}>
          <DetailRow label="Auction ID" value={settlement.auction_id} copyable />
          <DetailRow label="Status" value={settlement.auction?.status ?? "—"} />
          <DetailRow
            label="Starts at"
            value={formatDate(settlement.auction?.starts_at)}
          />
          <DetailRow
            label="Ends at"
            value={formatDate(settlement.auction?.ends_at)}
          />
          <DetailRow
            label="Starting bid"
            value={formatMoney(settlement.auction?.starting_bid, currency)}
          />
          <DetailRow
            label="Participation fee"
            value={formatMoney(settlement.auction?.participation_fee, currency)}
          />
          <DetailRow label="Total bids" value={settlement.auction?.total_bids} />
          <DetailRow
            label="Total revenue"
            value={formatMoney(settlement.auction?.total_revenue, currency)}
          />
        </InfoCard>

        {/* ITEM */}
        <InfoCard title="Item" icon={Package}>
          <DetailRow label="Item ID" value={item?.id} copyable />
          <DetailRow label="Title" value={item?.title} />
          <DetailRow label="Slug" value={item?.slug || "—"} copyable />
          <DetailRow label="Category" value={item?.category || "—"} />
          <DetailRow label="Condition" value={item?.condition || "—"} />
          {item?.description && (
            <div className="py-2">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <p className="text-xs leading-relaxed text-foreground">
                {item.description}
              </p>
            </div>
          )}
        </InfoCard>

        {/* SETTLEMENT DATA */}
        {settlement.settlement_data && (
          <InfoCard title="Settlement data" icon={CalendarDays}>
            {settlement.settlement_data.ended_at && (
              <DetailRow
                label="Ended at"
                value={formatDate(settlement.settlement_data.ended_at)}
              />
            )}
            {settlement.settlement_data.total_paid_bids !== undefined && (
              <DetailRow
                label="Total paid bids"
                value={settlement.settlement_data.total_paid_bids}
              />
            )}
            {settlement.settlement_data.distinct_amounts !== undefined && (
              <DetailRow
                label="Distinct amounts"
                value={settlement.settlement_data.distinct_amounts}
              />
            )}
          </InfoCard>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────

export default function Settlements() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] =
    useState<Settlement | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useQuery<SettlementsResponse>({
      queryFn: getAuctionSettlements,
      queryKey: ["getAuctionSettlements"],
      staleTime: 30_000,
    });

  const settlements = data ?? [];

  // Client-side filter (endpoint has no query params in the given signature)
  const filtered = settlements.filter((s) => {
    if (outcomeFilter !== "all" && s.outcome !== outcomeFilter) return false;
    if (decisionFilter !== "all" && s.admin_decision !== decisionFilter)
      return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;

    const item = s.auction?.item;
    const winnerName = getWinnerName(s.winner).toLowerCase();

    return (
      item?.title?.toLowerCase().includes(q) ||
      item?.category?.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.auction_id.toLowerCase().includes(q) ||
      winnerName.includes(q) ||
      String(s.winner?.telegram_id ?? "").includes(q)
    );
  });

  // Summary counters
  const withWinner = settlements.filter((s) => s.outcome === "winner").length;
  const noUniqueBid = settlements.filter(
    (s) => s.outcome === "no_unique_bid"
  ).length;
  const pendingDecision = settlements.filter(
    (s) => s.admin_decision === "pending"
  ).length;

  const hasActiveFilters =
    Boolean(search) ||
    outcomeFilter !== "all" ||
    decisionFilter !== "all";
  const activeFilterCount =
    (search ? 1 : 0) +
    (outcomeFilter !== "all" ? 1 : 0) +
    (decisionFilter !== "all" ? 1 : 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setOutcomeFilter("all");
    setDecisionFilter("all");
  };

  const openDetail = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-full space-y-3 px-3 py-4">
        {/* ═══ HEADER ═══ */}
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Gavel className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                  Settlements
                </h1>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {settlements.length} settlements total
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

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search item, winner, auction ID..."
                className="h-10 rounded-full border-border/60 bg-muted/40 pl-9 pr-9 text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
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
                    Outcome
                  </label>
                  <Select
                    value={outcomeFilter}
                    onValueChange={setOutcomeFilter}
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All outcomes</SelectItem>
                      <SelectItem value="winner">Winner</SelectItem>
                      <SelectItem value="no_unique_bid">No unique bid</SelectItem>
                      <SelectItem value="no_winner">No winner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">
                    Admin decision
                  </label>
                  <Select
                    value={decisionFilter}
                    onValueChange={setDecisionFilter}
                  >
                    <SelectTrigger className="h-9 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All decisions</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* ═══ SUMMARY ═══ */}
        {!isLoading && !isError && settlements.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <StatMiniCard
              icon={Trophy}
              label="Winners"
              value={withWinner}
              valueClass="text-emerald-600"
            />
            <StatMiniCard
              icon={AlertCircle}
              label="No unique bid"
              value={noUniqueBid}
              valueClass="text-amber-600"
            />
            <StatMiniCard
              icon={Clock}
              label="Pending"
              value={pendingDecision}
              valueClass="text-violet-600"
            />
          </div>
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
                  Failed to load settlements
                </p>
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
        )}

        {/* ═══ EMPTY ═══ */}
        {!isLoading && !isError && settlements.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Gavel className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  No settlements found
                </p>
                <p className="max-w-[240px] text-xs text-muted-foreground">
                  Settlements appear after auctions end.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="rounded-full"
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ═══ FILTERED EMPTY ═══ */}
        {!isLoading &&
          !isError &&
          settlements.length > 0 &&
          filtered.length === 0 && (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    No matching settlements
                  </p>
                  <p className="max-w-[240px] text-xs text-muted-foreground">
                    Try adjusting your search or filters.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

        {/* ═══ LIST ═══ */}
        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-sm font-semibold">All Settlements</h2>
              <span className="text-[10px] text-muted-foreground">
                {filtered.length} shown
              </span>
            </div>

            <div className="space-y-2">
              {filtered.map((s) => {
                const item = s.auction?.item;
                const winner = s.winner;
                const currency = s.auction?.currency || "ETB";
                const winnerName = getWinnerName(winner);

                return (
                  <Card
                    key={s.id}
                    className="overflow-hidden border-border/60 transition-colors active:bg-muted/40"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-3 p-3">
                        {/* Thumbnail */}
                        <button
                          onClick={() => openDetail(s)}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-muted"
                          aria-label={`View settlement for ${item?.title || "item"
                            }`}
                        >
                          {item?.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
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
                          onClick={() => openDetail(s)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold leading-tight text-foreground">
                              {item?.title ?? "Unknown item"}
                            </p>
                            <OutcomeBadge outcome={s.outcome} />
                          </div>

                          <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                            {winner ? winnerName : "No winner"}
                            {item?.category && ` · ${item.category}`}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {s.winning_amount !== null ? (
                              <span className="text-xs font-bold text-primary">
                                {formatMoney(s.winning_amount, currency)}
                              </span>
                            ) : (
                              <DecisionBadge decision={s.admin_decision} />
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              ·
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatShortDate(s.settled_at)}
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
                                aria-label="Actions for settlement"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="truncate text-[10px] font-normal text-muted-foreground">
                                {item?.title || "Settlement"}
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDetail(s)}
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
          </>
        )}
      </div>

      {/* ═══ DETAIL SHEET ═══ */}
      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedSettlement(null);
        }}
      >
        <DialogContent className="bottom-0 top-auto w-full max-w-full translate-y-0 gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
          <div className="flex justify-center pt-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="pr-8 text-base">
              {selectedSettlement?.auction?.item?.title ?? "Settlement Details"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Full information about this settlement.
            </DialogDescription>
          </DialogHeader>

          {selectedSettlement ? (
            <SettlementDetailContent settlement={selectedSettlement} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}