import React from "react";
import { Outlet } from "react-router-dom";

import Header from "@/components/Header";
import NavBar from "@/components/NavBar";

export default function MainLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-background max-w-md mx-auto">
            {/* Top header */}
            <header className="sticky top-0 z-50 shrink-0">
                <Header />
            </header>

            {/* Main routed content */}
            <main className="flex-1 overflow-y-auto  pt-2 pb-24">
                <Outlet />
            </main>

            {/* Bottom navigation */}
            <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur max-w-md mx-auto">
                <NavBar />
            </footer>
        </div>
    );
}