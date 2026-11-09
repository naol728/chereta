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
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/items", label: "Items", icon: Package },
    { to: "/admin/auctions", label: "Auctions", icon: Gavel },
    { to: "/admin/transactions", label: "Transactions", icon: Wallet },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar collapsible="offcanvas" {...props}>
            {/* Brand */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"

                            className="hover:bg-transparent active:bg-transparent"
                        >
                            <NavLink to="/admin" end className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                    <GavelBrand className="size-5" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-base font-bold tracking-tight text-foreground">
                                        Chereta
                                    </span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Admin Panel
                                    </span>
                                </div>
                            </NavLink>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Main nav */}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Dashboard
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {navMain.map(({ to, label, icon: Icon, end }) => (
                                <SidebarMenuItem key={to}>
                                    <SidebarMenuButton

                                        tooltip={label}
                                        className="h-10"
                                    >
                                        <NavLink
                                            to={to}
                                            end={end}
                                            className={({ isActive }) =>
                                                [
                                                    "flex w-full items-center gap-3 rounded-md text-[15px]   font-medium transition-colors",
                                                    "[&_svg]:size-[18px] [&_svg]:shrink-0",
                                                    isActive
                                                        ? "bg-accent p-3 text-accent-foreground [&_svg]:text-primary"
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
            <SidebarFooter>
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <span>© {new Date().getFullYear()} Chereta</span>
                    <span className="font-medium">v1.0</span>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}