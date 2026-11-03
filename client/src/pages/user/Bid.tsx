import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getAuctionItem } from "@/api/auction";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
    ArrowLeft,
    ArrowRight,
    AlertCircle,

    ShieldCheck,
    Gavel,
    ImageOff,
    Info,
} from "lucide-react";

type AuctionItem = {
    id: string;
    title: string;
    slug: string | null;
    description: string | null;
    image_url: string | null;
    images: string[];
    category: string | null;
    condition: "new" | "used" | "refurbished";
    status: "draft" | "published" | "archived";
    created_at: string;
    updated_at: string;
};

export default function Bid() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [bidAmount, setBidAmount] = useState("");
    const [selectedImage, setSelectedImage] = useState(0);

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

    // Match this to your actual API response.
    const item: AuctionItem | undefined = data?.data?.item;

    const amount = Number(bidAmount);
    const isValidAmount =
        bidAmount.trim() !== "" &&
        Number.isFinite(amount) &&
        amount >= 1;

    const images =
        item?.images?.length
            ? item.images
            : item?.image_url
                ? [item.image_url]
                : [];

    const currentImage = images[selectedImage] ?? images[0];

    const handleContinue = () => {
        if (!item || !isValidAmount) return;

        // Pass the selected item and bid amount to the payment step.
        navigate(`/auction/${item.id}/payment`, {
            state: {
                itemId: item.id,
                bidAmount: amount,
            },
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background p-4">
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

    if (!id || isError || !item) {
        return (
            <div className="min-h-screen bg-background px-4 py-12">
                <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>

                    <h2 className="text-xl font-bold">
                        {id ? "Item not found" : "Invalid auction"}
                    </h2>

                    <p className="mt-2 text-sm text-muted-foreground">
                        {id
                            ? "We couldn't load this item. It may have been removed or is no longer available."
                            : "The auction item ID is missing from the URL."}
                    </p>

                    {isError && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {error instanceof Error ? error.message : "Something went wrong."}
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
                            <Button className="flex-1" onClick={() => refetch()}>
                                Try again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-28">
            <div className="mx-auto max-w-lg">
                {/* Header */}
                <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="min-w-0 flex-1">
                        <h1 className="font-bold">Place your bid</h1>
                        <p className="text-xs text-muted-foreground">
                            Lowest unique bid wins
                        </p>
                    </div>

                    <Badge variant="secondary">ETB</Badge>
                </header>

                <main className="space-y-5 p-4">
                    {/* Product image */}
                    <div className="space-y-3">
                        <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted">
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

                            <Badge className="absolute left-3 top-3">
                                {item.category || "General"}
                            </Badge>
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {images.map((image, index) => (
                                    <button
                                        key={`${image}-${index}`}
                                        onClick={() => setSelectedImage(index)}
                                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${selectedImage === index
                                            ? "border-primary"
                                            : "border-transparent"
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

                    {/* Product details */}
                    <section className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-xl font-bold leading-tight">
                                {item.title}
                            </h2>

                            <Badge variant="outline" className="shrink-0 capitalize">
                                {item.condition}
                            </Badge>
                        </div>

                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {item.description || "No description available for this item."}
                        </p>
                    </section>

                    <Separator />

                    {/* Bid information */}
                    <Card className="border-primary/20 bg-primary/5 shadow-none">
                        <CardContent className="flex items-start gap-3 p-4">
                            <div className="rounded-xl bg-primary/10 p-2">
                                <Gavel className="h-5 w-5 text-primary" />
                            </div>

                            <div>
                                <h3 className="font-semibold">How bidding works</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Choose your bid amount. If your amount is the lowest amount
                                    submitted by exactly one user, you win the auction.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bid input */}
                    <section className="space-y-3">
                        <div>
                            <h3 className="font-bold">Enter your bid amount</h3>
                            <p className="text-xs text-muted-foreground">
                                Your payment will be exactly the amount you enter.
                            </p>
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
                                className="h-14 pr-16 text-xl font-bold"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                                ETB
                            </span>
                        </div>

                        {bidAmount && !isValidAmount && (
                            <p className="flex items-center gap-1 text-xs text-destructive">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Enter a valid bid amount of at least 1 ETB.
                            </p>
                        )}

                        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                You can only submit the same bid amount once per auction.
                                Other users may choose the same amount.
                            </p>
                        </div>
                    </section>

                    {/* Summary */}
                    {isValidAmount && (
                        <Card className="shadow-none">
                            <CardContent className="space-y-3 p-4">
                                <h3 className="font-semibold">Bid summary</h3>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Item</span>
                                    <span className="max-w-[60%] truncate font-medium">
                                        {item.title}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Your bid</span>
                                    <span className="font-bold">
                                        {amount.toLocaleString()} ETB
                                    </span>
                                </div>

                                <Separator />

                                <div className="flex justify-between">
                                    <span className="font-semibold">Payment amount</span>
                                    <span className="text-lg font-bold text-primary">
                                        {amount.toLocaleString()} ETB
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Trust information */}
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Secure payment verification
                    </div>
                </main>

                {/* Bottom action */}
                <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-4 backdrop-blur">
                    <div className="mx-auto max-w-lg">
                        <Button
                            className="h-12 w-full text-base font-bold"
                            disabled={!isValidAmount}
                            onClick={handleContinue}
                        >
                            Continue to payment
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}