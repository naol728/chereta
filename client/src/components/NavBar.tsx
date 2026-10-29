import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Ticket, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export default function NavBar() {
    const { t } = useTranslation();
    const { pathname } = useLocation();

    const navItems = [
        { id: "home", href: "/", label: t("app.home"), icon: Home },
        { id: "bids", href: "/bids", label: t("app.bids"), icon: LayoutGrid },
        { id: "mybids", href: "/my-bids", label: t("app.mybids"), icon: Ticket },
        { id: "profile", href: "/profile", label: t("app.profile"), icon: User },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
            style={{
                paddingBottom: "env(safe-area-inset-bottom)",
            }}
        >
            <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
                {navItems.map((item) => {

                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.id}
                            to={item.href}
                            className={cn(
                                "group relative flex h-full w-full flex-col items-center justify-center gap-1 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground/80"
                            )}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <div
                                className={cn(
                                    "flex h-8 w-16 items-center justify-center rounded-full transition-all duration-300",
                                    isActive
                                        ? "bg-primary/10"
                                        : "bg-transparent group-hover:bg-muted"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "size-5 transition-transform",
                                        isActive ? "scale-110" : "scale-100"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>

                            <span
                                className={cn(
                                    "text-[11px] tracking-tight whitespace-nowrap",
                                    isActive ? "font-bold" : "font-medium"
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}