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
    "/admin/users": "Users",
    "/admin/items": "Items",
    "/admin/auctions": "Auctions",
    "/admin/transactions": "Transactions",
};

function LoadingScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
                Verifying  permissions...
            </p>
        </div>
    );
}

function Unauthorized() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="size-8 text-destructive" />
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Unauthorized Access
                </h1>

                <p className="max-w-md text-sm text-muted-foreground">
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
                <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <SidebarTrigger className="-ml-1" />

                    <Separator orientation="vertical" className="h-5" />

                    <h1 className="text-sm font-semibold tracking-tight text-foreground">
                        {title}
                    </h1>
                </header>

                <div className="flex-1 ">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
