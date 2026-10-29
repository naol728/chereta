import React from "react";
import { Outlet } from "react-router-dom";

import Header from "@/components/Header";
import NavBar from "@/components/NavBar";

export default function MainLayout() {
    return (
        <div className="flex min-h-dvh flex-col bg-background text-foreground">
            {/* Top header */}
            <header className="sticky top-0 z-50 shrink-0">
                <Header />
            </header>

            {/* Main routed content */}
            <main className="w-full flex-1 pb-20">
                <Outlet />
            </main>

            {/* Bottom navigation */}
            <footer className="fixed inset-x-0 bottom-0 z-50 md:sticky md:bottom-0 md:mt-auto">
                <NavBar />
            </footer>
        </div>
    );
}