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
import { ModeToggle } from "./mode-toggle"; // Assuming this exists in your project

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "am", label: "አማርኛ" },
    { code: "om", label: "Afaan Oromoo" },
];

export default function Header() {
    const { i18n } = useTranslation();

    const currentLangCode = i18n.resolvedLanguage?.split("-")[0] ?? "en";

    const changeLanguage = async (langCode: string) => {
        await i18n.changeLanguage(langCode);
        localStorage.setItem("app-language", langCode);
    };

    return (
        // Removed 'sticky top-0 z-50' because it is handled by MainLayout
        <div className="w-full border-b border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-12 items-center justify-between gap-2 px-4 sm:h-14">

                {/* Brand - left */}
                <Link
                    to="/"
                    className="shrink-0 text-lg font-black tracking-tight sm:text-xl"
                >
                    <span className="text-foreground">CHE</span>
                    <span className="text-primary">RETA</span>
                </Link>

                {/* Actions - right */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <ModeToggle />

                    {/* Language Selector Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger >
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 rounded-full px-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:h-9 sm:px-3"
                                aria-label="Select language"
                            >
                                <Globe className="size-3.5 sm:size-4" />
                                <span className="text-xs font-bold uppercase">
                                    {currentLangCode}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="min-w-[150px] rounded-xl border-border bg-popover p-1 text-popover-foreground shadow-md"
                        >
                            {LANGUAGES.map((lang) => (
                                <DropdownMenuItem
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className="cursor-pointer gap-2 rounded-md py-2 text-xs focus:bg-accent focus:text-accent-foreground"
                                >
                                    {/* Checkmark area */}
                                    <span className="flex w-4 items-center justify-center">
                                        {currentLangCode === lang.code && (
                                            <Check className="size-3.5 text-primary" />
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
        </div>
    );
}