import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Gavel, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BidItem = {
    id: number;
    title: string;
    image: string;
    startingPrice: number;
    currentBid: number;
    bids: number;
    bidders: number;
    endsIn: number;
    category: string;
};

const initialItems: BidItem[] = [
    {
        id: 1,
        title: "DJI MIC MINI",
        image:
            "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1000&q=85",
        startingPrice: 20,
        currentBid: 156,
        bids: 24,
        bidders: 18,
        endsIn: 12 * 86400 + 23 * 3600 + 54 * 60 + 24,
        category: "ኤሌክትሮኒክስ",
    },
    {
        id: 2,
        title: "Premium Smartphone",
        image:
            "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1000&q=85",
        startingPrice: 100,
        currentBid: 420,
        bids: 48,
        bidders: 32,
        endsIn: 2 * 86400 + 5 * 3600 + 32 * 60 + 12,
        category: "ስልክ",
    },
    {
        id: 3,
        title: "Wireless Headphones",
        image:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85",
        startingPrice: 50,
        currentBid: 235,
        bids: 31,
        bidders: 21,
        endsIn: 86400 + 8 * 3600 + 15 * 60 + 42,
        category: "ኤሌክትሮኒክስ",
    },
    {
        id: 4,
        title: "Smart Watch Pro",
        image:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85",
        startingPrice: 80,
        currentBid: 310,
        bids: 36,
        bidders: 26,
        endsIn: 4 * 86400 + 12 * 3600 + 8 * 60 + 5,
        category: "መለዋወጫ",
    },
    {
        id: 5,
        title: "Digital Camera",
        image:
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85",
        startingPrice: 200,
        currentBid: 675,
        bids: 67,
        bidders: 43,
        endsIn: 6 * 86400 + 4 * 3600 + 42 * 60 + 18,
        category: "ካሜራ",
    },
];

function formatTime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        { value: days, label: "D" },
        { value: hours, label: "H" },
        { value: minutes, label: "M" },
        { value: secs, label: "S" },
    ];
}

export default function LiveBid() {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState<BidItem[]>(initialItems);
    const [remaining, setRemaining] = useState<number[]>(
        initialItems.map((item) => item.endsIn)
    );
    const [selectedItem, setSelectedItem] = useState<number | null>(null);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setRemaining((previous) =>
                previous.map((seconds) => Math.max(0, seconds - 1))
            );
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    const scroll = (direction: "left" | "right") => {
        sliderRef.current?.scrollBy({
            left: direction === "right" ? 360 : -360,
            behavior: "smooth",
        });
    };

    const placeBid = (id: number) => {
        const index = items.findIndex((item) => item.id === id);

        if (index === -1 || remaining[index] === 0) return;

        setItems((previous) =>
            previous.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        currentBid: item.currentBid + 5,
                        bids: item.bids + 1,
                        bidders: item.bidders + 1,
                    }
                    : item
            )
        );

        setSelectedItem(id);
    };

    return (
        <section className="w-full bg-background px-4 py-8 text-foreground sm:px-8 sm:py-12">
            <div className="mx-auto max-w-7xl">
                {/* Section header */}
                <div className="mb-7 flex items-end justify-between gap-3 sm:mb-9">
                    <div>
                        <p className="mb-2 text-sm font-bold tracking-wide text-primary sm:text-base">
                            በቀጥታ ጨረታ
                        </p>

                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                            አሁን ቅረብ
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="hidden text-sm font-semibold text-muted-foreground sm:block">
                            ሁሉንም ይመልከቱ
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Previous items"
                            onClick={() => scroll("left")}
                            className="size-9 rounded-full sm:size-10"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Next items"
                            onClick={() => scroll("right")}
                            className="size-9 rounded-full sm:size-10"
                        >
                            <ChevronRight className="size-5" />
                        </Button>
                    </div>
                </div>

                {/* Horizontal product carousel */}
                <div
                    ref={sliderRef}
                    className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6"
                >
                    {items.map((item, index) => {
                        const time = formatTime(remaining[index] ?? 0);
                        const isSelected = selectedItem === item.id;
                        const ended = (remaining[index] ?? 0) === 0;

                        return (
                            <Card
                                key={item.id}
                                className="w-[min(82vw,320px)] min-w-[min(82vw,320px)] snap-start gap-0 overflow-hidden rounded-3xl border-border bg-card py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:w-[340px] sm:min-w-[340px]"
                            >
                                {/* Product image */}
                                <div className="relative h-[230px] overflow-hidden bg-muted sm:h-[270px]">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        loading="lazy"
                                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                    />

                                    <Badge
                                        variant="secondary"
                                        className="absolute left-4 top-4 rounded-full border border-border/50 px-4 py-2 text-xs font-semibold shadow-sm"
                                    >
                                        {item.category}
                                    </Badge>

                                    <Badge
                                        variant="outline"
                                        className="absolute right-4 top-4 gap-1.5 rounded-full border-border bg-background/90 text-foreground shadow-sm"
                                    >
                                        <span
                                            className={`size-2 rounded-full ${ended
                                                ? "bg-muted-foreground"
                                                : "animate-pulse bg-destructive"
                                                }`}
                                        />
                                        {ended ? "ENDED" : "LIVE"}
                                    </Badge>

                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>

                                {/* Product details */}
                                <CardContent className="p-5 sm:p-6">
                                    <h3 className="truncate text-xl font-bold tracking-tight text-card-foreground sm:text-[22px]">
                                        {item.title}
                                    </h3>

                                    {/* Prices */}
                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground sm:text-sm">
                                                የመጀመሪያ ዋጋ
                                            </p>

                                            <p className="mt-1 text-lg font-semibold text-foreground">
                                                {item.startingPrice.toLocaleString()} ETB
                                            </p>
                                        </div>

                                        <div className="h-12 w-px shrink-0 bg-border" />

                                        <div className="min-w-0 text-right">
                                            <p className="text-xs text-muted-foreground sm:text-sm">
                                                አሁን ያለው ዋጋ
                                            </p>

                                            <p className="mt-1 text-xl font-extrabold text-foreground">
                                                {item.currentBid.toLocaleString()} ETB
                                            </p>
                                        </div>
                                    </div>

                                    {/* Countdown */}
                                    <div className="mt-5 grid grid-cols-4 gap-2">
                                        {time.map((part) => (
                                            <div
                                                key={part.label}
                                                className="rounded-xl border border-border/50 bg-muted px-1 py-2.5 text-center"
                                            >
                                                <p className="text-lg font-bold leading-tight text-foreground">
                                                    {String(part.value).padStart(2, "0")}
                                                </p>

                                                <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                                    {part.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bid statistics */}
                                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Gavel className="size-3.5 shrink-0" />
                                            {item.bids} ጨረታዎች
                                        </span>

                                        <span className="flex items-center gap-1.5">
                                            <Users className="size-3.5 shrink-0" />
                                            {item.bidders} ተሳታፊዎች
                                        </span>
                                    </div>

                                    {/* Bid button */}
                                    <Button
                                        disabled={ended}
                                        onClick={() => placeBid(item.id)}
                                        className="mt-4 h-12 w-full rounded-xl font-bold"
                                    >
                                        {ended
                                            ? "ጨረታው ተጠናቋል"
                                            : isSelected
                                                ? "ቅናሽዎ ተጨምሯል ✓"
                                                : "ጨረታ ያቅርቡ"}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Mobile swipe hint */}
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground sm:hidden">
                    <ChevronLeft className="size-4" />
                    <span>ወደ ግራ ወይም ቀኝ ያንሸራትቱ</span>
                    <ChevronRight className="size-4" />
                </div>
            </div>
        </section>
    );
}