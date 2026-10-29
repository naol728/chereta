import React from "react";
import { Globe, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "./mode-toggle";

// Define languages outside the component so it's not recreated on every render
const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "am", label: "አማርኛ" },
    { code: "om", label: "Afaan Oromoo" },
];

export default function Header() {
    const { i18n } = useTranslation();

    // Get the current language code (e.g., "en" from "en-US")
    const currentLangCode = i18n.resolvedLanguage?.split("-")[0] ?? "en";

    const changeLanguage = async (langCode: string) => {
        await i18n.changeLanguage(langCode);
        localStorage.setItem("app-language", langCode);
    };

    return (
        <header
            className="sticky top-0 z-50 w-full border-b border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80"
            style={{
                // Respect Telegram / iOS notch & status bar
                paddingTop: "env(safe-area-inset-top)",
            }}
        >
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6">

                {/* Brand - left */}
                <Link
                    to="/"
                    className="shrink-0 text-xl font-black tracking-tight sm:text-2xl md:text-[28px]"
                >
                    <span className="text-foreground">CHE</span>
                    <span className="text-[#eab83f]">RETA</span>
                </Link>

                {/* Actions - right */}
                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <ModeToggle />

                    {/* Language Selector Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger >
                            <Button
                                variant="outline"
                                className="h-10 gap-1.5 rounded-full border-border bg-transparent px-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:h-11 sm:gap-2 sm:px-4"
                                aria-label="Select language"
                            >
                                <Globe className="size-4 sm:size-5" />
                                {/* Show the active language code (EN, AM, OM) */}
                                <span className="text-sm font-semibold uppercase sm:text-base">
                                    {currentLangCode}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            sideOffset={6}
                            className="min-w-[140px] rounded-xl border-border bg-popover text-popover-foreground"
                        >
                            {LANGUAGES.map((lang) => (
                                <DropdownMenuItem
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className="cursor-pointer gap-2 py-2 text-xs focus:bg-accent focus:text-accent-foreground"
                                >
                                    {/* Show a checkmark next to the active language */}
                                    <span className="flex w-3.5 items-center justify-center">
                                        {currentLangCode === lang.code && (
                                            <Check className="size-3.5" />
                                        )}
                                    </span>

                                    <span className="font-bold uppercase">
                                        {lang.code}
                                    </span>

                                    <span className="text-muted-foreground text-[11px]">
                                        {lang.label}
                                    </span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}