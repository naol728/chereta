import React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PreviousBidItem = {
    id: string;
    title: string;
    subtitle: string;
    image: string;
};

const previousBids: PreviousBidItem[] = [
    {
        id: "1",
        title: "iPhone 17 Pro Max",
        subtitle: "ያሸነፈ መጠን · 5.32 ETB",
        image:
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: "2",
        title: "Samsung Galaxy S24 Ultra",
        subtitle: "ያሸነፈ መጠን · 3.15 ETB",
        image:
            "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: "3",
        title: "MacBook Pro M3",
        subtitle: "ያሸነፈ መጠን · 8.50 ETB",
        image:
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: "4",
        title: "Sony PlayStation 5",
        subtitle: "ያሸነፈ መጠን · 2.75 ETB",
        image:
            "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: "5",
        title: "iPad Pro 12.9",
        subtitle: "ያሸነፈ መጠን · 4.20 ETB",
        image:
            "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80",
    },
];

export default function PreviousBid() {
    return (
        // Root background and text colors
        <div className="min-h-screen w-full bg-background p-5 font-sans text-foreground">

            {/* Header Section */}
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-extrabold tracking-tight">
                    በቅርቡ ያተወሱ
                </h1>
                <Button
                    variant="link"
                    className="h-auto p-0 text-sm font-bold text-primary hover:no-underline"
                >
                    ያሉሱ
                </Button>
            </div>

            {/* List Section */}
            <div className="flex flex-col gap-4">
                {previousBids.map((item) => (
                    <div
                        key={item.id}
                        className="group flex cursor-pointer items-center gap-4 rounded-3xl bg-card p-3 shadow-sm transition-all duration-200 hover:bg-accent/50 active:scale-[0.98] border border-border/50"
                    >
                        {/* Image Container */}
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-border bg-muted">
                            <img
                                src={item.image}
                                alt={item.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                            />
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-1 flex-col justify-center overflow-hidden">
                            <h2 className="truncate text-[17px] font-bold text-card-foreground">
                                {item.title}
                            </h2>
                            {/* Using text-muted-foreground to inherit shadcn subtitle coloring */}
                            <p className="mt-1 truncate text-[13px] font-medium text-muted-foreground">
                                {item.subtitle}
                            </p>
                        </div>

                        {/* Chevron Icon */}
                        <div className="pr-2 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1">
                            <ChevronRight className="h-5 w-5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}