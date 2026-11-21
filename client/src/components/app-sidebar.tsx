import type * as React from "react";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Package,
    Gavel,
    Wallet,
    Gavel as GavelBrand,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const navMain = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/transactions", label: "Transactions", icon: Wallet },
    { to: "/admin/items", label: "Items", icon: Package },
    { to: "/admin/auctions", label: "Auctions", icon: Gavel },
    { to: "/admin/auctionbids", label: "Auction Bids", icon: Wallet },
    { to: "/admin/settlements", label: "Settlements", icon: Users },
    { to: "/admin/profile", label: "Profile", icon: Users },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            {/* Brand */}
            <SidebarHeader className="p-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="hover:bg-transparent active:bg-transparent"
                        >
                            <NavLink to="/admin" end className="flex items-center gap-2.5">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                                    <GavelBrand className="size-4" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-sm font-bold tracking-tight text-foreground">
                                        Chereta
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        Admin Panel
                                    </span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Main nav */}
            <SidebarContent className="px-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Dashboard
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0.5">
                            {navMain.map(({ to, label, icon: Icon, end }) => (
                                <SidebarMenuItem key={to}>
                                    <SidebarMenuButton
                                        tooltip={label}
                                        className="h-9"
                                    >
                                        <NavLink
                                            to={to}
                                            end={end}
                                            className={({ isActive }) =>
                                                [
                                                    "flex w-full items-center gap-2.5 rounded-md text-sm font-medium transition-colors",
                                                    "[&_svg]:size-4 [&_svg]:shrink-0",
                                                    isActive
                                                        ? "bg-accent p-2 text-accent-foreground [&_svg]:text-primary"
                                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                                ].join(" ")
                                            }
                                        >
                                            <Icon />
                                            <span>{label}</span>
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter className="p-3">
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                    <span>© {new Date().getFullYear()} Chereta</span>
                    <span className="font-medium">v1.0</span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}