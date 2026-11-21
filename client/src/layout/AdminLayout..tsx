import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, Loader2 } from "lucide-react";

import {
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";

import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { checkIsAdmin } from "@/api/admin";

const titles: Record<string, string> = {
    "/admin": "Overview",
    "/admin/settlements": "Settlements",
    "/admin/items": "Items",
    "/admin/auctions": "Auctions",
    "/admin/transactions": "Transactions",
    "/admin/auctionbids": "Auction Bids",
    "/admin/profile": "Admin Profile",
};

function LoadingScreen() {
    return (
        < div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-4" >
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
                Verifying permissions...
            </p>
        </ div>
    );
}

function Unauthorized() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="size-7 text-destructive" />
            </div>

            <div className="space-y-1.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Unauthorized Access
                </h1>

                <p className="max-w-xs text-xs text-muted-foreground">
                    You don't have permission to access the admin dashboard.
                    Please contact the administrator if you believe this is a mistake.
                </p>
            </div>
        </div>
    );
}

export default function AdminLayout() {
    const { pathname } = useLocation();

    const {
        data,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["admin-auth"],
        queryFn: checkIsAdmin,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) {
        return <LoadingScreen />;
    }

    // Any failed authorization request blocks dashboard access.
    if (error || !data?.success) {
        return <Unauthorized />;
    }

    const title = titles[pathname] ?? "Admin";

    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset>
                {/* Telegram mini app: shorter header, tighter padding */}
                <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <SidebarTrigger className="-ml-1 h-7 w-7" />

                    <Separator orientation="vertical" className="h-4" />

                    <h1 className="text-xs font-semibold tracking-tight text-foreground">
                        {title}
                    </h1>
                </header>

                <div className="flex-1">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}