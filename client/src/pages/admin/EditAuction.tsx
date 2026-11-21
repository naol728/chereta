/* eslint-disable */
//@ts-nocheck
import { updateAuction, getItems } from "@/api/admin";
import type {
    UpdateAuctionPayload,
    GetItemsParams,
    ItemType,
} from "@/api/admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Check,
    Gavel,
    Loader2,
    Package,
    PackageOpen,
    Pencil,
    Search,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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

type AuctionStatus = "scheduled" | "live" | "ended" | "cancelled";

interface AuctionItem {
    id: string;
    title: string;
    slug: string | null;
    description: string | null;
    image_url: string | null;
    images: string[];
    category: string | null;
    condition: "new" | "used" | "refurbished";
    status: "draft" | "published" | "archived";
}

export interface Auction {
    id: string;
    item_id: string;
    starting_bid: number;
    currency: string;
    starts_at: string;
    ends_at: string;
    status: AuctionStatus;
    total_bids: number;
    total_revenue: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    participation_fee: number;
    item: AuctionItem;
}

interface EditAuctionProps {
    auction: Auction;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CURRENCIES = ["ETB", "USD", "EUR"];
const PAGE_SIZE = 20;

/** Convert ISO → "YYYY-MM-DDTHH:mm" for datetime-local inputs (local time). */
const toLocalInputValue = (iso?: string) => {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return "";
    }
};

export default function EditAuction({
    auction,
    onSuccess,
    onCancel,
}: EditAuctionProps) {
    const queryClient = useQueryClient();

    // ─── Form state ──────────────────────────────────────
    const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
    const [startingBid, setStartingBid] = useState(
        String(auction.starting_bid ?? "")
    );
    const [participationFee, setParticipationFee] = useState(
        String(auction.participation_fee ?? "")
    );
    const [currency, setCurrency] = useState(auction.currency || "ETB");
    const [startsAt, setStartsAt] = useState(
        toLocalInputValue(auction.starts_at)
    );
    const [endsAt, setEndsAt] = useState(toLocalInputValue(auction.ends_at));
    const [status, setStatus] = useState<AuctionStatus>(
        auction.status || "scheduled"
    );

    // Seed the selected item from the auction's embedded item snapshot.
    // This avoids a flash while the picker's query loads.
    useEffect(() => {
        if (auction.item) {
            setSelectedItem(auction.item as unknown as ItemType);
        }
    }, [auction.id]);

    // Reset all fields whenever a different auction is passed in
    useEffect(() => {
        setSelectedItem((auction.item as unknown as ItemType) ?? null);
        setStartingBid(String(auction.starting_bid ?? ""));
        setParticipationFee(String(auction.participation_fee ?? ""));
        setCurrency(auction.currency || "ETB");
        setStartsAt(toLocalInputValue(auction.starts_at));
        setEndsAt(toLocalInputValue(auction.ends_at));
        setStatus(auction.status || "scheduled");
    }, [auction.id]);

    // ─── Item picker state ───────────────────────────────
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerSearch, setPickerSearch] = useState("");
    const [pickerPage, setPickerPage] = useState(1);

    const pickerParams: GetItemsParams = useMemo(() => {
        const p: GetItemsParams = { page: pickerPage, limit: PAGE_SIZE };
        if (pickerSearch.trim()) p.search = pickerSearch.trim();
        p.status = "published";
        return p;
    }, [pickerPage, pickerSearch]);

    const {
        data: itemsData,
        isLoading: itemsLoading,
        error: itemsError,
    } = useQuery({
        queryKey: ["getItems", "auction-picker", pickerParams],
        queryFn: () => getItems(pickerParams),
        staleTime: 30_000,
        enabled: pickerOpen,
    });

    const items: ItemType[] = itemsData?.data?.items ?? [];
    const itemsPagination = itemsData?.data?.pagination;

    // ─── Mutation ────────────────────────────────────────
    const { mutate, isPending } = useMutation({
        mutationFn: (payload: UpdateAuctionPayload) =>
            updateAuction(auction.id, payload),
        mutationKey: ["updateAuction", auction.id],
        onSuccess: () => {
            toast.success("Auction updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["getAuctions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-auctions"] });
            onSuccess?.();
        },
        onError: (err: any) => {
            toast.error(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to update auction."
            );
        },
    });

    // ─── Handlers ────────────────────────────────────────
    const handlePickItem = (item: ItemType) => {
        setSelectedItem(item);
        setPickerOpen(false);
        setPickerSearch("");
        setPickerPage(1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedItem) {
            toast.error("Please select an item to auction.");
            setPickerOpen(true);
            return;
        }
        if (!startsAt) {
            toast.error("Please set the start date and time.");
            return;
        }
        if (!endsAt) {
            toast.error("Please set the end date and time.");
            return;
        }
        if (new Date(endsAt) <= new Date(startsAt)) {
            toast.error("End time must be after the start time.");
            return;
        }

        const payload: UpdateAuctionPayload = {
            item_id: selectedItem.id,
            starts_at: new Date(startsAt).toISOString(),
            ends_at: new Date(endsAt).toISOString(),
            status,
        };

        const bid = Number(startingBid);
        if (Number.isFinite(bid) && bid >= 0) payload.starting_bid = bid;

        const fee = Number(participationFee);
        if (Number.isFinite(fee) && fee >= 0)
            payload.participation_fee = fee;

        if (currency) payload.currency = currency;

        mutate(payload);
    };

    const handleReset = () => {
        setSelectedItem((auction.item as unknown as ItemType) ?? null);
        setStartingBid(String(auction.starting_bid ?? ""));
        setParticipationFee(String(auction.participation_fee ?? ""));
        setCurrency(auction.currency || "ETB");
        setStartsAt(toLocalInputValue(auction.starts_at));
        setEndsAt(toLocalInputValue(auction.ends_at));
        setStatus(auction.status || "scheduled");
    };

    return (
        <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Pencil className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold">Edit Auction</p>
                    <p className="text-[10px] text-muted-foreground">
                        Update the item, schedule, or pricing.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* ═══ ITEM SELECTION ═══ */}
                <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm">Item</CardTitle>
                        <CardDescription className="text-xs">
                            Change the item being auctioned, if needed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 p-3 pt-0">
                        {selectedItem ? (
                            <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-2.5">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                                    {selectedItem.image_url ? (
                                        <img
                                            src={selectedItem.image_url}
                                            alt={selectedItem.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                            <Package className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-foreground">
                                        {selectedItem.title}
                                    </p>
                                    <p className="truncate text-[10px] text-muted-foreground">
                                        {selectedItem.category || "Uncategorized"}
                                        {selectedItem.condition && ` · ${selectedItem.condition}`}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPickerOpen(true)}
                                    className="h-8 shrink-0 rounded-full px-2.5 text-[11px]"
                                >
                                    Change
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setPickerOpen(true)}
                                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-3 py-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <PackageOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-foreground">
                                        Select an item
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Browse your published items
                                    </p>
                                </div>
                            </button>
                        )}
                    </CardContent>
                </Card>

                {/* ═══ SCHEDULE ═══ */}
                <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm">Schedule</CardTitle>
                        <CardDescription className="text-xs">
                            When should bidding open and close?
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 p-3 pt-0">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-starts-at" className="text-xs">
                                Starts At <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-starts-at"
                                type="datetime-local"
                                value={startsAt}
                                onChange={(e) => setStartsAt(e.target.value)}
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-ends-at" className="text-xs">
                                Ends At <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="edit-ends-at"
                                type="datetime-local"
                                value={endsAt}
                                onChange={(e) => setEndsAt(e.target.value)}
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-status" className="text-xs">
                                Status
                            </Label>
                            <Select
                                value={status}
                                onValueChange={(v) => setStatus(v as AuctionStatus)}
                            >
                                <SelectTrigger id="edit-status" className="h-10 w-full text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="live">Live</SelectItem>
                                    <SelectItem value="ended">Ended</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* ═══ PRICING ═══ */}
                <Card>
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm">Pricing</CardTitle>
                        <CardDescription className="text-xs">
                            Adjust the starting bid, fee, or currency.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 p-3 pt-0">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-starting-bid" className="text-xs">
                                Starting Bid
                            </Label>
                            <Input
                                id="edit-starting-bid"
                                type="number"
                                min="0"
                                step="0.01"
                                value={startingBid}
                                onChange={(e) => setStartingBid(e.target.value)}
                                placeholder="1"
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-participation-fee" className="text-xs">
                                Participation Fee
                            </Label>
                            <Input
                                id="edit-participation-fee"
                                type="number"
                                min="0"
                                step="0.01"
                                value={participationFee}
                                onChange={(e) => setParticipationFee(e.target.value)}
                                placeholder="20"
                                className="h-10 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-currency" className="text-xs">
                                Currency
                            </Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger
                                    id="edit-currency"
                                    className="h-10 w-full text-sm"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* ═══ ACTIONS ═══ */}
                <div className="flex flex-col-reverse gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                            handleReset();
                            onCancel?.();
                        }}
                        className="h-10 w-full text-sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending || !selectedItem || !startsAt || !endsAt}
                        className="h-10 w-full gap-1.5 text-sm"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>

            {/* ═══ ITEM PICKER DIALOG ═══ */}
            <Dialog
                open={pickerOpen}
                onOpenChange={(open) => {
                    setPickerOpen(open);
                    if (!open) {
                        setPickerSearch("");
                        setPickerPage(1);
                    }
                }}
            >
                <DialogContent className="bottom-0 top-auto flex h-[85dvh] max-h-[85dvh] w-full max-w-full translate-y-0 flex-col gap-0 rounded-t-2xl border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:bottom-auto sm:top-1/2 sm:h-[70dvh] sm:max-w-lg sm:-translate-y-1/2 sm:rounded-2xl">
                    <div className="flex justify-center pt-2 sm:hidden">
                        <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                    </div>

                    <DialogHeader className="border-b px-4 py-3">
                        <DialogTitle className="text-base">Select an Item</DialogTitle>
                        <DialogDescription className="text-xs">
                            Pick a published item to auction.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search */}
                    <div className="border-b px-4 py-2.5">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={pickerSearch}
                                onChange={(e) => {
                                    setPickerSearch(e.target.value);
                                    setPickerPage(1);
                                }}
                                placeholder="Search items..."
                                className="h-9 rounded-full border-border/60 bg-muted/40 pl-9 pr-9 text-sm"
                            />
                            {pickerSearch && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPickerSearch("");
                                        setPickerPage(1);
                                    }}
                                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                    aria-label="Clear search"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Items list */}
                    <div className="flex-1 overflow-y-auto px-3 py-2">
                        {itemsLoading && (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5"
                                    >
                                        <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                                        <div className="flex-1 space-y-1.5">
                                            <Skeleton className="h-3 w-2/3" />
                                            <Skeleton className="h-2.5 w-1/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {itemsError && !itemsLoading && (
                            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                                    <X className="h-6 w-6 text-destructive" />
                                </div>
                                <p className="text-sm font-semibold">Failed to load items</p>
                                <p className="text-xs text-muted-foreground">
                                    {(itemsError as any)?.message || "Try again"}
                                </p>
                            </div>
                        )}

                        {!itemsLoading && !itemsError && items.length === 0 && (
                            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <PackageOpen className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-semibold">No published items</p>
                                <p className="text-xs text-muted-foreground">
                                    {pickerSearch
                                        ? "Try a different search term."
                                        : "Publish an item first to auction it."}
                                </p>
                            </div>
                        )}

                        {!itemsLoading && !itemsError && items.length > 0 && (
                            <div className="space-y-1.5">
                                {items.map((item) => {
                                    const isSelected = selectedItem?.id === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handlePickItem(item)}
                                            className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors active:bg-muted/60 ${isSelected
                                                ? "border-primary bg-primary/5"
                                                : "border-border/60 hover:bg-muted/40"
                                                }`}
                                        >
                                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
                                                {item.image_url ? (
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
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-foreground">
                                                    {item.title}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {item.category || "Uncategorized"}
                                                    {item.condition && ` · ${item.condition}`}
                                                </p>
                                            </div>

                                            {isSelected && (
                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                    <Check className="h-3.5 w-3.5" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {itemsPagination && itemsPagination.totalPages > 1 && (
                        <div className="border-t px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-full px-3 text-xs"
                                    onClick={() => setPickerPage((p) => Math.max(1, p - 1))}
                                    disabled={!itemsPagination.hasPrevPage}
                                >
                                    Prev
                                </Button>
                                <span className="text-[11px] text-muted-foreground">
                                    {itemsPagination.currentPage} / {itemsPagination.totalPages}
                                </span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-full px-3 text-xs"
                                    onClick={() => setPickerPage((p) => p + 1)}
                                    disabled={!itemsPagination.hasNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}